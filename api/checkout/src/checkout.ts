import { DateGenerator } from './adapters/date.generator'
import { GetOrders, UploadQrCode } from './adapters/document/storage.gateway'
import { confirmationEmail, confirmationEmailTemplate } from './adapters/email/email.confirmation'
import { cruiseEmail, cruiseEmailTemplate } from './adapters/email/email.cruise'
import { SendingBulkEmails, SendingEmail } from './adapters/email/email.gateway'
import { paymentConfirmationEmail, paymentConfirmationEmailTemplate } from './adapters/email/email.payment.confirmation'
import { registrationEmail, registrationEmailTemplate } from './adapters/email/email.registration'
import { registrationReminderEmail, registrationReminderEmailTemplate } from './adapters/email/email.registration-reminder'
import { ticketOptionEmail, ticketOptionEmailTemplate } from './adapters/email/email.ticket-option'
import { CreatingPaymentIntent } from './adapters/payment/payment.gateway'
import { GeneratingQRCode } from './adapters/qr-code/qr-code.gateway'
import { ImportOrderQueueRequest } from './adapters/queue.gateway'
import { Repository } from './adapters/repository/repository'
import { UUIDGenerator } from './adapters/uuid.generator'
import {
  calculateNewOptionTotal,
  calculateOrderTotal,
  isPromotionAppliable,
  isPromotionExpired,
} from './checkout.rules'
import { Currency } from './types/currency'
import { Customer } from './types/customer'
import { InstallmentPayment } from './types/installment'
import { makeFingerprint, makeOrderId, NewOrder, Order } from './types/order'
import {
  isInstallment,
  isPaymentOverdue,
  makePaymentStructure,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentStructure,
  PaymentStructureType,
} from './types/payment'
import { PaymentIntent } from './types/payment-intent'
import { Promotion } from './types/promotion'
import { DateTime } from 'luxon'
import { calculateAmountInTHB, Sales } from './types/sales'

export class Checkout {
  constructor(
    private readonly repository: Repository,
    private readonly paymentAdapter: CreatingPaymentIntent,
    private readonly emailApi: SendingEmail & SendingBulkEmails,
    private readonly qrCodeGenerator: GeneratingQRCode,
    private readonly documentAdapter: GetOrders & UploadQrCode,
    private readonly queueAdapter: ImportOrderQueueRequest,
    private readonly dateGenerator: DateGenerator,
    private readonly uuidGenerator: UUIDGenerator
  ) {
    this.queueAdapter
  }

  async proceed({
    newOrder,
    customer,
    promoCode,
    paymentOption,
  }: {
    newOrder: NewOrder
    customer: Customer
    promoCode: string | null
    paymentOption: { method: PaymentMethod; structure: PaymentStructureType; paymentMethodId: string }
  }) {
    let existingCheckout = newOrder.id ? await this.getOrder(newOrder.id) : undefined
    let order = existingCheckout?.order ?? this.makeOrder(newOrder)
    let amountToBePaid = this.calculateAmountToBePaid({ newOrder, order })
    let paymentStructure = makePaymentStructure({
      amountToBePaid,
      type: paymentOption.structure,
      today: this.dateGenerator.today(),
      uuidGenerator: this.uuidGenerator
    })
    let paymentStructures = (existingCheckout?.paymentStructures ?? []).concat(paymentStructure)
    let payment = await this.createPayment({
      order,
      paymentStructure,
      customer,
      paymentMethodId: paymentOption.paymentMethodId,
    })
    order = this.updateItems(order, newOrder)
    const checkout = await this.makeCheckout({ order, paymentStructures, payment, customer, promoCode })
    await this.repository.saveCheckout(checkout)
    return checkout
  }

  async handlePayment({ orderId, payment }: { orderId: string; payment: { id: string, status: PaymentStatus } }) {
    const checkoutOrder = (await this.repository.getOrderById(orderId))
    if (!checkoutOrder) {
      throw new Error(`Order (${orderId}) is not found.`)
    }
    const { order, customer, paymentStructures } = checkoutOrder
    const processedPayment = await this.repository.getPaymentById(payment.id)
    if (!processedPayment) {
      throw new Error(`Payment with stripe id ${payment.id} doesn't exist.`)
    }
    await this.repository.savePaymentStatus({ order, payment })
    if (!this.isPaymentSuccess(payment)) {
      return
    }
    let paymentStructure = paymentStructures.find((paymentStructure) =>
      isInstallment(paymentStructure)
        ? paymentStructure.dueDates.some((dueDate) => dueDate.paymentId == processedPayment.id)
        : paymentStructure.paymentId == processedPayment.id
    )
    if (!paymentStructure) {
      throw new Error(`No payment structures for order ${order.id} is matching with payment ${processedPayment.id}.`)
    }
    if (paymentStructures.length > 1 && !isInstallment(paymentStructure)) {

      return
    }
    if (
      isInstallment(paymentStructure) &&
      paymentStructure.dueDates.filter((paymentStructure) => paymentStructure.status === 'completed').length > 1
    ) {

      return this.sendPaymentConfirmationEmail({ order, customer, installment: paymentStructure })
    }
    const qrCodeFile = await this.qrCodeGenerator.generateOrderQrCode(order)
    await this.sendConfirmationEmail({ order, customer, qrCode: qrCodeFile })
  }

  async processPendingPayments(): Promise<PaymentIntent[]> {
    let payments = await this.repository.getPendingPayments(this.dateGenerator.today())
    console.log("Pending payments: ", JSON.stringify(payments))
    let results = await Promise.allSettled(
      payments.map(async (payment) => {
        let paymentIntent: PaymentIntent | undefined
        try {
          paymentIntent = await this.paymentAdapter.chargeCustomerInstallment({
            order: { id: payment.orderId },
            total: { amount: payment.amount, currency: payment.currency },
            customer: { id: payment.stripe.customerId },
          })
        }
        catch (error) {
          console.error(error)
        }
        await this.repository.savePayment({
          ...payment,
          status: isPaymentOverdue(payment, this.dateGenerator.today()) ? 'overdue' : payment.status,
          stripe: paymentIntent ? { ...payment.stripe, id: paymentIntent.id, secret: paymentIntent.secret } : payment.stripe,
        })
        let paymentStatus = isPaymentOverdue(payment, this.dateGenerator.today()) ? 'overdue' : payment.status
        if (paymentStatus != payment.status) {
          await this.repository.savePaymentStatus({ order: { id: payment.orderId }, payment: { id: payment.id, status: paymentStatus }})
        }
        return paymentIntent
      })
    )
    let paymentIntents = results.filter((result) => result.status == 'fulfilled').map((result: any) => result.value)
    let errors = results.filter((result) => result.status != 'fulfilled').map((result: any) => result.reason)
    console.error(errors)
    return paymentIntents
  }

  async getLatePayments(): Promise<{ payment: Payment; order: Order; customer: Customer }[]> {
    let today = this.dateGenerator.today()
    let payments = await this.repository.getPendingPayments(today)
    let latePayments = payments.filter((payment) => {
      if (!payment.dueDate) {
        return false
      }
      const dueDate = DateTime.fromJSDate(payment.dueDate)
      const todayDateTime = DateTime.fromJSDate(today)
      return todayDateTime.diff(dueDate, 'days').days > 3
    })
    let orders = await this.repository.getOrderByIds(latePayments.map((payment) => payment.orderId))
    const orderMap = orders.reduce<Record<string, { order: Order; customer: Customer; paymentStructures: PaymentStructure[]; }>>((orders, { order, customer, paymentStructures }) => {
      orders[order.id] = { order, customer, paymentStructures }
      return orders
    }, {})
    return latePayments
      .reduce<{ payment: Payment; order: Order; customer: Customer }[]>((latePayments, payment) => {
        let { order, customer, paymentStructures } = orderMap[payment.orderId]
        let isFailingPayment = paymentStructures.every((payment) => {
          if (isInstallment(payment)) {
            return payment.dueDates.every((dueDate) => dueDate.status != 'completed')
          } else {
            return payment.status != 'completed'
          }
        })
        return latePayments.concat(order && !isFailingPayment ? [{ payment, order, customer }] : [])
      }, [])
  }

  async getOrder(id: string): Promise<{
    order: Order
    customer: Customer
    promoCode: string | null
    paymentStructures: PaymentStructure[]
    checkedIn: boolean
  } | null> {
    return this.repository.getOrderById(id)
  }

  async getPayment(id: string): Promise<{
    payment: Payment
    order: Order
    customer: Customer
    promoCode: string | null
    paymentStructures: PaymentStructure[]
    checkedIn: boolean
  } | null> {
    let payment = await this.repository.getPaymentById(id)
    if (!payment) {
      return null
    }
    let order = await this.repository.getOrderById(payment.orderId)
    if (!order) {
      return null
    }
    return { payment, ...order }
  }

  async createPaymentAuthorization(paymentId: string, paymentMethodId: string): Promise<PaymentIntent | null> {
    let payment = await this.repository.getPaymentById(paymentId)
    if (!payment) {
      return null
    }
    let order = await this.repository.getOrderById(payment.orderId)
    if (!order) {
      return null
    }
    const paymentIntent = await this.paymentAdapter.createPaymentIntent({
        order: order.order,
        total: { amount: payment.amount, currency: payment.currency},
        customer: { id: payment.stripe.customerId },
        paymentMethodId,
        payment: { id: paymentId }
      })
    
    payment.stripe.id = paymentIntent.id
    payment.stripe.secret = paymentIntent.secret
    
    await this.repository.savePayment(payment)
    return paymentIntent
  }

  async getPromotion(passId: string, code: string): Promise<Promotion | null> {
    const promotions = await this.repository.getAllPromotions(passId)
    const promotion = promotions[code.toUpperCase()]
    const today = this.dateGenerator.today()
    if (
      !promotion ||
      !promotion.isActive ||
      isPromotionExpired(promotion, today) ||
      !isPromotionAppliable(passId, promotion)
    ) {
      return null
    }
    return promotion ?? null
  }

  private calculateAmountToBePaid({ newOrder, order }: { newOrder: NewOrder; order: Order }): {
    amount: number
    currency: Currency
  } {
    return newOrder.id != order.id ? order.total : calculateNewOptionTotal(order.items, newOrder.items)
  }

  private updateItems(order: Order, newOrder: NewOrder): Order {
    return { ...order, items: newOrder.items, total: calculateOrderTotal(newOrder.items) }
  }

  private async createPayment({
    order,
    paymentStructure,
    customer: sourceCustomer,
    paymentMethodId,
  }: {
    order: Order
    paymentStructure: PaymentStructure
    customer: Customer
    paymentMethodId: string
  }): Promise<{ status: PaymentStatus; intent: PaymentIntent; customer: { id: string } }> {
    let customer = await this.paymentAdapter.createCustomer({
      name: sourceCustomer.fullname,
      email: sourceCustomer.email,
    })
    if (isInstallment(paymentStructure)) {
      let firstDueDate = paymentStructure.dueDates[0]
      let total = { amount: firstDueDate.amount, currency: firstDueDate.currency }
      const paymentIntent = await this.paymentAdapter.createPaymentIntentForInstallment({
        order,
        total,
        customer,
        paymentMethodId,
        payment: { id: firstDueDate.paymentId }
      })
      return { status: firstDueDate.status, intent: paymentIntent, customer }
    } else {
      let total = { amount: paymentStructure.amount, currency: paymentStructure.currency }
      const paymentIntent = await this.paymentAdapter.createPaymentIntent({ order, total, customer, paymentMethodId, payment: { id: paymentStructure.paymentId } })
      return { status: paymentStructure.status, intent: paymentIntent, customer }
    }
  }

  private async makeCheckout({
    order,
    payment,
    paymentStructures,
    customer,
    promoCode,
  }: {
    order: Order
    payment: { status: PaymentStatus; intent: PaymentIntent; customer: { id: string } }
    paymentStructures: PaymentStructure[]
    customer: Customer
    promoCode: string | null
  }) {
    return {
      order,
      total: order.total,
      paymentStructures,
      customer,
      promoCode,
      payment,
      checkedIn: false,
    }
  }

  private isPaymentSuccess = (payment: { status: PaymentStatus }) => payment.status == 'completed'

  private makeOrder = (newOrder: NewOrder): Order => ({
    ...newOrder,
    total: calculateOrderTotal(newOrder.items),
    id: makeOrderId(),
    status: 'pending',
  })

  private async sendConfirmationEmail({
    order,
    customer,
    qrCode,
  }: {
    order: Order
    customer: Customer
    qrCode: Buffer
  }) {
    const link = await this.documentAdapter.uploadQrCode(order.id, qrCode)
    return this.emailApi.sendBulkEmails(confirmationEmail([{ order, customer, qrCodeUrl: link }], this.uuidGenerator))
  }

  private async sendPaymentConfirmationEmail({
    order,
    customer,
    installment,
  }: {
    order: Order
    customer: Customer
    installment: InstallmentPayment
  }) {
    return this.emailApi.sendBulkEmails(
      paymentConfirmationEmail([{ order, customer, installment }], this.uuidGenerator)
    )
  }

  // TODO: Move to another service.

  async resendConfirmationEmail(orderId: string) {
    const { order, customer } = (await this.repository.getOrderById(orderId)) || {}
    if (!order || !customer) {
      throw new Error(`Order (${orderId}) is not found.`)
    }
    const qrCodeFile = await this.qrCodeGenerator.generateOrderQrCode(order)
    await this.sendConfirmationEmail({ order, customer, qrCode: qrCodeFile })
  }

  async remakeEmailTemplates() {
    await this.emailApi.cleanUp(['ConfirmationEmail', 'PaymentConfirmationEmail', 'RegistrationEmail', 'CruiseEmail', 'RegistrationReminderEmail', 'TicketOption'])
    await this.emailApi.createTemplate(confirmationEmailTemplate())
    await this.emailApi.createTemplate(paymentConfirmationEmailTemplate())
    await this.emailApi.createTemplate(registrationEmailTemplate())
    await this.emailApi.createTemplate(cruiseEmailTemplate())
    await this.emailApi.createTemplate(registrationReminderEmailTemplate())
    await this.emailApi.createTemplate(ticketOptionEmailTemplate())
  }

  async sendRegistrationCampaign() {
    const allSales = await this.repository.getAllRegistrationCampaignSales()
    const sales = allSales.filter(
        (sale) =>
          ((sale.paymentStatus as string).startsWith('success') || (sale.paymentStatus as string).startsWith('completed')) &&
          sale.date.getTime() > new Date('2024-09-05').getTime() &&
          !['testpass'].includes(sale.pass)
      )
      .reduce((sales, sale) => {
        if (sale.pass == 'fullpass-valentine') {
          return sales.concat([
            { ...sale, fullname: sale.fullname.split(',')[0] ?? sale.fullname, customerType: 'follower' },
            { ...sale, fullname: sale.fullname.split(',')[1] ?? sale.fullname, customerType: 'leader' },
          ])
        }
        return sales.concat([sale])
      }, [] as Sales[])
      .map((sale) => ({
        ...sale,
        total: { amount: calculateAmountInTHB(sale.total.amount, sale.total.currency), currency: 'THB' as const },
      }))
    if (sales.length == 0) {
      return []
    }
    const data = await Promise.all(
      sales.map(async (sale) => {
        const existingLink = await this.documentAdapter.getQrCodeUrl(sale.id)
        if (existingLink) {
          return { sale, qrCodeUrl: existingLink }
        }
        const qrCode = await this.qrCodeGenerator.generateOrderQrCode({ id: sale.id })
        const link = await this.documentAdapter.uploadQrCode(sale.id, qrCode)
        return { sale, qrCodeUrl: link }
      })
    )
    await this.emailApi.sendBulkEmails(registrationEmail(data))
    await this.repository.updateOrdersForRegistrationCampaign(sales.map((sale) => sale.id))
    return data
  }

  async sendDinnerCruiseCampaign() {
    const sales = await this.repository.getAllCruiseCampaignSales()
    if (sales.length == 0) {
      return []
    }
    const data = await Promise.all(
      sales.map(async (sale) => {
        const existingLink = await this.documentAdapter.getQrCodeUrl(sale.id)
        if (existingLink) {
          return { sale, qrCodeUrl: existingLink }
        }
        const qrCode = await this.qrCodeGenerator.generateOrderQrCode({ id: sale.id })
        const link = await this.documentAdapter.uploadQrCode(sale.id, qrCode)
        return { sale, qrCodeUrl: link }
      })
    )
    await this.emailApi.sendBulkEmails(cruiseEmail(data))
    await this.repository.updateOrdersForCruiseCampaign(sales.map((sale) => sale.id))
    return data
  }

  async sendRegistrationReminderCampaign() {
    const allSales = await this.repository.getAllRegistrationReminderCampaignSales()
    const sales = allSales.filter((sale) => sale.paymentStatus == 'success')
    if (sales.length == 0) {
      return []
    }
    const data = await Promise.all(
      sales.map(async (sale) => {
        const existingLink = await this.documentAdapter.getQrCodeUrl(sale.id)
        if (existingLink) {
          return { sale, qrCodeUrl: existingLink }
        }
        const qrCode = await this.qrCodeGenerator.generateOrderQrCode({ id: sale.id })
        const link = await this.documentAdapter.uploadQrCode(sale.id, qrCode)
        return { sale, qrCodeUrl: link }
      })
    )
    await this.emailApi.sendBulkEmails(registrationReminderEmail(data))
    await this.repository.updateOrdersForRegistrationReminderCampaign(sales.map((sale) => sale.id))
    return data
  }

  async checkIn(orderId: string) {
    await this.repository.updateOrderCheckIn(orderId, true)
  }

  async importOrder(orderId: string) {
    throw new Error('It must be refactored and use a specific event instead of the checkout event')
    // const result = await this.repository.getOrderById(orderId)
    // if (!result) {
    //   throw new Error(`Can not find order ${orderId}`)
    // }
    // const { order, customer } = result
    // await this.repository.savePaymentStatus({ order, payment: { status: 'completed' } })
    // const qrCodeFile = await this.qrCodeGenerator.generateOrderQrCode(order)
    // const link = await this.documentAdapter.uploadQrCode(order.id, qrCodeFile)
    // await this.emailApi.sendBulkEmails(confirmationEmail([{ order, customer, qrCodeUrl: link }], this.uuidGenerator))
  }

  async requestImportOrders(csvPath: string): Promise<Order[]> {
    throw new Error('It must be refactored and use a specific event instead of the checkout event')
    // this.queueAdapter
    // const orders = await this.documentAdapter.getOrdersFromImports(csvPath)
    // const newOrders = await this.getNewOrders(orders)
    // if (newOrders.length == 0) {
    //   return []
    // }
    // await this.saveImportOrders(newOrders)
    // await this.saveCheckouts(newOrders)
    // const ordersWithQrCode = await Promise.all(
    //   newOrders.map(async ({ order, customer, promoCode }) => {
    //     await this.repository.savePaymentStatus({ order, payment: { status: 'completed' } })
    //     const qrCodeFile = await this.qrCodeGenerator.generateOrderQrCode(order)
    //     const link = await this.documentAdapter.uploadQrCode(order.id, qrCodeFile)
    //     return { order, customer, promoCode, qrCodeUrl: link }
    //   })
    // )
    // await this.emailApi.sendBulkEmails(confirmationEmail(ordersWithQrCode, this.uuidGenerator))
    // return newOrders.map(({ order }) => order)
  }

  async requestImportEdition3Orders(csvPath: string): Promise<Order[]> {
    const orders = await this.documentAdapter.getOrdersFromImports(csvPath)
    const newOrders = await this.getNewOrders(orders)
    if (newOrders.length == 0) {
      return []
    }
    await this.saveImportOrders(newOrders)
    await this.saveCheckouts(newOrders)
    const ordersWithQrCode = await Promise.all(
      newOrders.map(async ({ order, customer, promoCode }) => {
        const qrCodeFile = await this.qrCodeGenerator.generateOrderQrCode(order)
        const link = await this.documentAdapter.uploadQrCode(order.id, qrCodeFile)
        return { order, customer, promoCode, qrCodeUrl: link }
      })
    )
    console.log(">>>>> SENDING EMAILS: ", JSON.stringify(ordersWithQrCode))
    await this.emailApi.sendBulkEmails(confirmationEmail(ordersWithQrCode, this.uuidGenerator))
    return newOrders.map(({ order }) => order)
  }

  async sendTicketOptionCampaign() {
    const sales = await this.repository.getAllTicketOptionCampaignSales()
    if (sales.length == 0) {
      return []
    }
    await this.emailApi.sendBulkEmails(
      ticketOptionEmail(sales.concat([{ ...sales[0], email: 'romain.asnar@gmail.com' }]).map((sale) => ({ sale })))
    )
    await this.repository.updateOrdersForTicketOptionCampaign(sales.map((sale) => sale.id))
    return sales
  }

  private saveImportOrders(
    newOrders: {
      customer: Customer
      order: Order
      promoCode: string | null
    }[]
  ): Promise<void> {
    return this.repository.saveImportOrders(
      newOrders.map(({ order, customer, promoCode }) => ({
        fingerprint: makeFingerprint({ order, customer, promoCode }),
        orderId: order.id,
      }))
    )
  }

  private saveCheckouts(
    newOrders: {
      customer: Customer
      order: Order
      promoCode: string | null
    }[]
  ): Promise<void> {
    return this.repository.saveCheckouts(
      newOrders.map((order) => ({
        order: order.order,
        total: order.order.total,
        customer: order.customer,
        promoCode: order.promoCode,
        payment: { status: 'completed', intent: null, customer: { id: 'imported' } },
        paymentStructures: [
          {
            paymentId: this.uuidGenerator.generate(),
            amount: order.order.total.amount,
            currency: order.order.total.currency,
            status: 'completed',
          },
        ],
        checkedIn: false,
      }))
    )
  }

  private async getNewOrders(
    orders: {
      customer: Customer
      order: Order
      promoCode: string | null
    }[]
  ) {
    const fingerprints = this.makeFingerprints(orders)
    const importedOrders = (await this.repository.getImportOrdersByFingerprints(fingerprints)).map(
      (order) => order.fingerprint
    )
    return orders.filter((order) => !importedOrders.includes(makeFingerprint(order)))
  }

  private makeFingerprints(
    orders: {
      customer: Customer
      order: Order
      promoCode: string | null
    }[]
  ): string[] {
    return orders.map(({ order, customer, promoCode }) => makeFingerprint({ order, customer, promoCode }))
  }

  // private async applyPromotion(order: Order, promoCode?: string): Promise<Order> {
  //   if (promoCode) {
  //     const promotion = await this.getPromotion(promoCode)
  //     const today = this.dateGenerator.today()
  //     if (promotion && shouldApplyPromotion(promotion, today)) {
  //       return promotion.apply(order)
  //     }
  //   }
  //   return order
  // }

  // private requestImportOrder(
  //   newOrders: {
  //     customer: Customer
  //     order: Order
  //     promoCode: string | null
  //   }[]
  // ): Promise<void> {
  //   return this.queueAdapter.requestImportOrder(newOrders.map(({ order }) => order))
  // }
}

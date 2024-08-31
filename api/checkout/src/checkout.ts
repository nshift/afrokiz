import { DateGenerator } from './adapters/date.generator'
import { GetOrders, UploadQrCode } from './adapters/document/storage.gateway'
import { confirmationEmail } from './adapters/email/email.confirmation'
import { cruiseEmail } from './adapters/email/email.cruise'
import { SendingBulkEmails, SendingEmail } from './adapters/email/email.gateway'
import { registrationEmail } from './adapters/email/email.registration'
import { registrationReminderEmail } from './adapters/email/email.registration-reminder'
import { CreatingPaymentIntent } from './adapters/payment/payment.gateway'
import { GeneratingQRCode } from './adapters/qr-code/qr-code.gateway'
import { ImportOrderQueueRequest } from './adapters/queue.gateway'
import { Repository } from './adapters/repository/repository'
import { calculateOrderTotal, isPromotionAppliable, isPromotionExpired } from './checkout.rules'
import { Currency } from './types/currency'
import { Customer } from './types/customer'
import { NewOrder, Order, makeFingerprint, makeOrderId } from './types/order'
import { PaymentStatus } from './types/payment'
import { PaymentIntent } from './types/payment-intent'
import { Promotion } from './types/promotion'

export class Checkout {
  constructor(
    private readonly repository: Repository,
    private readonly paymentAdapter: CreatingPaymentIntent,
    private readonly emailApi: SendingEmail & SendingBulkEmails,
    private readonly qrCodeGenerator: GeneratingQRCode,
    private readonly documentAdapter: GetOrders & UploadQrCode,
    private readonly queueAdapter: ImportOrderQueueRequest,
    private readonly dateGenerator: DateGenerator
  ) {}

  async proceed({
    newOrder,
    customer,
    promoCode,
  }: {
    newOrder: NewOrder
    customer: Customer
    promoCode: string | null
  }) {
    const checkout = await this.createCheckout({ newOrder, customer, promoCode })
    await this.repository.saveCheckout(checkout)
    return checkout
  }

  async handlePayment({ orderId, payment }: { orderId: string; payment: { status: PaymentStatus } }) {
    const { order, customer } = (await this.repository.getOrderById(orderId)) || {}
    if (!order || !customer) {
      throw new Error(`Order (${orderId}) is not found.`)
    }
    await this.repository.savePaymentStatus({ order, payment })
    if (this.isPaymentSuccess(payment)) {
      const qrCodeFile = await this.qrCodeGenerator.generateOrderQrCode(order)
      await this.sendConfirmationEmail({ order, customer, qrCode: qrCodeFile })
    }
  }

  async resendConfirmationEmail(orderId: string) {
    const { order, customer } = (await this.repository.getOrderById(orderId)) || {}
    if (!order || !customer) {
      throw new Error(`Order (${orderId}) is not found.`)
    }
    const qrCodeFile = await this.qrCodeGenerator.generateOrderQrCode(order)
    await this.sendConfirmationEmail({ order, customer, qrCode: qrCodeFile })
  }

  async getOrder(id: string): Promise<{
    order: Order
    customer: Customer
    promoCode: string | null
    payment: { status: PaymentStatus; intent: PaymentIntent | null }
    checkedIn: boolean
  } | null> {
    return this.repository.getOrderById(id)
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

  async requestImportOrders(csvPath: string): Promise<Order[]> {
    this.queueAdapter
    const orders = await this.documentAdapter.getOrdersFromImports(csvPath)
    const newOrders = await this.getNewOrders(orders)
    if (newOrders.length == 0) {
      return []
    }
    await this.saveImportOrders(newOrders)
    await this.saveCheckouts(newOrders)
    const ordersWithQrCode = await Promise.all(
      newOrders.map(async ({ order, customer, promoCode }) => {
        await this.repository.savePaymentStatus({ order, payment: { status: 'success' } })
        const qrCodeFile = await this.qrCodeGenerator.generateOrderQrCode(order)
        const link = await this.documentAdapter.uploadQrCode(order.id, qrCodeFile)
        return { order, customer, promoCode, qrCodeUrl: link }
      })
    )
    await this.emailApi.sendBulkEmails(confirmationEmail(ordersWithQrCode))
    return newOrders.map(({ order }) => order)
  }

  async importOrder(orderId: string) {
    const result = await this.repository.getOrderById(orderId)
    if (!result) {
      throw new Error(`Can not find order ${orderId}`)
    }
    const { order, customer } = result
    await this.repository.savePaymentStatus({ order, payment: { status: 'success' } })
    const qrCodeFile = await this.qrCodeGenerator.generateOrderQrCode(order)
    const link = await this.documentAdapter.uploadQrCode(order.id, qrCodeFile)
    await this.emailApi.sendBulkEmails(confirmationEmail([{ order, customer, qrCodeUrl: link }]))
  }

  async sendRegistrationCampaign() {
    const allSales = await this.repository.getAllRegistrationCampaignSales()
    const sales = allSales.filter((sale) => sale.paymentStatus == 'success')
    if (sales.length == 0) {
      return []
    }
    const data = await Promise.all(
      sales.map(async (sale) => {
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
    const allSales = (await this.repository.getAllRegistrationReminderCampaignSales()).slice(0, 3)
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
        return { sale: { ...sale, email: 'romain.asnar+reminder@gmail.com' }, qrCodeUrl: link }
      })
    )
    await this.emailApi.sendBulkEmails(registrationReminderEmail(data))
    await this.repository.updateOrdersForRegistrationReminderCampaign(sales.map((sale) => sale.id))
    return data
  }

  async checkIn(orderId: string) {
    await this.repository.updateOrderCheckIn(orderId, true)
  }

  private async createCheckout({
    newOrder,
    customer,
    promoCode,
  }: {
    newOrder: NewOrder
    customer: Customer
    promoCode: string | null
  }) {
    const total = calculateOrderTotal(newOrder.items)
    const order =
      (newOrder.id ? (await this.getOrder(newOrder.id))?.order : undefined) ?? this.createOrder(newOrder, total)
    order.items = newOrder.items
    order.total = total
    const paymentIntent = await this.paymentAdapter.createPaymentIntent({ order, total })
    return {
      order,
      total,
      customer,
      promoCode,
      payment: { status: 'pending' as PaymentStatus, intent: paymentIntent },
      checkedIn: false,
    }
  }

  private isPaymentSuccess = (payment: { status: PaymentStatus }) => payment.status == 'success'

  private createOrder = (
    newOrder: Omit<Order, 'id' | 'total'>,
    total: { amount: number; currency: Currency }
  ): Order => ({ ...newOrder, total, id: makeOrderId() })

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
    return this.emailApi.sendBulkEmails(confirmationEmail([{ order, customer, qrCodeUrl: link }]))
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
        payment: { status: 'pending', intent: null },
        checkedIn: false,
      }))
    )
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

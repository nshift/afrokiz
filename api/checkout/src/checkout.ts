import { DateGenerator } from './adapters/date.generator'
import { confirmationEmail } from './adapters/email/email.confirmation'
import { SendingEmail } from './adapters/email/email.gateway'
import { CreatingPaymentIntent } from './adapters/payment/payment.gateway'
import { GeneratingQRCode } from './adapters/qr-code/qr-code.gateway'
import { Repository } from './adapters/repository/repository'
import { calculateOrderTotal, isPromotionAppliable, isPromotionExpired } from './checkout.rules'
import { Currency } from './types/currency'
import { Customer } from './types/customer'
import { NewOrder, Order, makeOrderId } from './types/order'
import { PaymentStatus } from './types/payment'
import { PaymentIntent } from './types/payment-intent'
import { Promotion } from './types/promotion'

export class Checkout {
  constructor(
    private readonly repository: Repository,
    private readonly paymentAdapter: CreatingPaymentIntent,
    private readonly emailApi: SendingEmail,
    private readonly qrCodeGenerator: GeneratingQRCode,
    private readonly dateGenerator: DateGenerator
  ) {}

  async proceed({ newOrder, customer, promoCode }: { newOrder: NewOrder; customer: Customer; promoCode?: string }) {
    const total = calculateOrderTotal(newOrder.items)
    const order =
      (newOrder.id ? (await this.getOrder(newOrder.id))?.order : undefined) ?? this.createOrder(newOrder, total)
    order.items = newOrder.items
    order.total = total
    // order = await this.applyPromotion(order, promoCode)
    const paymentIntent = await this.paymentAdapter.createPaymentIntent({ order, total })
    const checkout = {
      order,
      total,
      customer,
      promoCode,
      payment: { status: 'pending' as PaymentStatus, intent: paymentIntent },
    }
    await this.repository.saveCheckout(checkout)
    return checkout
  }

  async handlePayment({ orderId, payment }: { orderId: string; payment: { status: PaymentStatus } }) {
    const { order, customer } = (await this.repository.getOrderById(orderId)) || {}
    if (!order || !customer) {
      throw new Error(`Order (${orderId}) is not found.`)
    }
    await this.repository.savePaymentStatus({ order, payment })
    if (payment.status == 'success') {
      const qrCodeFile = await this.qrCodeGenerator.generateOrderQrCode(order)
      await this.emailApi.sendEmail(await confirmationEmail({ order, customer, qrCode: qrCodeFile }))
    }
  }

  async resendConfirmationEmail(orderId: string) {
    const { order, customer } = (await this.repository.getOrderById(orderId)) || {}
    if (!order || !customer) {
      throw new Error(`Order (${orderId}) is not found.`)
    }
    const qrCodeFile = await this.qrCodeGenerator.generateOrderQrCode(order)
    await this.emailApi.sendEmail(await confirmationEmail({ order, customer, qrCode: qrCodeFile }))
  }

  async getOrder(id: string): Promise<{
    order: Order
    customer: Customer
    promoCode: string | undefined
    payment: { status: PaymentStatus; intent: PaymentIntent }
  } | null> {
    return this.repository.getOrderById(id)
  }

  private createOrder = (
    newOrder: Omit<Order, 'id' | 'total'>,
    total: { amount: number; currency: Currency }
  ): Order => ({ id: makeOrderId(), ...newOrder, total })

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
}

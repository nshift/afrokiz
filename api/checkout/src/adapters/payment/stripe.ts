import Stripe from 'stripe'
import { Currency } from '../../types/currency'
import { PaymentIntent } from '../../types/payment-intent'
import { CreatingPaymentIntent } from './payment.gateway'

export class StripePaymentAdapter implements CreatingPaymentIntent {
  constructor(private readonly stripe: Stripe) {}

  async createPaymentIntent({
    order,
    total,
  }: {
    order: { id: string }
    total: { amount: number; currency: Currency }
  }): Promise<PaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: total.amount,
      currency: total.currency,
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: order.id },
    })
    if (!paymentIntent.client_secret) {
      throw new Error(`Payment intent (${paymentIntent.id}) does not contain any client secret.`)
    }
    return { id: paymentIntent.id, secret: paymentIntent.client_secret }
  }
}

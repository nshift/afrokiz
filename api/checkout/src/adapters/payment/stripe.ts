import Stripe from 'stripe'
import { Currency } from '../../types/currency'
import { PaymentIntent } from '../../types/payment-intent'
import { CreatingPaymentIntent } from './payment.gateway'

export class StripePaymentAdapter implements CreatingPaymentIntent {
  constructor(private readonly stripe: Stripe) {}

  async createPaymentIntent({
    order,
    total,
    customer,
  }: {
    order: { id: string }
    total: { amount: number; currency: Currency }
    customer: { id: string }
  }): Promise<PaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      customer: customer.id,
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

  async createCustomer(source: { name: string; email: string }): Promise<{ id: string }> {
    return this.stripe.customers.create(source)
  }

  async createPaymentIntentForInstallment({
    order,
    total,
    customer,
  }: {
    order: { id: string }
    total: { amount: number; currency: Currency }
    customer: { id: string }
  }): Promise<PaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      customer: customer.id,
      amount: total.amount,
      currency: total.currency,
      automatic_payment_methods: { enabled: true },
      setup_future_usage: 'off_session',
      metadata: { orderId: order.id },
    })
    if (!paymentIntent.client_secret) {
      throw new Error(`Payment intent (${paymentIntent.id}) does not contain any client secret.`)
    }
    return { id: paymentIntent.id, secret: paymentIntent.client_secret }
  }

  async chargeCustomerInstallment({
    order,
    total,
    customer,
  }: {
    order: { id: string }
    total: { amount: number; currency: Currency }
    customer: { id: string }
  }): Promise<PaymentIntent> {
    const { data: paymentMethods } = await this.stripe.paymentMethods.list({ customer: customer.id, type: 'card' })
    if (paymentMethods.length == 0) {
      throw new Error(`No payment methods for customer ${customer.id} and order ${order.id}`)
    }
    let errors: string[] = []
    for (let paymentMethod of paymentMethods) {
      try {
        return await this.createConfirmedPaymentIntentForInstallment({ order, total, customer, paymentMethod })
      } catch (error: any) {
        errors.push(error?.message ?? 'Unknown error when creating confirmed payment intent')
      }
    }
    console.error(errors)
    throw new Error(errors.join('\n'))
  }

  async createConfirmedPaymentIntentForInstallment({
    order,
    total,
    customer,
    paymentMethod,
  }: {
    order: { id: string }
    total: { amount: number; currency: Currency }
    customer: { id: string }
    paymentMethod: { id: string }
  }): Promise<PaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      customer: customer.id,
      amount: total.amount,
      currency: total.currency,
      automatic_payment_methods: { enabled: true },
      payment_method: paymentMethod.id,
      confirm: true,
      off_session: true,
      metadata: { orderId: order.id },
    })
    if (!paymentIntent.client_secret) {
      throw new Error(`Payment intent (${paymentIntent.id}) does not contain any client secret.`)
    }
    return { id: paymentIntent.id, secret: paymentIntent.client_secret }
  }
}

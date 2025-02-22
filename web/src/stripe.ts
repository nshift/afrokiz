import {
  loadStripe as loadStripeJS,
  type Stripe as StripJS,
  type StripeElements,
  type StripeError,
} from '@stripe/stripe-js'
import { Environment } from './environment'
import { PaymentAPI, type NewOrder, type PaymentOption } from './payment-api/payment.api'

export { type StripeElements, type StripeError } from '@stripe/stripe-js'

export async function loadStripe(): Promise<Stripe> {
  const stripePublicKey = Environment.StripeSecretKey()
  const stripe = await loadStripeJS(stripePublicKey)
  if (!stripe) {
    throw new Error(`Can not load stripe`)
  }
  const paymentApi = new PaymentAPI()
  return new Stripe(stripe, paymentApi)
}

export class Stripe {
  constructor(public readonly stripe: StripJS, private readonly paymentApi: PaymentAPI) {}

  elements = (options: { amount: number; currency: string; isInstallment: boolean }): StripeElements =>
    this.stripe.elements({
      amount: options.amount,
      currency: options.currency,
      mode: 'payment',
      capture_method: 'automatic',
      setup_future_usage: options.isInstallment ? 'off_session' : undefined,
    })

  mountElements(elements: StripeElements, domElement: string | HTMLElement) {
    const options = { layout: { type: 'tabs', defaultCollapsed: false } }
    const paymentElement = elements.create('payment' as any, options as any)
    paymentElement.mount(domElement)
  }

  async confirmPayment(
    elements: StripeElements,
    newOrder: NewOrder,
    paymentOption: PaymentOption
  ): Promise<never | { error: StripeError }> {
    const { order, clientSecret } = await this.paymentApi.createOrder(newOrder, paymentOption)
    return await this.stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: Environment.Host() + '/checkout?order_id=' + order.id },
    })
  }
}

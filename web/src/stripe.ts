import {
  loadStripe as loadStripeJS,
  type Stripe as StripJS,
  type StripeElements,
  type StripeError,
} from '@stripe/stripe-js'
import { Environment } from './environment'
import { PaymentAPI, type NewOrder } from './payment-api/payment.api'

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

  elements = (options: { amount: number; currency: string }): StripeElements =>
    this.stripe.elements({
      ...options,
      mode: 'payment',
      capture_method: 'automatic',
    })

  mountElements(elements: StripeElements, domElement: string | HTMLElement) {
    const options = { layout: { type: 'tabs', defaultCollapsed: false } }
    const paymentElement = elements.create('payment' as any, options as any)
    paymentElement.mount(domElement)
  }

  async confirmPayment(elements: StripeElements, newOrder: NewOrder): Promise<never | { error: StripeError }> {
    const { error: submitError } = await elements.submit()
    if (submitError) {
      return { error: submitError }
    }
    if (!newOrder.fullname || !newOrder.email) {
      return {
        error: { type: 'validation_error', message: 'Full name and email are required.' },
      }
    }
    const { order, clientSecret } = await this.paymentApi.createOrder(newOrder)
    return await this.stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: Environment.Host() + '/checkout?order_id=' + order.id },
    })
  }
}

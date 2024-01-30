import { APIGatewayEvent } from 'aws-lambda'
import Stripe from 'stripe'
import { Environment } from '../../environment'
import { Customer } from '../../types/customer'
import { Order } from '../../types/order'

export const buildProceedToCheckoutRequest = (
  request: any
): {
  newOrder: Omit<Order, 'id' | 'total'>
  customer: Customer
  promoCode?: string
} => ({
  newOrder: {
    // passId: request.pass_id,
    date: new Date(request.date),
    items: request.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      includes: item.includes,
      amount: item.amount,
      total: { amount: item.total.amount, currency: item.total.currency },
    })),
  },
  customer: {
    email: request.email,
    fullname: request.fullname,
    type: request.dancer_type,
  },
  promoCode: request.promo_code,
})

export const buildUpdateOrderPaymentRequest = (event: APIGatewayEvent, stripe: Stripe) => {
  const body = event.body
  const signature = event.headers['stripe-signature']
  if (!body || !signature) {
    throw new Error('Body and stripe signature are required.')
  }
  const stripeEvent = stripe.webhooks.constructEvent(body, signature, Environment.StripeWebhookSecretKey())
  return { type: stripeEvent.type, orderId: (stripeEvent.data.object as Stripe.PaymentIntent).metadata.orderId }
}

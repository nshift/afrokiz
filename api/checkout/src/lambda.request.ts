import { APIGatewayEvent } from 'aws-lambda'
import Stripe from 'stripe'
import { Environment } from './environment'

export const buildCreateOrderRequest = (request: any) => ({
  email: request.email,
  passId: request.pass_id,
  fullname: request.fullname,
  dancerType: request.dancer_type,
  date: new Date(request.date),
  promoCode: request.promo_code,
  items: request.items.map((item: any) => ({
    id: item.id,
    title: item.title,
    includes: item.includes,
    amount: item.amount,
    total: { amount: item.total.amount, currency: item.total.currency },
  })),
})

export const buildUpdateOrderPaymentRequest = (event: APIGatewayEvent, stripe: Stripe) => {
  const body = event.body
  const signature = event.headers['stripe-signature']
  if (!body || !signature) {
    throw new Error('Body and stripe signature are required.')
  }
  console.log({ signature, env: Environment.StripeWebhookSecretKey() })
  return stripe.webhooks.constructEvent(body, signature, Environment.StripeWebhookSecretKey())
}

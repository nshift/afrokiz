import { APIGatewayEvent } from 'aws-lambda'
import Stripe from 'stripe'

export const buildCreateOrderRequest = (request: any) => ({
  email: request.email,
  passId: request.pass_id,
  date: new Date(request.date),
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
    throw new Error('Boy and stripe signature are required.')
  }
  return stripe.webhooks.constructEvent(body, signature, 'whsec_jCvWJBwkk1wgli6Jog3nqwFK0WrQCF4u')
}

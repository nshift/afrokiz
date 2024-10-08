import { APIGatewayEvent, SQSRecord } from 'aws-lambda'
import Stripe from 'stripe'
import { Environment } from '../../environment'
import { Customer } from '../../types/customer'
import { NewOrder } from '../../types/order'

export const buildProceedToCheckoutRequest = (
  request: any
): {
  newOrder: NewOrder
  customer: Customer
  promoCode: string | null
} => ({
  newOrder: {
    // passId: request.pass_id,
    id: request.id ?? undefined,
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

export const buildResendConfirmationEmailRequest = (event: APIGatewayEvent) => {
  const body = JSON.parse(event.body ?? '{}')
  return { orderId: body.orderId }
}

export const buildRequestImportOrdersRequest = (event: APIGatewayEvent) => {
  const body = JSON.parse(event.body ?? '{}')
  return { csvPath: body.csvPath }
}

export const buildImportOrderRequest = (record: SQSRecord) => {
  const body = JSON.parse(record.body ?? '{}')
  return { orderId: body.id }
}

export const buildMarkPaymentAsSucceedRequest = (event: APIGatewayEvent) => {
  const body = JSON.parse(event.body ?? '{}')
  return { orderId: body.orderId }
}

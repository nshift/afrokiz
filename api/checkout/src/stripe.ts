import Stripe from 'stripe'
import { Order } from './order'

export const createPaymentIntent = async (
  stripe: Stripe,
  newOrder: Omit<Order, 'paymentIntentId' | 'paymentStatus'>
) => {
  const total = newOrder.items.reduce((total, item) => total + item.total.amount, 0)
  const currency = Array.from(new Set(newOrder.items.map((item) => item.total.currency)))[0]
  return await stripe.paymentIntents.create({
    amount: total,
    currency,
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: newOrder.id },
  })
}

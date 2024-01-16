import { Order } from './order'

export const buildOrderResponse = (order: Order) => ({
  id: order.id,
  paymentIntentId: order.paymentIntentId,
  paymentStatus: order.paymentStatus,
  email: order.email,
  pass_id: order.passId,
  date: order.date.toISOString(),
  items: order.items.map((item) => ({
    id: item.id,
    title: item.title,
    includes: item.includes,
    amount: item.amount,
    total: { amount: item.total.amount, currency: item.total.currency },
  })),
})

import { Order } from './types/order'
import { Promotion } from './types/promotion'

export const calculateOrderTotal = (items: Order['items']) => ({
  amount: items.reduce((total, item) => (total += item.total.amount), 0),
  currency: Array.from(new Set(items.map((item) => item.total.currency)))[0],
})

export const isPromotionAppliable = (promotion: Promotion, today: Date) =>
  promotion.isActive && today.getTime() < promotion.expirationDate.getTime()

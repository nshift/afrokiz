import { Order } from './types/order'
import { Promotion } from './types/promotion'

export const calculateOrderTotal = (items: Order['items']) => ({
  amount: items.reduce((total, item) => (total += item.total.amount), 0),
  currency: Array.from(new Set(items.map((item) => item.total.currency)))[0],
})

export const isPromotionExpired = (promotion: Promotion, today: Date) =>
  today.getTime() > promotion.expirationDate.getTime()

export const isPromotionAppliable = (passId: string, promotion: Promotion) => promotion.isAppliable(passId)

import { Order } from './order'
import { DiscountPromotion, GiveAwayPromotion, Promotion } from './promotions'

export const buildOrderResponse = (order: Order) => ({
  id: order.id,
  paymentIntentId: order.paymentIntentId,
  paymentStatus: order.paymentStatus,
  email: order.email,
  fullname: order.fullname,
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

export const buildPromotionResponse = (promotion: Promotion) => ({
  id: promotion.id,
  code: promotion.code,
  expirationDate: promotion.expirationDate.toISOString(),
  isActive: promotion.isActive,
  discount: (promotion as DiscountPromotion).discount,
  options: (promotion as GiveAwayPromotion).options
    ? (promotion as GiveAwayPromotion).options.map((option) => ({
        title: option.title,
        description: option.description,
      }))
    : undefined,
})

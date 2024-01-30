import { Customer } from '../../types/customer'
import { Order } from '../../types/order'
import { PaymentStatus } from '../../types/payment'
import { PaymentIntent } from '../../types/payment-intent'
import { DiscountPromotion, GiveAwayPromotion, Promotion } from '../../types/promotion'

export const buildOrderResponse = ({
  order,
  customer,
  promoCode,
  payment,
}: {
  order: Order
  customer: Customer
  promoCode?: string
  payment: { status: PaymentStatus; intent: PaymentIntent }
}) => ({
  id: order.id,
  paymentIntentId: payment.intent.id,
  paymentStatus: payment.status,
  email: customer.email,
  fullname: customer.fullname,
  dancer_type: customer.type,
  promo_code: promoCode,
  pass_id: order.items[0].id,
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

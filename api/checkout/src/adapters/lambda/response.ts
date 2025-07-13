import { Customer } from '../../types/customer'
import { Order } from '../../types/order'
import { isInstallment, Payment, PaymentStructure } from '../../types/payment'
import { PaymentIntent } from '../../types/payment-intent'
import { DiscountPromotion, GiveAwayPromotion, Promotion } from '../../types/promotion'

export const buildOrderResponse = ({
  order,
  paymentStructures,
  customer,
  promoCode,
  checkedIn,
}: {
  order: Order
  paymentStructures: PaymentStructure[]
  customer: Customer
  promoCode: string | null
  checkedIn: boolean
}) => ({
  id: order.id,
  email: customer.email,
  fullname: customer.fullname,
  dancer_type: customer.type,
  promo_code: promoCode,
  pass_id: order.items[0].id,
  date: order.date.toISOString(),
  checked_in: checkedIn,
  items: order.items.map((item) => ({
    id: item.id,
    title: item.title,
    includes: item.includes ?? [],
    amount: item.amount,
    total: { amount: item.total.amount, currency: item.total.currency },
  })),
  paymentStructures: paymentStructures.map((paymentStructure) =>
    isInstallment(paymentStructure)
      ? {
          principalAmount: paymentStructure.principalAmount,
          currency: paymentStructure.currency,
          frequency: paymentStructure.frequency,
          term: paymentStructure.term,
          dueDates: paymentStructure.dueDates.map((dueDate) => ({
            amount: dueDate.amount,
            currency: dueDate.currency,
            dueDate: dueDate.dueDate,
            status: dueDate.status,
          })),
        }
      : {
          amount: paymentStructure.amount,
          currency: paymentStructure.currency,
          status: paymentStructure.status,
        }
  ),
})

export const buildPaymentResponse = ({
  payment,
  order,
  paymentStructures,
  customer,
  promoCode,
  checkedIn,
}: {
  payment: Payment
  order: Order
  paymentStructures: PaymentStructure[]
  customer: Customer
  promoCode: string | null
  checkedIn: boolean
}) => ({
  payment: {
    id: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    dueDate: payment.dueDate,
    status: payment.status,
  },
  order: buildOrderResponse({ order, paymentStructures, customer, promoCode, checkedIn })
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

export const buildPaymentIntentsResponse = (paymentIntents: PaymentIntent[]) =>
  paymentIntents.map((paymentIntent) => ({
    id: paymentIntent.id,
    secret: paymentIntent.secret,
  }))

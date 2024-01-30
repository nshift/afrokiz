import { calculateOrderTotal } from '../../checkout.rules'
import { Order } from '../../types/order'
import { DiscountPromotion, GiveAwayPromotion } from '../../types/promotion'

export const makeDiscountPromotion = (promotion: Omit<DiscountPromotion, 'apply'>) => ({
  ...promotion,
  apply: (order: Order): Order => {
    const total = calculateOrderTotal(order.items)
    return {
      ...order,
      items: order.items.concat([
        {
          id: 'dicount-' + promotion.id,
          title: `Discount ${(100 - promotion.discount * 100).toFixed(0)}% off`,
          includes: [],
          amount: 1,
          total: {
            amount: Math.round((total.amount / promotion.discount - total.amount) * -1),
            currency: total.currency,
          },
        },
      ]),
    }
  },
})

export const makeGiveAwayPromotion = (promotion: Omit<GiveAwayPromotion, 'apply'>) => ({
  ...promotion,
  apply: (order: Order): Order => ({
    ...order,
    items: order.items.concat(
      promotion.options.map((option) => ({
        id: 'give-away-' + promotion.id,
        title: option.title,
        includes: [],
        amount: order.items.map((item) => item.id).includes('couple-option') ? 2 : 1,
        total: {
          amount: 0,
          currency: Array.from(new Set(order.items.map((item) => item.total.currency)))[0],
        },
      }))
    ),
  }),
})

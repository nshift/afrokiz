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

export const makePromoterDiscount = (code: string) =>
  makeDiscountPromotion({
    id: `promoter-${code.toLowerCase()}`,
    isActive: true,
    code: code.toUpperCase(),
    expirationDate: new Date('2024-09-01'),
    discount: 0.95,
    isAppliable: (passId: string) => ['fullpass'].includes(passId),
  })

export const makeTarrakizSGDiscount = makeDiscountPromotion({
  id: 'tarrakizSG',
  isActive: true,
  code: 'tarrakizSG'.toUpperCase(),
  expirationDate: new Date('2024-05-11'),
  discount: 0.9,
  isAppliable: (passId: string) => ['fullpass', 'vip-silver', 'vip-gold'].includes(passId),
})

export const massagePromotion: GiveAwayPromotion = makeGiveAwayPromotion({
  id: 'referal-dicount-promotion',
  isActive: true,
  code: 'MASSAGE',
  expirationDate: new Date('2024-01-01'),
  options: [
    {
      title: '1H Free Traditional Massage',
      description: '1H Free Traditional Massage',
    },
    {
      title: '1H Free Traditional Massage',
      description: '1H Free Traditional Massage',
    },
  ],
  isAppliable: () => false,
})

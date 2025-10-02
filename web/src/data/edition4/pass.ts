import { type Option } from '../options'

export type Currency = 'USD' | 'EUR' | 'THB'

export type Pass = {
  id: string
  name: string
  price: {
    USD: number
    EUR: number
    THB: number
  }
  doorPrice: {
    USD: number
    EUR: number
    THB: number
  }
  includes: string[]
  giveAways: string[]
  isPromoted: boolean
  isSoldOut: boolean
  options: { [key: string]: Option }
}

export const defaultPasses: { [key: string]: Pass } = {
  membership: {
    id: 'afrokiz-membership',
    name: 'Afrokiz Membership',
    isSoldOut: false,
    price: { USD: 12900, EUR: 10900, THB: 390000 },
    doorPrice: { USD: 12900, EUR: 10900, THB: 390000 },
    includes: ['Afrokiz full pass from 30th October to 1st November.', 'Evazion 3 Festival Early Bird Discount (Lyon, France)', 'Wuhan Kizomba Festival Discount (China)', 'AKC Festival Discount (Seoul, Korea)', 'Japan Kizomba Festival Discount (Tokyo, Japan)', '10% off on Afrokiz Merch'],
    giveAways: [],
    isPromoted: true,
    options: { },
  },
}

// export const defaultPasses: { [key: string]: Pass } = baliPasses

export function calculateTotal(
  pass: Pass,
  selectedOptionIds: string[],
  discount: number = 1
): { USD: number; EUR: number; THB: number } {
  return Object.keys(pass.price).reduce((prices, currency) => {
    let total = pass.price[currency as Currency] * discount
    total += Object.values(pass.options).reduce(
      (total, option) =>
        (total += selectedOptionIds.includes(option.id)
          ? option.price[currency as Currency] *
            (selectedOptionIds.includes('couple-option') && option.id != 'couple-option' ? 2 : 1)
          : 0),
      0
    )
    prices[currency] = total
    return prices
  }, {} as any)
}

export function sumPrices(prices: { USD: number; EUR: number; THB: number }[]) {
  return prices.reduce(
    (total, currencies) => {
      total = {
        USD: total.USD + currencies.USD,
        EUR: total.EUR + currencies.EUR,
        THB: total.THB + currencies.THB,
      }
      return total
    },
    { USD: 0, EUR: 0, THB: 0 }
  )
}
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

export const superEarlyBirdPasses: { [key: string]: Pass } = {
  fullPass: {
    id: 'fullpass-edition3',
    name: 'SUPER EARLY BIRD Full Pass',
    isSoldOut: true,
    price: { USD: 8900, EUR: 8000, THB: 300000 },
    doorPrice: { USD: 8900, EUR: 8000, THB: 300000 },
    includes: ['All workshops', 'All parties in main venue', '3 welcome drinks per person'],
    giveAways: [],
    isPromoted: true,
    options: {},
  },
}

export const earlyBirdPasses: { [key: string]: Pass } = {
  fullPass: {
    id: 'early-bird-fullpass-edition3',
    name: 'EARLY BIRD Full Pass',
    isSoldOut: true,
    price: { USD: 11000, EUR: 10500, THB: 380000 },
    doorPrice: { USD: 11000, EUR: 10500, THB: 380000 },
    includes: [
      'Includes all workshops',
      'Day time social',
      'Evening parties during September 5-7',
      'NOT includes Masterclass, Bootcamp, or other additional programs',
      'Non-refundable',
    ],
    giveAways: [],
    isPromoted: true,
    options: {},
  },
}

export const defaultPasses: { [key: string]: Pass } = earlyBirdPasses

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

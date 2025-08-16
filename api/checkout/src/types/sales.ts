import { Currency } from './currency'

export type Sales = {
  id: string
  date: Date
  email: string
  fullname: string
  pass: string
  customerType: string
  items: {
    id: string
    title: string
    includes: string[]
    amount: number
    total: { amount: number; currency: Currency }
  }[]
  promoCode: string
  paymentStatus: 'pending' | 'success' | 'failed'
  total: {
    amount: number
    currency: Currency
  }
}

export const calculateAmountInTHB = (amount: number, currency: Currency) => {
  switch (currency) {
    case 'EUR':
      return Number((amount / 0.025).toFixed(0))
    case 'USD':
      return Number((amount / 0.028).toFixed(0))
    case 'THB':
      return amount
    default:
      throw new Error('Can not calculate amount in THB because currency is unknown.')
  }
}
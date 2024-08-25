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

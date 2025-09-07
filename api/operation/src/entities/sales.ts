import { Currency } from './currency'

export type Sales = {
  id: string
  date: Date
  email: string
  fullname: string
  pass: string
  customerType: string
  includes: string[]
  items: { id: string; total: { amount: number; currency: Currency } }[]
  promoCode: string
  paymentStatus: 'pending' | 'success' | 'failed'
  checkedIn: boolean
  total: {
    amount: number
    currency: Currency
  }
}

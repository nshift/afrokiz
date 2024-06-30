import { Currency } from './currency'

export type Sales = {
  id: string
  date: Date
  email: string
  fullname: string
  pass: string
  customerType: string
  includes: string[]
  promoCode: string
  total: {
    amount: number
    currency: Currency
  }
}

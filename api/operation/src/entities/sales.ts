import { Currency } from './currency'

export type Sales = {
  id: string
  email: string
  pass: string
  customerType: string
  includes: string[]
  promoCode: string
  total: {
    amount: number
    currency: Currency
  }
}

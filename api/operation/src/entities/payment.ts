import { Currency } from './currency'

export type Payment = {
  orderId: string
  createdAt: Date
  amount: number
  currency: Currency
}

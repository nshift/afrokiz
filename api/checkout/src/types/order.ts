import crypto from 'crypto'
import { Currency } from './currency'

export type Order = {
  id: string
  date: Date
  items: {
    id: string
    title: string
    includes: string[]
    amount: number
    total: { amount: number; currency: Currency }
  }[]
  total: { amount: number; currency: Currency }
}

export const makeOrderId = () => crypto.randomBytes(3).toString('hex')

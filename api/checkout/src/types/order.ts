import crypto from 'crypto'
import { Currency } from './currency'
import { Customer } from './customer'

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

export type NewOrder = {
  id?: string
  date: Date
  items: {
    id: string
    title: string
    includes: string[]
    amount: number
    total: { amount: number; currency: Currency }
  }[]
}

export type ImportOrder = {
  fingerprint: string
  orderId: string
}

export function makeFingerprint({
  order,
  customer,
  promoCode,
}: {
  order: Order
  customer: Customer
  promoCode: string | null
}): string {
  return [order.total.amount.toString(), order.total.currency, customer.email, customer.fullname, promoCode]
    .map((item) => (item ? item.toLowerCase().replace(' ', '_') : 'null'))
    .join('_')
}

export const makeOrderId = () => crypto.randomBytes(3).toString('hex')

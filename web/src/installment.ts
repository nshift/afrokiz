import { DateTime } from 'luxon'
import type { Currency } from './data/pass'

export type PaymentDueDate = {
  amount: number
  currency: Currency
  dueDate: Date
}

export const makeMonthlyDueDates = ({
  term,
  amountToBePaid,
  today,
}: {
  term: number
  amountToBePaid: { amount: number; currency: Currency }
  today: Date
}): PaymentDueDate[] => {
  let amountByMonth = Math.floor(amountToBePaid.amount / term)
  return Array(term)
    .fill(0)
    .map((_, index) => (index == 0 ? amountToBePaid.amount - amountByMonth * (term - 1) : amountByMonth))
    .map((amount, index) => ({
      amount,
      currency: amountToBePaid.currency,
      dueDate: DateTime.fromJSDate(today).plus({ month: index }).toJSDate(),
      status: 'pending',
    }))
}

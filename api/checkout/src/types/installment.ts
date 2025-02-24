import { DateTime } from 'luxon'
import { Currency } from './currency'
import { PaymentStatus } from './payment'

export type InstallmentFrequency = 'monthly'

export type PaymentDueDate = {
  amount: number
  currency: Currency
  dueDate: Date
  status: PaymentStatus
  paymentId?: string
}

export type InstallmentPayment = {
  principalAmount: number
  currency: Currency
  frequency: InstallmentFrequency
  term: number
  dueDates: PaymentDueDate[]
}

export const makeInstallment3xPayment = (
  amountToBePaid: {
    amount: number
    currency: Currency
  },
  today: Date
): InstallmentPayment => ({
  principalAmount: amountToBePaid.amount,
  currency: amountToBePaid.currency,
  frequency: 'monthly',
  term: 3,
  dueDates: makeMonthlyDueDates({ term: 3, amountToBePaid, today }),
})

const makeMonthlyDueDates = ({
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

import { DateTime } from 'luxon'
import { Currency } from './currency'
import { PaymentStatus } from './payment'
import { UUIDGenerator } from '../adapters/uuid.generator'

export type InstallmentFrequency = 'monthly'

export type PaymentDueDate = {
  amount: number
  currency: Currency
  dueDate: Date
  status: PaymentStatus
  paymentId: string
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
  today: Date,
  uuidGenerator: UUIDGenerator
): InstallmentPayment => ({
  principalAmount: amountToBePaid.amount,
  currency: amountToBePaid.currency,
  frequency: 'monthly',
  term: 2,
  dueDates: makeMonthlyDueDates({ term: 2, amountToBePaid, today, uuidGenerator }),
})

const makeMonthlyDueDates = ({
  term,
  amountToBePaid,
  today,
  uuidGenerator
}: {
  term: number
  amountToBePaid: { amount: number; currency: Currency }
  today: Date
  uuidGenerator: UUIDGenerator
}): PaymentDueDate[] => {
  let amountByMonth = Math.floor(amountToBePaid.amount / term)
  return Array(term)
    .fill(0)
    .map((_, index) => (index == 0 ? amountToBePaid.amount - amountByMonth * (term - 1) : amountByMonth))
    .map((amount, index) => ({
      paymentId: uuidGenerator.generate(),
      amount,
      currency: amountToBePaid.currency,
      dueDate: DateTime.fromJSDate(today).plus({ month: index }).toJSDate(),
      status: 'pending',
    }))
}

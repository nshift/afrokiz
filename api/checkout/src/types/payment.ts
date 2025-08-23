import { DateTime } from 'luxon'
import { Currency } from './currency'
import { InstallmentPayment, makeInstallment3xPayment } from './installment'
import { UUIDGenerator } from '../adapters/uuid.generator'

export type PaymentStatus = 'pending' | 'overdue' | 'default' | 'completed' | 'failed'

export type PaymentMethod = string

export type DirectPayment = {
  amount: number
  currency: Currency
  status: PaymentStatus
  paymentId: string
}

export type PaymentStructure = DirectPayment | InstallmentPayment
export type PaymentStructureType = 'direct' | 'installment3x'

export function isInstallment(payment: DirectPayment | InstallmentPayment): payment is InstallmentPayment {
  return (<InstallmentPayment>payment).dueDates !== undefined
}

export type PaymentOption = { method: PaymentMethod; structure: PaymentStructure }

export type Payment = {
  id: string
  orderId: string
  amount: number
  currency: Currency
  dueDate?: Date
  status: PaymentStatus
  stripe: { id: string | null; secret: string | null; customerId: string }
}

export const isPaymentOverdue = (payment: Payment, today: Date) => {
  if (!payment.dueDate || payment.status != 'pending') {
    return false
  }
  const dueDate = DateTime.fromJSDate(payment.dueDate)
  const todayDateTime = DateTime.fromJSDate(today)
  return todayDateTime.diff(dueDate, 'days').days > 3
}

export const makeDirectPayment = (amountToBePaid: { amount: number; currency: Currency }, uuidGenerator: UUIDGenerator): DirectPayment => ({
  paymentId: uuidGenerator.generate(),
  amount: amountToBePaid.amount,
  currency: amountToBePaid.currency,
  status: 'pending',
})

export const makePaymentStructure = ({
  amountToBePaid,
  type,
  today,
  uuidGenerator
}: {
  amountToBePaid: { amount: number; currency: Currency }
  type: PaymentStructureType
  today: Date
  uuidGenerator: UUIDGenerator
}): PaymentStructure => {
  switch (type) {
    case 'direct':
      return makeDirectPayment(amountToBePaid, uuidGenerator)
    case 'installment3x':
      return makeInstallment3xPayment(amountToBePaid, today, uuidGenerator)
  }
}

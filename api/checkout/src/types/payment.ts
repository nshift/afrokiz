import { Currency } from './currency'
import { InstallmentPayment, makeInstallment3xPayment } from './installment'

export type PaymentStatus = 'pending' | 'overdue' | 'default' | 'completed' | 'failed'

export type PaymentMethod = string

export type DirectPayment = {
  amount: number
  currency: Currency
  status: PaymentStatus
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

export const makeDirectPayment = (amountToBePaid: { amount: number; currency: Currency }): DirectPayment => ({
  amount: amountToBePaid.amount,
  currency: amountToBePaid.currency,
  status: 'pending',
})

export const makePaymentStructure = ({
  amountToBePaid,
  type,
  today,
}: {
  amountToBePaid: { amount: number; currency: Currency }
  type: PaymentStructureType
  today: Date
}): PaymentStructure => {
  switch (type) {
    case 'direct':
      return makeDirectPayment(amountToBePaid)
    case 'installment3x':
      return makeInstallment3xPayment(amountToBePaid, today)
  }
}

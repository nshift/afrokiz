import { Currency } from '../../types/currency'
import { PaymentIntent } from '../../types/payment-intent'

export interface CreatingPaymentIntent {
  createPaymentIntent(input: {
    order: { id: string }
    total: { amount: number; currency: Currency }
    customer: { id: string }
  }): Promise<PaymentIntent>

  createPaymentIntentForInstallment(input: {
    order: { id: string }
    total: { amount: number; currency: Currency }
    customer: { id: string }
  }): Promise<PaymentIntent>

  createCustomer(source: { name: string; email: string }): Promise<{ id: string }>

  chargeCustomerInstallment(input: {
    order: { id: string }
    total: { amount: number; currency: Currency }
    customer: { id: string }
  }): Promise<PaymentIntent>
}

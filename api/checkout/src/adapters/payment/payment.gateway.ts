import { Currency } from '../../types/currency'
import { PaymentIntent } from '../../types/payment-intent'

export interface CreatingPaymentIntent {
  createPaymentIntent(input: {
    order: { id: string }
    total: { amount: number; currency: Currency }
  }): Promise<PaymentIntent>
}

export type PaymentStatus = 'pending' | 'success' | 'failed'

export type Payment = {
  status: PaymentStatus
}

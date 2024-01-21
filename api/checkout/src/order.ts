export type Order = {
  id: string
  email: string
  fullname: string
  passId: string
  date: Date
  promoCode?: string
  paymentIntentId: string
  paymentStatus: 'pending' | 'success' | 'failed'
  items: {
    id: string
    title: string
    includes: string[]
    amount: number
    total: { amount: number; currency: 'USD' | 'EUR' | 'THB' }
  }[]
}

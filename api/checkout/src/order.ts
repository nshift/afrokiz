export type Order = {
  id: string
  email: string
  fullname: string
  dancerType: 'leader' | 'follower' | 'couple'
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

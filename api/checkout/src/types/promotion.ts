import { Order } from './order'

export interface Promotion {
  id: string
  code: string
  expirationDate: Date
  isActive: boolean
  apply(order: Order): Order
}

export interface DiscountPromotion extends Promotion {
  discount: number
}

export interface GiveAwayPromotion extends Promotion {
  options: {
    title: string
    description: string
  }[]
}

export interface Promotion {
  id: string
  expirationDate: Date
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

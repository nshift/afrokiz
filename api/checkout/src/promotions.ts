export interface Promotion {
  id: string
  code: string
  expirationDate: Date
  isActive: boolean
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

export const discountPromotion: DiscountPromotion = {
  id: 'referal-dicount-promotion',
  isActive: true,
  code: '5OFF',
  expirationDate: new Date('2024-09-01'),
  discount: 0.5,
}

export const massagePromotion: GiveAwayPromotion = {
  id: 'referal-dicount-promotion',
  isActive: true,
  code: 'MASSAGE',
  expirationDate: new Date('2024-09-01'),
  options: [
    {
      title: '1H Free Traditional Massage',
      description: '1H Free Traditional Massage',
    },
    {
      title: '1H Free Traditional Massage',
      description: '1H Free Traditional Massage',
    },
  ],
}

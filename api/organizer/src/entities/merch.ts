import { Price } from './price'

export type Merch = {
  id: string
  name: string
  price: Price
  discountedPrice?: Price
  isSoldOut: boolean
  variants: MerchVariant[]
}

export type MerchVariant = {
  sku: string
  attributes: { color: string; size: string }
  additionalPrice: Price
  stockQuantity: number
}

export type NewMerch = Omit<Merch, 'id'>

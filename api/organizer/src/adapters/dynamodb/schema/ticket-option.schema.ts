import { Identifier } from '../../../entities/identifier'
import { PriceSchema } from './price.schema'

export type TicketOptionSchema = {
  id: Identifier
  name: string
  price: PriceSchema
  discountedPrice?: PriceSchema
  isSoldOut: boolean
  isDefault: boolean
}

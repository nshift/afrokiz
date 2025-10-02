import { EventConfiguration } from '../../../entities/event-configuration'
import { Identifier } from '../../../entities/identifier'
import { Ticket } from '../../../entities/ticket'
import { PriceSchema } from './price.schema'

export type EventSchema = {
  id: Identifier
  name: string
  date?: { start: Date; end: Date }
  location?: string
}

export const makeEventSchemaPrimaryKey = (event: EventConfiguration) => event.id
export const makeEventSchemaSortKey = () => 'EVENT'

export type TicketSchema = {
  id: Identifier
  name: string
  price: PriceSchema
  discountedPrice?: PriceSchema
  includes: string[]
  isPromoted: boolean
  isSoldOut: boolean
  options: Identifier[]
}

export const makeTicketchemaSortKey = (ticket: Ticket) => `TICKET#${ticket.id}`

export type PromoCodeSchema = {
  id: Identifier
  code: string
  discountInPercent: number
}

export type MerchSchema = {
  id: string
  name: string
  price: PriceSchema
  discountedPrice?: PriceSchema
  isSoldOut: boolean
  variants: MerchVariantSchema[]
}

export type MerchVariantSchema = {
  sku: string
  attributes: { color: string; size: string }
  additionalPrice: PriceSchema
  stockQuantity: number
}

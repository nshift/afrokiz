import { Identifier } from './identifier'
import { Price } from './price'

export type Ticket = {
  id: Identifier
  name: string
  price: Price
  discountedPrice?: Price
  includes: string[]
  isPromoted: boolean
  isSoldOut: boolean
  options: TicketOption[]
}

export type NewTicket = Omit<Ticket, 'id' | 'options'> & { options: NewTicketOption[] }

export type TicketOption = {
  id: Identifier
  name: string
  price: Price
  discountedPrice?: Price
  isSoldOut: boolean
  isDefault: boolean
}

export type NewTicketOption = Omit<TicketOption, 'id'>

import { Identifier } from './identifier'
import { Merch, NewMerch } from './merch'
import { PromoCode } from './promo-code'
import { NewTicket, Ticket } from './ticket'

export type EventConfiguration = {
  id: Identifier
  name: string
  userId: Identifier
  date?: { start: Date; end: Date }
  location?: string
  tickets: Ticket[]
  merchs: Merch[]
  promoCodes: PromoCode[]
}

export type NewEvent = Omit<EventConfiguration, 'id' | 'userId' | 'tickets' | 'merchs' | 'promoCodes'> & {
  tickets: NewTicket[]
  merchs: NewMerch[]
  promoCodes: PromoCode[]
}

export type UpdateEvent = Omit<EventConfiguration, 'userId'>

import { EventConfiguration } from '../entities/event-configuration'
import { Identifier } from '../entities/identifier'
import { Merch } from '../entities/merch'
import { PromoCode } from '../entities/promo-code'
import { Ticket, TicketOption } from '../entities/ticket'

export type Repository = EventRepository &
  MerchRepository &
  PromoCodeRepository &
  TicketRepository &
  TicketOptionRepository

export interface EventRepository {
  getAllUserEvents(userId: Identifier): Promise<EventConfiguration[]>
  getEventOwners(eventIds: Identifier[]): Promise<{ eventId: Identifier; userId: Identifier }[]>
  saveEvents(events: EventConfiguration[]): Promise<void>
  deleteEvents(eventIds: Identifier[]): Promise<void>
}

export interface MerchRepository {
  getAllMerchs(eventId: Identifier): Promise<Merch[]>
  saveMerchs(eventId: string, merchs: Merch[]): Promise<void>
  deleteMerchs(eventId: Identifier, merchIds: Identifier[]): Promise<void>
}

export interface PromoCodeRepository {
  getAllPromoCodes(eventId: Identifier): Promise<PromoCode[]>
  savePromoCodes(eventId: Identifier, promoCodes: PromoCode[]): Promise<void>
  deletePromoCodes(eventId: Identifier, promoCodeIds: Identifier[]): Promise<void>
}

export interface TicketRepository {
  getAllTickets(eventId: Identifier): Promise<Ticket[]>
  saveTickets(eventId: Identifier, tickets: Ticket[]): Promise<void>
  deleteTickets(eventId: Identifier, ticketIds: Identifier[]): Promise<void>
}

export interface TicketOptionRepository {
  getAllTicketOptions(eventId: Identifier): Promise<TicketOption[]>
  saveTicketOptions(eventId: Identifier, ticketOptions: TicketOption[]): Promise<void>
  deleteTicketOptions(eventId: Identifier, ticketOptionIds: Identifier[]): Promise<void>
  getTicketOptionByIds(eventId: Identifier, ids: Identifier[]): Promise<TicketOption[]>
}

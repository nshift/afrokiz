import { Repository } from '../adapters/repository'
import { makeDictionary } from '../dictionary'
import { EventConfiguration } from '../entities/event-configuration'
import { Identifier } from '../entities/identifier'
import { Merch } from '../entities/merch'
import { PromoCode } from '../entities/promo-code'
import { Ticket, TicketOption } from '../entities/ticket'

export class InMemoryRepository implements Repository {
  private events: Record<Identifier, EventConfiguration> = {}
  private merchs: { [key: Identifier]: Merch[] } = {}
  private tickets: { [key: Identifier]: Ticket[] } = {}
  private ticketOptions: { [key: Identifier]: TicketOption[] } = {}
  private promoCodes: { [key: Identifier]: PromoCode[] } = {}

  async getAllUserEvents(userId: Identifier): Promise<EventConfiguration[]> {
    return Object.values(this.events).filter((event) => event.userId === userId)
  }

  async getEventOwners(eventIds: Identifier[]): Promise<{ eventId: Identifier; userId: Identifier }[]> {
    return Object.values(this.events)
      .filter((event) => eventIds.includes(event.id))
      .map((event) => ({ eventId: event.id, userId: event.userId }))
  }

  async saveEvents(events: EventConfiguration[]): Promise<void> {
    this.events = { ...this.events, ...makeDictionary(events) }
  }

  async deleteEvents(eventIds: Identifier[]): Promise<void> {
    for (let eventId of eventIds) {
      delete this.events[eventId]
    }
  }

  async getAllMerchs(eventId: Identifier): Promise<Merch[]> {
    return this.merchs[eventId] ?? []
  }

  async saveMerchs(eventId: Identifier, merchs: Merch[]): Promise<void> {
    this.merchs[eventId] = merchs
  }

  async deleteMerchs(eventId: Identifier, merchIds: Identifier[]): Promise<void> {
    this.merchs[eventId] = (this.merchs[eventId] ?? []).filter((merch) => !merchIds.includes(merch.id))
  }

  async getAllPromoCodes(eventId: Identifier): Promise<PromoCode[]> {
    return this.promoCodes[eventId] ?? []
  }

  async savePromoCodes(eventId: Identifier, promoCodes: PromoCode[]): Promise<void> {
    this.promoCodes[eventId] = promoCodes
  }

  async deletePromoCodes(eventId: Identifier, promoCodes: Identifier[]): Promise<void> {
    this.promoCodes[eventId] = (this.promoCodes[eventId] ?? []).filter(
      (promoCode) => !promoCodes.includes(promoCode.code)
    )
  }

  async getAllTickets(eventId: Identifier): Promise<Ticket[]> {
    return this.tickets[eventId] ?? []
  }

  async saveTickets(eventId: Identifier, tickets: Ticket[]): Promise<void> {
    this.tickets[eventId] = tickets
  }

  async deleteTickets(eventId: Identifier, ticketIds: Identifier[]): Promise<void> {
    this.tickets[eventId] = (this.tickets[eventId] ?? []).filter((ticket) => !ticketIds.includes(ticket.id))
  }

  async getAllTicketOptions(eventId: Identifier): Promise<TicketOption[]> {
    return this.ticketOptions[eventId] ?? []
  }

  async getTicketOptionByIds(eventId: Identifier, ids: Identifier[]): Promise<TicketOption[]> {
    let ticketOptions = Object.values(this.ticketOptions)
      .flatMap((options) => options)
      .filter((ticketOption) => ids.includes(ticketOption.id))
    return Array.from(new Map(ticketOptions.map((item) => [item.id, item])).values())
  }

  async saveTicketOptions(eventId: Identifier, ticketOptions: TicketOption[]): Promise<void> {
    this.ticketOptions[eventId] = ticketOptions
  }

  async deleteTicketOptions(eventId: Identifier, ticketOptionIds: Identifier[]): Promise<void> {
    this.ticketOptions[eventId] = (this.ticketOptions[eventId] ?? []).filter(
      (ticketOption) => !ticketOptionIds.includes(ticketOption.id)
    )
  }
}

import {
  EventRepository,
  MerchRepository,
  PromoCodeRepository,
  TicketOptionRepository,
  TicketRepository,
} from '../adapters/repository'
import { UUIDGenerator } from '../adapters/uuid.generator'
import { EventConfiguration, NewEvent, UpdateEvent } from '../entities/event-configuration'
import { Identifier } from '../entities/identifier'
import { TicketOption } from '../entities/ticket'
import { hashObject } from '../hash'

export class EventAdministration {
  constructor(
    private readonly repository: EventRepository &
      TicketRepository &
      PromoCodeRepository &
      MerchRepository &
      TicketOptionRepository,
    private readonly uuidGenerator: UUIDGenerator
  ) {}

  async addEvents(newEvents: NewEvent[], userId: Identifier): Promise<void> {
    let ticketOptions: Record<string, TicketOption> = Object.fromEntries(
      [...new Set(newEvents.flatMap((newEvent) => newEvent.tickets.flatMap((ticket) => ticket.options)))]
        .map((option) => ({ ...option, id: this.uuidGenerator.generate() }))
        .map(({ id, ...item }) => [hashObject(item), { id, ...item }])
    )
    let events = newEvents.map(
      (newEvent): EventConfiguration => ({
        ...newEvent,
        id: this.uuidGenerator.generate(),
        userId,
        tickets: newEvent.tickets.map((newTicket) => ({
          ...newTicket,
          id: this.uuidGenerator.generate(),
          options: newTicket.options.map((option) => ticketOptions[hashObject(option)]),
        })),
        merchs: newEvent.merchs.map((newMerch) => ({ ...newMerch, id: this.uuidGenerator.generate() })),
        promoCodes: newEvent.promoCodes,
      })
    )
    await this.repository.saveEvents(events)
    for (let event of events) {
      await this.repository.saveTicketOptions(event.id, Object.values(ticketOptions))
      await this.repository.saveMerchs(event.id, event.merchs)
      await this.repository.savePromoCodes(event.id, event.promoCodes)
      await this.repository.saveTickets(event.id, event.tickets)
    }
  }

  async updateEvents(updatedEvents: UpdateEvent[], userId: Identifier): Promise<void> {
    let eventOwners = await this.getEventOwners(updatedEvents.map((event) => event.id))
    let events = updatedEvents
      .filter(({ id }) => eventOwners[id]?.userId == userId)
      .map((event): EventConfiguration => ({ ...event, userId }))
    await this.repository.saveEvents(events)
  }

  listEvent(userId: Identifier): Promise<EventConfiguration[]> {
    return this.repository.getAllUserEvents(userId)
  }

  async removeEvents(eventIds: Identifier[], userId: Identifier): Promise<void> {
    let eventOwners = await this.getEventOwners(eventIds)
    let events = eventIds.filter((id) => eventOwners[id]?.userId == userId)
    await this.repository.deleteEvents(events)
  }

  private async getEventOwners(eventIds: Identifier[]) {
    let eventOwners = await this.repository.getEventOwners(eventIds)
    return Object.fromEntries(eventOwners.map((item) => [item.eventId, item]))
  }
}

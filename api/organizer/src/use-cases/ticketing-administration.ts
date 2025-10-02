import { TicketOptionRepository, TicketRepository } from '../adapters/repository'
import { UUIDGenerator } from '../adapters/uuid.generator'
import { makeDictionary } from '../dictionary'
import { Identifier } from '../entities/identifier'
import { Price } from '../entities/price'
import { NewTicketOption, Ticket, TicketOption } from '../entities/ticket'

export class TicketingAdministration {
  constructor(
    private readonly repository: TicketRepository & TicketOptionRepository,
    private readonly uuidGenerator: UUIDGenerator
  ) {}

  async addTickets(eventId: Identifier, newTickets: Omit<TicketInput, 'id'>[]): Promise<void> {
    let tickets = await this.makeTickets(eventId, newTickets)
    await this.repository.saveTickets(eventId, tickets)
  }

  async updateTickets(eventId: Identifier, tickets: TicketInput[]): Promise<void> {
    let updatedTickets = await this.makeTickets(eventId, tickets)
    await this.repository.saveTickets(eventId, updatedTickets)
  }

  async removeTickets(eventId: Identifier, ticketIds: Identifier[]): Promise<void> {
    await this.repository.deleteTickets(eventId, ticketIds)
  }

  listTicket(eventId: Identifier): Promise<Ticket[]> {
    return this.repository.getAllTickets(eventId)
  }

  async addTicketOptions(eventId: Identifier, newTicketOptions: NewTicketOption[]): Promise<void> {
    let ticketOptions = newTicketOptions.map((newTicketOption) => ({
      ...newTicketOption,
      id: this.uuidGenerator.generate(),
    }))
    await this.repository.saveTicketOptions(eventId, ticketOptions)
  }

  async updateTicketOptions(eventId: Identifier, ticketOptions: TicketOption[]): Promise<void> {
    await this.repository.saveTicketOptions(eventId, ticketOptions)
  }

  async removeTicketOptions(eventId: Identifier, ticketOptionIds: Identifier[]): Promise<void> {
    await this.repository.deleteTicketOptions(eventId, ticketOptionIds)
  }

  listTicketOption(eventId: Identifier): Promise<TicketOption[]> {
    return this.repository.getAllTicketOptions(eventId)
  }

  private makeTickets = async (eventId: Identifier, tickets: (Omit<TicketInput, 'id'> | TicketInput)[]) => {
    let uniqueTicketOptions = [...new Set(tickets.flatMap((ticket) => ticket.options))]
    let ticketOptions = makeDictionary(await this.repository.getTicketOptionByIds(eventId, uniqueTicketOptions))
    return tickets.map((ticket) => ({
      ...ticket,
      id: this.uuidGenerator.generate(),
      options: ticket.options.map((id) => ticketOptions[id]).filter((option) => option !== undefined),
    }))
  }
}

export type TicketInput = {
  id: Identifier
  name: string
  price: Price
  discountedPrice?: Price
  includes: string[]
  isPromoted: boolean
  isSoldOut: boolean
  options: Identifier[]
}

import { beforeEach, describe, expect, it } from '@jest/globals'
import { Fixtures } from '../doubles/fixtures'
import { InMemoryRepository } from '../doubles/repository.in-memory'
import { TicketingAdministration } from './ticketing-administration'

let fixtures = new Fixtures()
let repository: InMemoryRepository
let eventId = 'afrokiz-edition-4'
let uuidFullpassGenerator = { generate: () => fixtures.fullpassTicket.id }
let uuidMasterclassGenerator = { generate: () => fixtures.masterclassOption.id }
let ticketingAdministration: TicketingAdministration
let ticketingOptionAdministration: TicketingAdministration

beforeEach(() => {
  repository = new InMemoryRepository()
  ticketingAdministration = new TicketingAdministration(repository, uuidFullpassGenerator)
  ticketingOptionAdministration = new TicketingAdministration(repository, uuidMasterclassGenerator)
})

describe('Add tickets', () => {
  it('should save the tickets', async () => {
    await ticketingOptionAdministration.addTicketOptions(eventId, [fixtures.newMasterclassOption])

    await ticketingAdministration.addTickets(eventId, [fixtures.newFullpassTicketInput])

    expect(await repository.getAllTickets(eventId)).toEqual([fixtures.fullpassTicket])
  })
})

describe('Update tickets', () => {
  it('should update the tickets', async () => {
    let updatedFullpassTicket = { ...fixtures.updatingFullpassTicketInput, isSoldOut: true }
    await ticketingOptionAdministration.addTicketOptions(eventId, [fixtures.newMasterclassOption])
    await ticketingAdministration.addTickets(eventId, [fixtures.newFullpassTicketInput])

    await ticketingAdministration.updateTickets(eventId, [updatedFullpassTicket])

    expect(await repository.getAllTickets(eventId)).toEqual([{ ...fixtures.fullpassTicket, isSoldOut: true }])
  })
})

describe('List ticket', () => {
  it('should list all tickets', async () => {
    await ticketingOptionAdministration.addTicketOptions(eventId, [fixtures.newMasterclassOption])
    await ticketingAdministration.addTickets(eventId, [fixtures.newFullpassTicketInput])

    let tickets = await ticketingAdministration.listTicket(eventId)

    expect(tickets).toEqual([fixtures.fullpassTicket])
  })
})

describe('Remove tickets', () => {
  it('should delete the tickets', async () => {
    await ticketingOptionAdministration.addTicketOptions(eventId, [fixtures.newMasterclassOption])
    await ticketingAdministration.addTickets(eventId, [fixtures.newFullpassTicketInput])

    await ticketingAdministration.removeTickets(eventId, [fixtures.fullpassTicket.id])

    expect(await repository.getAllTickets(eventId)).toEqual([])
  })
})

describe('Add ticket options', () => {
  it('should save the ticket options', async () => {
    await ticketingOptionAdministration.addTicketOptions(eventId, [fixtures.newMasterclassOption])

    expect(await repository.getAllTicketOptions(eventId)).toEqual([fixtures.masterclassOption])
  })
})

describe('Update ticket options', () => {
  it('should update the ticket options', async () => {
    let updatedMasterclassOption = { ...fixtures.masterclassOption, isDefault: true }
    await ticketingOptionAdministration.addTicketOptions(eventId, [fixtures.newMasterclassOption])

    await ticketingOptionAdministration.updateTicketOptions(eventId, [updatedMasterclassOption])

    expect(await repository.getAllTicketOptions(eventId)).toEqual([updatedMasterclassOption])
  })
})

describe('List ticket options', () => {
  it('should list all ticket options', async () => {
    await ticketingOptionAdministration.addTicketOptions(eventId, [fixtures.newMasterclassOption])

    let ticketOptions = await ticketingOptionAdministration.listTicketOption(eventId)

    expect(ticketOptions).toEqual([fixtures.masterclassOption])
  })
})

describe('Remove ticket options', () => {
  it('should soft delete the ticket options', async () => {
    await ticketingOptionAdministration.addTicketOptions(eventId, [fixtures.newMasterclassOption])

    await ticketingOptionAdministration.removeTicketOptions(eventId, [fixtures.masterclassOption.id])

    expect(await repository.getAllTicketOptions(eventId)).toEqual([])
  })
})

import { beforeEach, describe, expect, it } from '@jest/globals'
import { Fixtures } from '../doubles/fixtures'
import { InMemoryRepository } from '../doubles/repository.in-memory'
import { EventAdministration } from './event-administration'

let fixtures = new Fixtures()
let repository: InMemoryRepository
let uuidGenerator = { generate: () => fixtures.afrokiz4Event.id }

beforeEach(() => {
  repository = new InMemoryRepository()
})

describe('Add events', () => {
  it('should save the events', async () => {
    var id = 0
    let eventAdministration = new EventAdministration(repository, { generate: () => `${++id}` })

    await eventAdministration.addEvents(
      [
        {
          ...fixtures.newAfrokizEvent,
          merchs: [fixtures.newAfrokizVansMerch],
          tickets: [fixtures.newFullpassTicket],
          promoCodes: [fixtures.romainPromoCode],
        },
      ],
      fixtures.romainUser.id
    )

    let afrokiz4EventId = '2'
    let afrokizVansMerch = { ...fixtures.afrokizVansMerch, id: '4' }
    let masterclassOption = { ...fixtures.masterclassOption, id: '1' }
    let newFullpassTicket = { ...fixtures.newFullpassTicket, id: '3', options: [masterclassOption] }
    expect(await repository.getAllUserEvents(fixtures.romainUser.id)).toEqual([
      {
        ...fixtures.afrokiz4Event,
        id: afrokiz4EventId,
        merchs: [afrokizVansMerch],
        tickets: [newFullpassTicket],
        promoCodes: [fixtures.romainPromoCode],
      },
    ])
    expect(await repository.getAllMerchs(afrokiz4EventId)).toEqual([afrokizVansMerch])
    expect(await repository.getAllPromoCodes(afrokiz4EventId)).toEqual([fixtures.romainPromoCode])
    expect(await repository.getAllTickets(afrokiz4EventId)).toEqual([newFullpassTicket])
    expect(await repository.getAllTicketOptions(afrokiz4EventId)).toEqual([masterclassOption])
  })
})

describe('Update events', () => {
  it('should update the events', async () => {
    let eventAdministration = new EventAdministration(repository, uuidGenerator)
    let updatedAfrokizEvent = { ...fixtures.afrokiz4Event, location: '123 Street, Bangkok' }
    await eventAdministration.addEvents([fixtures.newAfrokizEvent], fixtures.romainUser.id)

    await eventAdministration.updateEvents([updatedAfrokizEvent], fixtures.romainUser.id)

    expect(await repository.getAllUserEvents(fixtures.romainUser.id)).toEqual([updatedAfrokizEvent])
  })
  it("should not update the event if the user doesn't own the event", async () => {
    let eventAdministration = new EventAdministration(repository, uuidGenerator)
    let eventAdministrationAfrokiz3 = new EventAdministration(repository, { generate: () => fixtures.afrokiz3Event.id })
    let updatedAfrokizEvent = { ...fixtures.afrokiz4Event, location: '123 Street, Bangkok' }
    await eventAdministration.addEvents([fixtures.newAfrokizEvent], fixtures.romainUser.id)
    await eventAdministrationAfrokiz3.addEvents([fixtures.afrokiz3Event], fixtures.ployUser.id)

    await eventAdministration.updateEvents([updatedAfrokizEvent], fixtures.ployUser.id)

    expect(await repository.getAllUserEvents(fixtures.ployUser.id)).toEqual([
      { ...fixtures.afrokiz3Event, userId: fixtures.ployUser.id },
    ])
  })
})

describe('Remove events', () => {
  it('should soft delete the events', async () => {
    let eventAdministration = new EventAdministration(repository, uuidGenerator)
    await eventAdministration.addEvents([fixtures.newAfrokizEvent], fixtures.romainUser.id)

    await eventAdministration.removeEvents([fixtures.afrokiz4Event.id], fixtures.romainUser.id)

    expect(await repository.getAllUserEvents(fixtures.romainUser.id)).toEqual([])
  })
  it("should not soft delete the events that the user doesn't own", async () => {
    let eventAdministration = new EventAdministration(repository, uuidGenerator)
    let eventAdministrationAfrokiz3 = new EventAdministration(repository, { generate: () => fixtures.afrokiz3Event.id })
    await eventAdministration.addEvents([fixtures.newAfrokizEvent], fixtures.ployUser.id)
    await eventAdministrationAfrokiz3.addEvents([fixtures.afrokiz3Event], fixtures.romainUser.id)

    await eventAdministration.removeEvents([fixtures.afrokiz4Event.id], fixtures.romainUser.id)

    expect(await repository.getAllUserEvents(fixtures.romainUser.id)).toEqual([fixtures.afrokiz3Event])
  })
})

describe('List event', () => {
  it('should list all the events', async () => {
    let eventAdministration = new EventAdministration(repository, uuidGenerator)
    await eventAdministration.addEvents([fixtures.newAfrokizEvent], fixtures.romainUser.id)

    let events = await eventAdministration.listEvent(fixtures.romainUser.id)

    expect(events).toEqual([fixtures.afrokiz4Event])
  })
})

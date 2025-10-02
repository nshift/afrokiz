import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { beforeEach, describe, expect, it } from '@jest/globals'
import { Fixtures } from '../../doubles/fixtures'
import { DynamoDbRepository } from './dynamodb.repository'
import { buildBatchDeleteRequestItem, tableName } from './event.table'

let fixtures = new Fixtures()
let dynamodb = DynamoDBDocumentClient.from(new DynamoDB({}), {
  marshallOptions: { removeUndefinedValues: true },
})
let repository = new DynamoDbRepository(dynamodb)

describe.skip('Dynamo DB repository', () => {
  beforeEach(async () => {
    await repository.executeBatchWriteRequests({
      [tableName]: [
        { pk: 'afrokiz4', sk: 'EVENT' },
        { pk: 'afrokiz4', sk: 'MERCH#afrokiz-vans' },
        { pk: 'afrokiz4', sk: 'MERCH#afrokiz-vans#VANS-AFKIZ-EDITION-36' },
        { pk: 'afrokiz4', sk: 'MERCH#afrokiz-vans#VANS-AFKIZ-EDITION-42' },
        { pk: 'afrokiz4', sk: 'PROMO#ROMAIN' },
        { pk: 'afrokiz4', sk: 'TICKET#afrokiz-fullpass' },
        { pk: 'afrokiz4', sk: 'TCKTOPT#masterclass-option' },
        { pk: 'afrokiz3', sk: 'EVENT' },
        { pk: 'afrokiz3', sk: 'MERCH#afrokiz-vans' },
        { pk: 'afrokiz3', sk: 'MERCH#afrokiz-vans#VANS-AFKIZ-EDITION-36' },
        { pk: 'afrokiz3', sk: 'MERCH#afrokiz-vans#VANS-AFKIZ-EDITION-42' },
        { pk: 'afrokiz3', sk: 'PROMO#ROMAIN' },
        { pk: 'afrokiz3', sk: 'TICKET#afrokiz-fullpass' },
        { pk: 'afrokiz3', sk: 'TCKTOPT#masterclass-option' },
      ].map(buildBatchDeleteRequestItem),
    })
  })
  it('should save events', async () => {
    await repository.saveEvents([fixtures.afrokiz4Event])

    expect(await repository.getAllUserEvents(fixtures.afrokiz4Event.userId)).toEqual([fixtures.afrokiz4Event])
  })
  it('should delete events', async () => {
    await repository.saveEvents([fixtures.afrokiz4Event])
    await repository.deleteEvents([fixtures.afrokiz4Event.id])

    expect(await repository.getAllUserEvents(fixtures.afrokiz4Event.userId)).toEqual([])
  })
  it('should save merchs', async () => {
    await repository.saveMerchs(fixtures.afrokiz4Event.id, [fixtures.afrokizVansMerch])

    expect(await repository.getAllMerchs(fixtures.afrokiz4Event.id)).toEqual([fixtures.afrokizVansMerch])
  })
  it('should delete merchs', async () => {
    await repository.saveMerchs(fixtures.afrokiz4Event.id, [fixtures.afrokizVansMerch])
    await repository.deleteMerchs(fixtures.afrokiz4Event.id, [fixtures.afrokizVansMerch.id])

    expect(await repository.getAllMerchs(fixtures.afrokiz4Event.id)).toEqual([])
  })
  it('should delete merch variants', async () => {
    await repository.saveMerchs(fixtures.afrokiz4Event.id, [fixtures.afrokizVansMerch])
    await repository.deleteMerchVariants(fixtures.afrokiz4Event.id, {
      [fixtures.afrokizVansMerch.id]: [fixtures.afrokizVansMerch.variants[0].sku],
    })

    expect(await repository.getAllMerchs(fixtures.afrokiz4Event.id)).toEqual([
      { ...fixtures.afrokizVansMerch, variants: [fixtures.afrokizVansMerch.variants[1]] },
    ])
  })
  it('should save promo codes', async () => {
    await repository.savePromoCodes(fixtures.afrokiz4Event.id, [fixtures.romainPromoCode])

    expect(await repository.getAllPromoCodes(fixtures.afrokiz4Event.id)).toEqual([fixtures.romainPromoCode])
  })
  it('should delete promo codes', async () => {
    await repository.savePromoCodes(fixtures.afrokiz4Event.id, [fixtures.romainPromoCode])
    await repository.deletePromoCodes(fixtures.afrokiz4Event.id, [fixtures.romainPromoCode.code])

    expect(await repository.getAllPromoCodes(fixtures.afrokiz4Event.id)).toEqual([])
  })
  it('should save ticket options', async () => {
    await repository.saveTicketOptions(fixtures.afrokiz4Event.id, [fixtures.masterclassOption])

    expect(await repository.getAllTicketOptions(fixtures.afrokiz4Event.id)).toEqual([fixtures.masterclassOption])
  })
  it('should delete ticket options', async () => {
    await repository.saveTicketOptions(fixtures.afrokiz4Event.id, [fixtures.masterclassOption])
    await repository.saveTickets(fixtures.afrokiz4Event.id, [fixtures.fullpassTicket])
    await repository.deleteTicketOptions(fixtures.afrokiz4Event.id, [fixtures.masterclassOption.id])

    expect(await repository.getAllTicketOptions(fixtures.afrokiz4Event.id)).toEqual([])
    expect(await repository.getAllTickets(fixtures.afrokiz4Event.id)).toEqual([
      { ...fixtures.fullpassTicket, options: [] },
    ])
  })
  it('should save tickets', async () => {
    await repository.saveTicketOptions(fixtures.afrokiz4Event.id, [fixtures.masterclassOption])
    await repository.saveTickets(fixtures.afrokiz4Event.id, [fixtures.fullpassTicket])

    expect(await repository.getAllTickets(fixtures.afrokiz4Event.id)).toEqual([fixtures.fullpassTicket])
  })
  it('should delete tickets', async () => {
    await repository.saveTickets(fixtures.afrokiz4Event.id, [fixtures.fullpassTicket])
    await repository.deleteTickets(fixtures.afrokiz4Event.id, [fixtures.fullpassTicket.id])

    expect(await repository.getAllTickets(fixtures.afrokiz4Event.id)).toEqual([])
  })
  it('should get all events from a user', async () => {
    await repository.saveEvents([fixtures.afrokiz4Event])
    await repository.saveMerchs(fixtures.afrokiz4Event.id, [fixtures.afrokizVansMerch])
    await repository.savePromoCodes(fixtures.afrokiz4Event.id, [fixtures.romainPromoCode])
    await repository.saveTicketOptions(fixtures.afrokiz4Event.id, [fixtures.masterclassOption])
    await repository.saveTickets(fixtures.afrokiz4Event.id, [fixtures.fullpassTicket])

    await repository.saveEvents([fixtures.afrokiz3Event])
    await repository.saveMerchs(fixtures.afrokiz3Event.id, [fixtures.afrokizVansMerch])
    await repository.savePromoCodes(fixtures.afrokiz3Event.id, [fixtures.romainPromoCode])
    await repository.saveTicketOptions(fixtures.afrokiz3Event.id, [fixtures.masterclassOption])
    await repository.saveTickets(fixtures.afrokiz3Event.id, [fixtures.fullpassTicket])

    expect(await repository.getAllUserEvents(fixtures.romainUser.id)).toEqual(
      expect.arrayContaining([
        {
          ...fixtures.afrokiz4Event,
          tickets: [fixtures.fullpassTicket],
          merchs: [fixtures.afrokizVansMerch],
          promoCodes: [fixtures.romainPromoCode],
        },
        {
          ...fixtures.afrokiz3Event,
          tickets: [fixtures.fullpassTicket],
          merchs: [fixtures.afrokizVansMerch],
          promoCodes: [fixtures.romainPromoCode],
        },
      ])
    )
  })
})

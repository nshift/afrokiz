import { describe, expect, it } from '@jest/globals'
import { Fixtures } from '../doubles/fixtures'
import { InMemoryRepository } from '../doubles/repository.in-memory'
import { MerchAdministration } from './merch-administration'

let fixtures = new Fixtures()
let repository = new InMemoryRepository()
let eventId = 'afrokiz-edition-4'
let uuidGenerator = { generate: () => fixtures.afrokizVansMerch.id }

describe('Add merchs', () => {
  it('should save the merchs', async () => {
    let merchAdministration = new MerchAdministration(repository, uuidGenerator)

    await merchAdministration.addMerchs(eventId, [fixtures.newAfrokizVansMerch])

    expect(await repository.getAllMerchs(eventId)).toEqual([fixtures.afrokizVansMerch])
  })
})

describe('Update merchs', () => {
  it('should update the merchs', async () => {
    let merchAdministration = new MerchAdministration(repository, uuidGenerator)
    let updatedAfrokizVansMerch = { ...fixtures.afrokizVansMerch, isSoldOut: true }

    await merchAdministration.addMerchs(eventId, [fixtures.newAfrokizVansMerch])
    await merchAdministration.updateMerchs(eventId, [updatedAfrokizVansMerch])

    expect(await repository.getAllMerchs(eventId)).toEqual([updatedAfrokizVansMerch])
  })
})

describe('List merch', () => {
  it('should list all the merchs', async () => {
    let merchAdministration = new MerchAdministration(repository, uuidGenerator)

    await merchAdministration.addMerchs(eventId, [fixtures.newAfrokizVansMerch])
    let merchs = await merchAdministration.listMerch(eventId)

    expect(merchs).toEqual([fixtures.afrokizVansMerch])
  })
})

describe('Remove merchs', () => {
  it('should soft delete the merchs', async () => {
    let merchAdministration = new MerchAdministration(repository, uuidGenerator)

    await merchAdministration.addMerchs(eventId, [fixtures.newAfrokizVansMerch])
    await merchAdministration.removeMerchs(eventId, [fixtures.afrokizVansMerch.id])

    expect(await repository.getAllMerchs(eventId)).toEqual([])
  })
})

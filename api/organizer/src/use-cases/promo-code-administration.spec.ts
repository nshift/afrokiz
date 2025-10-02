import { describe, expect, it } from '@jest/globals'
import { Fixtures } from '../doubles/fixtures'
import { InMemoryRepository } from '../doubles/repository.in-memory'
import { PromoCodeAdministration } from './promo-code-administration'

let fixtures = new Fixtures()
let repository = new InMemoryRepository()
let eventId = 'afrokiz-edition-4'

describe('Add promo codes', () => {
  it('should save the promo codes', async () => {
    let promoCodeAdministration = new PromoCodeAdministration(repository)

    await promoCodeAdministration.addPromoCodes(eventId, [fixtures.romainPromoCode])

    expect(await repository.getAllPromoCodes(eventId)).toEqual([fixtures.romainPromoCode])
  })
})

describe('Update promo codes', () => {
  it('should update the promo codes', async () => {
    let promoCodeAdministration = new PromoCodeAdministration(repository)
    let updatedPromoCodes = { ...fixtures.romainPromoCode, discountInPercent: 10 }

    await promoCodeAdministration.addPromoCodes(eventId, [fixtures.romainPromoCode])
    await promoCodeAdministration.updatePromoCodes(eventId, [updatedPromoCodes])

    expect(await repository.getAllPromoCodes(eventId)).toEqual([updatedPromoCodes])
  })
})

describe('List promo code', () => {
  it('should list all promo codes', async () => {
    let promoCodeAdministration = new PromoCodeAdministration(repository)

    await promoCodeAdministration.addPromoCodes(eventId, [fixtures.romainPromoCode])
    let promoCodes = await promoCodeAdministration.listPromoCode(eventId)

    expect(promoCodes).toEqual([fixtures.romainPromoCode])
  })
})

describe('Remove promo codes', () => {
  it('should delete the promo codes', async () => {
    let promoCodeAdministration = new PromoCodeAdministration(repository)

    await promoCodeAdministration.addPromoCodes(eventId, [fixtures.romainPromoCode])
    await promoCodeAdministration.removePromoCodes(eventId, [fixtures.romainPromoCode.code])

    expect(await repository.getAllPromoCodes(eventId)).toEqual([])
  })
})

describe.skip('Enable promo codes', () => {})

describe.skip('Disable promo codes', () => {})

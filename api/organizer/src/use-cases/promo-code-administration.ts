import { PromoCodeRepository } from '../adapters/repository'
import { Identifier } from '../entities/identifier'
import { PromoCode } from '../entities/promo-code'

export class PromoCodeAdministration {
  constructor(private readonly repository: PromoCodeRepository) {}

  async addPromoCodes(eventId: Identifier, newPromoCodes: PromoCode[]): Promise<void> {
    await this.repository.savePromoCodes(eventId, newPromoCodes)
  }

  async updatePromoCodes(eventId: Identifier, promoCodes: PromoCode[]): Promise<void> {
    await this.repository.savePromoCodes(eventId, promoCodes)
  }

  listPromoCode(eventId: Identifier): Promise<PromoCode[]> {
    return this.repository.getAllPromoCodes(eventId)
  }

  async removePromoCodes(eventId: Identifier, promoCodeIds: Identifier[]): Promise<void> {
    return this.repository.deletePromoCodes(eventId, promoCodeIds)
  }

  async disablePromoCodes(eventId: Identifier, promoCodeIds: Identifier[]): Promise<void> {}

  async enablePromoCodes(eventId: Identifier, promoCodeIds: Identifier[]): Promise<void> {}
}

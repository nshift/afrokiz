import { MerchRepository } from '../adapters/repository'
import { UUIDGenerator } from '../adapters/uuid.generator'
import { Identifier } from '../entities/identifier'
import { Merch, NewMerch } from '../entities/merch'

export class MerchAdministration {
  constructor(private readonly repository: MerchRepository, private readonly uuidGenerator: UUIDGenerator) {}

  async addMerchs(eventId: Identifier, newMerchs: NewMerch[]): Promise<void> {
    let merchs = newMerchs.map((newMerch) => ({ ...newMerch, id: this.uuidGenerator.generate() }))
    await this.repository.saveMerchs(eventId, merchs)
  }

  async updateMerchs(eventId: Identifier, merchs: Merch[]) {
    await this.repository.saveMerchs(eventId, merchs)
  }

  async listMerch(eventId: Identifier): Promise<Merch[]> {
    return this.repository.getAllMerchs(eventId)
  }

  async removeMerchs(eventId: Identifier, merchIds: Identifier[]): Promise<void> {
    await this.repository.deleteMerchs(eventId, merchIds)
  }
}

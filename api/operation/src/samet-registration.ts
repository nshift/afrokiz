import { SendingBulkEmails } from './adapters/email.gateway'
import { preSametGuestRegistrationEmail } from './adapters/email/email.samet-pre-registration'
import { SaveGuest } from './adapters/repository'
import { Guest, makeId } from './entities/guest'

export class SametRegistration {
  constructor(private readonly repository: SaveGuest, private readonly email: SendingBulkEmails) {}

  async preRegister(guest: { email: string; fullname: string }): Promise<void> {
    const preRegisteredGuest: Guest = { ...guest, id: makeId(), createdAt: new Date(), checkedIn: false }
    await this.repository.saveSametGuest(preRegisteredGuest)
    await this.email.sendBulkEmails(preSametGuestRegistrationEmail({ guest: preRegisteredGuest }))
  }
}

import { SendingBulkEmails } from './adapters/email.gateway'
import { preGuestRegistrationEmail } from './adapters/email/email.pre-registration'
import { SaveGuest } from './adapters/repository'
import { Guest, makeId } from './entities/guest'

export class GuestRegistration {
  constructor(
    private readonly repository: SaveGuest,
    private readonly email: SendingBulkEmails,
  ) {}

  async preRegister(guest: { email: string; fullname: string }): Promise<void> {
    const preRegisteredGuest: Guest = { ...guest, id: makeId(), createdAt: new Date(), checkedIn: false }
    await this.repository.saveGuest(preRegisteredGuest)
    await this.email.sendBulkEmails(preGuestRegistrationEmail({ guest: preRegisteredGuest }))
  }
}

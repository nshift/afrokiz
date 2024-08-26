import { GetGuest, SaveGuest } from './adapters/repository'
import { Guest } from './entities/guest'

export class GuestCheckIn {
  constructor(private readonly repository: GetGuest & SaveGuest) {}

  getGuest(email: string): Promise<Guest> {
    return this.repository.getGuest(email)
  }

  checkIn(email: string): Promise<void> {
    return this.repository.updateGuestCheckIn(email, true)
  }
}

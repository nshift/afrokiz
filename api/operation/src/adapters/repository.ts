import { Guest } from '../entities/guest'
import { Sales } from '../entities/sales'

export interface ListAllSales {
  listAllSales(): Promise<Sales[]>
}

export interface SaveGuest {
  saveGuest(guest: Guest): Promise<void>
  updateGuestCheckIn(guestEmail: string, value: boolean): Promise<void>
}

export interface GetGuest {
  getGuest(email: string): Promise<Guest>
}

import { EventConfiguration, NewEvent } from '../entities/event-configuration'
import { Merch, NewMerch } from '../entities/merch'
import { PromoCode } from '../entities/promo-code'
import { NewTicket, NewTicketOption, Ticket, TicketOption } from '../entities/ticket'
import { TicketInput } from '../use-cases/ticketing-administration'

export class Fixtures {
  romainCredential = {
    username: 'romain.asnar@gmail.com',
    password: '7xhR6>y7',
  }

  romainNewPasswordRequiredCredential = {
    username: 'romain.asnar+2@gmail.com',
    newPassword: '7xhR6>y7',
    oldPassword: '7xhR6>y7',
  }

  romainUser = {
    id: 'romain',
  }
  ployUser = {
    id: 'ploy',
  }

  newAfrokizEvent: NewEvent = {
    name: 'Afrokiz Edition 4',
    date: {
      start: new Date('2026-10-30'),
      end: new Date('2026-11-01'),
    },
    location: undefined,
    tickets: [],
    merchs: [],
    promoCodes: [],
  }

  afrokiz4Event: EventConfiguration = {
    id: 'afrokiz4',
    userId: this.romainUser.id,
    ...this.newAfrokizEvent,
    tickets: [],
    merchs: [],
    promoCodes: [],
  }

  afrokiz3Event: EventConfiguration = {
    id: 'afrokiz3',
    name: 'Afrokiz Edition 3',
    userId: this.romainUser.id,
    date: {
      start: new Date('2025-09-05'),
      end: new Date('2025-09-08'),
    },
    location: undefined,
    tickets: [],
    merchs: [],
    promoCodes: [],
  }

  newAfrokizVansMerch: NewMerch = {
    name: 'Vans Afrokiz Edition',
    price: { USD: 10000, EUR: 9900, THB: 360000 },
    discountedPrice: undefined,
    isSoldOut: false,
    variants: [
      {
        sku: 'VANS-AFKIZ-EDITION-36',
        attributes: { color: 'black-purple', size: '36' },
        additionalPrice: { USD: 0, EUR: 0, THB: 0 },
        stockQuantity: 10,
      },
      {
        sku: 'VANS-AFKIZ-EDITION-42',
        attributes: { color: 'black-purple', size: '42' },
        additionalPrice: { USD: 0, EUR: 0, THB: 0 },
        stockQuantity: 10,
      },
    ],
  }

  afrokizVansMerch: Merch = {
    id: 'afrokiz-vans',
    ...this.newAfrokizVansMerch,
  }

  romainPromoCode: PromoCode = {
    code: 'ROMAIN',
    discountInPercent: 5,
  }

  newMasterclassOption: NewTicketOption = {
    name: 'Masterclass',
    price: { USD: 10000, EUR: 9900, THB: 360000 },
    discountedPrice: undefined,
    isSoldOut: false,
    isDefault: false,
  }

  masterclassOption: TicketOption = {
    id: 'masterclass-option',
    ...this.newMasterclassOption,
  }

  newFullpassTicket: NewTicket = {
    name: 'Fullpass',
    price: { USD: 10000, EUR: 9900, THB: 360000 },
    discountedPrice: undefined,
    includes: ['All workshops', 'All parties'],
    isPromoted: false,
    isSoldOut: false,
    options: [this.newMasterclassOption],
  }

  fullpassTicket: Ticket = {
    id: 'afrokiz-fullpass',
    ...this.newFullpassTicket,
    options: [this.masterclassOption],
  }

  newFullpassTicketInput: Omit<TicketInput, 'id'> = {
    ...this.newFullpassTicket,
    options: [this.masterclassOption.id],
  }

  updatingFullpassTicketInput: TicketInput = {
    id: this.fullpassTicket.id,
    ...this.newFullpassTicketInput,
    options: [this.masterclassOption.id],
  }
}

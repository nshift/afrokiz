import fs from 'fs'
import path from 'path'
import { v4 as uuid } from 'uuid'
import { Sales } from '../../types/sales'
import { EmailTemplate } from './email.template'

export const ticketOptionEmailTemplate = (): EmailTemplate => ({
  name: 'TicketOption',
  destinations: [],
  subject: 'Add more to your Afrokiz experience - AfroKiz Bangkok #3',
  html: fs.readFileSync(path.join(__dirname, 'ticket-option.html')).toString(),
})

export const ticketOptionEmail = (data: { sale: Sales }[]): EmailTemplate => ({
  // name: 'TicketOption-' + uuid(),
  name: 'TicketOption',
  destinations: data.map(({ sale }) => ({
    toAddresses: [sale.email],
    data: {
      orderId: sale.id,
      fullname: sale.fullname,
    },
  })),
  subject: 'Add more to your Afrokiz experience - AfroKiz Bangkok #3',
  html: fs.readFileSync(path.join(__dirname, 'ticket-option.html')).toString(),
})

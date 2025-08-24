import fs from 'fs'
import path from 'path'
import { Guest } from '../../entities/guest'
import { EmailTemplate } from './email.template'

export const preGuestRegistrationEmailTemplate = (): EmailTemplate => ({
  name: 'PreGuestRegistrationEmail',
  destinations: [],
  subject: 'Pre Registration - AfroKiz Bangkok #3',
  html: fs.readFileSync(path.join(__dirname, 'pre-registration.html')).toString(),
})

export const preGuestRegistrationEmail = ({ guest }: { guest: Guest }): EmailTemplate => ({
  name: 'PreGuestRegistrationEmail',
  destinations: [
    {
      toAddresses: [guest.email],
      data: { email: guest.email, fullname: guest.fullname },
    },
  ],
  subject: 'Pre Registration - AfroKiz Bangkok #3',
  html: fs.readFileSync(path.join(__dirname, 'pre-registration.html')).toString(),
})

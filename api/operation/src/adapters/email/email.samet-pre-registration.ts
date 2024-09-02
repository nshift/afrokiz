import fs from 'fs'
import path from 'path'
import { v4 as uuid } from 'uuid'
import { Guest } from '../../entities/guest'
import { EmailTemplate } from './email.template'

export const preSametGuestRegistrationEmail = ({ guest }: { guest: Guest }): EmailTemplate => ({
  name: 'SametPreRegistrationEmail-' + uuid(),
  destinations: [
    {
      toAddresses: [guest.email],
      data: { email: guest.email, fullname: guest.fullname },
    },
  ],
  subject: 'Samet Getaway Pre-Registration - AfroKiz Bangkok #3',
  html: fs.readFileSync(path.join(__dirname, 'samet.pre-registration.html')).toString(),
})

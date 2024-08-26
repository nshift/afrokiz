import fs from 'fs'
import path from 'path'
import { v4 as uuid } from 'uuid'
import { Guest } from '../../entities/guest'
import { EmailTemplate } from './email.template'

export const preGuestRegistrationEmail = ({
  guest,
  qrCodeUrl,
}: {
  guest: Guest
  qrCodeUrl: string
}): EmailTemplate => ({
  name: 'PreGuestRegistrationEmail-' + uuid(),
  destinations: [
    {
      toAddresses: [guest.email],
      data: { email: guest.email, fullname: guest.fullname, qrCodeUrl },
    },
  ],
  subject: 'Pre Registration - AfroKiz Bangkok #2',
  html: fs.readFileSync(path.join(__dirname, 'pre-registration.html')).toString(),
})

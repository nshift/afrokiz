import fs from 'fs'
import path from 'path'
// import { v4 as uuid } from 'uuid'
import { Sales } from '../../types/sales'
import { EmailTemplate } from './email.template'

export const registrationReminderEmailTemplate = (): EmailTemplate => ({
  name: 'RegistrationReminderEmail',
  destinations: [],
  subject: '3 Days Before AfroKiz Bangkok #3',
  html: fs.readFileSync(path.join(__dirname, 'registration-reminder.html')).toString(),
})

export const registrationReminderEmail = (data: { sale: Sales; qrCodeUrl: string }[]): EmailTemplate => ({
  // name: 'RegistrationReminderEmail-' + uuid(),
  name: 'RegistrationReminderEmail',
  destinations: data.map(({ sale, qrCodeUrl }) => ({
    toAddresses: [sale.email],
    data: {
      orderId: sale.id,
      qrCodeUrl: qrCodeUrl.toString(),
      fullname: sale.fullname,
      passHexColor: getPassColor(sale.pass),
      passName: getPassName(sale.pass),
    },
  })),
  subject: '3 Days Before AfroKiz Bangkok #2',
  html: fs.readFileSync(path.join(__dirname, 'registration-reminder.html')).toString(),
})

function getPassColor(passId: string) {
  return (
    {
      'vip-silver': '#808080',
      'vip-gold': '#ed9e00',
    }[passId] ?? '#371b58'
  )
}

function getPassName(passId: string) {
  return (
    {
      party: 'Party Pass',
      'party-bundle': 'Party Combo Pass',
      fullpass: 'Full Pass',
      'fullpass-bundle': 'Full Pass + Masterclass',
      heneco: 'Heneco Full Pass',
      said: 'Said Full Pass',
      'vip-silver': 'VIP Silver Pass',
      'vip-gold': 'VIP Gold Pass',
      'fri-sat': 'Friday & Saturday Pass',
      'sat-sun': 'Saturday & Sunday Pass',
      fri: 'Friday Pass',
      sat: 'Saturday Pass',
      sun: 'Sunday Pass',
    }[passId] ?? passId.replace('-', ' ') + ' Pass'
  )
}

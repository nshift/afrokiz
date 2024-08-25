import fs from 'fs'
import path from 'path'
import { v4 as uuid } from 'uuid'
import { Customer } from '../../types/customer'
import { Order } from '../../types/order'
import { EmailTemplate } from './email.template'

export const confirmationEmail = ({
  order,
  customer,
  qrCodeUrl,
}: {
  order: Order
  customer: Customer
  qrCodeUrl: string
}): EmailTemplate => ({
  name: 'ConfirmationEmail-' + uuid(),
  destinations: [
    {
      toAddresses: [customer.email],
      data: {
        orderId: order.id,
        qrCodeUrl: qrCodeUrl,
        fullname: customer.fullname,
        items: order.items.map((item) => ({
          pass: item.title,
          includes: item.includes.map((description) => ({ description })),
          amount: item.amount,
          price: {
            amount: (item.total.amount / 100).toFixed(2).toString(),
            currency: item.total.currency,
          },
        })),
        total: {
          amount: (order.total.amount / 100).toFixed(2).toString(),
          currency: order.total.currency,
        },
        passHexColor: getPassColor(order.items[0].id),
        passName: getPassName(order.items[0].id),
      },
    },
  ],
  subject: 'Confirmation - AfroKiz Bangkok #2',
  html: fs.readFileSync(path.join(__dirname, 'confirmation.html')).toString(),
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

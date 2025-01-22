import fs from 'fs'
import path from 'path'
import { v4 as uuid } from 'uuid'
import { Customer } from '../../types/customer'
import { Order } from '../../types/order'
import { EmailTemplate } from './email.template'

export const confirmationEmail = (
  data: {
    order: Order
    customer: Customer
    qrCodeUrl: string
  }[]
): EmailTemplate => ({
  name: 'ConfirmationEmail-' + uuid(),
  destinations: data.map(({ order, customer, qrCodeUrl }) => ({
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
      passName: order.items[0].title,
    },
  })),
  subject: 'Confirmation - AfroKiz Bangkok #3',
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

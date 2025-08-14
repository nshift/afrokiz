import fs from 'fs'
import { DateTime } from 'luxon'
import path from 'path'
import { Customer } from '../../types/customer'
import { InstallmentPayment } from '../../types/installment'
import { Order } from '../../types/order'
import { UUIDGenerator } from '../uuid.generator'
import { EmailTemplate } from './email.template'

export const paymentConfirmationEmailTemplate = (): EmailTemplate => ({
  name: 'PaymentConfirmationEmail',
  destinations: [],
  subject: 'Payment confirmation - AfroKiz Bangkok #3',
  html: fs.readFileSync(path.join(__dirname, 'payment-confirmation.html')).toString(),
})

export const paymentConfirmationEmail = (
  data: {
    order: Order
    customer: Customer
    installment: InstallmentPayment
  }[],
  uuidGenerator: UUIDGenerator
): EmailTemplate => ({
  // name: 'PaymentConfirmationEmail-' + uuidGenerator.generate(),
  name: 'PaymentConfirmationEmail',
  destinations: data.map(({ order, customer, installment }) => {
    let completedDueDates = installment.dueDates.filter((dueDate) => dueDate.status == 'completed')
    let paidDueDate = completedDueDates[completedDueDates.length - 1]
    let pendingDueDates = installment.dueDates.filter((dueDate) => dueDate.status != 'completed')
    let nextDueDate = pendingDueDates.length > 0 ? pendingDueDates[0] : null
    const paymentStatusIcon = {
      pending: '⏸️',
      overdue: '⚠️',
      default: '⚠️',
      completed: '✅',
      success: '✅',
      failed: '⚠️',
    }
    return {
      toAddresses: [customer.email],
      data: {
        orderId: order.id,
        fullname: customer.fullname,
        passHexColor: getPassColor(order.items[0].id),
        passName: order.items[0].title,
        amountPaid: `${paidDueDate.currency} ${paidDueDate.amount / 100}`,
        paidDate: DateTime.fromJSDate(paidDueDate.dueDate).toISODate(),
        nextInstallmentAmount: nextDueDate ? `${nextDueDate.currency} ${nextDueDate.amount / 100}` : null,
        nextInstallmentDate: nextDueDate ? DateTime.fromJSDate(nextDueDate.dueDate).toISODate() : null,
        payments: installment.dueDates.map((dueDate) => ({
          statusIcon: paymentStatusIcon[dueDate.status],
          amount: dueDate.amount / 100,
          currency: dueDate.currency,
          date: DateTime.fromJSDate(dueDate.dueDate).toISODate(),
          status: dueDate.status,
        })),
      },
    }
  }),
  subject: 'Payment confirmation - AfroKiz Bangkok #3',
  html: fs.readFileSync(path.join(__dirname, 'payment-confirmation.html')).toString(),
})

function getPassColor(passId: string) {
  return (
    {
      'vip-silver': '#808080',
      'vip-gold': '#ed9e00',
    }[passId] ?? '#371b58'
  )
}

import { EmailTemplate } from '../adapters/email/email.template'
import { Sales } from '../entities/sales'

export const awdeshSales: Sales = {
  id: 'awdesh-sales',
  date: new Date('2025-01-01'),
  email: 'awdesh@gmail.com',
  pass: 'vip-silver',
  isLeader: true,
  includes: [
    { name: 'All Workshops' },
    { name: 'All parties in main venue' },
    { name: '3 welcome drinks per person' },
    { name: '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)' },
    { name: 'Exclusive Dinner Cruise Party (7th September 6:30PM-9:30PM)' },
    { name: '1H Foot Massage at Lek Massage per person' },
  ],
  total: { amount: 7000, currency: 'USD' },
  paymentStatus: 'success',
}

export const achiSales: Sales = {
  id: 'achi-sales',
  date: new Date('2025-01-02'),
  email: 'achi@gmail.com',
  pass: 'vip-gold',
  isLeader: true,
  includes: [
    { name: 'All Workshops' },
    { name: '2H Masterclass by Said & Oksana' },
    { name: '2H Masterclass by Heneco' },
    { name: 'All parties in main venue' },
    { name: '3 welcome drinks per person' },
    { name: '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)' },
    { name: 'Airport Pick up' },
    { name: 'Exclusive Dinner Cruise Party' },
    { name: '1H Foot Massage at Lek Massage per person' },
  ],
  total: { amount: 250000, currency: 'THB' },
  paymentStatus: 'success',
}

export const testEmailTemplate: EmailTemplate = {
  name: 'EmailDoublesTemplate',
  subject: 'Email template testing',
  html: `
  Hi,

  This is a test made by {{author}}.

  Best regards,
  `.replace(/\n/g, '<br />'),
  destinations: [{ toAddresses: ['romain.asnar@gmail.com'], data: { author: 'Uncle Bob' } }],
}

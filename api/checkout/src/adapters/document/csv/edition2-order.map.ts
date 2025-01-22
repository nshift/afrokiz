import { Currency } from '../../../types/currency'
import { Customer } from '../../../types/customer'
import { makeOrderId, Order } from '../../../types/order'

export const mapCustomer = (customer: any): Customer => ({
  email: customer['Email'],
  fullname: customer['Name'],
  type: (() => {
    switch ((customer['Type'] as string).toLowerCase()) {
      case 'follower':
        return 'follower'
      case 'leader':
        return 'leader'
      default:
        return 'couple'
    }
  })(),
})

export const mapOrder = (order: any, today: Date): Order => {
  const passName = order['Pass'].toUpperCase()
  const amount = Number((order['THB'] as string).replace(',', '')) * 100
  const options = (() => {
    const options = []
    if (order['Ginga'] == '1') {
      options.push('2H Ginga Styling bootcamp (video recorded)')
    }
    if (order['Cruise'] == '1') {
      options.push('Exclusive Dinner Cruise Party (7th September 6:30PM-9:30PM)')
    }
    if (order['S&O MC'] == '1') {
      options.push('2H Said & Oksana Masterclass')
    }
    if (order['Heneco MC'] == '1') {
      options.push('2H Heneco Masterclass')
    }
    if (order['Massage']) {
      options.push(`${order['Massage']}H Foot Massage at Lek Massage per person`)
    }
    if (order['Drinks']) {
      options.push(`${order['Drinks']} welcome drinks per person`)
    }
    return options
  })()
  const pass = (() => {
    switch (passName) {
      case 'FULL PASS':
        return {
          id: 'fullpass',
          title: 'Full Pass',
          includes: ['All workshops', 'All parties in main venue'].concat(options),
          amount: 1,
          total: { amount, currency: 'THB' as Currency },
        }
      case 'VIP GOLD':
        return {
          id: 'vip-gold',
          title: 'VIP Gold Pass',
          includes: [
            'All Workshops',
            'All parties in main venue',
            '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)',
            'Airport Pick up',
          ].concat(options),
          amount: 1,
          total: { amount, currency: 'THB' as Currency },
        }
      case 'VIP SILVER':
        return {
          id: 'vip-silver',
          title: 'VIP Silver Pass',
          includes: [
            'All Workshops',
            'All parties in main venue',
            '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)',
          ].concat(options),
          amount: 1,
          total: { amount, currency: 'THB' as Currency },
        }
      case 'PARTY PASS':
        return {
          id: 'party',
          title: 'Party Pass',
          includes: ['All parties in main venue'].concat(options),
          amount: 1,
          total: { amount, currency: 'THB' as Currency },
        }
      case 'PARTY COMBO':
        return {
          id: 'party-bundle',
          title: 'Party Pass',
          includes: ['All parties in main venue', 'Day time social party'].concat(options),
          amount: 1,
          total: { amount, currency: 'THB' as Currency },
        }
      case 'HENECO MASTER CLASS':
        return {
          id: 'heneco-master-class',
          title: 'Heneco Master Class',
          includes: ["Saturday's Day Time Social", '2H Heneco Masterclass'],
          amount: 1,
          total: { amount, currency: 'THB' as Currency },
        }
      default:
        return {
          id: (order['Pass'] as string).toLowerCase().replace(' ', '-'),
          title: order['Pass'],
          includes: options,
          amount: 1,
          total: { amount, currency: 'THB' as Currency },
        }
    }
  })()
  return {
    id: makeOrderId(),
    date: today,
    items: [pass],
    total: { amount, currency: 'THB' },
  }
}

export const mapPromoCode = (item: any): string | null => item['Promo Code'] ?? null

import { Currency } from '../../../types/currency'
import { Customer } from '../../../types/customer'
import { makeOrderId, Order } from '../../../types/order'

const email = (object: any) => object['Email']
const name = (object: any) => object['Name']
const type = (object: any) => object['Type']
const promoCode = (object: any) => object['Promo Code']
const price = (object: any) => object['Price']
const currency = (object: any) => object['Currency']
const passId = (object: any) => object['Pass']

export const mapCustomer = (customer: any): Customer => ({
  email: email(customer),
  fullname: name(customer),
  type: (() => {
    switch ((type(customer) as string).toLowerCase()) {
      case 'follower':
        return 'follower'
      case 'leader':
        return 'leader'
      default:
        return 'couple'
    }
  })(),
})

export const mapPromoCode = (item: any): string | null => promoCode(item) ?? null

export const mapOrder = (order: any, today: Date): Order => {
  const total = mapTotal(order)
  const passItem = mapPassItem(order, total)
  const options = mapOptions(order)
  return { id: makeOrderId(), date: today, items: [passItem].concat(options), total }
}

const mapTotal = (order: any): { amount: number; currency: Currency } => ({
  amount: Number((price(order) as string).replace(',', '')) * 100,
  currency: currency(order).toUpperCase(),
})

const mapPassItem = (order: any, total: { amount: number; currency: Currency }) => ({
  ...passes[passId(order)],
  amount: 1,
  total,
})

const mapOptions = (order: any) =>
  Object.keys(passOptions).reduce((options, optionName) => {
    if (order[optionName] == '1') {
      options.push({ ...passOptions[optionName], amount: 1, total: { amount: 0, currency: 'THB' as Currency } })
    }
    return options
  }, [] as Order['items'])

type Pass = { id: string; title: string; includes: string[] }

const passes: { [key: string]: Pass } = {
  'fullpass-edition3': {
    id: 'fullpass-edition3',
    title: 'SUPER EARLY BIRD Full Pass',
    includes: ['All workshops', 'All parties in main venue', '3 welcome drinks per person'],
  },
  'early-bird-fullpass-edition3': {
    id: 'early-bird-fullpass-edition3',
    title: 'EARLY BIRD Full Pass',
    includes: ['Includes all workshops', 'Day time social', 'Evening parties during September 5-7', 'Non-refundable'],
  },
  fullPass: {
    id: 'fullpass',
    title: 'Full Pass',
    includes: ['All workshops', 'Day time social', 'Evening parties during September 5-7', 'Non-refundable'],
  },
  vipSilverPass: {
    id: 'vip-silver',
    title: 'VIP Silver',
    includes: [
      'All workshops',
      'Day time social',
      'Evening parties during September 5-7',
      '3 welcome drinks per person',
      '3 Nights Stay at I-Residence Silom Bangkok Hotel (breakfast included)',
      'Exclusive Cruise Party',
      '1H Foot Massage at Lek Massage per person',
      'Non-refundable',
    ],
  },
  vipGoldPass: {
    id: 'vip-gold',
    title: 'VIP Gold',
    includes: [
      'All workshops',
      'Day time social',
      'Evening parties during September 5-7',
      '2H Masterclass by Audi & Laura',
      "2H Masterclass by T'Peak",
      '3 welcome drinks per person',
      '3 Nights Stay at I-Residence Silom Bangkok Hotel (breakfast included)',
      'Airport Pick up',
      'Exclusive Cruise Party',
      '1H Foot Massage at Lek Massage per person',
      'Non-refundable',
    ],
  },
  sametBangkokPass: {
    id: 'samet-bangkok',
    title: 'Bangkok x Samet Pass',
    includes: [
      'All workshops at Bangkok and Koh Samet',
      'Day time social',
      'Evening parties during September 5-12',
      'Breakfast, Lunch and Dinner for 3 Days in Koh Samet',
      'Non-refundable',
    ],
  },
  sametPass: {
    id: 'samet',
    title: 'Samet Getaway Pass',
    includes: [
      'All workshops at Koh Samet only',
      'Day time social',
      'Evening parties during September 9-12',
      '3 Nights at Hotel Sangthianbeach Resort',
      'Breakfast, Lunch and Dinner for 3 Days',
      'Non-refundable',
    ],
  },
}

type PassOption = { id: string; title: string; includes: string[]; includesInShortDescription: string[] }

const passOptions: { [key: string]: PassOption } = {
  Cruise: {
    id: 'cruise-option',
    title: 'Cruise Party',
    includesInShortDescription: ['3H party & Carribean Tappas'],
    includes: ['Exclusive Cruise Party'],
  },
  'VIP Silver Upgrade': {
    id: 'vip-silver-upgrade',
    title: 'VIP Silver Upgrade',
    includesInShortDescription: ['Upgrade to VIP Silver Pass'],
    includes: [
      '3 Nights Stay at I-Residence Silom Bangkok Hotel (breakfast included)',
      'Exclusive Cruise Party',
      '1H Foot Massage at Lek Massage per person',
    ],
  },
  'VIP Gold Upgrade': {
    id: 'vip-gold-upgrade',
    title: 'VIP Gold Upgrade',
    includesInShortDescription: ['Upgrade to VIP Gold Pass'],
    includes: [
      '3 Nights Stay at I-Residence Silom Bangkok Hotel (breakfast included)',
      'Exclusive Cruise Party',
      '1H Foot Massage at Lek Massage per person',
      '2H Masterclass by Audi & Laura',
      "2H Masterclass by T'Peak",
      'Airport Pick up',
    ],
  },
  'Samet Hotel Room': {
    id: 'hotel-room-option',
    title: 'Shared Samet Hotel Room',
    includesInShortDescription: ['3 Nights in a shared room at Hotel Sangthianbeach Resort'],
    includes: ['3 Nights in a shared room at Hotel Sangthianbeach Resort'],
  },
}

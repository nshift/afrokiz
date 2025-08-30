import { Currency } from '../../../types/currency'
import { Customer } from '../../../types/customer'
import { makeOrderId, Order } from '../../../types/order'

const email = (object: any) => object['Email']
const name = (object: any) => object['Name']
const type = (object: any) => object['Dancer type']
const promoCode = (object: any) => object['Promo Code']
const price = (object: any) => object['Amount']
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
  return { id: makeOrderId(), status: 'paid', date: today, items: [passItem].concat(options), total }
}

const mapTotal = (order: any): { amount: number; currency: Currency } => ({
  amount: Number((price(order) as string).replace(',', '')) * 100,
  currency: currency(order).toUpperCase(),
})

const mapPassItem = (order: any, total: { amount: number; currency: Currency }) => ({
  ...Object.values(passes).find((pass) => pass.id == passId(order))!,
  amount: 1,
  total,
})

const mapOptions = (order: any) =>
  Object.keys(passOptions).reduce((options, optionName) => {
    if (
      order[optionName] == '1' &&
      !(passId(order) == 'vip-gold' && optionName != 'Afro Bootcamp') &&
      !(passId(order) == 'all-inclusive-package' && ['Samet Hotel Room', 'Cruise'].includes(optionName))
    ) {
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
  guestPass: {
    id: 'guest-pass',
    title: 'Guest Pass',
    includes: ['All workshops', 'Day time social', 'Evening parties during September 5-7', 'Non-transferable'],
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
      '2H Masterclass by Asia',
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
      'Transportation Bangkok to Samet and return',
      'Fire Show in Koh Samet',
    ],
  },
  sametPass: {
    id: 'samet',
    title: 'Samet Getaway Pass',
    includes: [
      'All workshops at Koh Samet',
      'All parties at Koh Samet',
      'Day time social',
      'Breakfast, Lunch and Dinner for 3 Days in Koh Samet',
      'Transportation Bangkok to Samet and return',
      'Fire Show in Koh Samet',
    ],
  },
  partyPackage: {
    id: 'party-package',
    title: 'Party Package',
    includes: [
      'All workshops at Koh Samet',
      'Day time social',
      'Evening parties during September 5-12',
      'Breakfast, Lunch and Dinner for 3 Days in Koh Samet',
      'Transportation Bangkok to Samet and return',
      'Fire Show in Koh Samet',
    ],
  },
  allInclusivePackage: {
    id: 'all-inclusive-package',
    title: 'All Inclusive Package',
    includes: [
      'All workshops at Bangkok and Koh Samet',
      'Day time social',
      'Evening parties during September 5-12',
      '4 Nights Stay at Bangkok hotel',
      'Cruise Party in Bangkok',
      '3 Nights Stay in shared room at Koh Samet hotel',
      'Breakfast, Lunch and Dinner for 3 Days in Koh Samet',
      'Transportation Bangkok to Samet and return',
      'Fire Show in Koh Samet',
      'Airport Pick Up',
    ],
  },
  partyPass: {
    id: 'partyPass',
    title: 'Party Pass',
    includes: ['Evening parties during September 5-7', 'Day time social', 'Includes 3 welcome drinks'],
  },
  friNight: {
    id: 'fri-night',
    title: 'Friday Party Pass',
    includes: ['Includes 1 welcome drinks', 'Party until 4 am.'],
  },
  satNight: {
    id: 'sat-night',
    title: 'Saturday Party Pass',
    includes: ['Includes 1 welcome drinks', 'Party until 5 am.'],
  },
  sunNight: {
    id: 'sun-night',
    title: 'Sunday Party Pass',
    includes: ['Includes 1 welcome drinks', 'Party until 4 am.'],
  },
  fri: {
    id: 'fri',
    title: 'Friday Pass',
    includes: ['All workshops in Friday', 'Day time social', 'Friday Evening party', 'Includes 1 welcome drinks'],
  },
  sat: {
    id: 'sat',
    title: 'Saturday Pass',
    includes: ['All workshops in Saturday', 'Day time social', 'Saturday Evening party', 'Includes 1 welcome drinks'],
  },
  sun: {
    id: 'sun',
    title: 'Sunday Pass',
    includes: ['All workshops in Sunday', 'Day time social', 'Sunday Evening party', 'Includes 1 welcome drinks'],
  },
}

type PassOption = { id: string; title: string; includes: string[] }

const passOptions: { [key: string]: PassOption } = {
  Cruise: {
    id: 'cruise-option',
    title: 'Cruise Party',
    includes: ['Exclusive Cruise Party'],
  },
  'Afro Bootcamp': {
    id: 'afro-bootcamp',
    title: 'Afro Essense Bootcamp by AfroGiants',
    includes: ['1H30 Afro Essense Bootcamp by AfroGiants'],
  },
  'Audi & Laura MC': {
    id: 'audi-laura-masterclass',
    title: 'Audi & Laura Masterclass',
    includes: ['2H Audi & Laura Masterclass'],
  },
  'TPeak MC': {
    id: 'tpeak-masterclass',
    title: "T'Peak Masterclass",
    includes: ["2H T'Peak Masterclass"],
  },
  'Asia MC': {
    id: 'asia-masterclass',
    title: 'Asia Masterclass',
    includes: ['2H Asia Masterclass'],
  },
  'Samet Hotel Room': {
    id: 'hotel-room-option',
    title: 'Shared Samet Hotel Room',
    includes: ['3 Nights in a shared room at Hotel Sangthianbeach Resort'],
  },
}

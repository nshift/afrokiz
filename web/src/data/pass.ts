import { options, type Option } from './options'

export type Pass = {
  id: string
  name: string
  price: {
    USD: number
    EUR: number
    THB: number
  }
  doorPrice: {
    USD: number
    EUR: number
    THB: number
  }
  includes: string[]
  isPromoted: boolean
  isSoldOut: boolean
  options: { [key: string]: Option }
}

const makePromotion = (promotion: { price: Pass['price']; start: Date; end: Date }) => ({
  price: promotion.price,
  isActive: new Date().getTime() > promotion.start.getTime() && new Date().getTime() < promotion.end.getTime(),
})

export const passes: { [key: string]: Pass } = {
  party: {
    id: 'party',
    name: 'Party Pass',
    isSoldOut: false,
    price: (() => {
      const promotions = [
        makePromotion({
          price: { USD: 7599, EUR: 6999, THB: 269900 },
          start: new Date('2024-01-01'),
          end: new Date('2024-02-01'),
        }),
        makePromotion({
          price: { USD: 9299, EUR: 8399, THB: 319900 },
          start: new Date('2024-02-01'),
          end: new Date('2024-03-01'),
        }),
        makePromotion({
          price: { USD: 9899, EUR: 8999, THB: 339900 },
          start: new Date('2024-03-01'),
          end: new Date('2024-05-01'),
        }),
        makePromotion({
          price: { USD: 10599, EUR: 9699, THB: 369900 },
          start: new Date('2024-05-01'),
          end: new Date('2024-07-01'),
        }),
        makePromotion({
          price: { USD: 11299, EUR: 10299, THB: 389900 },
          start: new Date('2024-07-01'),
          end: new Date('2024-09-01'),
        }),
      ]
      const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
      const doorPrice = { USD: 12499, EUR: 11299, THB: 429900 }
      return activePromotion?.price ?? doorPrice
    })(),
    doorPrice: { USD: 12499, EUR: 11299, THB: 429900 },
    includes: ['All parties in main venue', '3 welcome drinks'],
    isPromoted: false,
    options: {
      'massage-option': options['massage-option'],
      'muay-thai-option': options['muay-thai-option'],
      'cruise-option': options['cruise-option'],
      'all-mc-option': options['all-mc-option'],
      'heneco-mc-option': options['heneco-mc-option'],
      'said-mc-option': options['said-mc-option'],
    },
  },
  fullPass: {
    id: 'fullpass',
    name: 'Full Pass',
    isSoldOut: false,
    price: (() => {
      const promotions = [
        makePromotion({
          price: { USD: 9499, EUR: 8499, THB: 319900 },
          start: new Date('2024-01-01'),
          end: new Date('2024-02-01'),
        }),
        makePromotion({
          price: { USD: 9999, EUR: 8999, THB: 339900 },
          start: new Date('2024-02-01'),
          end: new Date('2024-03-01'),
        }),
        makePromotion({
          price: { USD: 10599, EUR: 9699, THB: 369900 },
          start: new Date('2024-03-01'),
          end: new Date('2024-05-01'),
        }),
        makePromotion({
          price: { USD: 11499, EUR: 10499, THB: 399900 },
          start: new Date('2024-05-01'),
          end: new Date('2024-07-01'),
        }),
        makePromotion({
          price: { USD: 12399, EUR: 11299, THB: 429900 },
          start: new Date('2024-07-01'),
          end: new Date('2024-09-01'),
        }),
      ]
      const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
      const doorPrice = { USD: 13099, EUR: 12499, THB: 449900 }
      return activePromotion?.price ?? doorPrice
    })(),
    doorPrice: { USD: 13099, EUR: 12499, THB: 449900 },
    includes: ['All workshops', 'All parties in main venue', '3 welcome drinks'],
    isPromoted: false,
    options: {
      'massage-option': options['massage-option'],
      'muay-thai-option': options['muay-thai-option'],
      'cruise-option': options['cruise-option'],
      'all-mc-option': options['all-mc-option'],
      'heneco-mc-option': options['heneco-mc-option'],
      'said-mc-option': options['said-mc-option'],
    },
  },
  vipSilver: {
    id: 'vip-silver',
    name: 'VIP Silver Pass',
    isSoldOut: false,
    price: (() => {
      const promotions = [
        makePromotion({
          price: { USD: 25999, EUR: 22999, THB: 899000 },
          start: new Date('2024-01-01'),
          end: new Date('2024-02-01'),
        }),
        makePromotion({
          price: { USD: 27999, EUR: 24999, THB: 939900 },
          start: new Date('2024-02-01'),
          end: new Date('2024-03-01'),
        }),
        makePromotion({
          price: { USD: 30099, EUR: 27499, THB: 1049900 },
          start: new Date('2024-03-01'),
          end: new Date('2024-05-01'),
        }),
        makePromotion({
          price: { USD: 32999, EUR: 30099, THB: 1149900 },
          start: new Date('2024-05-01'),
          end: new Date('2024-07-01'),
        }),
        makePromotion({
          price: { USD: 38699, EUR: 35299, THB: 1349900 },
          start: new Date('2024-07-01'),
          end: new Date('2024-09-01'),
        }),
      ]
      const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
      const doorPrice = { USD: 39999, EUR: 37099, THB: 1509900 }
      return activePromotion?.price ?? doorPrice
    })(),
    doorPrice: { USD: 39999, EUR: 37099, THB: 1509900 },
    includes: [
      'All Workshops',
      'All parties in main venue',
      '3 welcome drinks',
      '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)',
      'Exclusive Dinner Cruise Party (7th September 6:30PM-9:30PM)',
      '1H Foot Massage at Lek Massage',
    ],
    isPromoted: true,
    options: {
      'couple-option': {
        id: 'couple-option',
        icon: 'fa-user-group',
        title: 'Couple',
        description: '1 couple ticket',
        price: (() => {
          const promotions = [
            makePromotion({
              price: { USD: 12900, EUR: 11800, THB: 450000 },
              start: new Date('2024-01-01'),
              end: new Date('2024-02-01'),
            }),
            makePromotion({
              price: { USD: 13800, EUR: 12600, THB: 480000 },
              start: new Date('2024-02-01'),
              end: new Date('2024-03-01'),
            }),
            makePromotion({
              price: { USD: 14600, EUR: 13400, THB: 510000 },
              start: new Date('2024-03-01'),
              end: new Date('2024-05-01'),
            }),
            makePromotion({
              price: { USD: 15500, EUR: 14200, THB: 540000 },
              start: new Date('2024-05-01'),
              end: new Date('2024-07-01'),
            }),
            makePromotion({
              price: { USD: 16600, EUR: 15200, THB: 580000 },
              start: new Date('2024-07-01'),
              end: new Date('2024-09-01'),
            }),
          ]
          const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
          const doorPrice = { USD: 17500, EUR: 16000, THB: 660000 }
          return activePromotion?.price ?? doorPrice
        })(),
      },
      'muay-thai-option': options['muay-thai-option'],
      'all-mc-option': options['all-mc-option'],
      'heneco-mc-option': options['heneco-mc-option'],
      'said-mc-option': options['said-mc-option'],
    },
  },
  vipGold: {
    id: 'vip-gold',
    name: 'VIP Gold Pass',
    isSoldOut: false,
    price: (() => {
      const promotions = [
        makePromotion({
          price: { USD: 34399, EUR: 31299, THB: 1199000 },
          start: new Date('2024-01-01'),
          end: new Date('2024-02-01'),
        }),
        makePromotion({
          price: { USD: 37999, EUR: 34999, THB: 1399000 },
          start: new Date('2024-02-01'),
          end: new Date('2024-03-01'),
        }),
        makePromotion({
          price: { USD: 42999, EUR: 39299, THB: 1499000 },
          start: new Date('2024-03-01'),
          end: new Date('2024-05-01'),
        }),
        makePromotion({
          price: { USD: 45799, EUR: 41799, THB: 1599000 },
          start: new Date('2024-05-01'),
          end: new Date('2024-07-01'),
        }),
        makePromotion({
          price: { USD: 50099, EUR: 45699, THB: 1749900 },
          start: new Date('2024-07-01'),
          end: new Date('2024-09-01'),
        }),
      ]
      const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
      const doorPrice = { USD: 52999, EUR: 46099, THB: 1900000 }
      return activePromotion?.price ?? doorPrice
    })(),
    doorPrice: { USD: 52999, EUR: 46099, THB: 1900000 },
    includes: [
      'All Workshops',
      '2H Masterclass by Said & Oksana',
      '2H Masterclass by Heneco',
      'All parties in main venue',
      '3 welcome drinks',
      '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)',
      'Airport Pick up',
      'Exclusive Dinner Cruise Party',
      '1H Foot Massage at Lek Massage',
    ],
    isPromoted: false,
    options: {
      'couple-option': {
        id: 'couple-option',
        icon: 'fa-user-group',
        title: 'Couple',
        description: '1 couple ticket',
        price: (() => {
          const promotions = [
            makePromotion({
              price: { USD: 17500, EUR: 16000, THB: 610000 },
              start: new Date('2024-01-01'),
              end: new Date('2024-02-01'),
            }),
            makePromotion({
              price: { USD: 18600, EUR: 17000, THB: 650000 },
              start: new Date('2024-02-01'),
              end: new Date('2024-03-01'),
            }),
            makePromotion({
              price: { USD: 20000, EUR: 18200, THB: 700000 },
              start: new Date('2024-03-01'),
              end: new Date('2024-05-01'),
            }),
            makePromotion({
              price: { USD: 21400, EUR: 19500, THB: 750000 },
              start: new Date('2024-05-01'),
              end: new Date('2024-07-01'),
            }),
            makePromotion({
              price: { USD: 22900, EUR: 20900, THB: 800000 },
              start: new Date('2024-07-01'),
              end: new Date('2024-09-01'),
            }),
          ]
          const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
          const doorPrice = { USD: 25700, EUR: 23500, THB: 900000 }
          return activePromotion?.price ?? doorPrice
        })(),
      },
      'muay-thai-option': options['muay-thai-option'],
    },
  },
}

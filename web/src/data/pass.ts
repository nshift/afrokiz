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
          price: { USD: 7500, EUR: 6900, THB: 269000 },
          start: new Date('2024-01-01'),
          end: new Date('2024-02-01'),
        }),
        makePromotion({
          price: { USD: 9900, EUR: 8900, THB: 339000 },
          start: new Date('2024-02-01'),
          end: new Date('2024-05-01'),
        }),
        makePromotion({
          price: { USD: 10500, EUR: 9900, THB: 369000 },
          start: new Date('2024-05-01'),
          end: new Date('2024-07-01'),
        }),
        makePromotion({
          price: { USD: 11500, EUR: 10500, THB: 389000 },
          start: new Date('2024-07-01'),
          end: new Date('2024-09-01'),
        }),
      ]
      const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
      const doorPrice = { USD: 12500, EUR: 11500, THB: 429000 }
      return activePromotion?.price ?? doorPrice
    })(),
    doorPrice: { USD: 12500, EUR: 11500, THB: 429000 },
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
          price: { USD: 9500, EUR: 8500, THB: 319000 },
          start: new Date('2024-01-01'),
          end: new Date('2024-02-01'),
        }),
        makePromotion({
          price: { USD: 12500, EUR: 11500, THB: 429000 },
          start: new Date('2024-02-01'),
          end: new Date('2024-05-01'),
        }),
        makePromotion({
          price: { USD: 13500, EUR: 12500, THB: 469000 },
          start: new Date('2024-05-01'),
          end: new Date('2024-07-01'),
        }),
        makePromotion({
          price: { USD: 13900, EUR: 12900, THB: 489000 },
          start: new Date('2024-07-01'),
          end: new Date('2024-09-01'),
        }),
      ]
      const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
      const doorPrice = { USD: 14900, EUR: 13900, THB: 529000 }
      return activePromotion?.price ?? doorPrice
    })(),
    doorPrice: { USD: 14900, EUR: 13900, THB: 529000 },
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
          price: { USD: 25900, EUR: 22900, THB: 899000 },
          start: new Date('2024-01-01'),
          end: new Date('2024-02-01'),
        }),
        makePromotion({
          price: { USD: 36500, EUR: 33500, THB: 1279000 },
          start: new Date('2024-02-01'),
          end: new Date('2024-05-01'),
        }),
        makePromotion({
          price: { USD: 39900, EUR: 36900, THB: 1399000 },
          start: new Date('2024-05-01'),
          end: new Date('2024-07-01'),
        }),
        makePromotion({
          price: { USD: 41900, EUR: 38500, THB: 1479000 },
          start: new Date('2024-07-01'),
          end: new Date('2024-09-01'),
        }),
      ]
      const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
      const doorPrice = { USD: 39900, EUR: 41500, THB: 1599000 }
      return activePromotion?.price ?? doorPrice
    })(),
    doorPrice: { USD: 39900, EUR: 41500, THB: 1599000 },
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
              price: { USD: 14900, EUR: 13500, THB: 510000 },
              start: new Date('2024-02-01'),
              end: new Date('2024-05-01'),
            }),
            makePromotion({
              price: { USD: 15500, EUR: 14500, THB: 540000 },
              start: new Date('2024-05-01'),
              end: new Date('2024-07-01'),
            }),
            makePromotion({
              price: { USD: 16500, EUR: 15500, THB: 580000 },
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
          price: { USD: 34500, EUR: 31500, THB: 1199000 },
          start: new Date('2024-01-01'),
          end: new Date('2024-02-01'),
        }),
        makePromotion({
          price: { USD: 45500, EUR: 41900, THB: 1599000 },
          start: new Date('2024-02-01'),
          end: new Date('2024-05-01'),
        }),
        makePromotion({
          price: { USD: 49900, EUR: 45900, THB: 1749000 },
          start: new Date('2024-05-01'),
          end: new Date('2024-07-01'),
        }),
        makePromotion({
          price: { USD: 52500, EUR: 47900, THB: 1839000 },
          start: new Date('2024-07-01'),
          end: new Date('2024-09-01'),
        }),
      ]
      const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
      const doorPrice = { USD: 56500, EUR: 52000, THB: 1999000 }
      return activePromotion?.price ?? doorPrice
    })(),
    doorPrice: { USD: 56500, EUR: 52000, THB: 1999000 },
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
              price: { USD: 20000, EUR: 18200, THB: 700000 },
              start: new Date('2024-02-01'),
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

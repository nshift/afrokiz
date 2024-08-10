import { options, type Option } from './options'

export type Currency = 'USD' | 'EUR' | 'THB'

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
  giveAways: string[]
  isPromoted: boolean
  isSoldOut: boolean
  options: { [key: string]: Option }
}

const makePromotion = (promotion: { price: Pass['price']; start: Date; end: Date }) => ({
  price: promotion.price,
  isActive: new Date().getTime() > promotion.start.getTime() && new Date().getTime() < promotion.end.getTime(),
})

export const defaultPasses: { [key: string]: Pass } = {
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
          price: { USD: 11500, EUR: 10500, THB: 420000 },
          start: new Date('2024-07-01'),
          end: new Date('2024-08-07'),
        }),
        makePromotion({
          price: { USD: 13000, EUR: 12000, THB: 465000 },
          start: new Date('2024-08-08'),
          end: new Date('2024-09-07'),
        }),
      ]
      const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
      const doorPrice = { USD: 14200, EUR: 13000, THB: 500000 }
      return activePromotion?.price ?? doorPrice
    })(),
    doorPrice: { USD: 14200, EUR: 13000, THB: 500000 },
    includes: ['All parties in main venue', '3 welcome drinks per person'],
    giveAways: [],
    isPromoted: false,
    options: {
      'massage-option': options['massage-option'],
      'bootcamp-option': options['bootcamp-option'],
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
          price: { USD: 12500, EUR: 11500, THB: 450000 },
          start: new Date('2024-02-01'),
          end: new Date('2024-05-01'),
        }),
        makePromotion({
          price: { USD: 13500, EUR: 12500, THB: 469000 },
          start: new Date('2024-05-01'),
          end: new Date('2024-07-01'),
        }),
        makePromotion({
          price: { USD: 17500, EUR: 16000, THB: 640000 },
          start: new Date('2024-07-01'),
          end: new Date('2024-08-08'),
        }),
        makePromotion({
          price: { USD: 20000, EUR: 18000, THB: 695000 },
          start: new Date('2024-08-09'),
          end: new Date('2024-09-07'),
        }),
      ]
      const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
      const doorPrice = { USD: 21000, EUR: 19000, THB: 730000 }
      return activePromotion?.price ?? doorPrice
    })(),
    doorPrice: { USD: 21000, EUR: 19000, THB: 730000 },
    includes: ['All workshops', 'All parties in main venue', '3 welcome drinks per person'],
    giveAways: [],
    isPromoted: true,
    options: {
      'couple-option': {
        id: 'couple-option',
        icon: 'fa-user-group',
        title: 'Couple',
        includes: ['1 couple ticket'],
        selected: false,
        price: (() => {
          const promotions = [
            makePromotion({
              price: { USD: 12500, EUR: 11500, THB: 450000 },
              start: new Date('2024-07-01'),
              end: new Date('2024-09-07'),
            }),
          ]
          const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
          const doorPrice = { USD: 15000, EUR: 14000, THB: 550000 }
          return activePromotion?.price ?? doorPrice
        })(),
      },
      'massage-option': options['massage-option'],
      'bootcamp-option': {
        ...options['bootcamp-option'],
        price: { USD: 1400, EUR: 1200, THB: 50000 },
      },
      'cruise-option': options['cruise-option'],
      'all-mc-option': options['all-mc-option'],
      'heneco-mc-option': options['heneco-mc-option'],
      'said-mc-option': options['said-mc-option'],
    },
  },
  vipSilver: {
    id: 'vip-silver',
    name: 'VIP Silver Pass',
    isSoldOut: true,
    price: (() => {
      const promotions = [
        makePromotion({
          price: { USD: 25900, EUR: 22900, THB: 899000 },
          start: new Date('2024-01-01'),
          end: new Date('2024-02-01'),
        }),
        makePromotion({
          price: { USD: 36500, EUR: 33500, THB: 1295000 },
          start: new Date('2024-02-01'),
          end: new Date('2024-05-01'),
        }),
        makePromotion({
          price: { USD: 39900, EUR: 36900, THB: 1399000 },
          start: new Date('2024-05-01'),
          end: new Date('2024-07-01'),
        }),
        makePromotion({
          price: { USD: 41500, EUR: 38900, THB: 1499000 },
          start: new Date('2024-07-01'),
          end: new Date('2024-09-07'),
        }),
      ]
      const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
      const doorPrice = { USD: 44900, EUR: 41500, THB: 1599000 }
      return activePromotion?.price ?? doorPrice
    })(),
    doorPrice: { USD: 44900, EUR: 41500, THB: 1599000 },
    includes: [
      'All Workshops',
      'All parties in main venue',
      '3 welcome drinks per person',
      '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)',
      'Exclusive Dinner Cruise Party (7th September 6:30PM-9:30PM)',
      '1H Foot Massage at Lek Massage per person',
    ],
    giveAways: [],
    isPromoted: false,
    options: {
      'couple-option': {
        id: 'couple-option',
        icon: 'fa-user-group',
        title: 'Couple',
        includes: ['1 couple ticket'],
        selected: false,
        price: (() => {
          const promotions = [
            makePromotion({
              price: { USD: 12900, EUR: 11800, THB: 450000 },
              start: new Date('2024-01-01'),
              end: new Date('2024-02-01'),
            }),
            makePromotion({
              price: { USD: 23000, EUR: 21500, THB: 815000 },
              start: new Date('2024-02-01'),
              end: new Date('2024-05-01'),
            }),
            makePromotion({
              price: { USD: 26000, EUR: 24000, THB: 922000 },
              start: new Date('2024-05-01'),
              end: new Date('2024-07-01'),
            }),
            makePromotion({
              price: { USD: 27500, EUR: 25500, THB: 975000 },
              start: new Date('2024-07-01'),
              end: new Date('2024-09-01'),
            }),
          ]
          const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
          const doorPrice = { USD: 28500, EUR: 26500, THB: 1000000 }
          return activePromotion?.price ?? doorPrice
        })(),
      },
      'bootcamp-option': {
        ...options['bootcamp-option'],
        price: { USD: 1400, EUR: 1200, THB: 50000 },
      },
      'all-mc-option': options['all-mc-option'],
      'heneco-mc-option': options['heneco-mc-option'],
      'said-mc-option': options['said-mc-option'],
    },
  },
  dj: {
    id: 'dj',
    name: 'DJ Master Class By DJ Lenhy',
    isSoldOut: false,
    price: { USD: 9900, EUR: 8900, THB: 339000 },
    doorPrice: { USD: 9900, EUR: 8900, THB: 339000 },
    includes: [
      '2H DJ Masterclass on Transition, Mixing Technique, Live Mixing, Musicality',
      'Limited to "AfroKiz Bangkok Edition 2" participant only.',
      'Limited to 10 participants only.',
    ],
    giveAways: [],
    isPromoted: false,
    options: {},
  },
  vipGold: {
    id: 'vip-gold',
    name: 'VIP Gold Pass',
    isSoldOut: true,
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
          price: { USD: 55000, EUR: 51000, THB: 1999000 },
          start: new Date('2024-07-01'),
          end: new Date('2024-09-01'),
        }),
      ]
      const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
      const doorPrice = { USD: 56500, EUR: 52000, THB: 2199000 }
      return activePromotion?.price ?? doorPrice
    })(),
    doorPrice: { USD: 56500, EUR: 52000, THB: 2199000 },
    includes: [
      'All Workshops',
      '2H Masterclass by Said & Oksana',
      '2H Masterclass by Heneco',
      'All parties in main venue',
      '3 welcome drinks per person',
      '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)',
      'Airport Pick up',
      'Exclusive Dinner Cruise Party',
      '1H Foot Massage at Lek Massage per person',
    ],
    giveAways: [],
    isPromoted: false,
    options: {
      'couple-option': {
        id: 'couple-option',
        icon: 'fa-user-group',
        title: 'Couple',
        includes: ['1 couple ticket'],
        selected: false,
        price: (() => {
          const promotions = [
            makePromotion({
              price: { USD: 17500, EUR: 16000, THB: 610000 },
              start: new Date('2024-01-01'),
              end: new Date('2024-02-01'),
            }),
            makePromotion({
              price: { USD: 30000, EUR: 27500, THB: 1000000 },
              start: new Date('2024-02-01'),
              end: new Date('2024-05-01'),
            }),
            makePromotion({
              price: { USD: 32000, EUR: 29900, THB: 1130000 },
              start: new Date('2024-05-01'),
              end: new Date('2024-07-01'),
            }),
            makePromotion({
              price: { USD: 34000, EUR: 31500, THB: 1200000 },
              start: new Date('2024-07-01'),
              end: new Date('2024-09-01'),
            }),
          ]
          const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]
          const doorPrice = { USD: 35000, EUR: 32500, THB: 1250000 }
          return activePromotion?.price ?? doorPrice
        })(),
      },
      'bootcamp-option': options['bootcamp-option'],
    },
  },
  oneDay: {
    id: 'one-day',
    name: 'One Day Pass',
    isSoldOut: false,
    price: { USD: 11500, EUR: 10500, THB: 420000 },
    doorPrice: { USD: 11500, EUR: 10500, THB: 420000 },
    includes: [
      'All Workshops',
      '2H Masterclass by Said & Oksana',
      '2H Masterclass by Heneco',
      'All parties in main venue',
      '3 welcome drinks per person',
      '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)',
      'Airport Pick up',
      'Exclusive Dinner Cruise Party',
      '1H Foot Massage at Lek Massage per person',
    ],
    giveAways: [],
    isPromoted: false,
    options,
  },
  friSat: {
    id: 'fri-sat',
    name: 'Friday & Saturday Pass',
    isSoldOut: false,
    price: { USD: 17000, EUR: 15500, THB: 595000 },
    doorPrice: { USD: 18000, EUR: 16500, THB: 650000 },
    includes: [
      'All Workshops',
      'Jack & Jill Competition',
      "Saturday's Day Time Social",
      'Evening Party on Friday 6th - Saturday 7th September',
      '2 welcome drinks',
      'NOTE: Excluded Bootcamp, Master Class & Dinner Cruise',
    ],
    giveAways: [],
    isPromoted: false,
    options,
  },
  satSun: {
    id: 'sat-sun',
    name: 'Saturday & Sunday Pass',
    isSoldOut: false,
    price: { USD: 17000, EUR: 15500, THB: 595000 },
    doorPrice: { USD: 18000, EUR: 16500, THB: 650000 },
    includes: [
      'All Workshops',
      "Saturday's Day Time Social",
      'Evening Party on Saturday 7th September - Sunday 8th September',
      '2 welcome drinks',
      'NOTE: Excluded Bootcamp, Master Class & Dinner Cruise',
    ],
    giveAways: [],
    isPromoted: false,
    options,
  },
  fri: {
    id: 'fri',
    name: 'Friday Pass',
    isSoldOut: false,
    price: { USD: 8400, EUR: 7600, THB: 295000 },
    doorPrice: { USD: 10000, EUR: 9200, THB: 350000 },
    includes: [
      'All Friday Workshops',
      'Jack & Jill Competition',
      'Evening Party on Friday 6th',
      '1 welcome drink on Friday 6th',
      'NOTE: Excluded Bootcamp, Master Class & Dinner Cruise',
    ],
    giveAways: [],
    isPromoted: false,
    options,
  },
  sat: {
    id: 'sat',
    name: 'Saturday Pass',
    isSoldOut: false,
    price: { USD: 9500, EUR: 8500, THB: 330000 },
    doorPrice: { USD: 10900, EUR: 9900, THB: 380000 },
    includes: [
      'All Friday Workshops',
      'Jack & Jill Competition',
      "Saturday's Day Time Social",
      'Evening Party on Saturday 7th',
      '1 welcome drink on Saturday 7th',
      'NOTE: Excluded Bootcamp, Master Class & Dinner Cruise',
    ],
    giveAways: [],
    isPromoted: false,
    options,
  },
  sun: {
    id: 'sun',
    name: 'Sunday Pass',
    isSoldOut: false,
    price: { USD: 9500, EUR: 8500, THB: 330000 },
    doorPrice: { USD: 10900, EUR: 9900, THB: 380000 },
    includes: [
      'All Friday Workshops',
      'Jack & Jill Competition',
      "Sunday's Day Time Social",
      'Evening Party on Sunday 7th',
      '1 welcome drink on Sunday 7th',
      'NOTE: Excluded Bootcamp, Master Class & Dinner Cruise',
    ],
    giveAways: [],
    isPromoted: false,
    options,
  },
}

export function calculateTotal(
  pass: Pass,
  selectedOptionIds: string[],
  discount: number = 1
): { USD: number; EUR: number; THB: number } {
  return Object.keys(pass.price).reduce((prices, currency) => {
    let total = pass.price[currency as Currency] * discount
    total += Object.values(pass.options).reduce(
      (total, option) =>
        (total += selectedOptionIds.includes(option.id)
          ? option.price[currency as Currency] *
            (selectedOptionIds.includes('couple-option') && option.id != 'couple-option' ? 2 : 1)
          : 0),
      0
    )
    prices[currency] = total
    return prices
  }, {} as any)
}

export function sumPrices(prices: { USD: number; EUR: number; THB: number }[]) {
  return prices.reduce(
    (total, currencies) => {
      total = {
        USD: total.USD + currencies.USD,
        EUR: total.EUR + currencies.EUR,
        THB: total.THB + currencies.THB,
      }
      return total
    },
    { USD: 0, EUR: 0, THB: 0 }
  )
}

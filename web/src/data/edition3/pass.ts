import { type Option } from '../options'

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

export const superEarlyBirdPasses: { [key: string]: Pass } = {
  fullPass: {
    id: 'fullpass-edition3',
    name: 'SUPER EARLY BIRD Full Pass',
    isSoldOut: true,
    price: { USD: 8900, EUR: 8000, THB: 300000 },
    doorPrice: { USD: 8900, EUR: 8000, THB: 300000 },
    includes: ['All workshops', 'All parties in main venue', '3 welcome drinks per person'],
    giveAways: [],
    isPromoted: true,
    options: {},
  },
}

export const earlyBirdPasses: { [key: string]: Pass } = {
  fullPass: {
    id: 'early-bird-fullpass-edition3',
    name: 'EARLY BIRD Full Pass',
    isSoldOut: true,
    price: { USD: 11000, EUR: 10500, THB: 380000 },
    doorPrice: { USD: 11000, EUR: 10500, THB: 380000 },
    includes: [
      'Includes all workshops',
      'Day time social',
      'Evening parties during September 5-7',
      'NOT includes Masterclass, Bootcamp, or other additional programs',
      'Non-refundable',
    ],
    giveAways: [],
    isPromoted: true,
    options: {},
  },
}

export const baliPasses: { [key: string]: Pass } = {
  fullPass: {
    id: 'fullpass',
    name: 'Full Pass',
    isSoldOut: false,
    price: { USD: 12000, EUR: 11500, THB: 400000 },
    doorPrice: { USD: 20000, EUR: 19000, THB: 680000 },
    includes: [
      'Includes all workshops',
      'Day time social',
      'Evening parties during September 5-7',
      'NOT includes Masterclass, Bootcamp, or other additional programs',
      'Non-refundable',
    ],
    giveAways: [],
    isPromoted: true,
    options: {
      'cruise-option': {
        id: 'cruise-option',
        icon: 'fa-ship',
        title: 'Cruise Party',
        includesInShortDescription: ['3H party & Carribean Tappas'],
        includes: ['Exclusive Cruise Party'],
        selected: false,
        soldOut: false,
        price: {
          USD: 5500,
          EUR: 5000,
          THB: 191000,
        },
      },
    },
  },
  vipSilverPass: {
    id: 'vip-silver',
    name: 'VIP Silver',
    isSoldOut: false,
    price: { USD: 28000, EUR: 26500, THB: 950000 },
    doorPrice: { USD: 40000, EUR: 37800, THB: 1360000 },
    includes: [
      'Includes all workshops',
      'Day time social',
      'Evening parties during September 5-7',
      '3 welcome drinks per person',
      '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)',
      'Exclusive Cruise Party',
      '1H Foot Massage at Lek Massage per person',
      'Non-refundable',
    ],
    giveAways: [],
    isPromoted: true,
    options: {},
  },
  vipGoldPass: {
    id: 'vip-gold',
    name: 'VIP Gold',
    isSoldOut: false,
    price: { USD: 38000, EUR: 36000, THB: 1300000 },
    doorPrice: { USD: 50000, EUR: 47500, THB: 1700000 },
    includes: [
      'Includes all workshops',
      'Day time social',
      'Evening parties during September 5-7',
      '2H Masterclass by Audi & Laura',
      "2H Masterclass by T'Peak",
      '3 welcome drinks per person',
      '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)',
      'Airport Pick up',
      'Exclusive Cruise Party',
      '1H Foot Massage at Lek Massage per person',
      'Non-refundable',
    ],
    giveAways: [],
    isPromoted: true,
    options: {},
  },
  sametBangkokPass: {
    id: 'samet-bangkok',
    name: 'Bangkok x Samet Pass',
    isSoldOut: false,
    price: { USD: 40000, EUR: 37800, THB: 1350000 },
    doorPrice: { USD: 80000, EUR: 75600, THB: 2700000 },
    includes: [
      'Includes all workshops at Bangkok and Koh Samet',
      'Day time social',
      'Evening parties during September 5-12',
      'Breakfast, Lunch and Dinner for 3 Days in Koh Samet',
      'NOT includes Masterclass, Bootcamp, or other additional programs',
      'Non-refundable',
    ],
    giveAways: [],
    isPromoted: true,
    options: {
      'hotel-room-option': {
        id: 'hotel-room-option',
        icon: 'fa-hotel',
        title: 'Shared Hotel Room',
        includesInShortDescription: ['3 Nights in a shared room at Hotel Sangthianbeach Resort Koh Samet'],
        includes: ['3 Nights in a shared room at Hotel Sangthianbeach Resort Koh Samet'],
        selected: true,
        soldOut: false,
        price: {
          USD: 5000,
          EUR: 4700,
          THB: 170000,
        },
      },
      'cruise-option': {
        id: 'cruise-option',
        icon: 'fa-ship',
        title: 'Cruise Party',
        includesInShortDescription: ['3H party & Carribean Tappas (Bangkok)'],
        includes: ['Exclusive Cruise Party in Bangkok'],
        selected: false,
        soldOut: false,
        price: {
          USD: 5500,
          EUR: 5000,
          THB: 191000,
        },
      },
    },
  },
  sametPass: {
    id: 'samet',
    name: 'Samet Getaway Pass',
    isSoldOut: false,
    price: { USD: 30000, EUR: 28300, THB: 1000000 },
    doorPrice: { USD: 60000, EUR: 56800, THB: 2000000 },
    includes: [
      'Includes all workshops at Koh Samet only',
      'Day time social',
      'Evening parties during September 9-12',
      '3 Nights at Hotel Sangthianbeach Resort',
      'Breakfast, Lunch and Dinner for 3 Days',
      'NOT includes Masterclass, Bootcamp, or other additional programs',
      'Non-refundable',
    ],
    giveAways: [],
    isPromoted: true,
    options: {
      'hotel-room-option': {
        id: 'hotel-room-option',
        icon: 'fa-hotel',
        title: 'Shared Hotel Room',
        includesInShortDescription: ['3 Nights in a shared room at Hotel Sangthianbeach Resort'],
        includes: ['3 Nights in a shared room at Hotel Sangthianbeach Resort'],
        selected: true,
        soldOut: false,
        price: {
          USD: 5000,
          EUR: 4700,
          THB: 170000,
        },
      },
    },
  },
}

export const defaultPasses: { [key: string]: Pass } = {
  fullPass: {
    id: 'fullpass',
    name: 'Full Pass',
    isSoldOut: false,
    price: { USD: 15000, EUR: 14500, THB: 510000 },
    doorPrice: { USD: 20000, EUR: 19000, THB: 680000 },
    includes: [
      'All workshops',
      'Day time social',
      'Evening parties during September 5-7',
      'NOT includes Masterclass, Bootcamp, or other additional programs',
      'Non-refundable',
    ],
    giveAways: [],
    isPromoted: true,
    options: {
      'cruise-option': {
        id: 'cruise-option',
        icon: 'fa-ship',
        title: 'Cruise Party',
        includesInShortDescription: ['3H party & Carribean Tappas'],
        includes: ['Exclusive Cruise Party'],
        selected: false,
        soldOut: false,
        price: {
          USD: 5500,
          EUR: 5000,
          THB: 191000,
        },
      },
    },
  },
  vipSilverPass: {
    id: 'vip-silver',
    name: 'VIP Silver',
    isSoldOut: false,
    price: { USD: 32000, EUR: 31000, THB: 1100000 },
    doorPrice: { USD: 40000, EUR: 37800, THB: 1360000 },
    includes: [
      'All workshops',
      'Day time social',
      'Evening parties during September 5-7',
      '3 welcome drinks per person',
      '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)',
      'Exclusive Cruise Party',
      '1H Foot Massage at Lek Massage per person',
      'Non-refundable',
    ],
    giveAways: [],
    isPromoted: true,
    options: {},
  },
  vipGoldPass: {
    id: 'vip-gold',
    name: 'VIP Gold',
    isSoldOut: false,
    price: { USD: 45000, EUR: 43500, THB: 1550000 },
    doorPrice: { USD: 50000, EUR: 47500, THB: 1700000 },
    includes: [
      'All workshops',
      'Day time social',
      'Evening parties during September 5-7',
      '2H Masterclass by Audi & Laura',
      "2H Masterclass by T'Peak",
      '3 welcome drinks per person',
      '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)',
      'Airport Pick up',
      'Exclusive Cruise Party',
      '1H Foot Massage at Lek Massage per person',
      'Non-refundable',
    ],
    giveAways: [],
    isPromoted: true,
    options: {},
  },
  sametBangkokPass: {
    id: 'samet-bangkok',
    name: 'Bangkok x Samet Pass',
    isSoldOut: false,
    price: { USD: 45000, EUR: 43500, THB: 1550000 },
    doorPrice: { USD: 80000, EUR: 75600, THB: 2700000 },
    includes: [
      'All workshops at Bangkok and Koh Samet',
      'Day time social',
      'Evening parties during September 5-12',
      'Breakfast, Lunch and Dinner for 3 Days in Koh Samet',
      'NOT includes Masterclass, Bootcamp, or other additional programs',
      'Non-refundable',
    ],
    giveAways: [],
    isPromoted: true,
    options: {
      'hotel-room-option': {
        id: 'hotel-room-option',
        icon: 'fa-hotel',
        title: 'Shared Hotel Room',
        includesInShortDescription: ['3 Nights in a shared room at Hotel Sangthianbeach Resort Koh Samet'],
        includes: ['3 Nights in a shared room at Hotel Sangthianbeach Resort Koh Samet'],
        selected: true,
        soldOut: false,
        price: {
          USD: 5000,
          EUR: 4700,
          THB: 170000,
        },
      },
      'cruise-option': {
        id: 'cruise-option',
        icon: 'fa-ship',
        title: 'Cruise Party',
        includesInShortDescription: ['3H party & Carribean Tappas (Bangkok)'],
        includes: ['Exclusive Cruise Party in Bangkok'],
        selected: false,
        soldOut: false,
        price: {
          USD: 5500,
          EUR: 5000,
          THB: 191000,
        },
      },
    },
  },
  sametPass: {
    id: 'samet',
    name: 'Samet Getaway Pass',
    isSoldOut: false,
    price: { USD: 35000, EUR: 3400, THB: 1200000 },
    doorPrice: { USD: 60000, EUR: 56800, THB: 2000000 },
    includes: [
      'All workshops at Koh Samet only',
      'Day time social',
      'Evening parties during September 9-12',
      '3 Nights at Hotel Sangthianbeach Resort',
      'Breakfast, Lunch and Dinner for 3 Days',
      'NOT includes Masterclass, Bootcamp, or other additional programs',
      'Non-refundable',
    ],
    giveAways: [],
    isPromoted: true,
    options: {
      'hotel-room-option': {
        id: 'hotel-room-option',
        icon: 'fa-hotel',
        title: 'Shared Hotel Room',
        includesInShortDescription: ['3 Nights in a shared room at Hotel Sangthianbeach Resort'],
        includes: ['3 Nights in a shared room at Hotel Sangthianbeach Resort'],
        selected: true,
        soldOut: false,
        price: {
          USD: 5000,
          EUR: 4700,
          THB: 170000,
        },
      },
    },
  },
}

// export const defaultPasses: { [key: string]: Pass } = baliPasses

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

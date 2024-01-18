export type Option = {
  id: string
  icon: string
  title: string
  shortDescription?: string
  description: string
  price: {
    USD: number
    EUR: number
    THB: number
  }
}

export const options: {
  [key: string]: Option
} = {
  'massage-option': {
    id: 'massage-option',
    icon: 'fa-spa',
    title: 'Massage',
    shortDescription: '1H massage',
    description: '1H Foot Massage at Lek Massage',
    price: {
      USD: 1499,
      EUR: 1299,
      THB: 49900,
    },
  },
  'muay-thai-option': {
    id: 'muay-thai-option',
    icon: 'fa-dumbbell',
    title: 'Muay Thai',
    shortDescription: '1H session',
    description: '1H introduction of Muay Thai',
    price: {
      USD: 1799,
      EUR: 1599,
      THB: 59900,
    },
  },
  'cruise-option': {
    id: 'cruise-option',
    icon: 'fa-ship',
    title: 'Cruise Party',
    shortDescription: '3H party & buffet',
    description: 'Exclusive Dinner Cruise Party (7th September 6:30PM-9:30PM)',
    price: {
      USD: 4599,
      EUR: 4299,
      THB: 159900,
    },
  },
  'said-mc-option': {
    id: 'said-mc-option',
    icon: 'fa-user-group',
    title: 'Said & Oksana Masterclass',
    shortDescription: '2H masterclass',
    description: '2H Said & Oksana Masterclass',
    price: {
      USD: 7699,
      EUR: 6999,
      THB: 269900,
    },
  },
  'henoco-mc-option': {
    id: 'henoco-mc-option',
    icon: 'fa-user-group',
    title: 'Henoco Masterclass',
    shortDescription: '2H masterclass',
    description: '2H Henoco Masterclass',
    price: {
      USD: 7699,
      EUR: 6999,
      THB: 269900,
    },
  },
  'all-mc-option': {
    id: 'all-mc-option',
    icon: 'fa-user-group',
    title: 'All Masterclass',
    shortDescription: '4H master clas',
    description: '2H Said & Oksana Masterclass and 2H Henoco Masterclass',
    price: {
      USD: 10699,
      EUR: 9999,
      THB: 369900,
    },
  },
}

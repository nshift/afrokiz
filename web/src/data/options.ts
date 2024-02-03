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
    shortDescription: '1H foot massage',
    description: '1H Foot Massage at Lek Massage',
    price: {
      USD: 1200,
      EUR: 1000,
      THB: 39000,
    },
  },
  'muay-thai-option': {
    id: 'muay-thai-option',
    icon: 'fa-dumbbell',
    title: 'Muay Thai',
    shortDescription: '1H class',
    description: '1H introduction of Muay Thai',
    price: {
      USD: 1700,
      EUR: 1500,
      THB: 59000,
    },
  },
  'cruise-option': {
    id: 'cruise-option',
    icon: 'fa-ship',
    title: 'Cruise Party',
    shortDescription: '3H party & buffet',
    description: 'Exclusive Dinner Cruise Party (7th September 6:30PM-9:30PM)',
    price: {
      USD: 5500,
      EUR: 5000,
      THB: 191000,
    },
  },
  'said-mc-option': {
    id: 'said-mc-option',
    icon: 'fa-user-group',
    title: 'Said & Oksana Masterclass',
    shortDescription: '2H Masterclass',
    description: '2H Said & Oksana Masterclass',
    price: {
      USD: 7200,
      EUR: 6800,
      THB: 259000,
    },
  },
  'heneco-mc-option': {
    id: 'heneco-mc-option',
    icon: 'fa-user-group',
    title: 'Heneco Masterclass',
    shortDescription: '2H Masterclass',
    description: '2H Heneco Masterclass',
    price: {
      USD: 7200,
      EUR: 6700,
      THB: 259000,
    },
  },
  'all-mc-option': {
    id: 'all-mc-option',
    icon: 'fa-user-group',
    title: 'All Masterclass',
    shortDescription: '4H Masterclass',
    description: '2H Said & Oksana Masterclass and 2H Heneco Masterclass',
    price: {
      USD: 10000,
      EUR: 9200,
      THB: 349000,
    },
  },
}

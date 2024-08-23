export type Option = {
  id: string
  icon: string
  title: string
  includesInShortDescription?: string[]
  includes: string[]
  selected: boolean
  soldOut: boolean
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
    includesInShortDescription: ['1H foot massage'],
    includes: ['1H Foot Massage at Lek Massage'],
    selected: false,
    soldOut: false,
    price: {
      USD: 1200,
      EUR: 1000,
      THB: 39000,
    },
  },
  // 'muay-thai-option': {
  //   id: 'muay-thai-option',
  //   icon: 'fa-dumbbell',
  //   title: 'Muay Thai',
  //   includesInShortDescription: ['1H class'],
  //   includes: ['1H introduction of Muay Thai'],
  //   selected: false,
  //   price: {
  //     USD: 1700,
  //     EUR: 1500,
  //     THB: 59000,
  //   },
  // },
  'bootcamp-option': {
    id: 'bootcamp-option',
    icon: 'fa-dumbbell',
    title: 'Bootcamp',
    includesInShortDescription: ['2H Ginga Styling bootcamp'],
    includes: ['2H Ginga Styling bootcamp (video recorded)'],
    selected: false,
    soldOut: false,
    price: {
      USD: 2400,
      EUR: 2200,
      THB: 90000,
    },
  },
  'cruise-option': {
    id: 'cruise-option',
    icon: 'fa-ship',
    title: 'Cruise Party',
    includesInShortDescription: ['3H party & buffet'],
    includes: ['Exclusive Dinner Cruise Party (7th September 6:30PM-9:30PM)'],
    selected: false,
    soldOut: true,
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
    includesInShortDescription: ['2H Masterclass'],
    includes: ['2H Said & Oksana Masterclass'],
    selected: false,
    soldOut: false,
    price: {
      USD: 7200,
      EUR: 6700,
      THB: 259000,
    },
  },
  'heneco-mc-option': {
    id: 'heneco-mc-option',
    icon: 'fa-user-group',
    title: 'Heneco Masterclass',
    includesInShortDescription: ['2H Masterclass'],
    includes: ['2H Heneco Masterclass'],
    selected: false,
    soldOut: false,
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
    includesInShortDescription: ['4H Masterclass'],
    includes: ['2H Said & Oksana Masterclass and 2H Heneco Masterclass'],
    selected: false,
    soldOut: false,
    price: {
      USD: 10000,
      EUR: 9200,
      THB: 349000,
    },
  },
}

export type Option = {
  id: string;
  icon: string;
  title: string;
  description?: string;
  price: {
    USD: number;
    EUR: number;
    THB: number;
  };
};

export const options: {
  [key: string]: Option;
} = {
  "massage-option": {
    id: "massage-option",
    icon: "fa-spa",
    title: "Massage",
    description: "1h massage",
    price: {
      USD: 1499,
      EUR: 1299,
      THB: 49900,
    },
  },
  "muay-thai-option": {
    id: "muay-thai-option",
    icon: "fa-dumbbell",
    title: "Muay Thai",
    description: "1h session",
    price: {
      USD: 1799,
      EUR: 1599,
      THB: 59900,
    },
  },
  "cruise-option": {
    id: "cruise-option",
    icon: "fa-ship",
    title: "Cruise Party",
    description: "3h party & buffet",
    price: {
      USD: 4599,
      EUR: 4299,
      THB: 159900,
    },
  },
  "said-mc-option": {
    id: "said-mc-option",
    icon: "fa-user-group",
    title: "Said & Oksana Masterclass",
    description: "2h master class",
    price: {
      USD: 7699,
      EUR: 6999,
      THB: 269900,
    },
  },
  "henoco-mc-option": {
    id: "henoco-mc-option",
    icon: "fa-user-group",
    title: "Henoco Masterclass",
    description: "2h master class",
    price: {
      USD: 7699,
      EUR: 6999,
      THB: 269900,
    },
  },
  "all-mc-option": {
    id: "all-mc-option",
    icon: "fa-user-group",
    title: "All Masterclass",
    description: "4h master class",
    price: {
      USD: 10699,
      EUR: 9999,
      THB: 369900,
    },
  },
};

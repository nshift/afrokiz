import moment from 'moment'
import { options } from './options'
import { defaultPasses, type Pass } from './pass'

export type Promotion = {
  text: string
  isActive: boolean
  passes?: { [key: string]: Pass }
}

const makeSpecialPricePromotion = (promotion: { start: Date; end: Date }): Promotion => {
  return {
    text: `Get your ticket with special prices before ${moment(promotion.end).format('MMMM YYYY')}.`,
    isActive: new Date().getTime() > promotion.start.getTime() && new Date().getTime() < promotion.end.getTime(),
  }
}

const makeValentinePromotion = (promotion: { start: Date; end: Date }): Promotion => {
  return {
    text: `Get special prices for Valentine's day before ${moment(promotion.end).format('MMMM Do')}.`,
    isActive: new Date().getTime() > promotion.start.getTime() && new Date().getTime() < promotion.end.getTime(),
    passes: {
      ...defaultPasses,
      fullPass: {
        ...defaultPasses.fullPass,
        name: 'Full Pass 🌹',
        price: { USD: 12500, EUR: 11500, THB: 450000 },
        doorPrice: { USD: 14900 * 2, EUR: 13900 * 2, THB: 529000 * 2 },
        giveAways: ['FREE 2H Foot Massage at Lek Massage'],
        options: {
          'couple-option': {
            id: 'couple-option',
            icon: 'fa-user-group',
            title: 'Couple',
            includes: ['1 Valentine couple ticket', 'FREE 2H Foot Massage at Lek Massage'],
            selected: true,
            price: { USD: 12500, EUR: 11500, THB: 450000 },
          },
          ...defaultPasses.fullPass.options,
        },
      },
      vipSilver: {
        ...defaultPasses.vipSilver,
        name: 'VIP Silver Pass 🌹',
        price: { USD: 36500, EUR: 33500, THB: 1295000 },
        doorPrice: { USD: 36500 * 2, EUR: 33500 * 2, THB: 1295000 * 2 },
        giveAways: ['FREE 2H Foot Massage at Lek Massage'],
        options: {
          ...defaultPasses.vipSilver.options,
          'couple-option': {
            id: 'couple-option',
            icon: 'fa-user-group',
            title: 'Couple',
            includes: ['1 Valentine couple ticket', 'FREE 2H Foot Massage at Lek Massage'],
            selected: true,
            price: { USD: 6500, EUR: 6500, THB: 254000 },
          },
        },
      },
      vipGold: {
        ...defaultPasses.vipGold,
        name: 'VIP Gold Pass 🌹',
        price: { USD: 45500, EUR: 41900, THB: 1599000 },
        doorPrice: { USD: 44900 * 2, EUR: 41500 * 2, THB: 1599000 * 2 },
        options: {
          ...defaultPasses.vipGold.options,
          'couple-option': {
            id: 'couple-option',
            icon: 'fa-user-group',
            title: 'Couple',
            includes: ['1 Valentine couple ticket'],
            selected: true,
            price: { USD: 14500, EUR: 13600, THB: 550000 },
          },
        },
      },
    },
  }
}

const makeSaidPromotion = (promotion: { start: Date; end: Date }): Promotion => {
  return {
    text: `Get special promotion with Said & Oksana package before ${moment(promotion.end).format('MMMM Do')}.`,
    isActive: new Date().getTime() > promotion.start.getTime() && new Date().getTime() < promotion.end.getTime(),
    passes: {
      said: {
        ...defaultPasses.fullPass,
        id: 'said',
        isPromoted: true,
        name: 'Said & Oksana Package',
        price: { USD: 21000, EUR: 19500, THB: 750000 },
        doorPrice: { USD: 25200, EUR: 23300, THB: 900000 },
        giveAways: options['cruise-option'].includes.concat(options['said-mc-option'].includes),
        options: {
          ...defaultPasses.fullPass.options,
          'cruise-option': { ...options['cruise-option'], selected: true, price: { USD: 0, EUR: 0, THB: 0 } },
          'said-mc-option': { ...options['said-mc-option'], selected: true, price: { USD: 0, EUR: 0, THB: 0 } },
        },
      },
      fullPass: defaultPasses.fullPass,
      vipSilver: { ...defaultPasses.vipSilver, isPromoted: false },
      vipGold: defaultPasses.vipGold,
      party: defaultPasses.party,
      // dj: defaultPasses.dj,
    },
  }
}

const makePromotion = (promotion: { name: string; start: Date; end: Date }): Promotion => {
  const days = moment(promotion.end).diff(moment(new Date()), 'days')
  return {
    text: promotion.name + ' promotion ends in ' + (days > 0 ? days + ' days.' : 'today.'),
    isActive: new Date().getTime() > promotion.start.getTime() && new Date().getTime() < promotion.end.getTime(),
  }
}

export const valentinePromotion = makeValentinePromotion({
  start: new Date('2024-02-10'),
  end: new Date('2024-02-17'),
})

export const saidPromotion = makeSaidPromotion({
  start: new Date('2024-03-01'),
  end: new Date('2024-03-14'),
})

const promotions: Promotion[] = [
  makePromotion({
    name: 'Early bird',
    start: new Date('2024-01-01'),
    end: new Date('2024-02-01'),
  }),
  valentinePromotion,
  saidPromotion,
  makeSpecialPricePromotion({
    start: new Date('2024-02-01'),
    end: new Date('2024-05-01'),
  }),
  makeSpecialPricePromotion({
    start: new Date('2024-07-01'),
    end: new Date('2024-06-30'),
  }),
  makeSpecialPricePromotion({
    start: new Date('2024-07-01'),
    end: new Date('2024-09-01'),
  }),
]

export const activePromotion = promotions.filter((promotion) => promotion.isActive)[0]

export const promotionText = (() => {
  const promotion = activePromotion
  if (!promotion) {
    const festivalStartInDays = moment(new Date('2024-09-06')).diff(moment(new Date()), 'days')
    const isAfterFestival = festivalStartInDays < 0
    return isAfterFestival
      ? 'Thank you for making the festival amazing!'
      : `AfroKiz festival is starting in ${festivalStartInDays} days.`
  }
  return promotion.text
})()

export const passes = activePromotion.passes ?? defaultPasses

import { Order } from './types/order'
import { Promotion } from './types/promotion'

export const calculateOrderTotal = (items: Order['items']) => ({
  amount: items.reduce((total, item) => (total += item.total.amount), 0),
  currency: Array.from(new Set(items.map((item) => item.total.currency)))[0],
})

export const calculateNewOptionTotal = (oldItems: Order['items'], newItems: Order['items']) => {
  let diffItems = diffArrays(newItems, oldItems)
  return calculateOrderTotal(diffItems)
}

export const isPromotionExpired = (promotion: Promotion, today: Date) =>
  today.getTime() > promotion.expirationDate.getTime()

export const isPromotionAppliable = (passId: string, promotion: Promotion) => promotion.isAppliable(passId)

function diffArrays(newArray: Order['items'], oldArray: Order['items']): Order['items'] {
  const oldCountMap = oldArray.reduce<Record<string, number>>((acc, item) => {
    acc[item.id] = (acc[item.id] ?? 0) + 1;
    return acc;
  }, {});

  const newCountMap: Record<string, number> = {};
  const result: Order['items'] = [];

  for (const item of newArray) {
    newCountMap[item.id] = (newCountMap[item.id] ?? 0) + 1;

    if (newCountMap[item.id] > (oldCountMap[item.id] ?? 0)) {
      result.push(item);
    }
  }

  return result;
}
import { Currency } from './currency'
import { Sales } from './sales'

export type SalesReport = {
  sales: Sales[]
  totalInTHB: number
}

export const calculateTotalSales = (sales: Sales[]) =>
  sales.reduce((total, sale) => {
    const amountInTHB = calculateAmountInTHB(sale.total.amount, sale.total.currency)
    total += amountInTHB
    return total
  }, 0)

export const calculateAmountInTHB = (amount: number, currency: Currency) => {
  switch (currency) {
    case 'EUR':
      return Number((amount / 0.025).toFixed(0))
    case 'USD':
      return Number((amount / 0.028).toFixed(0))
    case 'THB':
      return amount
    default:
      throw new Error('Can not calculate amount in THB because currency is unknown.')
  }
}

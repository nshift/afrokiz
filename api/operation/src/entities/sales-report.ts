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
      return amount / 0.025
    case 'USD':
      return amount / 0.028
    case 'THB':
      return amount
    default:
      throw new Error('Can not calculate amount in THB because currency is unknown.')
  }
}

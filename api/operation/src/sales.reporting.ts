import { ListAllSales } from './adapters/repository'
import { Sales } from './entities/sales'
import { SalesReport, calculateAmountInTHB, calculateTotalSales } from './entities/sales-report'

export class SalesReporting {
  constructor(private readonly repository: ListAllSales) {}

  async makeAllSalesReport(): Promise<SalesReport> {
    const allSales = await this.repository.listAllSales()
    const succeedSales = allSales
      .filter(
        (sale) =>
          (sale.paymentStatus as string) != 'failed, pending, pending' &&
          (sale.paymentStatus as string) != 'failed' &&
          sale.date.getTime() > new Date('2024-09-05').getTime() &&
          !['testpass'].includes(sale.pass)
      )
      .reduce((sales, sale) => {
        if (sale.pass == 'fullpass-valentine') {
          return sales.concat([
            { ...sale, fullname: sale.fullname.split(',')[0] ?? sale.fullname, customerType: 'follower' },
            { ...sale, fullname: sale.fullname.split(',')[1] ?? sale.fullname, customerType: 'leader' },
          ])
        }
        return sales.concat([sale])
      }, [] as Sales[])
      .map((sale) => ({
        ...sale,
        total: { amount: calculateAmountInTHB(sale.total.amount, sale.total.currency), currency: 'THB' as const },
      }))
    return {
      sales: succeedSales,
      totalInTHB: calculateTotalSales(succeedSales),
    }
  }
}

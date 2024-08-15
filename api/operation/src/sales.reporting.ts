import { ListAllSales } from './adapters/repository'
import { SalesReport, calculateTotalSales } from './entities/sales-report'

export class SalesReporting {
  constructor(private readonly repository: ListAllSales) {}

  async makeAllSalesReport(): Promise<SalesReport> {
    const allSales = await this.repository.listAllSales()
    const succeedSales = allSales.filter((sale) => sale.paymentStatus == 'success')
    return {
      sales: succeedSales,
      totalInTHB: calculateTotalSales(succeedSales),
    }
  }
}

import { ListAllSales } from '../adapters/repository'
import { Sales } from '../entities/sales'

export class InMemoryRepository implements ListAllSales {
  private sales: Sales[] = []

  async listAllSales(): Promise<Sales[]> {
    return this.sales
  }

  addSales(sales: Sales[]) {
    this.sales = this.sales.concat(sales)
  }
}

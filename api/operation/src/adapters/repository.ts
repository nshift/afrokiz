import { Sales } from '../entities/sales'

export interface ListAllSales {
  listAllSales(): Promise<Sales[]>
}

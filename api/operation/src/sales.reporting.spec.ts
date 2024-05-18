import { beforeEach, describe, expect, it } from '@jest/globals'
import { achiSales, awdeshSales } from './doubles/fakes'
import { InMemoryRepository } from './doubles/repository.in-memory'
import { SalesReporting } from './sales.reporting'

let salesReporting: SalesReporting
let repository: InMemoryRepository

beforeEach(() => {
  repository = new InMemoryRepository()
  repository.addSales([awdeshSales, achiSales])
  salesReporting = new SalesReporting(repository)
})

describe('Make a sales report of total sales', () => {
  it('should list all the sales', async () => {
    const allSalesReport = await salesReporting.makeAllSalesReport()
    expect(allSalesReport).toMatchObject({ sales: [awdeshSales, achiSales], totalInTHB: 500000 })
  })
})

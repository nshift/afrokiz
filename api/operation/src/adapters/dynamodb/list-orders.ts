import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import { Currency } from '../../entities/currency'
import { Sales } from '../../entities/sales'
import { Environment } from '../../environment'

export const listOrdersRequest = () => new ScanCommand({ TableName: Environment.OrderTableName() })

export const listOrdersResponse = (response: any) =>
  response?.map(
    (item: any): Sales => ({
      id: item.id,
      date: new Date(item.date),
      email: item.customer?.email ?? item.email,
      fullname: item.customer?.fullname ?? item.fullname,
      pass: item.items[0].id,
      promoCode: item.promoCode,
      customerType: item.customer?.type ?? item.dancerType,
      includes: item.items.flatMap((item: any) => item.includes),
      paymentStatus: item.payment.status,
      total: {
        amount: item.items.reduce((total: number, item: any) => (total += item.total.amount), 0),
        currency: mapCurrency(item.items[0].total.currency),
      },
    })
  ) ?? []

const mapCurrency = (currency: string): Currency => {
  switch (currency) {
    case 'USD':
      return 'USD'
    case 'EUR':
      return 'EUR'
    case 'THB':
      return 'THB'
    default:
      return 'UNKNOWN'
  }
}

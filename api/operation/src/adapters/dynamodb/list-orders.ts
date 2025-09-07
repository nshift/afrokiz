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
      pass: (item.items as { id: string }[]).reduce((item, pass) => {
        if (item == 'all-inclusive-package') {
          return item
        }
        let upgradePasses: {[key: string]: string} = {'vip-silver-upgrade': 'vip-silver', 'vip-gold-upgrade': 'vip-gold'}
        let upgradedPass = upgradePasses[pass.id]
        return upgradedPass ?? item
      }, item.items[0].id as string),
      promoCode: item.promoCode,
      customerType: item.customer?.type ?? item.dancerType,
      includes: item.items.flatMap((item: any) => ((item.includes?.length ?? 0) > 0 ? item.includes : [item.title])),
      items: item.items.map((item: any) => ({ id: item.id, total: { amount: item.total.amount, currency: item.total.currency }})),
      checkedIn: item.checkedIn,
      paymentStatus:
        item.payment?.status ??
        item.paymentStructures
          ?.map(
            (payment: any) =>
              payment.status ??
              payment.dueDates
                ?.sort((a: any, b: any) =>
                  a.dueDate && b.dueDate ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() : 0
                )
                .map((dueDate: any) => dueDate.status)
                .join(', ') ??
              'unknown'
          )
          .join(', '),
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

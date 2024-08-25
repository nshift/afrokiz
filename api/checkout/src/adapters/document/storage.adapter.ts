import { parse } from 'csv-parse/sync'
import { Currency } from '../../types/currency'
import { Customer } from '../../types/customer'
import { Order, makeOrderId } from '../../types/order'
import { DateGenerator } from '../date.generator'
import { GetOrders, UploadQrCode } from './storage.gateway'
import { S3Storage } from './storage.s3'

export class StorageAdapter implements GetOrders, UploadQrCode {
  constructor(private readonly s3Storage: S3Storage, private readonly dateGenerator: DateGenerator) {}

  async getOrdersFromImports(path: string): Promise<{ customer: Customer; order: Order; promoCode: string | null }[]> {
    const csvDocument = await this.s3Storage.getDocument(path)
    const data = parse(csvDocument, { groupColumnsByName: true, columns: true })
    const orders: { customer: Customer; order: Order; promoCode: string | null }[] = data.map((item: any) => ({
      customer: this.mapCustomer(item),
      order: this.mapOrder(item),
      promoCode: this.mapPromoCode(item),
    }))
    return orders
  }

  async uploadQrCode(orderId: string, qrCode: Buffer): Promise<string> {
    const { link } = await this.s3Storage.uploadDocument(
      { binary: qrCode, name: `qrcode-${orderId}`, type: 'image/png' },
      `qrcode/${orderId}.png`
    )
    return link
  }

  private mapCustomer = (customer: any): Customer => ({
    email: customer['Email'],
    fullname: customer['Name'],
    type: (() => {
      switch ((customer['Type'] as string).toLowerCase()) {
        case 'follower':
          return 'follower'
        case 'leader':
          return 'leader'
        default:
          return 'couple'
      }
    })(),
  })

  private mapOrder = (order: any): Order => {
    const passName = order['Pass'].toUpperCase()
    const amount = Number((order['THB'] as string).replace(',', '')) * 100
    const options = (() => {
      const options = []
      if (order['Ginga'] == '1') {
        options.push('2H Ginga Styling bootcamp (video recorded)')
      }
      if (order['Cruise'] == '1') {
        options.push('Exclusive Dinner Cruise Party (7th September 6:30PM-9:30PM)')
      }
      if (order['S&O MC'] == '1') {
        options.push('2H Said & Oksana Masterclass')
      }
      if (order['Heneco MC'] == '1') {
        options.push('2H Heneco Masterclass')
      }
      if (order['Massage']) {
        options.push(`${order['Massage']}H Foot Massage at Lek Massage per person`)
      }
      if (order['Drinks']) {
        options.push(`${order['Drinks']} welcome drinks per person`)
      }
      return options
    })()
    const pass = (() => {
      switch (passName) {
        case 'FULL PASS':
          return {
            id: 'fullpass',
            title: 'Full Pass',
            includes: ['All workshops', 'All parties in main venue'].concat(options),
            amount: 1,
            total: { amount, currency: 'THB' as Currency },
          }
        case 'VIP GOLD':
          return {
            id: 'vip-gold',
            title: 'VIP Gold Pass',
            includes: [
              'All Workshops',
              'All parties in main venue',
              '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)',
              'Airport Pick up',
            ].concat(options),
            amount: 1,
            total: { amount, currency: 'THB' as Currency },
          }
        case 'VIP SILVER':
          return {
            id: 'vip-silver',
            title: 'VIP Silver Pass',
            includes: [
              'All Workshops',
              'All parties in main venue',
              '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)',
            ].concat(options),
            amount: 1,
            total: { amount, currency: 'THB' as Currency },
          }
        case 'PARTY PASS':
          return {
            id: 'party',
            title: 'Party Pass',
            includes: ['All parties in main venue'].concat(options),
            amount: 1,
            total: { amount, currency: 'THB' as Currency },
          }
        case 'PARTY COMBO':
          return {
            id: 'party-bundle',
            title: 'Party Pass',
            includes: ['All parties in main venue', 'Day time social party'].concat(options),
            amount: 1,
            total: { amount, currency: 'THB' as Currency },
          }
        case 'HENECO MASTER CLASS':
          return {
            id: 'heneco-master-class',
            title: 'Heneco Master Class',
            includes: ["Saturday's Day Time Social", '2H Heneco Masterclass'],
            amount: 1,
            total: { amount, currency: 'THB' as Currency },
          }
        default:
          return {
            id: (order['Pass'] as string).toLowerCase().replace(' ', '-'),
            title: order['Pass'],
            includes: options,
            amount: 1,
            total: { amount, currency: 'THB' as Currency },
          }
      }
    })()
    return {
      id: makeOrderId(),
      date: this.dateGenerator.today(),
      items: [pass],
      total: { amount, currency: 'THB' },
    }
  }

  private mapPromoCode = (item: any): string | null => item['Promo Code'] ?? null
}

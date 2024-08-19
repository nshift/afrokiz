import { parse } from 'csv-parse/sync'
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
    email: customer['Email'][0],
    fullname: customer['Name'],
    type: (() => {
      switch (customer['Type']) {
        case 'Follower':
          return 'follower'
        case 'Leader':
          return 'leader'
        default:
          return 'couple'
      }
    })(),
  })

  private mapOrder = (order: any): Order => {
    const pass = order['Pass'].toUpperCase()
    const amount = Number((order['Amount paid'] as string).replace(',', '')) * 100
    const items: Order['items'] = []
    if (pass.includes('FULL')) {
      items.push({
        id: 'fullpass',
        title: 'Full Pass',
        includes: ['All workshops', 'All parties in main venue', '3 welcome drinks per person'],
        amount: 1,
        total: { amount, currency: 'THB' },
      })
    }
    if (pass.includes('VIP GOLD')) {
      items.push({
        id: 'vip-gold',
        title: 'VIP Gold Pass',
        includes: [
          'All Workshops',
          '2H Masterclass by Said & Oksana',
          '2H Masterclass by Heneco',
          'All parties in main venue',
          '3 welcome drinks per person',
          '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)',
          'Airport Pick up',
          'Exclusive Dinner Cruise Party',
          '1H Foot Massage at Lek Massage per person',
        ],
        amount: 1,
        total: { amount, currency: 'THB' },
      })
    }
    if (pass.includes('VIP Silver')) {
      items.push({
        id: 'vip-silver',
        title: 'VIP Silver Pass',
        includes: [
          'All Workshops',
          'All parties in main venue',
          '3 welcome drinks per person',
          '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)',
          'Exclusive Dinner Cruise Party (7th September 6:30PM-9:30PM)',
          '1H Foot Massage at Lek Massage per person',
        ],
        amount: 1,
        total: { amount, currency: 'THB' },
      })
    }
    if (pass.includes('PARTY PASS')) {
      items.push({
        id: 'party',
        title: 'Party Pass',
        includes: ['All parties in main venue', '3 welcome drinks per person'],
        amount: 1,
        total: { amount, currency: 'THB' },
      })
    }
    if (pass.includes('MC')) {
      items.push({
        id: 'all-mc-option',
        title: 'All Masterclass',
        includes: ['2H Said & Oksana Masterclass and 2H Heneco Masterclass'],
        amount: 1,
        total: { amount: 0, currency: 'THB' },
      })
    }
    if (pass.includes('CRUISE')) {
      items.push({
        id: 'cruise-option',
        title: 'Cruise Party',
        includes: ['Exclusive Dinner Cruise Party (7th September 6:30PM-9:30PM)'],
        amount: 1,
        total: { amount: 0, currency: 'THB' },
      })
    }
    if (pass.includes('SAID')) {
      items.push({
        id: 'said-mc-option',
        title: 'Said & Oksana Masterclass',
        includes: ['2H Said & Oksana Masterclass'],
        amount: 1,
        total: { amount: 0, currency: 'THB' },
      })
    }
    if (pass.includes('HENECO')) {
      items.push({
        id: 'heneco-mc-option',
        title: 'Heneco Masterclass',
        includes: ['2H Heneco Masterclass'],
        amount: 1,
        total: { amount: 0, currency: 'THB' },
      })
    }
    return {
      id: makeOrderId(),
      date: this.dateGenerator.today(),
      items,
      total: { amount, currency: 'THB' },
    }
  }

  private mapPromoCode = (item: any): string | null => item['Promoter'] ?? null
}

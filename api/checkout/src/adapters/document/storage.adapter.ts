import { parse } from 'csv-parse/sync'
import { Customer } from '../../types/customer'
import { Order } from '../../types/order'
import { DateGenerator } from '../date.generator'
import { OrderMapping } from './csv/order.mapping'
import { GetOrders, UploadQrCode } from './storage.gateway'
import { S3Storage } from './storage.s3'

export class StorageAdapter implements GetOrders, UploadQrCode {
  constructor(
    private readonly s3Storage: S3Storage,
    private readonly orderMapping: OrderMapping,
    private readonly dateGenerator: DateGenerator
  ) {}

  async getOrdersFromImports(path: string): Promise<{ customer: Customer; order: Order; promoCode: string | null }[]> {
    const csvDocument = await this.s3Storage.getDocument(path)
    const data = parse(csvDocument, { groupColumnsByName: true, columns: true })
    const orders: { customer: Customer; order: Order; promoCode: string | null }[] = data.map((item: any) => ({
      customer: this.orderMapping.mapCustomer(item),
      order: this.orderMapping.mapOrder(item, this.dateGenerator.today()),
      promoCode: this.orderMapping.mapPromoCode(item),
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

  async getQrCodeUrl(orderId: string): Promise<string | null> {
    return this.s3Storage.getFileUrl(`qrcode/${orderId}.png`)
  }
}

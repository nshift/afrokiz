import { UploadQrCode } from './storage.gateway'
import { S3Storage } from './storage.s3'

export class StorageAdapter implements UploadQrCode {
  constructor(private readonly s3Storage: S3Storage) {}

  async uploadQrCode(orderId: string, qrCode: Buffer): Promise<string> {
    const { link } = await this.s3Storage.uploadDocument(
      { binary: qrCode, name: `qrcode-${orderId}`, type: 'image/png' },
      `qrcode/${orderId}.png`
    )
    return link
  }
}

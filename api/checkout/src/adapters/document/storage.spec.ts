import { S3 } from '@aws-sdk/client-s3'
import { beforeEach, describe, expect, it } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { Environment } from '../../environment'
import { mapCustomer, mapOrder, mapPromoCode } from './csv/edition2-order.map'
import { StorageAdapter } from './storage.adapter'
import { S3Storage } from './storage.s3'

describe('Storage adapter', () => {
  let storage: StorageAdapter

  beforeEach(async () => {
    const s3Client = new S3Storage(new S3({}), Environment.DocumentBucketName())
    const dateGenerator = { today: () => new Date('2024-01-01') }
    storage = new StorageAdapter(s3Client, { mapCustomer, mapOrder, mapPromoCode }, dateGenerator)
  })

  it('should import CSV document', async () => {
    const orders = await storage.getOrdersFromImports('imports/test.csv')

    expect(orders).toEqual(
      expect.arrayContaining([
        {
          customer: { email: 'romain.asnar@gmail.com', fullname: 'Lucy Selezneva', type: 'follower' },
          order: {
            id: expect.any(String),
            status: 'paid',
            date: new Date('2024-01-01T00:00:00.000Z'),
            items: [
              {
                id: 'fullpass',
                title: 'Full Pass',
                includes: [
                  'All workshops',
                  'All parties in main venue',
                  '2H Ginga Styling bootcamp (video recorded)',
                  '1H Foot Massage at Lek Massage per person',
                  '3 welcome drinks per person',
                ],
                amount: 1,
                total: { amount: 350000, currency: 'THB' },
              },
            ],
            total: { amount: 350000, currency: 'THB' },
          },
          promoCode: '',
        },
      ])
    )
  })

  it('should upload qr code', async () => {
    let id = 'test-42'
    let file = fs.readFileSync(path.join(__dirname, '../../doubles/qr-code.png'))

    const link = await storage.uploadQrCode(id, file)

    expect(link).toContain(Environment.DocumentBucketName())
    expect(link).toContain('/qrcode/test-42.png')
  })
})

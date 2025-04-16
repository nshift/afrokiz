import { S3 } from '@aws-sdk/client-s3'
import { beforeEach, describe, expect, it } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { Environment } from '../../environment'
import { mapCustomer, mapOrder, mapPromoCode } from './csv/edition3-order.map'
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
          customer: { email: 'romain.asnar@gmail.com', fullname: 'Nguyen Dieu Chi Mai', type: 'leader' },
          order: {
            date: new Date('2024-01-01'),
            id: expect.any(String),
            items: [
              {
                amount: 1,
                id: 'fullpass-edition3',
                includes: ['All workshops', 'All parties in main venue', '3 welcome drinks per person'],
                title: 'SUPER EARLY BIRD Full Pass',
                total: { amount: 317857, currency: 'THB' },
              },
            ],
            status: 'paid',
            total: { amount: 317857, currency: 'THB' },
          },
          promoCode: 'TEST',
        },
        {
          customer: { email: 'romain.asnar@gmail.com', fullname: 'Amit Chilgunde', type: 'leader' },
          order: {
            date: new Date('2024-01-01'),
            id: expect.any(String),
            items: [
              {
                amount: 1,
                id: 'vip-gold',
                title: 'VIP Gold',
                includes: [
                  'All workshops',
                  'Day time social',
                  'Evening parties during September 5-7',
                  '2H Masterclass by Audi & Laura',
                  "2H Masterclass by T'Peak",
                  '2H Masterclass by Asia',
                  '3 welcome drinks per person',
                  '3 Nights Stay at I-Residence Silom Bangkok Hotel (breakfast included)',
                  'Airport Pick up',
                  'Exclusive Cruise Party',
                  '1H Foot Massage at Lek Massage per person',
                  'Non-refundable',
                ],
                total: { amount: 21040, currency: 'EUR' },
              },
              {
                amount: 1,
                id: 'afro-bootcamp',
                title: 'Afro Essense Bootcamp by AfroGiants',
                includes: ['1H30 Afro Essense Bootcamp by AfroGiants'],
                total: { amount: 0, currency: 'THB' },
              },
            ],
            status: 'paid',
            total: { amount: 21040, currency: 'EUR' },
          },
          promoCode: '',
        },
        {
          customer: { email: 'romain.asnar@gmail.com', fullname: 'Takako Okude', type: 'follower' },
          order: {
            date: new Date('2024-01-01'),
            id: expect.any(String),
            items: [
              {
                amount: 1,
                id: 'vip-silver',
                title: 'VIP Silver',
                includes: [
                  'All workshops',
                  'Day time social',
                  'Evening parties during September 5-7',
                  '3 welcome drinks per person',
                  '3 Nights Stay at I-Residence Silom Bangkok Hotel (breakfast included)',
                  'Exclusive Cruise Party',
                  '1H Foot Massage at Lek Massage per person',
                  'Non-refundable',
                ],
                total: { amount: 30000, currency: 'USD' },
              },
              {
                amount: 1,
                id: 'cruise-option',
                includes: ['Exclusive Cruise Party'],
                title: 'Cruise Party',
                total: { amount: 0, currency: 'THB' },
              },
            ],
            status: 'paid',
            total: { amount: 30000, currency: 'USD' },
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

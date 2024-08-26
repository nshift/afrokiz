import { S3 } from '@aws-sdk/client-s3'
import { beforeEach, describe, it } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { Environment } from '../../environment'
import { StorageAdapter } from './storage.adapter'
import { S3Storage } from './storage.s3'

describe('Storage adapter', () => {
  let storage: StorageAdapter

  beforeEach(async () => {
    const s3Client = new S3Storage(new S3({}), Environment.DocumentBucketName())
    storage = new StorageAdapter(s3Client)
  })
  it('should upload qr code', async () => {
    const link = await storage.uploadQrCode(
      'test-42',
      fs.readFileSync(path.join(__dirname, '../../doubles/qr-code.png'))
    )
    console.log('>>> uploadQrCode', link)
  })
})

import { describe, expect, it } from '@jest/globals'
import { QrCodeGenerator } from './qr-code.generator'

describe('QR Code', () => {
  it('should generate a qr code with the input', async () => {
    const input = 'https://afrokizbkk.com/staff/check?order_id=42'
    const qrCode = new QrCodeGenerator()
    const qrCodeFile = await qrCode.generate(input)
    const decodedInput = await qrCode.decode(qrCodeFile)
    expect(decodedInput).toEqual(input)
  })
})

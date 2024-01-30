import jsQR from 'jsqr'
import * as NodeQrCode from 'qrcode'
import { decode as decodePng, toRGBA8 } from 'upng-js'
import { Environment } from '../../environment'
import { GeneratingQRCode } from './qr-code.gateway'

export class QrCodeGenerator implements GeneratingQRCode {
  generateOrderQrCode(order: { id: string }): Promise<Buffer> {
    return this.generate(Environment.WebAppHost() + '/staff/check?order_id=' + order.id)
  }

  generate(input: string): Promise<Buffer> {
    return NodeQrCode.toBuffer(input, { width: 400, type: 'png' } as NodeQrCode.QRCodeToBufferOptions)
  }

  async decode(qrCode: Buffer): Promise<string> {
    const decodedQRCode = jsQR(new Uint8ClampedArray(toRGBA8(decodePng(qrCode))[0]), 400, 400, {})
    if (!decodedQRCode?.data) {
      throw new Error('Can not decode QR Code')
    }
    return decodedQRCode.data
  }
}

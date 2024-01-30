export interface GeneratingQRCode {
  generateOrderQrCode(order: { id: string }): Promise<Buffer>
}

export interface UploadQrCode {
  uploadQrCode(orderId: string, qrCode: Buffer): Promise<string>
}

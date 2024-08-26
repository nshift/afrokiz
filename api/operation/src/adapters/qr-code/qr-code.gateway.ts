export interface GeneratingQRCode {
  generateGuestQrCode(email: string): Promise<Buffer>
}

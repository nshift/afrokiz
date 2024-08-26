import { UploadQrCode } from './adapters/document/storage.gateway'
import { SendingBulkEmails } from './adapters/email.gateway'
import { preGuestRegistrationEmail } from './adapters/email/email.pre-registration'
import { QrCodeGenerator } from './adapters/qr-code/qr-code.generator'
import { SaveGuest } from './adapters/repository'
import { Guest, makeId } from './entities/guest'

export class GuestRegistration {
  constructor(
    private readonly repository: SaveGuest,
    private readonly email: SendingBulkEmails,
    private readonly qrCode: QrCodeGenerator,
    private readonly document: UploadQrCode
  ) {}

  async preRegister(guest: { email: string; fullname: string }): Promise<void> {
    const preRegisteredGuest: Guest = { ...guest, id: makeId(), checkedIn: false }
    const qrCodeFile = await this.qrCode.generateGuestQrCode(guest.email)
    const link = await this.document.uploadQrCode(preRegisteredGuest.id, qrCodeFile)
    await this.repository.saveGuest(preRegisteredGuest)
    await this.email.sendBulkEmails(preGuestRegistrationEmail({ guest: preRegisteredGuest, qrCodeUrl: link }))
  }
}

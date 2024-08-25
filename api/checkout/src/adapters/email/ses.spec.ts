import { beforeEach, describe, expect, it } from '@jest/globals'
import { order, romainCustomer, sales, testEmail, testEmailTemplate } from '../../doubles/fixtures'
import { confirmationEmail } from './email.confirmation'
import { registrationEmail } from './email.registration'
import { SESEmailService } from './ses'

describe('Email service', () => {
  let email: SESEmailService

  beforeEach(async () => {
    email = new SESEmailService({ email: 'afrokiz.bkk@gmail.com', name: 'Romain Test' })
  })

  it('should send a bulk emails', async () => {
    await expect(email.sendBulkEmails(testEmailTemplate)).resolves.not.toThrow()
  })
  it('should send an email', async () => {
    await expect(email.sendEmail(testEmail)).resolves.not.toThrow()
  })
  it('should send a registration email', async () => {
    await expect(
      email.sendBulkEmails(
        registrationEmail([
          {
            sale: sales,
            qrCodeUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/31/MM_QRcode.png',
          },
        ])
      )
    ).resolves.not.toThrow()
  })
  it.only('should send a registration email', async () => {
    await expect(
      email.sendBulkEmails(
        confirmationEmail({
          order,
          customer: romainCustomer,
          qrCodeUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/31/MM_QRcode.png',
        })
      )
    ).resolves.not.toThrow()
  })
})

import { beforeEach, describe, expect, it } from '@jest/globals'
import { testEmail, testEmailTemplate } from '../../doubles/fixtures'
import { SESEmailService } from './ses'

describe.skip('Email service', () => {
  let email: SESEmailService

  beforeEach(async () => {
    email = new SESEmailService({ email: 'romain.a@nshift.co.th', name: 'Romain Asnar' })
  })

  it('should send a bulk emails', async () => {
    await expect(email.sendBulkEmails(testEmailTemplate)).resolves.not.toThrow()
  })
  it('should send an email', async () => {
    await expect(email.sendEmail(testEmail)).resolves.not.toThrow()
  })
})

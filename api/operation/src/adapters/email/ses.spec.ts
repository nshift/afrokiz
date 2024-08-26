import { beforeEach, describe, expect, it } from '@jest/globals'
import { testEmailTemplate } from '../../doubles/fakes'
import { SESEmailService } from './ses'

describe('Email service', () => {
  let email: SESEmailService

  beforeEach(async () => {
    email = new SESEmailService({ email: 'afrokiz.bkk@gmail.com', name: 'Romain Test' })
  })

  it('should send a bulk emails', async () => {
    await expect(email.sendBulkEmails(testEmailTemplate)).resolves.not.toThrow()
  })
})

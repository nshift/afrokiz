import { Email } from './email'
import { EmailTemplate } from './email.template'

export interface SendingBulkEmails {
  sendBulkEmails(template: EmailTemplate): Promise<void>
  createTemplate(template: EmailTemplate): Promise<void>
  cleanUp(names: string[]): Promise<void>
}

export interface SendingEmail {
  sendEmail(email: Email): Promise<void>
}

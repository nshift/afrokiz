import { EmailTemplate } from './email/email.template'

export interface SendingBulkEmails {
  sendBulkEmails(template: EmailTemplate): Promise<void>
}

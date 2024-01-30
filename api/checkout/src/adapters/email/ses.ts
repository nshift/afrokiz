import { SES } from '@aws-sdk/client-ses'
import { Email } from './email'
import { SendingBulkEmails, SendingEmail } from './email.gateway'
import { EmailTemplate } from './email.template'
import MailComposer = require('nodemailer/lib/mail-composer')

export class SESEmailService implements SendingBulkEmails, SendingEmail {
  private client: SES = new SES({})
  constructor(private source: { email: string; name: string }) {}

  async sendBulkEmails(template: EmailTemplate) {
    await this.client.createTemplate({
      Template: { TemplateName: template.name, SubjectPart: template.subject, HtmlPart: template.html },
    })
    await this.client.sendBulkTemplatedEmail({
      Destinations: template.destinations.map((destination) => ({
        Destination: { ToAddresses: destination.toAddresses },
        ReplacementTemplateData: JSON.stringify(destination.data),
      })),
      Source: this.source.email,
      Template: template.name,
      DefaultTemplateData: '{}',
    })
    await this.client.deleteTemplate({ TemplateName: template.name })
  }

  async sendEmail(email: Email) {
    const emailOptions = {
      from: `${this.source.name}" <${this.source.email}>`,
      to: email.destinations,
      cc: email.cc,
      subject: email.subject,
      html: email.html,
      attachments: email.attachments,
    }
    const compiledEmail = await new MailComposer(emailOptions).compile().build()
    await this.client.sendRawEmail({
      Destinations: email.destinations.concat(email.cc),
      Source: this.source.email,
      RawMessage: { Data: compiledEmail },
    })
  }
}

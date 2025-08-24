import { SES } from '@aws-sdk/client-ses'
import { chunk } from '../../chunk'
import { Email } from './email'
import { SendingBulkEmails, SendingEmail } from './email.gateway'
import { EmailTemplate } from './email.template'
import MailComposer = require('nodemailer/lib/mail-composer')

export class SESEmailService implements SendingBulkEmails, SendingEmail {
  private static BulkTemplateEmailLimit = 49
  private client: SES = new SES({})
  constructor(private source: { email: string; name: string }) {}

  async createTemplate(template: EmailTemplate) {
    await this.client.createTemplate({
      Template: {
        TemplateName: template.name,
        SubjectPart: template.subject,
        HtmlPart: template.html,
      },
    })
  }

  async cleanUp(names: string[]) {
    for (let name of names) {
      await this.client.deleteTemplate({ TemplateName: name })
    }
  }

  async sendBulkEmails(template: EmailTemplate) {
    await Promise.all(
      chunk(template.destinations, SESEmailService.BulkTemplateEmailLimit).map(async (destinations) => {
        return await this.client.sendBulkTemplatedEmail({
          Destinations: destinations.map((destination) => ({
            Destination: { ToAddresses: destination.toAddresses },
            ReplacementTemplateData: JSON.stringify(destination.data),
          })),
          Source: this.source.email,
          Template: template.name,
          DefaultTemplateData: '{}',
          ConfigurationSetName: 'afrokiz-configuration-set',
        })
      })
    )
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

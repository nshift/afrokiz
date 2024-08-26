import { SES } from '@aws-sdk/client-ses'
import { SendingBulkEmails } from '../email.gateway'
import { EmailTemplate } from './email.template'

export class SESEmailService implements SendingBulkEmails {
  private client: SES = new SES({})
  constructor(private source: { email: string; name: string }) {}

  async sendBulkEmails(template: EmailTemplate) {
    await this.client.createTemplate({
      Template: {
        TemplateName: template.name,
        SubjectPart: template.subject,
        HtmlPart: template.html,
      },
    })
    await this.client.sendBulkTemplatedEmail({
      Destinations: template.destinations.map((destination) => ({
        Destination: { ToAddresses: destination.toAddresses },
        ReplacementTemplateData: JSON.stringify(destination.data),
      })),
      Source: this.source.email,
      Template: template.name,
      DefaultTemplateData: '{}',
      ConfigurationSetName: 'afrokiz-configuration-set',
    })

    await this.client.deleteTemplate({ TemplateName: template.name })
  }
}

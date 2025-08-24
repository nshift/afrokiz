import { SES } from '@aws-sdk/client-ses'
import { SendingBulkEmails } from '../email.gateway'
import { EmailTemplate } from './email.template'
import { chunk } from '../../chunk';

export class SESEmailService implements SendingBulkEmails {
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
          Destinations: template.destinations.map((destination) => ({
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
}

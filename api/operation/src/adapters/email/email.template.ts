export type EmailTemplate = {
  name: string
  subject: string
  html: string
  destinations: {
    toAddresses: string[]
    data: { [key: string]: any }
  }[]
}

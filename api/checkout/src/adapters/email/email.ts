export type Email = {
  destinations: string[]
  cc: string[]
  subject: string
  html: string
  attachments: { filename: string; content: Buffer }[]
}

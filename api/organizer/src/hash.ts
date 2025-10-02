import crypto from 'crypto'

export function hashObject(obj: object): string {
  const str = JSON.stringify(obj)
  return crypto.createHash('sha256').update(str).digest('hex')
}

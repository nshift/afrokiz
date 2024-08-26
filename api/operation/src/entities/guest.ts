import crypto from 'crypto'

export type Guest = {
  id: string
  email: string
  fullname: string
  checkedIn: boolean
}

export const makeId = () => crypto.randomBytes(4).toString('hex')

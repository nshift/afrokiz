import { AccessInformation } from '../entities/access-information'
import { Identifier } from '../entities/identifier'

export interface AuthenticationAdapter {
  signIn(username: string, password: string): Promise<AccessInformation | null>
  signUp(username: string, password: string): Promise<Identifier>
  changePassword(username: string, oldPassword: string, newPassword: string): Promise<AccessInformation>
}

export class SignInError extends Error {
  metadata?: any
  constructor(metadata?: any) {
    super('Failed to sign in.')
    this.metadata = metadata
  }
}

export class NewPasswordRequiredError extends Error {
  session: string
  constructor(session: string) {
    super('New password required.')
    this.session = session
  }
}

export class ChangePasswordError extends Error {
  metadata?: any
  constructor(metadata?: any) {
    super('Failed to change password.')
    this.metadata = metadata
  }
}

export class SignUpError extends Error {
  metadata?: any
  constructor(metadata?: any) {
    super('Failed to sign up.')
    this.metadata = metadata
  }
}

export class SignUpUsernameExistsError extends Error {
  metadata?: any
  constructor(metadata?: any) {
    super('Failed to sign up.')
    this.metadata = metadata
  }
}

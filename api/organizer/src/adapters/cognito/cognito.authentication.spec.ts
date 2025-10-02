import { AdminDeleteUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'
import { beforeEach, describe, expect, it } from '@jest/globals'
import { Fixtures } from '../../doubles/fixtures'
import { Environment } from '../../environment'
import { NewPasswordRequiredError, SignUpUsernameExistsError } from '../authentication'
import { CognitoAuthentication } from './cognito.authentication'

let fixtures = new Fixtures()
let cognitoClient = new CognitoIdentityProviderClient({})
let cognitoAuthentication = new CognitoAuthentication(cognitoClient)

describe('Cognito authentication adapater', () => {
  beforeEach(async () => {
    try {
      await cognitoClient.send(makeAdminDeleteUserCommand(fixtures.romainNewPasswordRequiredCredential.username))
    } catch {}
  })

  describe('signs user in', () => {
    it('should return access information', async () => {
      const { username, password } = fixtures.romainCredential

      let access = await cognitoAuthentication.signIn(username, password)

      expect(access?.accessToken).toBeDefined()
      expect(access?.idToken).toBeDefined()
      expect(access?.expiresIn).toBeGreaterThan(0)
      expect(access?.refreshToken).toBeDefined()
    })

    it.skip('should throw error with session when a new password is required', async () => {
      const { username, oldPassword } = fixtures.romainNewPasswordRequiredCredential

      try {
        await cognitoAuthentication.signIn(username, oldPassword)
        throw new Error('Expected asyncFunction to throw')
      } catch (error) {
        expect(error).toBeInstanceOf(NewPasswordRequiredError)
        expect((error as NewPasswordRequiredError).session.length).toBeGreaterThan(0)
      }
    })

    it('should fail when credentials are wrong', async () => {
      let username = 'test@test.com'
      let password = 'wrong'

      let access = await cognitoAuthentication.signIn(username, password)

      expect(access).toBeNull()
    })
  })

  describe('signs user up', () => {
    it('should fail to sign up when the user already exists', async () => {
      const { username, password } = fixtures.romainCredential

      await expect(cognitoAuthentication.signUp(username, password)).rejects.toThrow(SignUpUsernameExistsError)
    })

    it('should return the user id', async () => {
      const { username, oldPassword } = fixtures.romainNewPasswordRequiredCredential

      let userId = await cognitoAuthentication.signUp(username, oldPassword)

      expect(userId).toBeDefined()
    })
  })

  describe.skip('changes password', () => {
    it('should return access information', async () => {
      const { username, newPassword, oldPassword } = fixtures.romainNewPasswordRequiredCredential
      await cognitoAuthentication.signUp(username, oldPassword)

      try {
        let access = await cognitoAuthentication.changePassword(username, oldPassword, newPassword)

        expect(access?.accessToken).toBeDefined()
        expect(access?.idToken).toBeDefined()
        expect(access?.expiresIn).toBeGreaterThan(0)
        expect(access?.refreshToken).toBeDefined()
      } catch (error) {
        console.error(error)
      }
    })
  })
})

const makeAdminDeleteUserCommand = (username: string) =>
  new AdminDeleteUserCommand({
    UserPoolId: Environment.UserPoolId(),
    Username: username,
  })

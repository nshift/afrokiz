import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandOutput,
  RespondToAuthChallengeCommand,
  RespondToAuthChallengeCommandOutput,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { AccessInformation } from '../../entities/access-information'
import { Identifier } from '../../entities/identifier'
import { Environment } from '../../environment'
import {
  AuthenticationAdapter,
  ChangePasswordError,
  NewPasswordRequiredError,
  SignInError,
  SignUpError,
  SignUpUsernameExistsError,
} from '../authentication'

export class CognitoAuthentication implements AuthenticationAdapter {
  constructor(private readonly client: CognitoIdentityProviderClient) {}

  async signIn(username: string, password: string): Promise<AccessInformation | null> {
    try {
      let command = this.makeSignInCommand(username, password)
      let response = await this.client.send(command)
      console.log('>>>>> signIn response: ', JSON.stringify(response))
      if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED' && response.Session) {
        throw new NewPasswordRequiredError(response.Session)
      }
      return this.parseAuthenticationResult(response)
    } catch (error: any) {
      switch (error?.name) {
        case 'UserNotFoundException':
          return null
        case 'NotAuthorizedException':
          return null
        case 'UserNotConfirmedException':
          return null
        case 'PasswordResetRequiredException':
          return null
        case 'NewPasswordRequiredError':
          throw new NewPasswordRequiredError((error as NewPasswordRequiredError).session)
        default:
          throw error
      }
    }
  }

  async signUp(username: string, password: string): Promise<Identifier> {
    try {
      let command = this.makeSignUpCommand(username, password)
      let response = await this.client.send(command)
      if (!response.UserSub) {
        throw new SignUpError(response)
      }
      return response.UserSub
    } catch (error: any) {
      switch (error?.name) {
        case 'UsernameExistsException':
          throw new SignUpUsernameExistsError()
        default:
          throw error
      }
    }
  }

  async changePassword(username: string, oldPassword: string, newPassword: string): Promise<AccessInformation> {
    let signInCommand = this.makeSignInCommand(username, oldPassword)
    let signInResponse = await this.client.send(signInCommand)
    if (signInResponse.ChallengeName !== 'NEW_PASSWORD_REQUIRED' || !signInResponse.Session) {
      throw new ChangePasswordError(signInResponse)
    }
    let changePasswordCommand = this.makeChangePasswordCommand(username, newPassword, signInResponse.Session)
    let changePasswordResponse = await this.client.send(changePasswordCommand)
    return this.parseAuthenticationResult(changePasswordResponse)
  }

  private makeSignInCommand = (username: string, password: string) =>
    new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: Environment.UserPoolClientId(),
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    })

  private makeChangePasswordCommand = (username: string, password: string, session: string) =>
    new RespondToAuthChallengeCommand({
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      ClientId: Environment.UserPoolClientId(),
      ChallengeResponses: {
        USERNAME: username,
        NEW_PASSWORD: password,
      },
      Session: session,
    })

  private makeSignUpCommand = (username: string, password: string) =>
    new SignUpCommand({
      ClientId: Environment.UserPoolClientId(),
      Username: username,
      Password: password,
    })

  private parseAuthenticationResult = (
    response: InitiateAuthCommandOutput | RespondToAuthChallengeCommandOutput
  ): AccessInformation => {
    if (
      !response.AuthenticationResult ||
      !response.AuthenticationResult.AccessToken ||
      !response.AuthenticationResult.IdToken ||
      !response.AuthenticationResult.ExpiresIn ||
      !response.AuthenticationResult.RefreshToken
    ) {
      throw new SignInError(response.AuthenticationResult)
    }
    return {
      accessToken: response.AuthenticationResult.AccessToken,
      idToken: response.AuthenticationResult.IdToken,
      expiresIn: response.AuthenticationResult.ExpiresIn,
      refreshToken: response.AuthenticationResult.RefreshToken,
    }
  }
}

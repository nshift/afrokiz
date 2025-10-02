import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { v4 as uuid } from 'uuid'
import { AuthenticationAdapter } from './adapters/authentication'
import { CognitoAuthentication } from './adapters/cognito/cognito.authentication'
import { DynamoDbRepository } from './adapters/dynamodb/dynamodb.repository'
import { Repository } from './adapters/repository'
import { UUIDGenerator } from './adapters/uuid.generator'

export class Context {
  constructor(
    public readonly repository: Repository,
    public readonly uuidGenerator: UUIDGenerator,
    public readonly authenticationAdapter: AuthenticationAdapter
  ) {}
}

export function makeDefaultContext() {
  let dynamodb = DynamoDBDocumentClient.from(new DynamoDB({}), {
    marshallOptions: { removeUndefinedValues: true },
  })
  let repository = new DynamoDbRepository(dynamodb)
  let uuidGenerator = { generate: uuid }
  let cognitoClient = new CognitoIdentityProviderClient({})
  let authenticationAdapter = new CognitoAuthentication(cognitoClient)
  return new Context(repository, uuidGenerator, authenticationAdapter)
}

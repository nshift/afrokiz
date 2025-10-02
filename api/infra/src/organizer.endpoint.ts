import { createEndpoint, createSharedLayer } from '@nshift/cdk'
import * as cdk from 'aws-cdk-lib'
import { OrganizerModule } from './path'

export const makeOrganizerEndpoints = (props: {
  stack: cdk.Stack
  api: cdk.aws_apigatewayv2.CfnApi
  eventConfigurationTable: cdk.aws_dynamodb.Table
  userPoolClient: cdk.aws_cognito.UserPoolClient
  apiAuthorizer: cdk.aws_apigatewayv2.CfnAuthorizer
}) => {
  const sharedLayer = createSharedLayer('OrganizerSharedLayer', OrganizerModule('.build/layer'), props.stack)
  const codeUri = OrganizerModule('.build/src')
  const context = { sharedLayer, codeUri }
  return [
    makeSignInOrganizerEndpoint({ ...props, ...context }),
    makeSignUpOrganizerEndpoint({ ...props, ...context }),
    makeListOrganizerEventEndpoint({ ...props, ...context }),
    makeAddOrganizerEventsEndpoint({ ...props, ...context }),
    makeRemoveOrganizerEventsEndpoint({ ...props, ...context }),
    makeUpdateOrganizerEventsEndpoint({ ...props, ...context }),
  ]
}

const makeSignInOrganizerEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventConfigurationTable: cdk.aws_dynamodb.Table
  userPoolClient: cdk.aws_cognito.UserPoolClient
}) => {
  const endpoint = createEndpoint('SignInOrganizerEvent', {
    handler: 'adapters/lambda/auth/sign-in.handle',
    method: 'POST',
    path: '/auth/sign-in',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      EVENT_CONFIGURATION_TABLE_NAME: props.eventConfigurationTable.tableName,
      COGNITO_USER_POOL_CLIENT_ID: props.userPoolClient.userPoolClientId,
    },
    memorySize: 2048,
    ...props,
  })
  props.eventConfigurationTable.grant(endpoint.lambda, 'dynamodb:BatchWriteItem', 'dynamodb:BatchGetItem')
  return endpoint
}

const makeSignUpOrganizerEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventConfigurationTable: cdk.aws_dynamodb.Table
  userPoolClient: cdk.aws_cognito.UserPoolClient
}) => {
  const endpoint = createEndpoint('SignUpOrganizerEvent', {
    handler: 'adapters/lambda/auth/sign-up.handle',
    method: 'POST',
    path: '/auth/sign-up',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      EVENT_CONFIGURATION_TABLE_NAME: props.eventConfigurationTable.tableName,
      COGNITO_USER_POOL_CLIENT_ID: props.userPoolClient.userPoolClientId,
    },
    memorySize: 2048,
    ...props,
  })
  props.eventConfigurationTable.grant(endpoint.lambda, 'dynamodb:BatchWriteItem', 'dynamodb:BatchGetItem')
  return endpoint
}

const makeListOrganizerEventEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventConfigurationTable: cdk.aws_dynamodb.Table
  apiAuthorizer: cdk.aws_apigatewayv2.CfnAuthorizer
}) => {
  const endpoint = createEndpoint('ListOrganizerEvent', {
    handler: 'adapters/lambda/event/list-event.handle',
    method: 'GET',
    path: '/organizers/events',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      EVENT_CONFIGURATION_TABLE_NAME: props.eventConfigurationTable.tableName,
    },
    memorySize: 2048,
    authorizer: props.apiAuthorizer,
    ...props,
  })
  props.eventConfigurationTable.grant(endpoint.lambda, 'dynamodb:Query')
  return endpoint
}

const makeAddOrganizerEventsEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventConfigurationTable: cdk.aws_dynamodb.Table
  apiAuthorizer: cdk.aws_apigatewayv2.CfnAuthorizer
}) => {
  const endpoint = createEndpoint('AddOrganizerEvents', {
    handler: 'adapters/lambda/event/add-events.handle',
    method: 'POST',
    path: '/organizers/events',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      EVENT_CONFIGURATION_TABLE_NAME: props.eventConfigurationTable.tableName,
    },
    memorySize: 2048,
    authorizer: props.apiAuthorizer,
    ...props,
  })
  props.eventConfigurationTable.grant(endpoint.lambda, 'dynamodb:BatchWriteItem')
  return endpoint
}

const makeRemoveOrganizerEventsEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventConfigurationTable: cdk.aws_dynamodb.Table
  apiAuthorizer: cdk.aws_apigatewayv2.CfnAuthorizer
}) => {
  const endpoint = createEndpoint('RemoveOrganizerEvents', {
    handler: 'adapters/lambda/event/remove-events.handle',
    method: 'DELETE',
    path: '/organizers/events',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      EVENT_CONFIGURATION_TABLE_NAME: props.eventConfigurationTable.tableName,
    },
    memorySize: 2048,
    authorizer: props.apiAuthorizer,
    ...props,
  })
  props.eventConfigurationTable.grant(
    endpoint.lambda,
    'dynamodb:BatchWriteItem',
    'dynamodb:BatchGetItem',
    'dynamodb:Query'
  )
  return endpoint
}

const makeUpdateOrganizerEventsEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventConfigurationTable: cdk.aws_dynamodb.Table
  apiAuthorizer: cdk.aws_apigatewayv2.CfnAuthorizer
}) => {
  const endpoint = createEndpoint('UpdateOrganizerEvent', {
    handler: 'adapters/lambda/event/update-events.handle',
    method: 'PUT',
    path: '/organizers/events',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      EVENT_CONFIGURATION_TABLE_NAME: props.eventConfigurationTable.tableName,
    },
    memorySize: 2048,
    authorizer: props.apiAuthorizer,
    ...props,
  })
  props.eventConfigurationTable.grant(endpoint.lambda, 'dynamodb:BatchWriteItem', 'dynamodb:BatchGetItem')
  return endpoint
}

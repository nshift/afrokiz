import { createEndpoint, createSharedLayer } from '@nshift/cdk'
import * as cdk from 'aws-cdk-lib'
import { Environment } from './environment'
import { OperationModule } from './path'

export const makeOperationEndpoints = (props: {
  stack: cdk.Stack
  api: cdk.aws_apigatewayv2.CfnApi
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
  salesTable: cdk.aws_dynamodb.Table
  guestTable: cdk.aws_dynamodb.Table
  sametTable: cdk.aws_dynamodb.Table
  documentBucket: cdk.aws_s3.Bucket
}) => {
  const sharedLayer = createSharedLayer('OperationSharedLayer', OperationModule('.build/layer'), props.stack)
  const codeUri = OperationModule('.build/src')
  const context = { sharedLayer, codeUri }
  return [
    makeAllSalesReportEndpoint({ ...props, ...context }),
    makePreGuestRegistrationEndpoint({ ...props, ...context }),
    makeGetGuestEndpoint({ ...props, ...context }),
    makeCheckInGuestEndpoint({ ...props, ...context }),
    makeSametGetawayPreRegistrationEndpoint({ ...props, ...context }),
    makeRemakeEmailTemplatesEndpoint({ ...props, ...context }),
  ]
}

const makeAllSalesReportEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  orderTable: cdk.aws_dynamodb.Table
}) => {
  const endpoint = createEndpoint('AllSalesReport', {
    handler: 'adapters/lambda/lambda.makeAllSalesReport',
    method: 'GET',
    path: '/sales/all',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      ORDER_TABLE_NAME: props.orderTable.tableName,
    },
    memorySize: 2048,
    ...props,
  })
  props.orderTable.grant(endpoint.lambda, 'dynamodb:Scan')
  return endpoint
}

const makePreGuestRegistrationEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  guestTable: cdk.aws_dynamodb.Table
  documentBucket: cdk.aws_s3.Bucket
}) => {
  const endpoint = createEndpoint('PreGuestRegistration', {
    handler: 'adapters/lambda/lambda.preGuestRegistration',
    method: 'POST',
    path: '/guests/pregister',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      GUEST_TABLE_NAME: props.guestTable.tableName,
      DOCUMENT_BUCKET_NAME: props.documentBucket.bucketName,
      WEB_APP_HOST: Environment.WebAppHost(),
    },
    memorySize: 2048,
    ...props,
  })
  props.guestTable.grant(endpoint.lambda, 'dynamodb:Query', 'dynamodb:PutItem')
  props.documentBucket.grantPut(endpoint.lambda)
  endpoint.lambda.addToRolePolicy(
    new cdk.aws_iam.PolicyStatement({
      actions: ['ses:CreateTemplate', 'ses:DeleteTemplate', 'ses:SendBulkTemplatedEmail', 'ses:SendRawEmail'],
      resources: ['*'],
      effect: cdk.aws_iam.Effect.ALLOW,
    })
  )
  return endpoint
}

const makeGetGuestEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  guestTable: cdk.aws_dynamodb.Table
}) => {
  const endpoint = createEndpoint('GetGuest', {
    handler: 'adapters/lambda/lambda.getGuest',
    method: 'GET',
    path: '/guests/{email}',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      GUEST_TABLE_NAME: props.guestTable.tableName,
    },
    memorySize: 2048,
    ...props,
  })
  props.guestTable.grant(endpoint.lambda, 'dynamodb:Query')
  return endpoint
}

const makeCheckInGuestEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  guestTable: cdk.aws_dynamodb.Table
}) => {
  const endpoint = createEndpoint('CheckInGuest', {
    handler: 'adapters/lambda/lambda.checkInGuest',
    method: 'POST',
    path: '/guests/check-in',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      GUEST_TABLE_NAME: props.guestTable.tableName,
    },
    memorySize: 2048,
    ...props,
  })
  props.guestTable.grant(endpoint.lambda, 'dynamodb:UpdateItem')
  return endpoint
}

const makeSametGetawayPreRegistrationEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  sametTable: cdk.aws_dynamodb.Table
}) => {
  const endpoint = createEndpoint('SametGetawayPreRegistration', {
    handler: 'adapters/lambda/lambda.preRegistraterForSametGetaway',
    method: 'POST',
    path: '/samet/pre-register',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      SAMET_TABLE_NAME: props.sametTable.tableName,
      WEB_APP_HOST: Environment.WebAppHost(),
    },
    memorySize: 2048,
    ...props,
  })
  props.sametTable.grant(endpoint.lambda, 'dynamodb:Query', 'dynamodb:PutItem')
  endpoint.lambda.addToRolePolicy(
    new cdk.aws_iam.PolicyStatement({
      actions: ['ses:CreateTemplate', 'ses:DeleteTemplate', 'ses:SendBulkTemplatedEmail', 'ses:SendRawEmail'],
      resources: ['*'],
      effect: cdk.aws_iam.Effect.ALLOW,
    })
  )
  return endpoint
}

const makeRemakeEmailTemplatesEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  guestTable: cdk.aws_dynamodb.Table
  documentBucket: cdk.aws_s3.Bucket
}) => {
  const endpoint = createEndpoint('OperationRemakeEmailTemplates', {
    handler: 'adapters/lambda/lambda.remakeEmailTemplates',
    method: 'POST',
    path: '/operation/email/templates',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      GUEST_TABLE_NAME: props.guestTable.tableName,
      DOCUMENT_BUCKET_NAME: props.documentBucket.bucketName,
      WEB_APP_HOST: Environment.WebAppHost(),
    },
    memorySize: 2048,
    ...props,
  })
  endpoint.lambda.addToRolePolicy(
    new cdk.aws_iam.PolicyStatement({
      actions: ['ses:CreateTemplate', 'ses:DeleteTemplate'],
      resources: ['*'],
      effect: cdk.aws_iam.Effect.ALLOW,
    })
  )
  return endpoint
}
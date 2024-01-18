import { createEndpoint, createSharedLayer } from '@nshift/cdk'
import * as cdk from 'aws-cdk-lib'
import { Environment } from './environment'
import { CheckoutModule } from './path'

export const makeCheckoutEndpoints = (props: {
  stack: cdk.Stack
  api: cdk.aws_apigatewayv2.CfnApi
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
}) => {
  const sharedLayer = createSharedLayer('CheckoutSharedLayer', CheckoutModule('.build/layer'), props.stack)
  const codeUri = CheckoutModule('.build/src')
  const stripeSecretKeyManager = cdk.aws_secretsmanager.Secret.fromSecretNameV2(
    props.stack,
    'aws/secretsmanager',
    Environment.StripeSecretKeyName()
  )
  const stripeSecretKey = stripeSecretKeyManager.secretValueFromJson('stripe_secret_key').unsafeUnwrap()
  const context = { sharedLayer, codeUri, stripeSecretKey }
  return [
    makeCreateOrderEndpoint({ ...props, ...context }),
    makeGetOrderEndpoint({ ...props, ...context }),
    makeUpdateOrderPaymentStatusEndpoint({ ...props, ...context }),
  ]
}

const makeCreateOrderEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
  stripeSecretKey: string
}) => {
  const endpoint = createEndpoint('CreateOrder', {
    handler: 'lambda.createOrder',
    method: 'POST',
    path: '/checkout',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      EVENT_TABLE_NAME: props.eventTable.tableName,
      ORDER_TABLE_NAME: props.orderTable.tableName,
      STRIPE_SECRET_KEY: props.stripeSecretKey,
    },
    memorySize: 2048,
    ...props,
  })
  props.eventTable.grant(endpoint.lambda, 'dynamodb:BatchWriteItem')
  props.orderTable.grant(endpoint.lambda, 'dynamodb:BatchWriteItem')
  return endpoint
}

const makeGetOrderEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  orderTable: cdk.aws_dynamodb.Table
  stripeSecretKey: string
}) => {
  const endpoint = createEndpoint('GetOrder', {
    handler: 'lambda.getOrder',
    method: 'GET',
    path: '/checkout/{id}',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      ORDER_TABLE_NAME: props.orderTable.tableName,
      STRIPE_SECRET_KEY: props.stripeSecretKey,
    },
    memorySize: 2048,
    ...props,
  })
  props.orderTable.grant(endpoint.lambda, 'dynamodb:Query')
  return endpoint
}

const makeUpdateOrderPaymentStatusEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
  stripeSecretKey: string
}) => {
  const endpoint = createEndpoint('UpdateOrderPaymentStatus', {
    handler: 'lambda.updateOrderPaymentStatus',
    method: 'POST',
    path: '/checkout/webhook',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      EVENT_TABLE_NAME: props.eventTable.tableName,
      ORDER_TABLE_NAME: props.orderTable.tableName,
      STRIPE_SECRET_KEY: props.stripeSecretKey,
    },
    memorySize: 2048,
    ...props,
  })
  endpoint.lambda.addToRolePolicy(
    new cdk.aws_iam.PolicyStatement({
      actions: ['ses:CreateTemplate', 'ses:DeleteTemplate', 'ses:SendBulkTemplatedEmail', 'ses:SendRawEmail'],
      resources: ['*'],
      effect: cdk.aws_iam.Effect.ALLOW,
    })
  )
  props.eventTable.grant(endpoint.lambda, 'dynamodb:BatchWriteItem')
  props.orderTable.grant(endpoint.lambda, 'dynamodb:BatchWriteItem', 'dynamodb:Query')
  return endpoint
}

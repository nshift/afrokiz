import { createEndpoint, createSharedLayer } from '@nshift/cdk'
import * as cdk from 'aws-cdk-lib'
import { Environment } from './environment'
import { CheckoutModule } from './path'

export const makeCheckoutEndpoints = (props: {
  stack: cdk.Stack
  api: cdk.aws_apigatewayv2.CfnApi
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
  salesTable: cdk.aws_dynamodb.Table
}) => {
  const sharedLayer = createSharedLayer('CheckoutSharedLayer', CheckoutModule('.build/layer'), props.stack)
  const codeUri = CheckoutModule('.build/src')
  const secretKeyManager = cdk.aws_secretsmanager.Secret.fromSecretNameV2(
    props.stack,
    'aws/secretsmanager',
    Environment.SecretKeysName()
  )
  const stripeSecretKey = secretKeyManager.secretValueFromJson(Environment.StripeSecretApiKeyName()).unsafeUnwrap()
  const stripeWebhookSecretKey = secretKeyManager
    .secretValueFromJson(Environment.StripeWebhookSecretApiKeyName())
    .unsafeUnwrap()
  const context = { sharedLayer, codeUri, stripeSecretKey, stripeWebhookSecretKey }
  return [
    makeProceedToCheckoutEndpoint({ ...props, ...context }),
    makeGetOrderEndpoint({ ...props, ...context }),
    makeUpdateOrderPaymentStatusEndpoint({ ...props, ...context }),
    makeGetPromotionEndpoint({ ...props, ...context }),
  ]
}

const makeProceedToCheckoutEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
  stripeSecretKey: string
  stripeWebhookSecretKey: string
}) => {
  const endpoint = createEndpoint('ProceedToCheckout', {
    handler: 'adapters/lambda/lambda.proceedToCheckout',
    method: 'POST',
    path: '/checkout',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      EVENT_TABLE_NAME: props.eventTable.tableName,
      ORDER_TABLE_NAME: props.orderTable.tableName,
      STRIPE_SECRET_KEY: props.stripeSecretKey,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeWebhookSecretKey,
    },
    memorySize: 2048,
    ...props,
  })
  props.eventTable.grant(endpoint.lambda, 'dynamodb:PutItem')
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
  stripeWebhookSecretKey: string
}) => {
  const endpoint = createEndpoint('GetOrder', {
    handler: 'adapters/lambda/lambda.getOrder',
    method: 'GET',
    path: '/checkout/{id}',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      ORDER_TABLE_NAME: props.orderTable.tableName,
      STRIPE_SECRET_KEY: props.stripeSecretKey,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeWebhookSecretKey,
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
  salesTable: cdk.aws_dynamodb.Table
  stripeSecretKey: string
  stripeWebhookSecretKey: string
}) => {
  const endpoint = createEndpoint('UpdateOrderPaymentStatus', {
    handler: 'adapters/lambda/lambda.updateOrderPaymentStatus',
    method: 'POST',
    path: '/checkout/webhook',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      EVENT_TABLE_NAME: props.eventTable.tableName,
      ORDER_TABLE_NAME: props.orderTable.tableName,
      SALES_TABLE_NAME: props.salesTable.tableName,
      STRIPE_SECRET_KEY: props.stripeSecretKey,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeWebhookSecretKey,
      WEB_APP_HOST: Environment.WebAppHost(),
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
  props.eventTable.grant(endpoint.lambda, 'dynamodb:PutItem')
  props.orderTable.grant(endpoint.lambda, 'dynamodb:UpdateItem', 'dynamodb:Query')
  props.salesTable.grant(endpoint.lambda, 'dynamodb:BatchWriteItem')
  return endpoint
}

const makeGetPromotionEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  stripeSecretKey: string
  stripeWebhookSecretKey: string
}) => {
  const endpoint = createEndpoint('GetPromotion', {
    handler: 'adapters/lambda/lambda.getPromotion',
    method: 'GET',
    path: '/promotion/{code}',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      STRIPE_SECRET_KEY: props.stripeSecretKey,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeWebhookSecretKey,
    },
    memorySize: 2048,
    ...props,
  })
  return endpoint
}

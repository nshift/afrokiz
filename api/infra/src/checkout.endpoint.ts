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
  importOrdersTable: cdk.aws_dynamodb.Table
  importOrderQueue: cdk.aws_sqs.Queue
  documentBucket: cdk.aws_s3.Bucket
  stripeSecrets: { secret: string; webhook: string }
}) => {
  const sharedLayer = createSharedLayer('CheckoutSharedLayer', CheckoutModule('.build/layer'), props.stack)
  const codeUri = CheckoutModule('.build/src')

  const context = { sharedLayer, codeUri, stripeSecrets: props.stripeSecrets }
  return [
    makeProceedToCheckoutEndpoint({ ...props, ...context }),
    makeGetOrderEndpoint({ ...props, ...context }),
    makeUpdateOrderPaymentStatusEndpoint({ ...props, ...context }),
    makeGetPromotionEndpoint({ ...props, ...context }),
    makeResendConfirmationEmailEndpoint({ ...props, ...context }),
    makeRequestImportOrderEndpoint({ ...props, ...context }),
    makeRequestImportEdition3OrderEndpoint({ ...props, ...context }),
    makeRequestSendRegistrationCampaignEndpoint({ ...props, ...context }),
    makeRequestSendDinnerCruiseCampaignEndpoint({ ...props, ...context }),
    makeRequestSendRegistrationReminderCampaignEndpoint({ ...props, ...context }),
    makeCheckInEndpoint({ ...props, ...context }),
    // makeMarkPaymentAsSucceedEndpoint({ ...props, ...context }),
  ]
}

const makeProceedToCheckoutEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
  documentBucket: cdk.aws_s3.Bucket
  stripeSecrets: { secret: string; webhook: string }
}) => {
  const endpoint = createEndpoint('ProceedToCheckout', {
    handler: 'adapters/lambda/lambda.proceedToCheckout',
    method: 'POST',
    path: '/checkout',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      DOCUMENT_BUCKET_NAME: props.documentBucket.bucketName,
      EVENT_TABLE_NAME: props.eventTable.tableName,
      ORDER_TABLE_NAME: props.orderTable.tableName,
      STRIPE_SECRET_KEY: props.stripeSecrets.secret,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeSecrets.webhook,
    },
    memorySize: 2048,
    ...props,
  })
  props.eventTable.grant(endpoint.lambda, 'dynamodb:PutItem')
  props.orderTable.grant(endpoint.lambda, 'dynamodb:BatchWriteItem', 'dynamodb:Query')
  return endpoint
}

const makeGetOrderEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  orderTable: cdk.aws_dynamodb.Table
  documentBucket: cdk.aws_s3.Bucket
  stripeSecrets: { secret: string; webhook: string }
}) => {
  const endpoint = createEndpoint('GetOrder', {
    handler: 'adapters/lambda/lambda.getOrder',
    method: 'GET',
    path: '/checkout/{id}',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      DOCUMENT_BUCKET_NAME: props.documentBucket.bucketName,
      ORDER_TABLE_NAME: props.orderTable.tableName,
      STRIPE_SECRET_KEY: props.stripeSecrets.secret,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeSecrets.webhook,
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
  documentBucket: cdk.aws_s3.Bucket
  stripeSecrets: { secret: string; webhook: string }
}) => {
  const endpoint = createEndpoint('UpdateOrderPaymentStatus', {
    handler: 'adapters/lambda/lambda.updateOrderPaymentStatus',
    method: 'POST',
    path: '/checkout/webhook',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      DOCUMENT_BUCKET_NAME: props.documentBucket.bucketName,
      EVENT_TABLE_NAME: props.eventTable.tableName,
      ORDER_TABLE_NAME: props.orderTable.tableName,
      SALES_TABLE_NAME: props.salesTable.tableName,
      STRIPE_SECRET_KEY: props.stripeSecrets.secret,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeSecrets.webhook,
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
  props.documentBucket.grantPut(endpoint.lambda)
  return endpoint
}

const makeGetPromotionEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  documentBucket: cdk.aws_s3.Bucket
  stripeSecrets: { secret: string; webhook: string }
}) => {
  const endpoint = createEndpoint('GetPromotion', {
    handler: 'adapters/lambda/lambda.getPromotion',
    method: 'GET',
    path: '/promotion/{passId}/{code}',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      DOCUMENT_BUCKET_NAME: props.documentBucket.bucketName,
      STRIPE_SECRET_KEY: props.stripeSecrets.secret,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeSecrets.webhook,
    },
    memorySize: 2048,
    ...props,
  })
  return endpoint
}

const makeResendConfirmationEmailEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
  salesTable: cdk.aws_dynamodb.Table
  documentBucket: cdk.aws_s3.Bucket
  stripeSecrets: { secret: string; webhook: string }
}) => {
  const endpoint = createEndpoint('ResendConfirmationEmail', {
    handler: 'adapters/lambda/lambda.resendConfirmationEmail',
    method: 'POST',
    path: '/checkout/send-email',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      DOCUMENT_BUCKET_NAME: props.documentBucket.bucketName,
      ORDER_TABLE_NAME: props.orderTable.tableName,
      STRIPE_SECRET_KEY: props.stripeSecrets.secret,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeSecrets.webhook,
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
  props.orderTable.grant(endpoint.lambda, 'dynamodb:Query')
  props.documentBucket.grantPut(endpoint.lambda)
  return endpoint
}

const makeRequestImportOrderEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
  salesTable: cdk.aws_dynamodb.Table
  importOrdersTable: cdk.aws_dynamodb.Table
  importOrderQueue: cdk.aws_sqs.Queue
  documentBucket: cdk.aws_s3.Bucket
  stripeSecrets: { secret: string; webhook: string }
}) => {
  const endpoint = createEndpoint('RequestImportOrder', {
    handler: 'adapters/lambda/lambda.requestImportOrders',
    method: 'POST',
    path: '/import/orders',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      EVENT_TABLE_NAME: props.eventTable.tableName,
      ORDER_TABLE_NAME: props.orderTable.tableName,
      SALES_TABLE_NAME: props.salesTable.tableName,
      DOCUMENT_BUCKET_NAME: props.documentBucket.bucketName,
      IMPORT_ORDER_TABLE_NAME: props.importOrdersTable.tableName,
      IMPORT_ORDER_QUEUE: props.importOrderQueue.queueUrl,
      WEB_APP_HOST: Environment.WebAppHost(),
      STRIPE_SECRET_KEY: props.stripeSecrets.secret,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeSecrets.webhook,
    },
    memorySize: 2048,
    ...props,
  })
  props.eventTable.grant(endpoint.lambda, 'dynamodb:Query', 'dynamodb:BatchWriteItem', 'dynamodb:PutItem')
  props.orderTable.grant(
    endpoint.lambda,
    'dynamodb:Query',
    'dynamodb:BatchWriteItem',
    'dynamodb:UpdateItem',
    'dynamodb:PutItem'
  )
  props.salesTable.grant(endpoint.lambda, 'dynamodb:BatchWriteItem')
  props.importOrdersTable.grant(endpoint.lambda, 'dynamodb:BatchGetItem', 'dynamodb:BatchWriteItem')
  props.documentBucket.grantRead(endpoint.lambda)
  props.importOrderQueue.grantSendMessages(endpoint.lambda)
  endpoint.lambda.addToRolePolicy(
    new cdk.aws_iam.PolicyStatement({
      actions: ['ses:CreateTemplate', 'ses:DeleteTemplate', 'ses:SendBulkTemplatedEmail', 'ses:SendRawEmail'],
      resources: ['*'],
      effect: cdk.aws_iam.Effect.ALLOW,
    })
  )
  props.documentBucket.grantPut(endpoint.lambda)
  return endpoint
}

const makeRequestImportEdition3OrderEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
  salesTable: cdk.aws_dynamodb.Table
  importOrdersTable: cdk.aws_dynamodb.Table
  importOrderQueue: cdk.aws_sqs.Queue
  documentBucket: cdk.aws_s3.Bucket
  stripeSecrets: { secret: string; webhook: string }
}) => {
  const endpoint = createEndpoint('RequestImportEdition3Order', {
    handler: 'adapters/lambda/lambda.requestImportEdition3Orders',
    method: 'POST',
    path: '/import/orders/edition3',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      EVENT_TABLE_NAME: props.eventTable.tableName,
      ORDER_TABLE_NAME: props.orderTable.tableName,
      SALES_TABLE_NAME: props.salesTable.tableName,
      DOCUMENT_BUCKET_NAME: props.documentBucket.bucketName,
      IMPORT_ORDER_TABLE_NAME: props.importOrdersTable.tableName,
      IMPORT_ORDER_QUEUE: props.importOrderQueue.queueUrl,
      WEB_APP_HOST: Environment.WebAppHost(),
      STRIPE_SECRET_KEY: props.stripeSecrets.secret,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeSecrets.webhook,
    },
    memorySize: 2048,
    ...props,
  })
  props.eventTable.grant(endpoint.lambda, 'dynamodb:Query', 'dynamodb:BatchWriteItem', 'dynamodb:PutItem')
  props.orderTable.grant(
    endpoint.lambda,
    'dynamodb:Query',
    'dynamodb:BatchWriteItem',
    'dynamodb:UpdateItem',
    'dynamodb:PutItem'
  )
  props.salesTable.grant(endpoint.lambda, 'dynamodb:BatchWriteItem')
  props.importOrdersTable.grant(endpoint.lambda, 'dynamodb:BatchGetItem', 'dynamodb:BatchWriteItem')
  props.documentBucket.grantRead(endpoint.lambda)
  props.importOrderQueue.grantSendMessages(endpoint.lambda)
  endpoint.lambda.addToRolePolicy(
    new cdk.aws_iam.PolicyStatement({
      actions: ['ses:CreateTemplate', 'ses:DeleteTemplate', 'ses:SendBulkTemplatedEmail', 'ses:SendRawEmail'],
      resources: ['*'],
      effect: cdk.aws_iam.Effect.ALLOW,
    })
  )
  props.documentBucket.grantPut(endpoint.lambda)
  return endpoint
}

const makeRequestSendRegistrationCampaignEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
  salesTable: cdk.aws_dynamodb.Table
  documentBucket: cdk.aws_s3.Bucket
  stripeSecrets: { secret: string; webhook: string }
}) => {
  const endpoint = createEndpoint('SendRegistrationCampaign', {
    handler: 'adapters/lambda/lambda.sendRegistrationCampaign',
    method: 'POST',
    path: '/campaign/registration',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      DOCUMENT_BUCKET_NAME: props.documentBucket.bucketName,
      ORDER_TABLE_NAME: props.orderTable.tableName,
      STRIPE_SECRET_KEY: props.stripeSecrets.secret,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeSecrets.webhook,
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
  props.orderTable.grant(endpoint.lambda, 'dynamodb:UpdateItem', 'dynamodb:Scan')
  props.documentBucket.grantPut(endpoint.lambda)
  return endpoint
}

const makeRequestSendDinnerCruiseCampaignEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
  salesTable: cdk.aws_dynamodb.Table
  documentBucket: cdk.aws_s3.Bucket
  stripeSecrets: { secret: string; webhook: string }
}) => {
  const endpoint = createEndpoint('SendDinnerCruiseCampaign', {
    handler: 'adapters/lambda/lambda.sendDinnerCruiseCampaign',
    method: 'POST',
    path: '/campaign/cruise',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      DOCUMENT_BUCKET_NAME: props.documentBucket.bucketName,
      ORDER_TABLE_NAME: props.orderTable.tableName,
      STRIPE_SECRET_KEY: props.stripeSecrets.secret,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeSecrets.webhook,
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
  props.orderTable.grant(endpoint.lambda, 'dynamodb:UpdateItem', 'dynamodb:Scan')
  props.documentBucket.grantPut(endpoint.lambda)
  return endpoint
}

const makeRequestSendRegistrationReminderCampaignEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
  salesTable: cdk.aws_dynamodb.Table
  documentBucket: cdk.aws_s3.Bucket
  stripeSecrets: { secret: string; webhook: string }
}) => {
  const endpoint = createEndpoint('SendRegistrationReminderCampaign', {
    handler: 'adapters/lambda/lambda.sendRegistrationReminderCampaign',
    method: 'POST',
    path: '/campaign/registration-reminder',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      DOCUMENT_BUCKET_NAME: props.documentBucket.bucketName,
      ORDER_TABLE_NAME: props.orderTable.tableName,
      STRIPE_SECRET_KEY: props.stripeSecrets.secret,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeSecrets.webhook,
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
  props.orderTable.grant(endpoint.lambda, 'dynamodb:UpdateItem', 'dynamodb:Scan')
  props.documentBucket.grantPut(endpoint.lambda)
  return endpoint
}

const makeCheckInEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
  documentBucket: cdk.aws_s3.Bucket
  stripeSecrets: { secret: string; webhook: string }
}) => {
  const endpoint = createEndpoint('MarkPaymentAsSucceed', {
    handler: 'adapters/lambda/lambda.checkIn',
    method: 'POST',
    path: '/check-in/{id}',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      DOCUMENT_BUCKET_NAME: props.documentBucket.bucketName,
      EVENT_TABLE_NAME: props.eventTable.tableName,
      ORDER_TABLE_NAME: props.orderTable.tableName,
      STRIPE_SECRET_KEY: props.stripeSecrets.secret,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeSecrets.webhook,
      WEB_APP_HOST: Environment.WebAppHost(),
    },
    memorySize: 2048,
    ...props,
  })
  props.eventTable.grant(endpoint.lambda, 'dynamodb:PutItem')
  props.orderTable.grant(endpoint.lambda, 'dynamodb:UpdateItem')
  return endpoint
}

const makeMarkPaymentAsSucceedEndpoint = (props: {
  stack: cdk.Stack
  codeUri: string
  api: cdk.aws_apigatewayv2.CfnApi
  sharedLayer: cdk.aws_lambda.LayerVersion
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
  salesTable: cdk.aws_dynamodb.Table
  documentBucket: cdk.aws_s3.Bucket
  stripeSecrets: { secret: string; webhook: string }
}) => {
  const endpoint = createEndpoint('MarkPaymentAsSucceed', {
    handler: 'adapters/lambda/lambda.markPaymentAsSucceed',
    method: 'POST',
    path: '/payment/succeed',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      DOCUMENT_BUCKET_NAME: props.documentBucket.bucketName,
      EVENT_TABLE_NAME: props.eventTable.tableName,
      ORDER_TABLE_NAME: props.orderTable.tableName,
      SALES_TABLE_NAME: props.salesTable.tableName,
      STRIPE_SECRET_KEY: props.stripeSecrets.secret,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeSecrets.webhook,
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

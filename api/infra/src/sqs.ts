import { createLambda, createSharedLayer, createSQS, linkLambdaToSQS } from '@nshift/cdk'
import * as cdk from 'aws-cdk-lib'
import { Environment } from './environment'
import { CheckoutModule } from './path'

export const createImportOrderQueue = (props: {
  stack: cdk.Stack
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
  salesTable: cdk.aws_dynamodb.Table
  stripeSecrets: { secret: string; webhook: string }
  documentBucket: cdk.aws_s3.Bucket
}) => {
  const sharedLayer = createSharedLayer('ImportOrderSharedLayer', CheckoutModule('.build/layer'), props.stack)
  const codeUri = CheckoutModule('.build/src')
  const queue = createSQS('ImportOrder', { stack: props.stack })
  const lambda = createLambda('ImportOrder', {
    stack: props.stack,
    sharedLayer,
    path: codeUri,
    handler: 'adapters/lambda/lambda.importOrder',
    environment: {
      NODE_ENV: 'PROD',
      LOG_LEVEL: 'info',
      EVENT_TABLE_NAME: props.eventTable.tableName,
      ORDER_TABLE_NAME: props.orderTable.tableName,
      SALES_TABLE_NAME: props.salesTable.tableName,
      DOCUMENT_BUCKET_NAME: props.documentBucket.bucketName,
      WEB_APP_HOST: Environment.WebAppHost(),
      STRIPE_SECRET_KEY: props.stripeSecrets.secret,
      STRIPE_WEBHOOK_SECRET_KEY: props.stripeSecrets.webhook,
    },
  })
  props.eventTable.grant(lambda, 'dynamodb:Query', 'dynamodb:PutItem')
  props.orderTable.grant(lambda, 'dynamodb:Query', 'dynamodb:UpdateItem')
  props.salesTable.grant(lambda, 'dynamodb:BatchWriteItem')
  lambda.addToRolePolicy(
    new cdk.aws_iam.PolicyStatement({
      actions: ['ses:CreateTemplate', 'ses:DeleteTemplate', 'ses:SendBulkTemplatedEmail', 'ses:SendRawEmail'],
      resources: ['*'],
      effect: cdk.aws_iam.Effect.ALLOW,
    })
  )
  linkLambdaToSQS(lambda, queue)
  return queue
}

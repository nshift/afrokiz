#!/usr/bin/env node
import {
  Environment,
  createApi,
  createAuthorizer,
  createAutoVerifyLambda,
  createCognito,
  createStack,
  deployApi,
  makeId,
} from '@nshift/cdk'
import * as cdk from 'aws-cdk-lib'
import * as dotenv from 'dotenv'
import * as path from 'path'
import 'source-map-support/register'
import { createDocumentBucket } from './bucket'
import { makeCheckoutEndpoints } from './checkout.endpoint'
import {
  createEventConfigurationTable,
  createEventTable,
  createGuestTable,
  createImportOrderTable,
  createOrderTable,
  createPaymentTable,
  createSalesTable,
  createSametTable,
} from './dynamodb'
import { makeOperationEndpoints } from './operation.endpoint'
import { makeOrganizerEndpoints } from './organizer.endpoint'
import { getStripeSecrets } from './secret'
import { createImportOrderQueue } from './sqs'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = new cdk.App()
const stack = createStack(makeId(Environment.projectName(), Environment.environment(), Environment.region()), app)
const api = createApi(stack, ['stripe-signature'])
const documentBucket = createDocumentBucket(stack)
const eventTable = createEventTable(stack)
const orderTable = createOrderTable(stack)
const salesTable = createSalesTable(stack)
const guestTable = createGuestTable(stack)
const sametTable = createSametTable(stack)
const paymentTable = createPaymentTable(stack)
const importOrdersTable = createImportOrderTable(stack)
const eventConfigurationTable = createEventConfigurationTable(stack)
const stripeSecrets = getStripeSecrets(stack)
const { userPool, userPoolClient } = createCognito('Authentication', { stack })
const autoVerifyLambda = createAutoVerifyLambda(stack)
userPool.addTrigger(cdk.aws_cognito.UserPoolOperation.PRE_SIGN_UP, autoVerifyLambda)
const apiAuthorizer = createAuthorizer('ApiJWTAuthorizer', {
  stack,
  api,
  userPool,
  userPoolClient,
})
const context = {
  stack,
  documentBucket,
  api,
  eventTable,
  orderTable,
  salesTable,
  guestTable,
  sametTable,
  paymentTable,
  importOrdersTable,
  eventConfigurationTable,
  stripeSecrets,
  userPoolClient,
  apiAuthorizer,
}
const importOrderQueue = createImportOrderQueue(context)
const endpoints: cdk.CfnResource[] = [
  ...makeCheckoutEndpoints({ ...context, importOrderQueue }).map((endpoint) => endpoint.route),
  ...makeOperationEndpoints(context).map((endpoint) => endpoint.route),
  ...makeOrganizerEndpoints(context).map((endpoint) => endpoint.route),
]
deployApi(stack, api, endpoints)
// new cdk.CfnOutput(stack, 'bucket', { value: bucket.bucketArn })
// new cdk.CfnOutput(stack, 'test', { value: __dirname })

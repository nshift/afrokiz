#!/usr/bin/env node
import { Environment, createApi, createStack, deployApi, makeId } from '@nshift/cdk'
import * as cdk from 'aws-cdk-lib'
import * as dotenv from 'dotenv'
import * as path from 'path'
import 'source-map-support/register'
import { makeCheckoutEndpoints } from './checkout.endpoint'
import { createEventTable, createOrderTable, createSalesTable } from './dynamodb'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = new cdk.App()
const stack = createStack(makeId(Environment.projectName(), Environment.environment(), Environment.region()), app)
const api = createApi(stack, ['stripe-signature'])
const eventTable = createEventTable(stack)
const orderTable = createOrderTable(stack)
const salesTable = createSalesTable(stack)
const context = {
  stack,
  api,
  eventTable,
  orderTable,
  salesTable,
}
const endpoints: cdk.CfnResource[] = [...makeCheckoutEndpoints(context).map((endpoint) => endpoint.route)]
deployApi(stack, api, endpoints)
// new cdk.CfnOutput(stack, 'bucket', { value: bucket.bucketArn })
// new cdk.CfnOutput(stack, 'test', { value: __dirname })

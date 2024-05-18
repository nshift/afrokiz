import { createEndpoint, createSharedLayer } from '@nshift/cdk'
import * as cdk from 'aws-cdk-lib'
import { CheckoutModule } from './path'

export const makeOperationEndpoints = (props: {
  stack: cdk.Stack
  api: cdk.aws_apigatewayv2.CfnApi
  eventTable: cdk.aws_dynamodb.Table
  orderTable: cdk.aws_dynamodb.Table
  salesTable: cdk.aws_dynamodb.Table
}) => {
  const sharedLayer = createSharedLayer('OperationSharedLayer', CheckoutModule('.build/layer'), props.stack)
  const codeUri = CheckoutModule('.build/src')
  const context = { sharedLayer, codeUri }
  return [makeAllSalesReportEndpoint({ ...props, ...context })]
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

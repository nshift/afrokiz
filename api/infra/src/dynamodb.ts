import { createDynamoDbTable } from '@nshift/cdk'
import * as cdk from 'aws-cdk-lib'

const STRING = cdk.aws_dynamodb.AttributeType.STRING
const NUMBER = cdk.aws_dynamodb.AttributeType.NUMBER

export const createEventTable = (stack: cdk.Stack) =>
  createDynamoDbTable('EventTable', {
    partitionKey: { name: 'id', type: STRING },
    secondaryIndexes: [
      { indexName: 'NameLookup', partitionKey: { name: 'name', type: STRING } },
      { indexName: 'TimeLookup', partitionKey: { name: 'time', type: STRING } },
    ],
    stack,
  })

export const createOrderTable = (stack: cdk.Stack) =>
  createDynamoDbTable('OrderTable', {
    partitionKey: { name: 'id', type: STRING },
    secondaryIndexes: [
      { indexName: 'EmailLookup', partitionKey: { name: 'email', type: STRING } },
      { indexName: 'PaymentIntentLookup', partitionKey: { name: 'paymentIntentId', type: STRING } },
    ],
    stack,
  })

export const createSalesTable = (stack: cdk.Stack) =>
  createDynamoDbTable('SalesTable', { partitionKey: { name: 'id', type: STRING }, stack })

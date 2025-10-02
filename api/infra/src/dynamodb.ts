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

export const createImportOrderTable = (stack: cdk.Stack) =>
  createDynamoDbTable('ImportOrderTable', { partitionKey: { name: 'fingerprint', type: STRING }, stack })

export const createGuestTable = (stack: cdk.Stack) =>
  createDynamoDbTable('GuestTable', { partitionKey: { name: 'email', type: STRING }, stack })

export const createSametTable = (stack: cdk.Stack) =>
  createDynamoDbTable('SametTable', { partitionKey: { name: 'email', type: STRING }, stack })

export const createPaymentTable = (stack: cdk.Stack) =>
  createDynamoDbTable('PaymentTable', {
    partitionKey: { name: 'id', type: STRING },
    secondaryIndexes: [
      { indexName: 'PaymentStatus', partitionKey: { name: 'status', type: STRING } },
      { indexName: 'PaymentIntentId', partitionKey: { name: 'stripePaymentIntentId', type: STRING } },
      { indexName: 'CustomerId', partitionKey: { name: 'stripeCustomerId', type: STRING } },
    ],
    stack,
  })

export const createEventConfigurationTable = (stack: cdk.Stack) =>
  createDynamoDbTable('EventConfigurationTable', {
    partitionKey: { name: 'pk', type: STRING },
    sortKey: { name: 'sk', type: STRING },
    secondaryIndexes: [
      { indexName: 'UserIdGSI', partitionKey: { name: 'userId', type: STRING } },
      { indexName: 'ByCode', partitionKey: { name: 'code', type: STRING }, sortKey: { name: 'sk', type: STRING } },
      { indexName: 'BySKU', partitionKey: { name: 'sku', type: STRING } },
    ],
    stack,
  })

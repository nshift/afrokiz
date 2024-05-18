import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { beforeEach, describe, expect, it } from '@jest/globals'
import { DynamoDbAdapter } from './dynamodb'

let dynamoDb: DynamoDbAdapter

beforeEach(() => {
  dynamoDb = new DynamoDbAdapter(
    DynamoDBDocumentClient.from(new DynamoDB({}), {
      marshallOptions: { removeUndefinedValues: true },
    })
  )
})

describe('List all sales', () => {
  it('should get all orders and format it to sales', async () => {
    const sales = await dynamoDb.listAllSales()
    expect(sales.length).toBeGreaterThan(0)
  })
})

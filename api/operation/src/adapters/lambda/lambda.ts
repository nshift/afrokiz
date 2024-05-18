import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SalesReporting } from '../../sales.reporting'
import { DynamoDbAdapter } from '../dynamodb/dynamodb'

const repository = new DynamoDbAdapter(
  DynamoDBDocumentClient.from(new DynamoDB({}), {
    marshallOptions: { removeUndefinedValues: true },
  })
)
const salesReporting = new SalesReporting(repository)

export const makeAllSalesReport = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const salesReport = await salesReporting.makeAllSalesReport()
    return successResponse(successResponse(salesReport))
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

const successResponse = (body: any) => ({
  statusCode: 200,
  headers,
  body: JSON.stringify(body),
})

const internalServerErrorResponse = (error: any) => ({
  statusCode: 500,
  headers,
  body: JSON.stringify({ message: error?.message ?? `Unknown error: ${error}` }),
})

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

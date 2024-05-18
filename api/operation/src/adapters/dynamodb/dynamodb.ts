import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { Sales } from '../../entities/sales'
import { ListAllSales } from '../repository'
import { listOrdersRequest, listOrdersResponse } from './list-orders'

export class DynamoDbAdapter implements ListAllSales {
  constructor(private readonly dynamodb: DynamoDBDocumentClient) {}

  async listAllSales(): Promise<Sales[]> {
    const response = await this.dynamodb.send(listOrdersRequest())
    return listOrdersResponse(response.Items)
  }
}

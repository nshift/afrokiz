import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { Guest } from '../../entities/guest'
import { Sales } from '../../entities/sales'
import { GetGuest, ListAllSales, SaveGuest } from '../repository'
import { getGuestByEmailRequest, guestResponse, saveGuestRequest, updateGuestCheckInRequest } from './guest'
import { listOrdersRequest, listOrdersResponse } from './list-orders'

export class DynamoDbAdapter implements ListAllSales, SaveGuest, GetGuest {
  constructor(private readonly dynamodb: DynamoDBDocumentClient) {}
  async listAllSales(): Promise<Sales[]> {
    const response = await this.dynamodb.send(listOrdersRequest())
    return listOrdersResponse(response.Items)
  }

  async saveGuest(guest: Guest): Promise<void> {
    await this.dynamodb.send(saveGuestRequest(guest))
  }

  async getGuest(email: string): Promise<Guest> {
    const response = await this.dynamodb.send(getGuestByEmailRequest(email))
    const guests = guestResponse(response.Items)
    return guests[0] ?? null
  }

  async updateGuestCheckIn(guestEmail: string, value: boolean): Promise<void> {
    await this.dynamodb.send(updateGuestCheckInRequest({ email: guestEmail, checkedIn: value }))
  }
}

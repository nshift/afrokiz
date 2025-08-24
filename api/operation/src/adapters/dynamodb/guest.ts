import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { Guest } from '../../entities/guest'
import { Environment } from '../../environment'

export const saveGuestRequest = (guest: Guest) =>
  new PutCommand({
    TableName: Environment.GuestTableName(),
    Item: {
      id: guest.id,
      email: guest.email,
      fullname: guest.fullname,
      created_at: guest.createdAt.toISOString(),
      checkedIn: guest.checkedIn,
    },
  })

export const getGuestByEmailRequest = (email: string) =>
  new QueryCommand({
    TableName: Environment.GuestTableName(),
    KeyConditionExpression: '#email = :email',
    ExpressionAttributeNames: { '#email': 'email' },
    ExpressionAttributeValues: { ':email': email },
  })

export const guestResponse = (response: any): Guest[] =>
  response?.map(
    (item: any): Guest => ({
      id: item.id,
      email: item.email,
      fullname: item.fullname,
      createdAt: new Date(item.created_at),
      checkedIn: item.checkedIn ?? false,
    })
  )

export const updateGuestCheckInRequest = (guest: { email: string; checkedIn: boolean }) =>
  new UpdateCommand({
    TableName: Environment.GuestTableName(),
    Key: { email: guest.email },
    UpdateExpression: 'SET #checkedIn = :checkedIn',
    ExpressionAttributeNames: { '#checkedIn': 'checkedIn' },
    ExpressionAttributeValues: { ':checkedIn': guest.checkedIn },
  })

export const saveSametGuestRequest = (guest: Guest) =>
  new PutCommand({
    TableName: Environment.SametTableName(),
    Item: {
      email: guest.email,
      fullname: guest.fullname,
      id: guest.id,
    },
  })

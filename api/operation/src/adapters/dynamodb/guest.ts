import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { Guest } from '../../entities/guest'
import { Environment } from '../../environment'

export const saveGuestRequest = (guest: Guest) =>
  new PutCommand({
    TableName: Environment.GuestTablName(),
    Item: {
      email: guest.email,
      fullname: guest.fullname,
      id: guest.id,
    },
  })

export const getGuestByEmailRequest = (email: string) =>
  new QueryCommand({
    TableName: Environment.GuestTablName(),
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
      checkedIn: item.checkedIn ?? false,
    })
  )

export const updateGuestCheckInRequest = (guest: { email: string; checkedIn: boolean }) =>
  new UpdateCommand({
    TableName: Environment.GuestTablName(),
    Key: { email: guest.email },
    UpdateExpression: 'SET #checkedIn = :checkedIn',
    ExpressionAttributeNames: { '#checkedIn': 'checkedIn' },
    ExpressionAttributeValues: { ':checkedIn': guest.checkedIn },
  })

import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { Environment } from '../../../environment'
import { DateGenerator } from '../../date.generator'
import { UUIDGenerator } from '../../uuid.generator'
import { EventStore } from '../event-store'
import { Event } from './event'

export interface CheckInEvent extends Event<{ id: string; checkedIn: boolean }> {}

const updateOrderCheckIn = (order: { id: string; checkedIn: boolean }) =>
  new UpdateCommand({
    TableName: Environment.OrderTableName(),
    Key: { id: order.id },
    UpdateExpression: 'SET #checkedIn = :checkedIn',
    ExpressionAttributeNames: { '#checkedIn': 'checkedIn' },
    ExpressionAttributeValues: { ':checkedIn': order.checkedIn },
  })

export const processUpdateOrderCheckInEvent = (
  dynamodb: DynamoDBDocumentClient,
  uuidGenerator: UUIDGenerator,
  dateGenerator: DateGenerator,
  data: { id: string; checkedIn: boolean }
) => {
  const event: CheckInEvent = {
    id: uuidGenerator.generate(),
    name: 'CheckIn',
    time: dateGenerator.today(),
    data: { id: data.id, checkedIn: data.checkedIn },
    process: () => [updateOrderCheckIn(data)],
  }
  const eventStore = new EventStore(dynamodb)
  return eventStore.process([event])
}

import { BatchWriteCommand, DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb'

export interface Event {
  id: string
  name: string
  time: Date
  data: { [key: string]: any }

  process(): (PutCommand | DeleteCommand | BatchWriteCommand)[]
}

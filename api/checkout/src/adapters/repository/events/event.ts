import { BatchWriteCommand, DeleteCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

export interface Event<T> {
  id: string
  name: string
  time: Date
  data: T

  process(): (UpdateCommand | PutCommand | DeleteCommand | BatchWriteCommand)[]
}

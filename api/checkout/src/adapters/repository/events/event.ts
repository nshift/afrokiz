import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

export interface Event<T> {
  id: string
  name: string
  time: Date
  data: T

  process(client: DynamoDBDocumentClient): Promise<(UpdateCommand | PutCommand | DeleteCommand | BatchWriteCommand)[]>
}

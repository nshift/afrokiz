import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { Event } from './events/event'
import { saveEventRequest } from './requests'

export class EventStore {
  constructor(private readonly client: DynamoDBDocumentClient) {}

  async process(events: Event<any>[]): Promise<void> {
    await Promise.all(
      events.map(async (event) => {
        const saveEventCommand = this.saveEvent(event)
        const commands = event.process()
        await this.commit([saveEventCommand, ...commands])
      })
    )
  }

  private saveEvent(event: Event<any>): PutCommand {
    return saveEventRequest(event)
  }

  private async commit(commands: (UpdateCommand | PutCommand | DeleteCommand | BatchWriteCommand)[]): Promise<void> {
    await Promise.all(commands.map((command) => this.client.send(command as any)))
    // await this.client.send(new BatchWriteCommand({ RequestItems: this.requestItems(commands) }))
  }

  // private requestItems = (
  //   commands: (PutCommand | DeleteCommand | BatchWriteCommand)[]
  // ): BatchWriteCommandInput['RequestItems'] => {
  //   return commands.reduce((requestItems, command) => {
  //     if (!requestItems) {
  //       requestItems = {}
  //     }
  //     if (command instanceof BatchWriteCommand) {
  //       const batchWriteRequestItems: { [key: string]: any } | undefined = command.input.RequestItems
  //       if (!batchWriteRequestItems) {
  //         return requestItems
  //       }
  //       for (const key of Object.keys(batchWriteRequestItems)) {
  //         requestItems[key] = (requestItems[key] ?? []).concat(...batchWriteRequestItems[key])
  //       }
  //       return requestItems
  //     }
  //     const tableName = command.input.TableName
  //     if (!tableName) {
  //       throw new Error(`Request has no tableName: ${JSON.stringify(command.input)}`)
  //     }
  //     const requests = (():
  //       | { PutRequest: Omit<PutCommandInput, 'TableName'> }[]
  //       | { DeleteRequest: Omit<DeleteCommandInput, 'TableName'> }[]
  //       | undefined => {
  //       if (command instanceof PutCommand) {
  //         const item = command.input.Item
  //         return item ? [{ PutRequest: { Item: item } }] : undefined
  //       } else if (command instanceof DeleteCommand) {
  //         const key = command.input.Key
  //         return key ? [{ DeleteRequest: { Key: key } }] : undefined
  //       } else {
  //         return undefined
  //       }
  //     })()
  //     if (!requests) {
  //       throw new Error(`Request is unknown: ${JSON.stringify(command.input)}`)
  //     }
  //     requestItems[tableName] = (requestItems[tableName] ?? []).concat(requests)
  //     return requestItems
  //   }, {} as BatchWriteCommandInput['RequestItems'])
  // }
}

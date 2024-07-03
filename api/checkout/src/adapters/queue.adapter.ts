import { SendMessageBatchCommand, SQSClient } from '@aws-sdk/client-sqs'
import { chunk } from '../chunk'
import { Environment } from '../environment'
import { Order } from '../types/order'
import { ImportOrderQueueRequest } from './queue.gateway'

export class QueueAdapter implements ImportOrderQueueRequest {
  private static BatchLimit = 10

  constructor(private readonly client: SQSClient) {}

  async requestImportOrder(orders: Order[]): Promise<void> {
    if (orders.length == 0) {
      return
    }
    await Promise.all(
      chunk(orders, QueueAdapter.BatchLimit).map((batch) =>
        this.client.send(
          new SendMessageBatchCommand({
            QueueUrl: Environment.ImportOrderQueue(),
            Entries: batch.map((order) => ({ Id: order.id, MessageBody: JSON.stringify(order) })),
          })
        )
      )
    )
  }
}

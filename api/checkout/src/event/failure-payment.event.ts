import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { v4 as uuid } from 'uuid'
import { saveOrdersRequest } from '../dynamodb'
import { Event } from '../event'
import { EventStore } from '../event-store'
import { Order } from '../order'

export interface FailurePaymentEvent extends Omit<Event, 'data'> {
  data: { orders: Order[]; paymentIntentId: string }
}

export const processFailurePaymentEvent = (
  dynamodb: DynamoDBDocumentClient,
  data: { orders: Order[]; paymentIntentId: string }
) => {
  const event: FailurePaymentEvent = {
    id: uuid(),
    name: 'FailurePayment',
    time: new Date(),
    data: { orders: data.orders, paymentIntentId: data.paymentIntentId },
    process: () => [saveOrdersRequest(data.orders)],
  }
  const eventStore = new EventStore(dynamodb)
  return eventStore.process([event])
}

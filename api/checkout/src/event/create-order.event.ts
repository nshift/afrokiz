import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { v4 as uuid } from 'uuid'
import { saveOrdersRequest } from '../dynamodb'
import { Event } from '../event'
import { EventStore } from '../event-store'
import { Order } from '../order'

export interface CreateOrderEvent extends Omit<Event, 'data'> {
  data: { order: Order }
}

export const processCreateOrderEvent = (dynamodb: DynamoDBDocumentClient, order: Order) => {
  const event: CreateOrderEvent = {
    id: uuid(),
    name: 'CreateOrder',
    time: new Date(),
    data: { order },
    process: () => [saveOrdersRequest([order])],
  }
  const eventStore = new EventStore(dynamodb)
  return eventStore.process([event])
}

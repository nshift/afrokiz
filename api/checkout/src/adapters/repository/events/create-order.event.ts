import { BatchWriteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { Environment } from '../../../environment'
import { DateGenerator } from '../../date.generator'
import { UUIDGenerator } from '../../uuid.generator'
import { EventStore } from '../event-store'
import { Event } from './event'

export type CreateOrder = {
  id: string
  email: string
  fullname: string
  dancerType: 'leader' | 'follower' | 'couple'
  passId: string
  date: Date
  promoCode?: string
  paymentIntentId: string
  paymentStatus: 'pending' | 'success' | 'failed'
  items: {
    id: string
    title: string
    includes: string[]
    amount: number
    total: { amount: number; currency: 'USD' | 'EUR' | 'THB' }
  }[]
}

export interface CreateOrderEvent
  extends Event<{
    order: CreateOrder
  }> {}

const saveOrdersRequest = (orders: CreateOrder[]) =>
  new BatchWriteCommand({
    RequestItems: {
      [Environment.OrderTableName()]: orders.map((order) => ({
        PutRequest: {
          Item: {
            id: order.id,
            paymentIntentId: order.paymentIntentId,
            paymentStatus: order.paymentStatus,
            dancerType: order.dancerType,
            email: order.email,
            fullname: order.fullname,
            passId: order.passId,
            date: order.date.toISOString(),
            promoCode: order.promoCode,
            items: order.items.map((item) => ({
              id: item.id,
              title: item.title,
              includes: item.includes,
              amount: item.amount,
              total: { amount: item.total.amount, currency: item.total.currency },
            })),
          },
        },
      })),
    },
  })

export const createOrderEvent = (event: Omit<CreateOrderEvent, 'process'>): CreateOrderEvent => ({
  ...event,
  process: () => [saveOrdersRequest([event.data.order])],
})

export const processCreateOrderEvent = async (
  dynamodb: DynamoDBDocumentClient,
  uuidGenerator: UUIDGenerator,
  dateGenerator: DateGenerator,
  order: CreateOrder
): Promise<CreateOrderEvent> => {
  const event: CreateOrderEvent = createOrderEvent({
    id: uuidGenerator.generate(),
    name: 'CreateOrder',
    time: dateGenerator.today(),
    data: { order },
  })
  const eventStore = new EventStore(dynamodb)
  await eventStore.process([event])
  return event
}

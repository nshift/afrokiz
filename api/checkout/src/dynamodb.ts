import { BatchWriteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { Environment } from './environment'
import { Event } from './event'
import { Order } from './order'

export const saveEventRequest = (event: Event) =>
  new PutCommand({
    TableName: Environment.EventTableName(),
    Item: {
      id: event.id,
      name: event.name,
      time: event.time.toISOString(),
      data: JSON.parse(
        JSON.stringify(event.data, function (key, value) {
          if (this[key] instanceof Date) {
            return this[key].toISOString()
          }
          if (this[key] === null) {
            return undefined
          }
          return value
        })
      ),
    },
  })

export const getOrderByIdRequest = (id: string) =>
  new QueryCommand({
    TableName: Environment.OrderTableName(),
    KeyConditionExpression: '#id = :id',
    ExpressionAttributeNames: { '#id': 'id' },
    ExpressionAttributeValues: { ':id': id },
  })

export const getOrderByPaymentIntentIdRequest = (paymentIntentId: string) =>
  new QueryCommand({
    TableName: Environment.OrderTableName(),
    IndexName: 'PaymentIntentLookup',
    KeyConditionExpression: '#paymentIntentId = :paymentIntentId',
    ExpressionAttributeNames: { '#paymentIntentId': 'paymentIntentId' },
    ExpressionAttributeValues: { ':paymentIntentId': paymentIntentId },
  })

export const saveOrdersRequest = (orders: Order[]) =>
  new BatchWriteCommand({
    RequestItems: {
      [Environment.OrderTableName()]: orders.map((order) => ({
        PutRequest: {
          Item: {
            id: order.id,
            paymentIntentId: order.paymentIntentId,
            paymentStatus: order.paymentStatus,
            email: order.email,
            fullname: order.fullname,
            passId: order.passId,
            date: order.date.toISOString(),
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

export const orderResponse = (response: any): Order[] =>
  response?.map(
    (item: any): Order => ({
      id: item.id,
      paymentIntentId: item.paymentIntentId,
      paymentStatus: item.paymentStatus,
      email: item.email,
      fullname: item.fullname,
      passId: item.passId,
      date: new Date(item.date),
      items: item.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        includes: item.includes,
        amount: item.amount,
        total: { amount: item.total.amount, currency: item.total.currency },
      })),
    })
  ) ?? []

import { BatchWriteCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { Environment } from '../../environment'
import { Currency } from '../../types/currency'
import { Customer } from '../../types/customer'
import { Order } from '../../types/order'
import { PaymentStatus } from '../../types/payment'
import { PaymentIntent } from '../../types/payment-intent'
import { Event } from './events/event'
import { proceedToCheckoutEvent } from './events/proceed-to-checkout.event'
import { updatePaymentStatusEvent } from './events/update-payment-status.event'

export const saveEventRequest = (event: Event<any>) =>
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

export const saveEventsRequest = (events: Event<any>[]) =>
  new BatchWriteCommand({
    RequestItems: {
      [Environment.EventTableName()]: events.map((event) => ({
        PutRequest: {
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
        },
      })),
    },
  })

export const deleteEventsRequest = (ids: string[]) =>
  new BatchWriteCommand({
    RequestItems: {
      [Environment.EventTableName()]: ids.map((id) => ({ DeleteRequest: { Key: { id } } })),
    },
  })

export const eventResponse = (response: any[] | undefined): Event<any>[] =>
  response?.map((item: any): Event<any> => {
    const events: { [key: string]: (event: Omit<Event<any>, 'process'>) => Event<any> } = {
      UpdatePaymentStatus: updatePaymentStatusEvent,
      ProceedToCheckout: proceedToCheckoutEvent,
    }
    const event = {
      id: item.id,
      name: item.name,
      time: new Date(item.time),
      data: JSON.parse(JSON.stringify(item.data), (key, value) => {
        return (key == 'date' || key == 'time') && typeof value === 'string' && !isNaN(Date.parse(value))
          ? new Date(value)
          : value
      }),
      process: () => [],
    }
    return events[item.name as string]?.(event) ?? event
  }) ?? []

export const getEventFromRangeRequest = (from: Date, to: Date) =>
  new ScanCommand({
    TableName: Environment.EventTableName(),
    IndexName: 'TimeLookup',
    FilterExpression: '#time BETWEEN :from AND :to',
    ExpressionAttributeNames: { '#time': 'time' },
    ExpressionAttributeValues: { ':from': from.toISOString(), ':to': to.toISOString() },
  })

export const getOrderByIdRequest = (id: string) =>
  new QueryCommand({
    TableName: Environment.OrderTableName(),
    KeyConditionExpression: '#id = :id',
    ExpressionAttributeNames: { '#id': 'id' },
    ExpressionAttributeValues: { ':id': id },
  })

export type OrderSchema = {
  order: Order
  customer: Customer
  promoCode: string | undefined
  payment: { status: PaymentStatus; intent: PaymentIntent }
}

export const saveOrdersRequest = (orders: OrderSchema[]) =>
  new BatchWriteCommand({
    RequestItems: {
      [Environment.OrderTableName()]: orders.map(({ order, customer, payment, promoCode }) => ({
        PutRequest: {
          Item: {
            id: order.id,
            customer: {
              email: customer.email,
              fullname: customer.fullname,
              type: customer.type,
            },
            payment: {
              status: payment.status,
              intent: {
                id: payment.intent.id,
                secret: payment.intent.secret,
              },
            },
            date: order.date.toISOString(),
            promoCode: promoCode ?? null,
            items: order.items.map((item) => ({
              id: item.id,
              title: item.title,
              includes: item.includes,
              amount: item.amount,
              total: { amount: item.total.amount, currency: item.total.currency },
            })),
            total: { amount: order.total.amount, currency: order.total.currency },
          },
        },
      })),
    },
  })

export const orderResponse = (response: any): OrderSchema[] =>
  response?.map(
    (item: any): OrderSchema => ({
      order: {
        id: item.id,
        date: new Date(item.date),
        total: { amount: item.total.amount, currency: item.total.currency },
        items: item.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          includes: item.includes,
          amount: item.amount,
          total: { amount: item.total.amount, currency: item.total.currency },
        })),
      },
      customer: {
        email: item.customer.email,
        fullname: item.customer.fullname,
        type: item.customer.type,
      },
      payment: {
        status: item.payment.status,
        intent: {
          id: item.payment.intent.id,
          secret: item.payment.intent.secret,
        },
      },
      promoCode: item.promoCode,
    })
  ) ?? []

export const updatePaymentOrdersRequest = (data: { orderId: string; paymentStatus: PaymentStatus }) =>
  new UpdateCommand({
    TableName: Environment.OrderTableName(),
    Key: { id: data.orderId },
    UpdateExpression: 'SET payment.#status = :status',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':status': data.paymentStatus },
  })

export type SaleSchema = {
  id: string
  date: Date
  orderId: string
  promoCode?: string
  customer: Customer
  passId: string
  items: {
    id: string
    title: string
    includes: string[]
    amount: number
  }[]
  total: { amount: number; currency: Currency }
}

export const saveSalesRequest = (sales: SaleSchema[]) =>
  new BatchWriteCommand({
    RequestItems: {
      [Environment.SalesTableName()]: sales.map((sale) => ({
        PutRequest: {
          Item: {
            id: sale.id,
            orderId: sale.orderId,
            passId: sale.passId,
            customer: {
              email: sale.customer.email,
              fullname: sale.customer.fullname,
              type: sale.customer.type,
            },
            date: sale.date.toISOString(),
            promoCode: sale.promoCode ?? null,
            items: sale.items.map((item) => ({
              id: item.id,
              title: item.title,
              includes: item.includes,
              amount: item.amount,
            })),
            total: { amount: sale.total.amount, currency: sale.total.currency },
          },
        },
      })),
    },
  })

export const getAllSalesRequest = () => new ScanCommand({ TableName: Environment.SalesTableName() })

export const salesResponse = (response: any): SaleSchema[] =>
  response?.map(
    (item: any): SaleSchema => ({
      id: item.id,
      orderId: item.orderId,
      date: new Date(item.date),
      passId: item.passId,
      customer: {
        email: item.customer.email,
        fullname: item.customer.fullname,
        type: item.customer.type,
      },
      promoCode: item.promoCode ?? undefined,
      total: { amount: item.total.amount, currency: item.total.currency },
      items: item.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        includes: item.includes,
        amount: item.amount,
      })),
    })
  ) ?? []

// export const getOrderByPaymentIntentIdRequest = (paymentIntentId: string) =>
//   new QueryCommand({
//     TableName: Environment.OrderTableName(),
//     IndexName: 'PaymentIntentLookup',
//     KeyConditionExpression: '#paymentIntentId = :paymentIntentId',
//     ExpressionAttributeNames: { '#paymentIntentId': 'paymentIntentId' },
//     ExpressionAttributeValues: { ':paymentIntentId': paymentIntentId },
//   })

// export const saveOrdersRequest = (orders: Order[]) =>
//   new BatchWriteCommand({
//     RequestItems: {
//       [Environment.OrderTableName()]: orders.map((order) => ({
//         PutRequest: {
//           Item: {
//             id: order.id,
//             // paymentIntentId: order.paymentIntentId,
//             // paymentStatus: order.paymentStatus,
//             // dancerType: order.dancerType,
//             // email: order.email,
//             // fullname: order.fullname,
//             // passId: order.passId,
//             date: order.date.toISOString(),
//             // promoCode: order.promoCode,
//             items: order.items.map((item) => ({
//               id: item.id,
//               title: item.title,
//               includes: item.includes,
//               amount: item.amount,
//               total: { amount: item.total.amount, currency: item.total.currency },
//             })),
//           },
//         },
//       })),
//     },
//   })

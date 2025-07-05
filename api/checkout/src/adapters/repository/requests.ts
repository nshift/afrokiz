import {
  BatchGetCommand,
  BatchWriteCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { Environment } from '../../environment'
import { Currency } from '../../types/currency'
import { Customer } from '../../types/customer'
import { InstallmentFrequency } from '../../types/installment'
import { ImportOrder, Order } from '../../types/order'
import { isInstallment, Payment, PaymentStatus } from '../../types/payment'
import { Sales } from '../../types/sales'
import { Event } from './events/event'
import { proceedToCheckoutEvent as proceedToCheckoutEventV1 } from './events/proceed-to-checkout.event'
import { proceedToCheckoutEvent } from './events/proceed-to-checkout.event.v2'
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
      ProceedToCheckout: proceedToCheckoutEventV1,
      ProceedToCheckoutV2: proceedToCheckoutEvent,
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

export type PaymentDueDateSchema = {
  amount: number
  currency: Currency
  dueDate: Date
  status: PaymentStatus
  paymentId: string
}

export type InstallmentPaymentSchema = {
  principalAmount: number
  currency: Currency
  frequency: InstallmentFrequency
  term: number
  dueDates: PaymentDueDateSchema[]
}

export type DirectPaymentSchema = {
  amount: number
  currency: Currency
  status: PaymentStatus
  paymentId: string
}

export type PaymentStructureSchema = DirectPaymentSchema | InstallmentPaymentSchema

export type OrderSchema = {
  order: Order
  customer: Customer
  promoCode: string | null
  paymentStructures: PaymentStructureSchema[]
  checkedIn: boolean
}

export const updateOrderStatusRequest = (orderId: string, status: Order['status']) =>
  new UpdateCommand({
    TableName: Environment.OrderTableName(),
    Key: { id: orderId },
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':status': status },
  })

export const updateOrderPaymentStatusRequest = (orderId: string, paymentStructures: PaymentStructureSchema[]) =>
  new UpdateCommand({
    TableName: Environment.OrderTableName(),
    Key: { id: orderId },
    UpdateExpression: 'SET #paymentStructures = :paymentStructures',
    ExpressionAttributeNames: { '#paymentStructures': 'paymentStructures' },
    ExpressionAttributeValues: {
      ':paymentStructures': paymentStructures.map((paymentStructure) =>
        isInstallment(paymentStructure)
          ? {
              principalAmount: paymentStructure.principalAmount,
              currency: paymentStructure.currency,
              frequency: paymentStructure.frequency,
              term: paymentStructure.term,
              dueDates: paymentStructure.dueDates.map((dueDate) => ({
                amount: dueDate.amount,
                currency: dueDate.currency,
                dueDate: dueDate.dueDate.toISOString(),
                status: dueDate.status,
                paymentId: dueDate.paymentId,
              })),
            }
          : {
              amount: paymentStructure.amount,
              currency: paymentStructure.currency,
              status: paymentStructure.status,
              paymentId: paymentStructure.paymentId,
            }
      ),
    },
  })

export const saveOrdersRequest = (orders: OrderSchema[]) => {
  return new BatchWriteCommand({
    RequestItems: {
      [Environment.OrderTableName()]: orders.map(({ order, customer, paymentStructures, promoCode }) => ({
        PutRequest: {
          Item: {
            id: order.id,
            status: order.status,
            customer: {
              email: customer.email,
              fullname: customer.fullname,
              type: customer.type,
            },
            paymentStructures: paymentStructures.map((paymentStructure) =>
              isInstallment(paymentStructure)
                ? {
                    principalAmount: paymentStructure.principalAmount,
                    currency: paymentStructure.currency,
                    frequency: paymentStructure.frequency,
                    term: paymentStructure.term,
                    dueDates: paymentStructure.dueDates.map((dueDate) => ({
                      amount: dueDate.amount,
                      currency: dueDate.currency,
                      dueDate: dueDate.dueDate.toISOString(),
                      status: dueDate.status,
                      paymentId: dueDate.paymentId,
                    })),
                  }
                : {
                    amount: paymentStructure.amount,
                    currency: paymentStructure.currency,
                    status: paymentStructure.status,
                    paymentId: paymentStructure.paymentId,
                  }
            ),
            date: order.date.toISOString(),
            promoCode: promoCode ?? null,
            items: order.items.map((item) => ({
              id: item.id,
              title: item.title,
              includes: item.includes ?? [],
              amount: item.amount,
              total: { amount: item.total.amount, currency: item.total.currency },
            })),
            total: { amount: order.total.amount, currency: order.total.currency },
          },
        },
      })),
    },
  })
}

export const orderResponse = (response: any): OrderSchema[] =>
  response?.map((item: any): OrderSchema => {
    if (item.email) return orderV1Response(item)
    else if (item.payment) return orderV2Response(item)
    else return orderV3Response(item)
  })

export const orderV3Response = (item: any): OrderSchema => ({
  order: {
    id: item.id,
    status: item.status,
    date: new Date(item.date),
    total: { amount: item.total.amount, currency: item.total.currency },
    items: item.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      includes: item.includes ?? [],
      amount: item.amount,
      total: { amount: item.total.amount, currency: item.total.currency },
    })),
  },
  customer: {
    email: item.customer.email,
    fullname: item.customer.fullname,
    type: item.customer.type,
  },
  paymentStructures:
    item.paymentStructures?.map((paymentStructure: any) =>
      isInstallment(paymentStructure)
        ? {
            principalAmount: paymentStructure.principalAmount,
            currency: paymentStructure.currency,
            frequency: paymentStructure.frequency,
            term: paymentStructure.term,
            dueDates: paymentStructure.dueDates.map((dueDate: any) => ({
              amount: dueDate.amount,
              currency: dueDate.currency,
              dueDate: new Date(dueDate.dueDate),
              status: dueDate.status,
              paymentId: dueDate.paymentId,
            })),
          }
        : {
            amount: paymentStructure.amount,
            currency: paymentStructure.currency,
            status: paymentStructure.status,
            paymentId: paymentStructure.paymentId,
          }
    ) ?? [],
  promoCode: item.promoCode,
  checkedIn: item.checkedIn ?? false,
})

export const orderV2Response = (item: any): OrderSchema => ({
  order: {
    id: item.id,
    status: item.payment.status == 'success' ? 'paid' : 'pending',
    date: new Date(item.date),
    total: { amount: item.total.amount, currency: item.total.currency },
    items: item.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      includes: item.includes ?? [],
      amount: item.amount,
      total: { amount: item.total.amount, currency: item.total.currency },
    })),
  },
  customer: {
    email: item.customer.email,
    fullname: item.customer.fullname,
    type: item.customer.type,
  },
  paymentStructures: [
    {
      amount: item.total.amount,
      currency: item.total.currency,
      status: item.payment.status,
      paymentId: '',
    },
  ],
  promoCode: item.promoCode,
  checkedIn: item.checkedIn ?? false,
})

export const orderV1Response = (item: any): OrderSchema => ({
  order: {
    id: item.id,
    status: item.payment.status == 'success' ? 'paid' : 'pending',
    date: new Date(item.date),
    total: {
      amount: item.items.reduce((total: number, item: any) => (total += item.total.amount), 0),
      currency: item.items[0].total.currency,
    },
    items: item.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      includes: item.includes ?? [],
      amount: item.amount,
      total: { amount: item.total.amount, currency: item.total.currency },
    })),
  },
  customer: {
    email: item.email,
    fullname: item.fullname,
    type: item.dancerType,
  },
  paymentStructures: [
    {
      amount: item.total.amount,
      currency: item.total.currency,
      status: item.paymentStatus,
      paymentId: '',
    },
  ],
  promoCode: item.promoCode,
  checkedIn: item.checkedIn ?? false,
})

export const updatePaymentOrdersRequest = (data: { orderId: string; paymentStatus: PaymentStatus }) =>
  new UpdateCommand({
    TableName: Environment.OrderTableName(),
    Key: { id: data.orderId },
    UpdateExpression: 'SET payment.#status = :status',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':status': data.paymentStatus },
  })

export type PaymentSchema = {
  id: string
  orderId: string
  amount: number
  currency: string
  dueDate?: Date
  status: string
  stripeCustomerId: string
  stripePaymentIntentId: string | null
  stripePaymentIntentSecret: string | null
}

export const savePaymentsRequest = (payments: PaymentSchema[]) =>
  new BatchWriteCommand({
    RequestItems: {
      [Environment.PaymentTableName()]: payments.map((payment) => ({
        PutRequest: {
          Item: {
            id: payment.id,
            orderId: payment.orderId,
            amount: payment.amount,
            currency: payment.currency,
            dueDate: payment.dueDate ? payment.dueDate.toISOString() : null,
            status: payment.status,
            stripeCustomerId: payment.stripeCustomerId,
            stripePaymentIntentId: payment.stripePaymentIntentId ?? undefined,
            stripePaymentIntentSecret: payment.stripePaymentIntentSecret ?? null,
          },
        },
      })),
    },
  })

export const getPendingPaymentsRequest = () =>
  new QueryCommand({
    TableName: Environment.PaymentTableName(),
    IndexName: 'PaymentStatus',
    KeyConditionExpression: '#status = :status',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':status': 'pending' },
  })

export const getPaymentByStripeIdRequest = (stripeId: string) =>
  new QueryCommand({
    TableName: Environment.PaymentTableName(),
    IndexName: 'PaymentIntentId',
    KeyConditionExpression: '#stripeId = :stripeId',
    ExpressionAttributeNames: { '#stripeId': 'stripePaymentIntentId' },
    ExpressionAttributeValues: { ':stripeId': stripeId },
  })

export const updatePaymentStatusRequest = (data: { paymentId: string; paymentStatus: PaymentStatus }) => {
  return new UpdateCommand({
    TableName: Environment.PaymentTableName(),
    Key: { id: data.paymentId },
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':status': data.paymentStatus },
  })
}

export const savePaymentRequest = (payment: Payment) =>
  new PutCommand({
    TableName: Environment.PaymentTableName(),
    Item: {
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      dueDate: payment.dueDate ? payment.dueDate.toISOString() : null,
      status: payment.status,
      stripeCustomerId: payment.stripe.customerId,
      stripePaymentIntentId: payment.stripe.id ?? undefined,
      stripePaymentIntentSecret: payment.stripe.secret ?? null,
    },
  })

export const paymentsResponse = (response: any): PaymentSchema[] =>
  response?.map((item: any) => paymentResponse(item)) ?? []

const paymentResponse = (item: any): PaymentSchema => ({
  id: item.id,
  orderId: item.orderId,
  amount: item.amount,
  currency: item.currency,
  dueDate: item.dueDate ? new Date(item.dueDate) : item.dueDate,
  status: item.status,
  stripeCustomerId: item.stripeCustomerId,
  stripePaymentIntentId: item.stripePaymentIntentId ?? null,
  stripePaymentIntentSecret: item.stripePaymentIntentSecret ?? null,
})

export type SaleSchema = {
  id: string
  date: Date
  orderId: string
  promoCode: string | null
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
              includes: item.includes ?? [],
              amount: item.amount,
            })),
            total: { amount: sale.total.amount, currency: sale.total.currency },
          },
        },
      })),
    },
  })

export const updateSalesCampaignRequest = (orderId: string, campaignName: string) =>
  new UpdateCommand({
    TableName: Environment.OrderTableName(),
    Key: { id: orderId },
    UpdateExpression: 'SET #campaignName = :status',
    ExpressionAttributeNames: { '#campaignName': campaignName },
    ExpressionAttributeValues: { ':status': 'sent' },
  })

export const getAllSalesRequest = () => new ScanCommand({ TableName: Environment.SalesTableName() })

export const listOrdersWithoutCampaignRequest = (campaignName: string) =>
  new ScanCommand({
    TableName: Environment.OrderTableName(),
    FilterExpression: `attribute_not_exists(${campaignName})`,
  })

export const listDinnerCruiseCampaignOrdersRequest = (campaignName: string) =>
  new ScanCommand({
    TableName: Environment.OrderTableName(),
    FilterExpression: `attribute_not_exists(${campaignName})`,
  })

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
        includes: item.includes ?? [],
        amount: item.amount,
      })),
    })
  ) ?? []

export const listOrdersResponse = (response: any): Sales[] =>
  response?.map(
    (item: any): Sales => ({
      id: item.id,
      date: new Date(item.date),
      email: item.customer?.email ?? item.email,
      fullname: item.customer?.fullname ?? item.fullname,
      pass: item.items[0]?.id ?? '',
      promoCode: item.promoCode,
      customerType: item.customer?.type ?? item.dancerType,
      items: item.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        includes: item.includes ?? [],
        amount: item.amount,
        total: { amount: item.total.amount, currency: item.total.currency },
      })),
      paymentStatus: item.paymentStatus ?? item.payment?.status,
      total: {
        amount: item.items.reduce((total: number, item: any) => (total += item.total.amount), 0),
        currency: item.items[0].total.currency,
      },
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

export type ImportOrderSchema = {
  fingerprint: string
  orderId: string
}

export const getImportOrdersByFingerprintsRequest = (fingerprints: string[]) =>
  new BatchGetCommand({
    RequestItems: {
      [Environment.ImportOrderTableName()]: {
        Keys: fingerprints.map((fingerprint) => ({ fingerprint })),
      },
    },
  })

export const saveImportOrdersRequest = (orders: ImportOrderSchema[]) =>
  new BatchWriteCommand({
    RequestItems: {
      [Environment.ImportOrderTableName()]: orders.map((order) => ({
        PutRequest: {
          Item: {
            fingerprint: order.fingerprint,
            orderId: order.orderId,
          },
        },
      })),
    },
  })

export const importOrdersResponse = (response: any): ImportOrder[] =>
  response?.map((item: any): ImportOrder => ({ fingerprint: item.fingerprint, orderId: item.orderId })) ?? []

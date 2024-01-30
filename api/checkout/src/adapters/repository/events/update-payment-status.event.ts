import { BatchWriteCommand, DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { Customer } from '../../../types/customer'
import { Order } from '../../../types/order'
import { PaymentStatus } from '../../../types/payment'
import { DateGenerator } from '../../date.generator'
import { UUIDGenerator } from '../../uuid.generator'
import { EventStore } from '../event-store'
import { SaleSchema, saveSalesRequest, updatePaymentOrdersRequest } from '../requests'
import { Event } from './event'

export type UpdatePaymentStatusEventInput = {
  order: Order
  customer: Customer
  promoCode?: string
  paymentStatus: PaymentStatus
}

export type UpdatePaymentStatusEventData = {
  sales?: SaleSchema
  orderId: string
  paymentStatus: PaymentStatus
}

export interface UpdatePaymentStatusEvent extends Event<UpdatePaymentStatusEventData> {}

export const updatePaymentStatusEvent = (
  event: Omit<UpdatePaymentStatusEvent, 'process'>
): UpdatePaymentStatusEvent => {
  const requests: (UpdateCommand | BatchWriteCommand)[] = [
    updatePaymentOrdersRequest({ orderId: event.data.orderId, paymentStatus: event.data.paymentStatus }),
  ]
  if (event.data.sales) {
    requests.push(saveSalesRequest([event.data.sales]))
  }
  return {
    ...event,
    process: () => requests,
  }
}

export const processUpdatePaymentStatusEvent = async (
  dynamodb: DynamoDBDocumentClient,
  uuidGenerator: UUIDGenerator,
  dateGenerator: DateGenerator,
  data: UpdatePaymentStatusEventInput
): Promise<UpdatePaymentStatusEvent> => {
  const sales = mapToSale(data, dateGenerator, uuidGenerator)
  const event = updatePaymentStatusEvent({
    id: uuidGenerator.generate(),
    name: 'UpdatePaymentStatus',
    time: dateGenerator.today(),
    data: {
      sales: data.paymentStatus == 'success' ? sales : undefined,
      orderId: data.order.id,
      paymentStatus: data.paymentStatus,
    },
  })
  const eventStore = new EventStore(dynamodb)
  await eventStore.process([event])
  return event
}

const mapToSale = (
  { order, promoCode, customer }: UpdatePaymentStatusEventInput,
  dateGenerator: DateGenerator,
  uuidGenerator: UUIDGenerator
) => ({
  id: uuidGenerator.generate(),
  orderId: order.id,
  date: dateGenerator.today(),
  promoCode,
  customer: customer,
  passId: order.items[0].id,
  items: order.items.map((item) => ({
    id: item.id,
    title: item.title,
    includes: item.includes,
    amount: item.amount,
  })),
  total: { amount: order.total.amount, currency: order.total.currency },
})

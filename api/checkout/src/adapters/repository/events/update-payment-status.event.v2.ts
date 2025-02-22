import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { Order } from '../../../types/order'
import { isInstallment, PaymentStatus } from '../../../types/payment'
import { DateGenerator } from '../../date.generator'
import { UUIDGenerator } from '../../uuid.generator'
import { EventStore } from '../event-store'
import {
  getOrderByIdRequest,
  orderResponse,
  updateOrderPaymentStatusRequest,
  updateOrderStatusRequest,
  updatePaymentStatusRequest,
} from '../requests'
import { Event } from './event'

export type UpdatePaymentStatusEventInput = {
  payment: { id: string; status: PaymentStatus }
  order: { id: string }
}

export type UpdatePaymentStatusEventData = {
  paymentId: string
  paymentStatus: PaymentStatus
  orderId: string
}

export interface UpdatePaymentStatusEvent extends Event<UpdatePaymentStatusEventData> {}

export const updatePaymentStatusEvent = (
  event: Omit<UpdatePaymentStatusEvent, 'process'>
): UpdatePaymentStatusEvent => ({
  ...event,
  process: async (dynamodb: DynamoDBDocumentClient) =>
    [updatePaymentStatusRequest({ paymentId: event.data.paymentId, paymentStatus: event.data.paymentStatus })].concat(
      await updateOrder(
        { orderId: event.data.orderId, paymentId: event.data.paymentId, paymentStatus: event.data.paymentStatus },
        dynamodb
      )
    ),
})

export const processUpdatePaymentStatusEvent = async (
  dynamodb: DynamoDBDocumentClient,
  uuidGenerator: UUIDGenerator,
  dateGenerator: DateGenerator,
  data: UpdatePaymentStatusEventInput
): Promise<UpdatePaymentStatusEvent> => {
  const event = updatePaymentStatusEvent({
    id: uuidGenerator.generate(),
    name: 'UpdatePaymentStatusV2',
    time: dateGenerator.today(),
    data: {
      orderId: data.order.id,
      paymentId: data.payment.id,
      paymentStatus: data.payment.status,
    },
  })
  const eventStore = new EventStore(dynamodb)
  await eventStore.process([event])
  return event
}

const updateOrder = async (
  data: { orderId: string; paymentId: string; paymentStatus: PaymentStatus },
  dynamodb: DynamoDBDocumentClient
) => {
  let getOrderByIdResponse = await dynamodb.send(getOrderByIdRequest(data.orderId))
  let orders = orderResponse(getOrderByIdResponse.Items)
  let order = orders[0]
  if (!order) {
    return []
  }
  let paymentStructures = order.paymentStructures.map((paymentStructure) => {
    if (isInstallment(paymentStructure)) {
      return {
        ...paymentStructure,
        dueDates: paymentStructure.dueDates.map((dueDate) =>
          dueDate.paymentId == data.paymentId ? { ...dueDate, status: data.paymentStatus } : dueDate
        ),
      }
    } else {
      return paymentStructure.paymentId == data.paymentId
        ? { ...paymentStructure, status: data.paymentStatus }
        : paymentStructure
    }
  })
  let isOrderCompleted = paymentStructures.every((paymentStructure) =>
    isInstallment(paymentStructure)
      ? paymentStructure.dueDates.every((dueDate) => dueDate.status == 'completed')
      : paymentStructure.status == 'completed'
  )
  let isOrderPartialyPaid = paymentStructures.every((paymentStructure) =>
    isInstallment(paymentStructure) ? paymentStructure.dueDates[0].status == 'completed' : false
  )
  let orderStatus: Order['status'] = isOrderCompleted ? 'paid' : isOrderPartialyPaid ? 'partially-paid' : 'pending'
  return [
    updateOrderPaymentStatusRequest(data.orderId, paymentStructures),
    updateOrderStatusRequest(data.orderId, orderStatus),
  ]
}

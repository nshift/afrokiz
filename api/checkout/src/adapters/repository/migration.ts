import { calculateOrderTotal } from '../../checkout.rules'
import { UUIDGenerator } from '../uuid.generator'
import { CreateOrderEvent } from './events/create-order.event'
import { FailurePaymentEvent } from './events/failure-payment.event'
import { ProceedToCheckoutEvent, proceedToCheckoutEvent } from './events/proceed-to-checkout.event.v2'
import { SuccessfulPaymentEvent } from './events/successful-payment.event'
import { UpdatePaymentStatusEvent, updatePaymentStatusEvent } from './events/update-payment-status.event'

export const transformCreateOrderEvent = (
  event: CreateOrderEvent,
  uuidGenerator: UUIDGenerator
): ProceedToCheckoutEvent => {
  const total = calculateOrderTotal(event.data.order.items)
  return proceedToCheckoutEvent({
    id: event.id,
    name: 'ProceedToCheckoutV2',
    time: event.time,
    data: {
      checkout: {
        order: {
          id: event.data.order.id,
          status: 'unknown',
          date: event.data.order.date,
          items: event.data.order.items.map((item) => ({
            id: item.id,
            title: item.title,
            includes: item.includes,
            amount: item.amount,
            total: { amount: item.total.amount, currency: item.total.currency },
          })),
          total: { amount: total.amount, currency: total.currency },
        },
        customer: {
          email: event.data.order.email,
          fullname: event.data.order.fullname,
          type: event.data.order.dancerType,
        },
        promoCode: event.data.order.promoCode,
        paymentStructures: [
          {
            amount: total.amount,
            currency: total.currency,
            status: event.data.order.paymentStatus,
            paymentId: '',
          },
        ],
        checkedIn: false,
      },
      payments: [
        {
          id: uuidGenerator.generate(),
          orderId: event.data.order.id,
          amount: total.amount,
          currency: total.currency,
          status: event.data.order.paymentStatus,
          stripeCustomerId: '',
          stripePaymentIntentId: event.data.order.paymentIntentId,
          stripePaymentIntentSecret: '',
        },
      ],
    },
  })
}

export const transformSuccessfulPaymentEvent = (
  event: SuccessfulPaymentEvent,
  uuidGenerator: UUIDGenerator
): UpdatePaymentStatusEvent => {
  const order = event.data.orders[0]
  const total = calculateOrderTotal(order.items)
  return updatePaymentStatusEvent({
    id: event.id,
    name: 'UpdatePaymentStatus',
    time: event.time,
    data: {
      sales: {
        id: uuidGenerator.generate(),
        date: event.time,
        orderId: order.id,
        promoCode: order.promoCode,
        customer: {
          email: order.email,
          fullname: order.fullname,
          type: order.dancerType,
        },
        passId: order.items[0].id,
        items: order.items.map((item) => ({
          id: item.id,
          title: item.title,
          includes: item.includes,
          amount: item.amount,
        })),
        total: { amount: total.amount, currency: total.currency },
      },
      orderId: order.id,
      paymentStatus: 'completed',
    },
  })
}

export const transformFailedPaymentEvent = (event: FailurePaymentEvent): UpdatePaymentStatusEvent => {
  const order = event.data.orders[0]
  return updatePaymentStatusEvent({
    id: event.id,
    name: 'UpdatePaymentStatus',
    time: event.time,
    data: {
      orderId: order.id,
      paymentStatus: 'failed',
    },
  })
}

import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { Currency } from '../../../types/currency'
import { Customer } from '../../../types/customer'
import { Order } from '../../../types/order'
import { PaymentStatus } from '../../../types/payment'
import { PaymentIntent } from '../../../types/payment-intent'
import { DateGenerator } from '../../date.generator'
import { UUIDGenerator } from '../../uuid.generator'
import { EventStore } from '../event-store'
import { saveOrdersRequest } from '../requests'
import { Event } from './event'

type Checkout = {
  order: Order
  total: { amount: number; currency: Currency }
  customer: Customer
  promoCode: string | null
  payment: { status: PaymentStatus; intent: PaymentIntent | null }
  checkedIn: boolean
}

export interface ProceedToCheckoutEvent extends Event<Checkout> {}

export const proceedToCheckoutEvent = (event: Omit<ProceedToCheckoutEvent, 'process'>): ProceedToCheckoutEvent => ({
  ...event,
  process: () => [saveOrdersRequest([mapToOrder(event.data)])],
})

export const processProceedToCheckoutEvent = async (
  dynamodb: DynamoDBDocumentClient,
  uuidGenerator: UUIDGenerator,
  dateGenerator: DateGenerator,
  checkout: Checkout
): Promise<ProceedToCheckoutEvent> => {
  const event = proceedToCheckoutEvent({
    id: uuidGenerator.generate(),
    name: 'ProceedToCheckout',
    time: dateGenerator.today(),
    data: checkout,
  })
  const eventStore = new EventStore(dynamodb)
  await eventStore.process([event])
  return event
}

export const mapToOrder = (
  checkout: Checkout
): {
  order: Order
  customer: Customer
  promoCode: string | null
  payment: { status: PaymentStatus; intent: PaymentIntent | null }
  checkedIn: boolean
} => ({
  order: checkout.order,
  customer: checkout.customer,
  promoCode: checkout.promoCode,
  payment: {
    status: checkout.payment.status,
    intent: checkout.payment.intent
      ? {
          id: checkout.payment.intent.id,
          secret: checkout.payment.intent.secret,
        }
      : null,
  },
  checkedIn: checkout.checkedIn,
})

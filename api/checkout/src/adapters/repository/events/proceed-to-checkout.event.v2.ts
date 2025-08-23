import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { Currency } from '../../../types/currency'
import { Customer } from '../../../types/customer'
import { Order } from '../../../types/order'
import { isInstallment, PaymentStatus, PaymentStructure } from '../../../types/payment'
import { PaymentIntent } from '../../../types/payment-intent'
import { DateGenerator } from '../../date.generator'
import { UUIDGenerator } from '../../uuid.generator'
import { EventStore } from '../event-store'
import { OrderSchema, PaymentSchema, PaymentStructureSchema, saveOrdersRequest, savePaymentsRequest } from '../requests'
import { Event } from './event'

type Checkout = {
  order: Order
  total: { amount: number; currency: Currency }
  customer: Customer
  promoCode: string | null
  payment: { status: PaymentStatus; intent: PaymentIntent | null; customer: { id: string } }
  paymentStructures: PaymentStructure[]
  checkedIn: boolean
}

export interface ProceedToCheckoutEvent extends Event<{ checkout: OrderSchema; payments: PaymentSchema[] }> {}

export const proceedToCheckoutEvent = (event: Omit<ProceedToCheckoutEvent, 'process'>): ProceedToCheckoutEvent => ({
  ...event,
  process: async () =>
    [saveOrdersRequest([event.data.checkout])].concat(
      event.data.payments.length > 0 ? [savePaymentsRequest(event.data.payments)] : []
    ),
})

export const processProceedToCheckoutEvent = async (
  dynamodb: DynamoDBDocumentClient,
  uuidGenerator: UUIDGenerator,
  dateGenerator: DateGenerator,
  checkout: Checkout
): Promise<ProceedToCheckoutEvent> => {
  let payments = mapToPayments(checkout)
  const event = proceedToCheckoutEvent({
    id: uuidGenerator.generate(),
    name: 'ProceedToCheckoutV2',
    time: dateGenerator.today(),
    data: { checkout: mapToOrder(checkout), payments },
  })
  const eventStore = new EventStore(dynamodb)
  await eventStore.process([event])
  return event
}

export const mapToOrder = (
  checkout: Checkout,
): {
  order: Order
  customer: Customer
  promoCode: string | null
  paymentStructures: PaymentStructureSchema[]
  checkedIn: boolean
} => {
  return {
    order: checkout.order,
    customer: checkout.customer,
    promoCode: checkout.promoCode,
    paymentStructures: checkout.paymentStructures.map((paymentStructure) =>
      isInstallment(paymentStructure)
        ? {
            principalAmount: paymentStructure.principalAmount,
            currency: paymentStructure.currency,
            frequency: paymentStructure.frequency,
            term: paymentStructure.term,
            dueDates: paymentStructure.dueDates.map((dueDate) => ({
              amount: dueDate.amount,
              currency: dueDate.currency,
              dueDate: dueDate.dueDate,
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
    checkedIn: checkout.checkedIn,
  }
}

export const mapToPayments = (checkout: Checkout): PaymentSchema[] => {
  return checkout.paymentStructures.flatMap((paymentStructure) =>
    isInstallment(paymentStructure)
      ? paymentStructure.dueDates.map((dueDate, index) => ({
          id: dueDate.paymentId,
          orderId: checkout.order.id,
          amount: dueDate.amount,
          currency: dueDate.currency,
          dueDate: dueDate.dueDate,
          status: dueDate.status,
          stripeCustomerId: checkout.payment.customer.id,
          stripePaymentIntentId: (index == 0 ? checkout.payment.intent?.id : null) ?? null,
          stripePaymentIntentSecret: (index == 0 ? checkout.payment.intent?.secret : null) ?? null,
        }))
      : [
          {
            id: paymentStructure.paymentId,
            orderId: checkout.order.id,
            amount: paymentStructure.amount,
            currency: paymentStructure.currency,
            status: paymentStructure.status,
            stripeCustomerId: checkout.payment.customer.id,
            stripePaymentIntentId: checkout.payment.intent?.id ?? null,
            stripePaymentIntentSecret: checkout.payment.intent?.secret ?? null,
          },
        ]
  )
}

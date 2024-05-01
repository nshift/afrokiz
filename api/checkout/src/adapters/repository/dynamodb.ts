import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { Currency } from '../../types/currency'
import { Customer } from '../../types/customer'
import { Order } from '../../types/order'
import { PaymentStatus } from '../../types/payment'
import { PaymentIntent } from '../../types/payment-intent'
import { Promotion } from '../../types/promotion'
import { DateGenerator } from '../date.generator'
import { UUIDGenerator } from '../uuid.generator'
import { EventStore } from './event-store'
import { Event } from './events/event'
import { processProceedToCheckoutEvent } from './events/proceed-to-checkout.event'
import { processUpdatePaymentStatusEvent } from './events/update-payment-status.event'
import { transformCreateOrderEvent, transformFailedPaymentEvent, transformSuccessfulPaymentEvent } from './migration'
import { makePromoterDiscount } from './promotions'
import { Repository } from './repository'
import {
  OrderSchema,
  SaleSchema,
  eventResponse,
  getAllSalesRequest,
  getEventFromRangeRequest,
  getOrderByIdRequest,
  orderResponse,
  salesResponse,
  saveEventsRequest,
} from './requests'

export class DynamoDbRepository implements Repository {
  constructor(
    private readonly dynamodb: DynamoDBDocumentClient,
    private readonly uuidGenerator: UUIDGenerator,
    private readonly dateGenerator: DateGenerator
  ) {}

  async savePaymentStatus(data: { order: { id: string }; payment: { status: PaymentStatus } }): Promise<void> {
    const { order, customer, promoCode } = (await this.getOrderById(data.order.id)) || {}
    if (!order || !customer) {
      throw new Error(`Order ${data.order.id} does not exist`)
    }
    const eventData = { order, customer, promoCode, paymentStatus: data.payment.status }
    await processUpdatePaymentStatusEvent(this.dynamodb, this.uuidGenerator, this.dateGenerator, eventData)
  }

  async saveCheckout(checkout: {
    order: Order
    total: { amount: number; currency: Currency }
    customer: Customer
    promoCode?: string
    payment: { status: PaymentStatus; intent: PaymentIntent }
  }): Promise<void> {
    await processProceedToCheckoutEvent(this.dynamodb, this.uuidGenerator, this.dateGenerator, checkout)
  }

  async getOrderById(id: string): Promise<OrderSchema | null> {
    const response = await this.dynamodb.send(getOrderByIdRequest(id))
    const orders = orderResponse(response.Items)
    return orders[0] ?? null
  }

  async getAllSales(): Promise<SaleSchema[]> {
    const response = await this.dynamodb.send(getAllSalesRequest())
    return salesResponse(response.Items)
  }

  async getAllPromotions(): Promise<{ [key: string]: Promotion }> {
    return {
      SANJAYA: makePromoterDiscount('SANJAYA'),
      SATOMI: makePromoterDiscount('SATOMI'),
      ARIEL: makePromoterDiscount('ARIEL'),
      SIRI: makePromoterDiscount('SIRI'),
      THEO: makePromoterDiscount('THEO'),
      RITA: makePromoterDiscount('RITA'),
      ZIKIMMY: makePromoterDiscount('ZIKIMMY'),
      LUCERNE: makePromoterDiscount('LUCERNE'),
      AIDANCE: makePromoterDiscount('AIDANCE'),
      NARUTONYA: makePromoterDiscount('NARUTONYA'),
      MANLUO: makePromoterDiscount('MANLUO'),
      ZAK: makePromoterDiscount('ZAK'),
      JAY: makePromoterDiscount('JAY'),
      RAJ: makePromoterDiscount('RAJ'),
      HITOMI: makePromoterDiscount('HITOMI'),
    }
  }

  async replayEvents(range: { from: Date; to: Date }): Promise<Event<any>[]> {
    const response = await this.dynamodb.send(getEventFromRangeRequest(range.from, range.to))
    const events = eventResponse(response.Items)
    const eventStore = new EventStore(this.dynamodb)
    await eventStore.process(events)
    return events
  }

  async migrateEvents(range: { from: Date; to: Date }): Promise<Event<any>[]> {
    const response = await this.dynamodb.send(getEventFromRangeRequest(range.from, range.to))
    const events = eventResponse(response.Items).reduce(
      (events, event) => {
        const transformableEvents: { [key: string]: (event: Event<any>) => Event<any> } = {
          CreateOrder: (event) => transformCreateOrderEvent(event),
          SuccessfulPayment: (event) => transformSuccessfulPaymentEvent(event, this.uuidGenerator),
          FailurePayment: (event: Event<any>) => transformFailedPaymentEvent(event),
        }
        const transformableEvent = transformableEvents[event.name]?.(event)
        if (transformableEvent) {
          events.eventsToAdd.push(transformableEvent)
          events.eventsToDelete.push(event)
        }
        events.eventsToPlay.push(transformableEvent ?? event)
        return events
      },
      { eventsToDelete: [], eventsToAdd: [], eventsToPlay: [] } as {
        eventsToDelete: Event<any>[]
        eventsToAdd: Event<any>[]
        eventsToPlay: Event<any>[]
      }
    )
    // await this.dynamodb.send(deleteEventsRequest(events.eventsToDelete.map((event) => event.id)))
    await Promise.all(chunk(events.eventsToAdd, 25).map((events) => this.dynamodb.send(saveEventsRequest(events))))
    const eventStore = new EventStore(this.dynamodb)
    const eventsToPlay = events.eventsToPlay.sort((a, b) => a.time.getTime() - b.time.getTime())
    console.log(eventsToPlay)
    await Promise.all(chunk(eventsToPlay, 25).map((event) => eventStore.process(event)))
    return events.eventsToPlay
  }
}

function chunk(array: any, size: number) {
  // TODO: should be made lazy
  return Array.from(
    { length: Math.ceil(array.length / size) }, // number of slices
    (_, index) => array.slice(index * size, (index + 1) * size) // for every slice, extract it
  )
}

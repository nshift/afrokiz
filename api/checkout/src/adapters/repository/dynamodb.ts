import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { chunk } from '../../chunk'
import { Environment } from '../../environment'
import { Currency } from '../../types/currency'
import { Customer } from '../../types/customer'
import { ImportOrder, Order } from '../../types/order'
import { PaymentStatus } from '../../types/payment'
import { PaymentIntent } from '../../types/payment-intent'
import { Promotion } from '../../types/promotion'
import { Sales } from '../../types/sales'
import { DateGenerator } from '../date.generator'
import { UUIDGenerator } from '../uuid.generator'
import { EventStore } from './event-store'
import { Event } from './events/event'
import { mapToOrder, proceedToCheckoutEvent, processProceedToCheckoutEvent } from './events/proceed-to-checkout.event'
import { processUpdatePaymentStatusEvent } from './events/update-payment-status.event'
import { transformCreateOrderEvent, transformFailedPaymentEvent, transformSuccessfulPaymentEvent } from './migration'
import {
  makeCNEDiscount,
  makeDashDiscount,
  makePromoterDiscount,
  makeSensualDiscount,
  makeTarrakizSGDiscount,
} from './promotions'
import { Repository } from './repository'
import {
  OrderSchema,
  eventResponse,
  getEventFromRangeRequest,
  getImportOrdersByFingerprintsRequest,
  getOrderByIdRequest,
  importOrdersResponse,
  listOrdersResponse,
  listOrdersWithoutCampaignRequest,
  orderResponse,
  saveEventsRequest,
  saveImportOrdersRequest,
  saveOrdersRequest,
  updateSalesCampaignRequest,
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
    const eventData = { order, customer, promoCode: promoCode ?? null, paymentStatus: data.payment.status }
    await processUpdatePaymentStatusEvent(this.dynamodb, this.uuidGenerator, this.dateGenerator, eventData)
  }

  async saveCheckout(checkout: {
    order: Order
    total: { amount: number; currency: Currency }
    customer: Customer
    promoCode: string | null
    payment: { status: PaymentStatus; intent: PaymentIntent | null }
  }): Promise<void> {
    await processProceedToCheckoutEvent(this.dynamodb, this.uuidGenerator, this.dateGenerator, checkout)
  }

  async saveCheckouts(
    checkouts: {
      order: Order
      total: { amount: number; currency: Currency }
      customer: Customer
      promoCode: string | null
      payment: { status: PaymentStatus; intent: PaymentIntent | null }
    }[]
  ): Promise<void> {
    if (checkouts.length == 0) {
      return
    }
    const events = checkouts.map((checkout) =>
      proceedToCheckoutEvent({
        id: this.uuidGenerator.generate(),
        name: 'ProceedToCheckout',
        time: this.dateGenerator.today(),
        data: checkout,
      })
    )
    const saveEventsCommand = saveEventsRequest(events)
    await this.dynamodb.send(saveEventsCommand)
    const saveOrdersCommand = saveOrdersRequest(checkouts.map((checkout) => mapToOrder(checkout)))
    await this.dynamodb.send(saveOrdersCommand)
  }

  async getOrderById(id: string): Promise<OrderSchema | null> {
    const response = await this.dynamodb.send(getOrderByIdRequest(id))
    const orders = orderResponse(response.Items)
    return orders[0] ?? null
  }

  // async getAllSales(): Promise<SaleSchema[]> {
  //   const response = await this.dynamodb.send(getAllSalesRequest())
  //   return salesResponse(response.Items)
  // }

  async getAllRegistrationCampaignSales(): Promise<Sales[]> {
    const response = await this.dynamodb.send(listOrdersWithoutCampaignRequest('registration_campaign'))
    return listOrdersResponse(response.Items)
  }

  async updateOrdersForRegistrationCampaign(orderIds: string[]): Promise<void> {
    await Promise.all(
      orderIds.map(
        async (orderId) => await this.dynamodb.send(updateSalesCampaignRequest(orderId, 'registration_campaign'))
      )
    )
  }

  async getAllPromotions(passId: string): Promise<{ [key: string]: Promotion }> {
    return {
      AIDANCE: makePromoterDiscount('AIDANCE'),
      ARIEL: makePromoterDiscount('ARIEL'),
      ASANKA: makePromoterDiscount('ASANKA'),
      CNE: makeCNEDiscount(passId),
      DAVID: makePromoterDiscount('DAVID'),
      DASH: makeDashDiscount,
      DJDRZ: makePromoterDiscount('DJDRZ'),
      HITOMI: makePromoterDiscount('HITOMI'),
      JAY: makePromoterDiscount('JAY'),
      KEVIN: makePromoterDiscount('KEVIN'),
      KIW: makePromoterDiscount('KIW'),
      LUCERNE: makePromoterDiscount('LUCERNE'),
      MANLUO: makePromoterDiscount('MANLUO'),
      NARUTONYA: makePromoterDiscount('NARUTONYA'),
      RAJ: makePromoterDiscount('RAJ'),
      RITA: makePromoterDiscount('RITA'),
      SANJAYA: makePromoterDiscount('SANJAYA'),
      SATOMI: makePromoterDiscount('SATOMI'),
      SENSUAL: makeSensualDiscount,
      SIRI: makePromoterDiscount('SIRI'),
      SOULKIZDANANG: makePromoterDiscount('SOULKIZDANANG'),
      STEFANOS: makePromoterDiscount('STEFANOS'),
      TARRAKIZSG: makeTarrakizSGDiscount,
      THEO: makePromoterDiscount('THEO'),
      ZIKIMMY: makePromoterDiscount('ZIKIMMY'),
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

  async saveImportOrders(imports: ImportOrder[]): Promise<void> {
    if (imports.length == 0) {
      return
    }
    await this.dynamodb.send(saveImportOrdersRequest(imports))
  }

  async getImportOrdersByFingerprints(fingerprints: string[]): Promise<ImportOrder[]> {
    const response = await this.dynamodb.send(getImportOrdersByFingerprintsRequest(fingerprints))
    return importOrdersResponse(response.Responses?.[Environment.ImportOrderTableName()] ?? [])
  }
}

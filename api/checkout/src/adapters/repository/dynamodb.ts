import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { chunk } from '../../chunk'
import { Environment } from '../../environment'
import { Currency } from '../../types/currency'
import { Customer } from '../../types/customer'
import { ImportOrder, Order } from '../../types/order'
import { Payment, PaymentStatus, PaymentStructure } from '../../types/payment'
import { PaymentIntent } from '../../types/payment-intent'
import { Promotion } from '../../types/promotion'
import { Sales } from '../../types/sales'
import { DateGenerator } from '../date.generator'
import { UUIDGenerator } from '../uuid.generator'
import { EventStore } from './event-store'
import { processUpdateOrderCheckInEvent } from './events/check-in.event'
import { Event } from './events/event'
import {
  mapToOrder,
  mapToPayments,
  proceedToCheckoutEvent,
  processProceedToCheckoutEvent,
} from './events/proceed-to-checkout.event.v2'
import { processUpdatePaymentStatusEvent } from './events/update-payment-status.event.v2'
import { makeEdition3PromoterDiscount } from './promotions'
import { Repository } from './repository'
import {
  OrderSchema,
  eventResponse,
  getEventFromRangeRequest,
  getImportOrdersByFingerprintsRequest,
  getOrderByIdRequest,
  getPaymentByStripeIdRequest,
  getPendingPaymentsRequest,
  importOrdersResponse,
  listDinnerCruiseCampaignOrdersRequest,
  listOrdersResponse,
  listOrdersWithoutCampaignRequest,
  orderResponse,
  paymentsResponse,
  saveEventsRequest,
  saveImportOrdersRequest,
  savePaymentRequest,
  updateSalesCampaignRequest,
} from './requests'

export class DynamoDbRepository implements Repository {
  static WriteBulkLimit = 25

  constructor(
    private readonly dynamodb: DynamoDBDocumentClient,
    private readonly uuidGenerator: UUIDGenerator,
    private readonly dateGenerator: DateGenerator
  ) {}

  async savePaymentStatus(data: {
    order: { id: string }
    payment: { stripeId: string; status: PaymentStatus }
  }): Promise<void> {
    const { order, customer } = (await this.getOrderById(data.order.id)) || {}
    if (!order || !customer) {
      throw new Error(`Order ${data.order.id} does not exist`)
    }
    let payment = await this.getPaymentByStripeId(data.payment.stripeId)
    if (!payment) {
      throw new Error(`Payment with stripe id ${data.payment.stripeId} does not exist`)
    }
    await processUpdatePaymentStatusEvent(this.dynamodb, this.uuidGenerator, this.dateGenerator, {
      payment: { id: payment.id, status: data.payment.status },
      order,
    })
  }

  async savePayment(payment: Payment): Promise<void> {
    await this.dynamodb.send(savePaymentRequest(payment))
  }

  async saveCheckout(checkout: {
    order: Order
    total: { amount: number; currency: Currency }
    customer: Customer
    promoCode: string | null
    payment: { status: PaymentStatus; intent: PaymentIntent | null; customer: { id: string } }
    paymentStructures: PaymentStructure[]
    checkedIn: boolean
  }): Promise<void> {
    await processProceedToCheckoutEvent(this.dynamodb, this.uuidGenerator, this.dateGenerator, checkout)
  }

  async saveCheckouts(
    checkouts: {
      order: Order
      total: { amount: number; currency: Currency }
      customer: Customer
      promoCode: string | null
      payment: { status: PaymentStatus; intent: PaymentIntent | null; customer: { id: string } }
      paymentStructures: PaymentStructure[]
      checkedIn: boolean
    }[]
  ): Promise<void> {
    if (checkouts.length == 0) {
      return
    }
    const events = checkouts.map((checkout) => {
      let payments = mapToPayments(checkout, this.uuidGenerator)
      return proceedToCheckoutEvent({
        id: this.uuidGenerator.generate(),
        name: 'ProceedToCheckout',
        time: this.dateGenerator.today(),
        data: { checkout: mapToOrder(checkout, payments), payments },
      })
    })
    await Promise.all(
      chunk(events, DynamoDbRepository.WriteBulkLimit).map((chunkEvents) =>
        this.dynamodb.send(saveEventsRequest(chunkEvents))
      )
    )
    const eventStore = new EventStore(this.dynamodb)
    await Promise.all(chunk(events, DynamoDbRepository.WriteBulkLimit).map((events) => eventStore.process(events)))
  }

  async getOrderById(id: string): Promise<OrderSchema | null> {
    const getOrderByIdResponse = await this.dynamodb.send(getOrderByIdRequest(id))
    const orders = orderResponse(getOrderByIdResponse.Items)
    return orders[0] ?? null
  }

  async getAllPromotions(passId: string): Promise<{ [key: string]: Promotion }> {
    return {
      AIKIZ: makeEdition3PromoterDiscount('AIKIZ'),
      ANAKIZ: makeEdition3PromoterDiscount('ANAKIZ'),
      ARIELTW: makeEdition3PromoterDiscount('ARIELTW'),
      BR_THEGROOVY: makeEdition3PromoterDiscount('BR_THEGROOVY'),
      CANELAEZRA: makeEdition3PromoterDiscount('CANELAEZRA'),
      CHRIS: makeEdition3PromoterDiscount('CHRIS'),
      CHU: makeEdition3PromoterDiscount('CHU'),
      DANZEVO: makeEdition3PromoterDiscount('DANZEVO'),
      ELDA: makeEdition3PromoterDiscount('ELDA'),
      FLOKICHITTIE: makeEdition3PromoterDiscount('FLOKICHITTIE'),
      FLORENCE: makeEdition3PromoterDiscount('FLORENCE'),
      FRANK: makeEdition3PromoterDiscount('FRANK'),
      HITOMI: makeEdition3PromoterDiscount('HITOMI'),
      KAMARAD: makeEdition3PromoterDiscount('KAMARAD'),
      KIMQCLW: makeEdition3PromoterDiscount('KIMQCLW'),
      KIW: makeEdition3PromoterDiscount('KIW'),
      LIYA: makeEdition3PromoterDiscount('LIYA'),
      MEL: makeEdition3PromoterDiscount('MEL'),
      MELISSA: makeEdition3PromoterDiscount('MELISSA'),
      MOU: makeEdition3PromoterDiscount('MOU'),
      NEHA: makeEdition3PromoterDiscount('NEHA'),
      NEIL: makeEdition3PromoterDiscount('NEIL'),
      NICHA: makeEdition3PromoterDiscount('NICHA'),
      OUSS: makeEdition3PromoterDiscount('OUSS'),
      PAUL: makeEdition3PromoterDiscount('PAUL'),
      RAJ: makeEdition3PromoterDiscount('RAJ'),
      RITAKIZ: makeEdition3PromoterDiscount('RITAKIZ'),
      RUSLADA: makeEdition3PromoterDiscount('RUSLADA'),
      RYAN: makeEdition3PromoterDiscount('RYAN'),
      SALSAMADRAS: makeEdition3PromoterDiscount('SALSAMADRAS'),
      SANJAYA: makeEdition3PromoterDiscount('SANJAYA'),
      SAOMAI: makeEdition3PromoterDiscount('SAOMAI'),
      SHAN: makeEdition3PromoterDiscount('SHAN'),
      SOULKIZDANANG: makeEdition3PromoterDiscount('SOULKIZDANANG'),
      THEO: makeEdition3PromoterDiscount('THEO'),
      THEONE: makeEdition3PromoterDiscount('THEONE'),
      TRIXIE: makeEdition3PromoterDiscount('TRIXIE'),
      TUN: makeEdition3PromoterDiscount('TUN'),
      ULIANA: makeEdition3PromoterDiscount('ULIANA'),
      UPIKIZ: makeEdition3PromoterDiscount('UPIKIZ'),
      VIETLINH: makeEdition3PromoterDiscount('VIETLINH'),
      VKIZ: makeEdition3PromoterDiscount('VKIZ'),
      WINO: makeEdition3PromoterDiscount('WINO'),
      ZIKIMMY: makeEdition3PromoterDiscount('ZIKIMMY'),
    }
  }

  async getPendingPayments(before: Date): Promise<Payment[]> {
    const response = await this.dynamodb.send(getPendingPaymentsRequest())
    return paymentsResponse(response.Items)
      .map((payment) => ({
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency as Currency,
        dueDate: payment.dueDate,
        status: payment.status as PaymentStatus,
        stripe: {
          id: payment.stripePaymentIntentId ?? null,
          secret: payment.stripePaymentIntentSecret ?? null,
          customerId: payment.stripeCustomerId,
        },
      }))
      .filter((payment) => (payment.dueDate ? payment.dueDate.getTime() < before.getTime() : false))
  }

  async getPaymentByStripeId(stripeId: string): Promise<Payment | null> {
    const response = await this.dynamodb.send(getPaymentByStripeIdRequest(stripeId))
    let payments = paymentsResponse(response.Items).map((payment) => ({
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency as Currency,
      dueDate: payment.dueDate,
      status: payment.status as PaymentStatus,
      stripe: {
        id: payment.stripePaymentIntentId ?? null,
        secret: payment.stripePaymentIntentSecret ?? null,
        customerId: payment.stripeCustomerId,
      },
    }))
    return payments[0] ?? null
  }

  async replayEvents(range: { from: Date; to: Date }): Promise<Event<any>[]> {
    const response = await this.dynamodb.send(getEventFromRangeRequest(range.from, range.to))
    const events = eventResponse(response.Items)
    const eventStore = new EventStore(this.dynamodb)
    await eventStore.process(events)
    return events
  }

  async saveImportOrders(imports: ImportOrder[]): Promise<void> {
    if (imports.length == 0) {
      return
    }
    await Promise.all(
      chunk(imports, DynamoDbRepository.WriteBulkLimit).map((chunkImports) =>
        this.dynamodb.send(saveImportOrdersRequest(chunkImports))
      )
    )
  }

  async getImportOrdersByFingerprints(fingerprints: string[]): Promise<ImportOrder[]> {
    const response = await this.dynamodb.send(getImportOrdersByFingerprintsRequest(fingerprints))
    return importOrdersResponse(response.Responses?.[Environment.ImportOrderTableName()] ?? [])
  }

  async updateOrderCheckIn(orderId: string, value: boolean): Promise<void> {
    await processUpdateOrderCheckInEvent(this.dynamodb, this.uuidGenerator, this.dateGenerator, {
      id: orderId,
      checkedIn: value,
    })
  }

  // TODO: Move to another service.

  async updateOrdersForCruiseCampaign(orderIds: string[]): Promise<void> {
    await Promise.all(
      orderIds.map(async (orderId) => await this.dynamodb.send(updateSalesCampaignRequest(orderId, 'cruise_campaign')))
    )
  }

  async updateOrdersForRegistrationCampaign(orderIds: string[]): Promise<void> {
    await Promise.all(
      orderIds.map(
        async (orderId) => await this.dynamodb.send(updateSalesCampaignRequest(orderId, 'registration_campaign'))
      )
    )
  }

  async updateOrdersForRegistrationReminderCampaign(orderIds: string[]): Promise<void> {
    await Promise.all(
      orderIds.map(
        async (orderId) =>
          await this.dynamodb.send(updateSalesCampaignRequest(orderId, 'registration_reminder_campaign'))
      )
    )
  }

  async getAllRegistrationCampaignSales(): Promise<Sales[]> {
    const response = await this.dynamodb.send(listOrdersWithoutCampaignRequest('registration_campaign'))
    return listOrdersResponse(response.Items)
  }

  async getAllRegistrationReminderCampaignSales(): Promise<Sales[]> {
    const response = await this.dynamodb.send(listOrdersWithoutCampaignRequest('registration_reminder_campaign'))
    return listOrdersResponse(response.Items)
  }

  async getAllCruiseCampaignSales(): Promise<Sales[]> {
    const response = await this.dynamodb.send(listDinnerCruiseCampaignOrdersRequest('cruise_campaign'))
    const sales = listOrdersResponse(response.Items)
    return sales.filter(
      (sale) =>
        sale.paymentStatus == 'success' &&
        sale.items.some(
          (item) =>
            item.includes.includes('Exclusive Dinner Cruise Party') ||
            item.includes.includes('Exclusive Dinner Cruise Party (7th September 6:30PM-9:30PM)')
        )
    )
  }
}

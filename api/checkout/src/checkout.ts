import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import Stripe from 'stripe'
import { v4 as uuid } from 'uuid'
import { getOrderByIdRequest, getOrderByPaymentIntentIdRequest, orderResponse, saveOrdersRequest } from './dynamodb'
import { Event } from './event'
import { EventStore } from './event-store'
import { Order } from './order'

export class CheckingOut {
  constructor(private readonly stripe: Stripe, private readonly dynamodb: DynamoDBDocumentClient) {}

  async createOrder(
    newOrder: Omit<Order, 'id' | 'paymentIntentId' | 'paymentStatus'>
  ): Promise<{ order: Order; clientSecret: string }> {
    const total = newOrder.items.reduce((total, item) => total + item.total.amount, 0)
    const currency = Array.from(new Set(newOrder.items.map((item) => item.total.currency)))[0]
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: total,
      currency,
      automatic_payment_methods: { enabled: true },
    })
    if (!paymentIntent.client_secret) {
      throw new Error(`Payment intent (${paymentIntent.id}) does not contain any client secret.`)
    }
    const order: Order = { id: uuid(), paymentIntentId: paymentIntent.id, paymentStatus: 'pending', ...newOrder }
    const event: CreateOrderEvent = {
      id: uuid(),
      name: 'CreateOrder',
      time: new Date(),
      data: { order },
      process: () => [saveOrdersRequest([order])],
    }
    const eventStore = new EventStore(this.dynamodb)
    await eventStore.process([event])
    return { order, clientSecret: paymentIntent.client_secret }
  }

  async getOrder(id: string): Promise<Order | null> {
    const response = await this.dynamodb.send(getOrderByIdRequest(id))
    const orders = orderResponse(response.Items)
    return orders[0]
  }

  async handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const getOrderByPaymentIntentIdResponse = await this.dynamodb.send(
      getOrderByPaymentIntentIdRequest(paymentIntent.id)
    )
    const orders = orderResponse(getOrderByPaymentIntentIdResponse.Items).map(
      (order): Order => ({ ...order, paymentStatus: 'success' })
    )
    const event: SuccessfulPaymentEvent = {
      id: uuid(),
      name: 'SuccessfulPayment',
      time: new Date(),
      data: { orders, paymentIntentId: paymentIntent.id },
      process: () => [saveOrdersRequest(orders)],
    }
    const eventStore = new EventStore(this.dynamodb)
    await eventStore.process([event])
  }

  async handleFailurePayment(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const getOrderByPaymentIntentIdResponse = await this.dynamodb.send(
      getOrderByPaymentIntentIdRequest(paymentIntent.id)
    )
    const orders = orderResponse(getOrderByPaymentIntentIdResponse.Items).map(
      (order): Order => ({ ...order, paymentStatus: 'failed' })
    )
    const event: SuccessfulPaymentEvent = {
      id: uuid(),
      name: 'FailurePayment',
      time: new Date(),
      data: { orders, paymentIntentId: paymentIntent.id },
      process: () => [saveOrdersRequest(orders)],
    }
    const eventStore = new EventStore(this.dynamodb)
    await eventStore.process([event])
  }
}

export interface CreateOrderEvent extends Omit<Event, 'data'> {
  data: { order: Order }
}

export interface SuccessfulPaymentEvent extends Omit<Event, 'data'> {
  data: { orders: Order[]; paymentIntentId: string }
}

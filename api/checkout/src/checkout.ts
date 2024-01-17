import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import crypto from 'crypto'
import Stripe from 'stripe'
import { getOrderByIdRequest, getOrderByPaymentIntentIdRequest, orderResponse } from './dynamodb'
import { processCreateOrderEvent } from './event/create-order.event'
import { processFailurePaymentEvent } from './event/failure-payment.event'
import { processSuccessfulPaymentEvent } from './event/successful-payment.event'
import { Order } from './order'
import { createPaymentIntent } from './stripe'

export class CheckingOut {
  constructor(private readonly stripe: Stripe, private readonly dynamodb: DynamoDBDocumentClient) {}

  async createOrder(
    newOrder: Omit<Order, 'id' | 'paymentIntentId' | 'paymentStatus'>
  ): Promise<{ order: Order; clientSecret: string }> {
    const orderId = crypto.randomBytes(3).toString('hex')
    const paymentIntent = await createPaymentIntent(this.stripe, { ...newOrder, id: orderId })
    if (!paymentIntent.client_secret) {
      throw new Error(`Payment intent (${paymentIntent.id}) does not contain any client secret.`)
    }
    const order: Order = { id: orderId, paymentIntentId: paymentIntent.id, paymentStatus: 'pending', ...newOrder }
    await processCreateOrderEvent(this.dynamodb, order)
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
    await processSuccessfulPaymentEvent(this.dynamodb, { orders, paymentIntentId: paymentIntent.id })
  }

  async handleFailurePayment(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const getOrderByPaymentIntentIdResponse = await this.dynamodb.send(
      getOrderByPaymentIntentIdRequest(paymentIntent.id)
    )
    const orders = orderResponse(getOrderByPaymentIntentIdResponse.Items).map(
      (order): Order => ({ ...order, paymentStatus: 'failed' })
    )
    await processFailurePaymentEvent(this.dynamodb, { orders, paymentIntentId: paymentIntent.id })
  }
}

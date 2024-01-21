import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import crypto from 'crypto'
import Stripe from 'stripe'
import { confirmationEmail } from './confirmation.email'
import { getOrderByIdRequest, getOrderByPaymentIntentIdRequest, orderResponse } from './dynamodb'
import { EmailApi } from './email'
import { processCreateOrderEvent } from './event/create-order.event'
import { processFailurePaymentEvent } from './event/failure-payment.event'
import { processSuccessfulPaymentEvent } from './event/successful-payment.event'
import { Order } from './order'
import { Promotion, discountPromotion, massagePromotion } from './promotions'
import { createPaymentIntent } from './stripe'

export class CheckingOut {
  constructor(
    private readonly stripe: Stripe,
    private readonly dynamodb: DynamoDBDocumentClient,
    private readonly emailApi: EmailApi
  ) {}

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
    const order = orders[0]
    await processSuccessfulPaymentEvent(this.dynamodb, { orders, paymentIntentId: paymentIntent.id })
    await this.emailApi.sendEmail(await confirmationEmail(order))
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

  async applyPromoCode(code: string): Promise<Promotion | null> {
    const promotions = {
      [discountPromotion.code.toUpperCase()]: discountPromotion,
      [massagePromotion.code.toUpperCase()]: massagePromotion,
    }
    const promotion = promotions[code.toUpperCase()]
    const today = new Date()
    if (!promotion || today.getTime() > promotion.expirationDate.getTime()) {
      return null
    }
    return promotion ?? null
  }
}

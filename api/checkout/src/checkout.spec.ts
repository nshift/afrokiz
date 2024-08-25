import { beforeEach, describe, expect, it } from '@jest/globals'
import { StorageAdapter } from './adapters/document/storage.adapter'
import { confirmationEmail } from './adapters/email/email.confirmation'
import { SendingEmail } from './adapters/email/email.gateway'
import { ImportOrderQueueRequest } from './adapters/queue.gateway'
import { Checkout } from './checkout'
import {
  order as fakeOrder,
  paymentIntent as fakePaymentIntent,
  qrCode as fakeQrCode,
  massagePromotion,
  romainCustomer,
} from './doubles/fixtures'
import { mock } from './doubles/mock'
import { InMemoryRepository } from './doubles/repository.in-memory'
import { Currency } from './types/currency'
import { PaymentIntent } from './types/payment-intent'

let checkout: Checkout
let emailGateway: SendingEmail
let queueAdapter: ImportOrderQueueRequest
let repository: InMemoryRepository
let storageAdapter: StorageAdapter

beforeEach(() => {
  emailGateway = mock()
  storageAdapter = mock()
  queueAdapter = mock()
  repository = new InMemoryRepository()
  checkout = new Checkout(
    repository,
    {
      createPaymentIntent: async (input: {
        order: { id: string }
        total: { amount: number; currency: Currency }
      }): Promise<PaymentIntent> => ({
        id: fakePaymentIntent.id,
        secret: fakePaymentIntent.secret,
      }),
    },
    emailGateway,
    { generateOrderQrCode: async (order: { id: string }) => fakeQrCode },
    storageAdapter,
    queueAdapter,
    { today: () => new Date('2024-01-01') }
  )
})

describe('Create an order when checking out', () => {
  it('should save an order', async () => {
    const { order } = await checkout.proceed({ newOrder: fakeOrder, customer: romainCustomer, promoCode: null })
    expect({
      order: { ...fakeOrder, id: expect.any(String) },
      payment: { status: 'pending', intent: fakePaymentIntent },
      customer: romainCustomer,
      promoCode: null,
    }).toEqual(await repository.getOrderById(order.id))
  })
  it('should create a payment intent', async () => {
    const { payment } = await checkout.proceed({ newOrder: fakeOrder, customer: romainCustomer, promoCode: null })
    expect(fakePaymentIntent.secret).toEqual(payment.intent.secret)
  })
})

describe('Get promotion when checking out', () => {
  it('should get the available promotion', async () => {
    const promotion = await checkout.getPromotion('fullpass', 'MASSAGE')
    expect(promotion).toEqual(massagePromotion)
  })
})

describe('Handling successful payment when checking out', () => {
  it('should update the payment status', async () => {
    const { order: newOrder } = await checkout.proceed({
      newOrder: fakeOrder,
      customer: romainCustomer,
      promoCode: null,
    })
    await checkout.handlePayment({ orderId: newOrder.id, payment: { status: 'success' } })
    const updatedOrder = await repository.getOrderById(newOrder.id)
    expect(updatedOrder).toEqual({
      order: { ...fakeOrder, id: newOrder.id },
      payment: { status: 'success', intent: fakePaymentIntent },
      customer: romainCustomer,
      promoCode: null,
    })
  })
  it.skip('should send a confirmation email', async () => {
    const { order: newOrder } = await checkout.proceed({
      newOrder: fakeOrder,
      customer: romainCustomer,
      promoCode: null,
    })
    await checkout.handlePayment({ orderId: newOrder.id, payment: { status: 'success' } })
    const email = await confirmationEmail({
      order: { ...fakeOrder, id: newOrder.id },
      customer: romainCustomer,
      qrCode: fakeQrCode,
    })
    expect(emailGateway.sendEmail).toHaveBeenCalledWith(email)
  })
})

describe('Handling failing payment when checking out', () => {
  it('should update the payment status', async () => {
    const { order: newOrder } = await checkout.proceed({
      newOrder: fakeOrder,
      customer: romainCustomer,
      promoCode: null,
    })
    await checkout.handlePayment({ orderId: newOrder.id, payment: { status: 'failed' } })
    const updatedOrder = await repository.getOrderById(newOrder.id)
    expect(updatedOrder).toEqual({
      order: { ...fakeOrder, id: newOrder.id },
      payment: { status: 'failed', intent: fakePaymentIntent },
      customer: romainCustomer,
      promoCode: null,
    })
  })
})

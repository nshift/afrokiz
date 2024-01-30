import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { beforeEach, describe, expect, it } from '@jest/globals'
import {
  checkoutEvent,
  deleteEventById,
  deleteOrderById,
  deleteSalesById,
  failedPaymentStatusEvent,
  createOrder as fakeCreateOrder,
  order as fakeOrder,
  paymentIntent as fakePaymentIntent,
  sales as fakeSales,
  successfulPaymentOrder as fakeSuccessfulPaymentOrder,
  formatDynamoDbJson,
  getEventById,
  romainCustomer,
  successPaymentStatusEvent,
  successPaymentStatusEvent3,
} from '../../doubles/fixtures'
import { DynamoDbRepository } from './dynamodb'
import { processCreateOrderEvent } from './events/create-order.event'
import { processSuccessfulPaymentEvent } from './events/successful-payment.event'

describe('Dynamodb', () => {
  let dynamodb: DynamoDBDocumentClient
  let repository: DynamoDbRepository
  let uuid = 1
  const uuidGenerator = { generate: () => `id-${uuid++}` }
  const dateGenerator = { today: () => new Date(`1990-01-02 10:${uuid.toFixed(2)}`) }

  beforeEach(async () => {
    uuid = 1
    dynamodb = DynamoDBDocumentClient.from(new DynamoDB({}), {
      marshallOptions: { removeUndefinedValues: true },
    })
    repository = new DynamoDbRepository(dynamodb, uuidGenerator, dateGenerator)
    await deleteEventById(dynamodb, 'id-1')
    await deleteEventById(dynamodb, 'id-2')
    await deleteEventById(dynamodb, 'id-3')
    await deleteEventById(dynamodb, 'event-1')
    await deleteEventById(dynamodb, 'event-2')
    await deleteEventById(dynamodb, 'event-3')
    await deleteOrderById(dynamodb, fakeOrder.id)
    await deleteSalesById(dynamodb, fakeSales.id)
    await deleteSalesById(dynamodb, 'id-2')
    await deleteSalesById(dynamodb, 'id-3')
  })
  it('should create a proceed checkout event', async () => {
    await repository.saveCheckout({
      order: fakeOrder,
      total: { amount: 30000, currency: 'USD' },
      customer: romainCustomer,
      payment: { status: 'pending', intent: fakePaymentIntent },
    })
    const events = await getEventById(dynamodb, checkoutEvent.id)
    expect(events).toEqual(expect.arrayContaining([formatDynamoDbJson(checkoutEvent)]))
    expect(await repository.getOrderById(fakeOrder.id)).toEqual({
      order: fakeOrder,
      customer: romainCustomer,
      payment: { status: 'pending', intent: fakePaymentIntent },
      promoCode: null,
    })
    await deleteEventById(dynamodb, checkoutEvent.id)
    await deleteOrderById(dynamodb, fakeOrder.id)
  })
  it('should create a payment success event', async () => {
    await repository.saveCheckout({
      order: fakeOrder,
      total: { amount: 30000, currency: 'USD' },
      customer: romainCustomer,
      payment: { status: 'pending', intent: fakePaymentIntent },
    })
    await repository.savePaymentStatus({
      order: { id: fakeOrder.id },
      payment: { status: 'success' },
    })
    const events = await getEventById(dynamodb, successPaymentStatusEvent3.id)
    expect(events).toEqual(expect.arrayContaining([formatDynamoDbJson(successPaymentStatusEvent3)]))
    expect(await repository.getOrderById(fakeOrder.id)).toEqual({
      order: fakeOrder,
      customer: romainCustomer,
      payment: { status: 'success', intent: fakePaymentIntent },
      promoCode: null,
    })
    const sales = await repository.getAllSales()
    expect(sales).toEqual(expect.arrayContaining([successPaymentStatusEvent3.data.sales]))
  })
  it('should create a payment failed event', async () => {
    await repository.saveCheckout({
      order: fakeOrder,
      total: { amount: 30000, currency: 'USD' },
      customer: romainCustomer,
      payment: { status: 'pending', intent: fakePaymentIntent },
    })
    await repository.savePaymentStatus({
      order: { id: fakeOrder.id },
      payment: { status: 'failed' },
    })
    const events = await getEventById(dynamodb, failedPaymentStatusEvent.id)
    expect(events).toEqual(expect.arrayContaining([formatDynamoDbJson(failedPaymentStatusEvent)]))
    expect(await repository.getOrderById(fakeOrder.id)).toEqual({
      order: fakeOrder,
      customer: romainCustomer,
      payment: { status: 'failed', intent: fakePaymentIntent },
      promoCode: null,
    })
    await deleteEventById(dynamodb, failedPaymentStatusEvent.id)
    await deleteOrderById(dynamodb, fakeOrder.id)
  })
  it('should replay events', async () => {
    await repository.saveCheckout({
      order: fakeOrder,
      total: { amount: 30000, currency: 'USD' },
      customer: romainCustomer,
      payment: { status: 'pending', intent: fakePaymentIntent },
    })
    await deleteOrderById(dynamodb, fakeOrder.id)
    expect(await repository.getOrderById(fakeOrder.id)).toBeNull()
    await repository.replayEvents({ from: new Date('1990-01-01'), to: new Date('1990-01-03') })
    expect(await repository.getOrderById(fakeOrder.id)).toEqual({
      order: fakeOrder,
      customer: romainCustomer,
      payment: { status: 'pending', intent: fakePaymentIntent },
      promoCode: null,
    })
  })
  it('should migrate create order events', async () => {
    await processCreateOrderEvent(dynamodb, uuidGenerator, dateGenerator, fakeCreateOrder)
    await repository.migrateEvents({ from: new Date('1990-01-01'), to: new Date('1990-01-03') })
    const events = await getEventById(dynamodb, checkoutEvent.id)
    const formattedCheckoutEvent = formatDynamoDbJson(checkoutEvent)
    expect(events).toEqual(
      expect.arrayContaining([
        {
          ...formattedCheckoutEvent,
          data: {
            ...formattedCheckoutEvent.data,
            payment: {
              ...formattedCheckoutEvent.data.payment,
              intent: { ...formattedCheckoutEvent.data.payment.intent, secret: '' },
            },
          },
        },
      ])
    )
    expect(await repository.getOrderById(fakeOrder.id)).toEqual({
      order: fakeOrder,
      customer: romainCustomer,
      payment: { status: 'pending', intent: { ...fakePaymentIntent, secret: '' } },
      promoCode: null,
    })
    await deleteEventById(dynamodb, checkoutEvent.id)
    await deleteOrderById(dynamodb, fakeOrder.id)
  })
  it('should migrate create successful payment events', async () => {
    await processCreateOrderEvent(dynamodb, uuidGenerator, dateGenerator, fakeCreateOrder)
    await processSuccessfulPaymentEvent(dynamodb, uuidGenerator, dateGenerator, {
      orders: [fakeSuccessfulPaymentOrder],
      paymentIntentId: fakePaymentIntent.id,
    })
    const events = await repository.migrateEvents({ from: new Date('1990-01-01'), to: new Date('1990-01-03') })
    expect(await getEventById(dynamodb, 'id-2')).toEqual([formatDynamoDbJson(successPaymentStatusEvent)])
    console.log(await repository.getOrderById(fakeOrder.id))
    expect(await repository.getOrderById(fakeOrder.id)).toEqual({
      order: fakeOrder,
      customer: romainCustomer,
      payment: { status: 'success', intent: { ...fakePaymentIntent, secret: '' } },
      promoCode: null,
    })
    const sales = await repository.getAllSales()
    console.log(sales)
    expect(sales).toEqual(expect.arrayContaining([{ ...fakeSales, id: 'id-3', date: new Date(`1990-01-02 10:03`) }]))
  })
  it.only('should migrate events', async () => {
    await repository.migrateEvents({ from: new Date('2023-01-01'), to: new Date('2025-01-03') })
  })
})

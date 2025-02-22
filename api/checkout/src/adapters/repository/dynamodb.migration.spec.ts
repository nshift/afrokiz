import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { beforeEach, describe, expect, it } from '@jest/globals'
import {
  checkoutEvent,
  deleteEventById,
  deleteOrderById,
  deleteSalesById,
  createOrder as fakeCreateOrder,
  directPaymentStructure as fakeDirectPaymentStructure,
  order as fakeOrder,
  paymentIntent as fakePaymentIntent,
  sales as fakeSales,
  stripeCustomer as fakeStripeCustomer,
  successfulPaymentOrder as fakeSuccessfulPaymentOrder,
  formatDynamoDbJson,
  getEventById,
  romainCustomer,
  successPaymentStatusEvent,
} from '../../doubles/fixtures'
import { DynamoDbRepository } from './dynamodb.migration'
import { processCreateOrderEvent } from './events/create-order.event'
import { processSuccessfulPaymentEvent } from './events/successful-payment.event'

describe.skip('Dynamodb', () => {
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
      payment: { status: 'success', intent: { ...fakePaymentIntent, secret: '' }, customer: fakeStripeCustomer },
      paymentStructure: fakeDirectPaymentStructure(3000),
      checkedIn: false,
      promoCode: null,
    })
  })
  it('should migrate events', async () => {
    await repository.migrateEvents({ from: new Date('2023-01-01'), to: new Date('2025-01-03') })
  })
})

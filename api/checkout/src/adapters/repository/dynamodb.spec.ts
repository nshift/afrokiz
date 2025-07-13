import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import {
  checkoutEvent,
  checkoutInstallmentEvent,
  deleteEventById,
  deleteOrderById,
  deletePaymentById,
  deleteSalesById,
  failedPaymentStatusEvent,
  directPaymentStructureSchema as fakeDirectPaymentStructure,
  installmentPaymentStructureSchema as fakeInstallmentPaymentStructure,
  order as fakeOrder,
  paymentIntent as fakePaymentIntent,
  sales as fakeSales,
  stripeCustomer as fakeStripeCustomer,
  formatDynamoDbJson,
  getEventById,
  romainCustomer,
  successPaymentStatusEvent3,
} from '../../doubles/fixtures'
import { Currency } from '../../types/currency'
import { Order } from '../../types/order'
import { PaymentStatus } from '../../types/payment'
import { DynamoDbRepository } from './dynamodb'

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
    await cleanUp()
  })
  afterEach(async () => await cleanUp())
  describe('save checkout', () => {
    it('should create a proceed checkout event', async () => {
      let checkout = {
        order: fakeOrder,
        total: { amount: 30000, currency: 'USD' as Currency },
        customer: romainCustomer,
        payment: { status: 'pending' as PaymentStatus, intent: fakePaymentIntent, customer: fakeStripeCustomer },
        paymentStructures: [fakeDirectPaymentStructure(30000)],
        checkedIn: false,
        promoCode: null,
      }

      await repository.saveCheckout(checkout)

      const events = await getEventById(dynamodb, 'id-2')
      expect(events).toEqual(expect.arrayContaining([formatDynamoDbJson({ ...checkoutEvent, id: 'id-2' })]))
    })
    it('should create an order', async () => {
      let checkout = {
        order: { ...fakeOrder, status: 'pending' as Order['status'] },
        total: { amount: 30000, currency: 'USD' as Currency },
        customer: romainCustomer,
        payment: { status: 'pending' as PaymentStatus, intent: fakePaymentIntent, customer: fakeStripeCustomer },
        paymentStructures: [fakeDirectPaymentStructure(3000)],
        checkedIn: false,
        promoCode: null,
      }

      await repository.saveCheckout(checkout)

      let order = await repository.getOrderById(fakeOrder.id)
      expect(order).toEqual({
        order: { ...fakeOrder, status: 'pending' },
        customer: romainCustomer,
        paymentStructures: [fakeDirectPaymentStructure(3000)],
        checkedIn: false,
        promoCode: null,
      })
    })
    it('should create a payment', async () => {
      let checkout = {
        order: { ...fakeOrder, status: 'pending' as Order['status'] },
        total: { amount: 30000, currency: 'USD' as Currency },
        customer: romainCustomer,
        payment: { status: 'pending' as PaymentStatus, intent: fakePaymentIntent, customer: fakeStripeCustomer },
        paymentStructures: [fakeDirectPaymentStructure(30000)],
        checkedIn: false,
        promoCode: null,
      }

      await repository.saveCheckout(checkout)

      let payment = await repository.getPaymentByStripeId(fakePaymentIntent.id)
      expect(payment).toEqual({
        id: 'id-1',
        orderId: fakeOrder.id,
        amount: 30000,
        currency: 'USD',
        status: 'pending',
        dueDate: null,
        stripe: { id: fakePaymentIntent.id, secret: fakePaymentIntent.secret, customerId: fakeStripeCustomer.id },
      })
    })
    describe('when the payment structure is installment', () => {
      it('should create a proceed checkout event', async () => {
        let checkout = {
          order: fakeOrder,
          total: { amount: 30000, currency: 'USD' as Currency },
          customer: romainCustomer,
          payment: { status: 'pending' as PaymentStatus, intent: fakePaymentIntent, customer: fakeStripeCustomer },
          paymentStructures: [fakeInstallmentPaymentStructure(30000, [10000, 10000, 10000])],
          checkedIn: false,
          promoCode: null,
        }

        await repository.saveCheckout(checkout)

        const events = await getEventById(dynamodb, checkoutEvent.id)
        expect(events).toEqual(expect.arrayContaining([formatDynamoDbJson(checkoutInstallmentEvent)]))
      })
      it('should create an order', async () => {
        let checkout = {
          order: { ...fakeOrder, status: 'pending' as Order['status'] },
          total: { amount: 30000, currency: 'USD' as Currency },
          customer: romainCustomer,
          payment: { status: 'pending' as PaymentStatus, intent: fakePaymentIntent, customer: fakeStripeCustomer },
          paymentStructures: [fakeInstallmentPaymentStructure(30000, [10000, 10000, 10000])],
          checkedIn: false,
          promoCode: null,
        }

        await repository.saveCheckout(checkout)

        let order = await repository.getOrderById(fakeOrder.id)
        expect(order).toEqual({
          order: { ...fakeOrder, status: 'pending' },
          customer: romainCustomer,
          paymentStructures: [fakeInstallmentPaymentStructure(30000, [10000, 10000, 10000])],
          checkedIn: false,
          promoCode: null,
        })
      })
      it('should create a payment', async () => {
        let checkout = {
          order: { ...fakeOrder, status: 'pending' as Order['status'] },
          total: { amount: 30000, currency: 'USD' as Currency },
          customer: romainCustomer,
          payment: { status: 'pending' as PaymentStatus, intent: fakePaymentIntent, customer: fakeStripeCustomer },
          paymentStructures: [fakeInstallmentPaymentStructure(30000, [10000, 10000, 10000])],
          checkedIn: false,
          promoCode: null,
        }

        await repository.saveCheckout(checkout)

        let payments = await repository.getPendingPayments(new Date('2025-01-01'))
        expect(payments).toEqual(
          expect.arrayContaining([
            {
              id: 'id-1',
              orderId: fakeOrder.id,
              amount: 10000,
              currency: 'USD',
              status: 'pending',
              dueDate: new Date('2024-01-01'),
              stripe: { id: fakePaymentIntent.id, secret: fakePaymentIntent.secret, customerId: fakeStripeCustomer.id },
            },
            {
              id: 'id-2',
              orderId: fakeOrder.id,
              amount: 10000,
              currency: 'USD',
              status: 'pending',
              dueDate: new Date('2024-02-01'),
              stripe: { id: null, secret: null, customerId: fakeStripeCustomer.id },
            },
            {
              id: 'id-3',
              orderId: fakeOrder.id,
              amount: 10000,
              currency: 'USD',
              status: 'pending',
              dueDate: new Date('2024-03-01'),
              stripe: { id: null, secret: null, customerId: fakeStripeCustomer.id },
            },
          ])
        )
      })
    })
  })
  describe('save the payment status', () => {
    it('should create a payment success event', async () => {
      await repository.saveCheckout({
        order: fakeOrder,
        total: { amount: 30000, currency: 'USD' },
        customer: romainCustomer,
        payment: { status: 'pending', intent: fakePaymentIntent, customer: fakeStripeCustomer },
        paymentStructures: [fakeDirectPaymentStructure(30000)],
        checkedIn: false,
        promoCode: null,
      })

      await repository.savePaymentStatus({
        order: { id: fakeOrder.id },
        payment: { stripeId: fakePaymentIntent.id, status: 'completed' },
      })

      const events = await getEventById(dynamodb, successPaymentStatusEvent3.id)
      expect(events).toEqual(expect.arrayContaining([formatDynamoDbJson(successPaymentStatusEvent3)]))
      let expectedPayment = {
        id: 'id-1',
        orderId: fakeOrder.id,
        amount: 30000,
        currency: 'USD',
        status: 'completed',
        dueDate: null,
        stripe: { id: fakePaymentIntent.id, secret: fakePaymentIntent.secret, customerId: fakeStripeCustomer.id },
      }
      expect(await repository.getPaymentByStripeId(fakePaymentIntent.id)).toEqual(expectedPayment)
      expect(await repository.getPaymentById(expectedPayment.id)).toEqual(expectedPayment)
      let order = await repository.getOrderById(fakeOrder.id)
      expect(order?.order).toMatchObject({ status: 'paid' })
    })
    it('should create a payment failed event', async () => {
      await repository.saveCheckout({
        order: fakeOrder,
        total: { amount: 30000, currency: 'USD' },
        customer: romainCustomer,
        payment: { status: 'pending', intent: fakePaymentIntent, customer: fakeStripeCustomer },
        paymentStructures: [fakeDirectPaymentStructure(30000)],
        checkedIn: false,
        promoCode: null,
      })

      await repository.savePaymentStatus({
        order: { id: fakeOrder.id },
        payment: { stripeId: fakePaymentIntent.id, status: 'failed' },
      })

      const events = await getEventById(dynamodb, failedPaymentStatusEvent.id)
      expect(events).toEqual(expect.arrayContaining([formatDynamoDbJson(failedPaymentStatusEvent)]))
      expect(await repository.getPaymentByStripeId(fakePaymentIntent.id)).toEqual({
        id: 'id-1',
        orderId: fakeOrder.id,
        amount: 30000,
        currency: 'USD',
        status: 'failed',
        dueDate: null,
        stripe: { id: fakePaymentIntent.id, secret: fakePaymentIntent.secret, customerId: fakeStripeCustomer.id },
      })
      let order = await repository.getOrderById(fakeOrder.id)
      expect(order?.order).toMatchObject({ status: 'pending' })
    })
  })
  it('should replay events', async () => {
    await repository.saveCheckout({
      order: fakeOrder,
      total: { amount: 30000, currency: 'USD' },
      customer: romainCustomer,
      payment: { status: 'pending', intent: fakePaymentIntent, customer: fakeStripeCustomer },
      paymentStructures: [fakeDirectPaymentStructure(30000)],
      checkedIn: false,
      promoCode: null,
    })
    await deleteOrderById(dynamodb, fakeOrder.id)
    expect(await repository.getOrderById(fakeOrder.id)).toBeNull()

    await repository.replayEvents({ from: new Date('1990-01-01'), to: new Date('1990-01-03') })

    expect(await repository.getOrderById(fakeOrder.id)).toEqual({
      order: fakeOrder,
      customer: romainCustomer,
      paymentStructures: [fakeDirectPaymentStructure(30000)],
      checkedIn: false,
      promoCode: null,
    })
  })

  const cleanUp = async () => {
    await deleteEventById(dynamodb, 'id-1')
    await deleteEventById(dynamodb, 'id-2')
    await deleteEventById(dynamodb, 'id-3')
    await deleteEventById(dynamodb, 'id-4')
    await deleteEventById(dynamodb, 'id-5')
    await deleteEventById(dynamodb, 'id-6')
    await deleteEventById(dynamodb, 'id-7')
    await deleteEventById(dynamodb, 'event-1')
    await deleteEventById(dynamodb, 'event-2')
    await deleteEventById(dynamodb, 'event-3')
    await deleteOrderById(dynamodb, fakeOrder.id)
    await deleteSalesById(dynamodb, fakeSales.id)
    await deleteSalesById(dynamodb, 'id-2')
    await deleteSalesById(dynamodb, 'id-3')
    await deletePaymentById(dynamodb, 'id-1')
    await deletePaymentById(dynamodb, 'id-2')
    await deletePaymentById(dynamodb, 'id-3')
    await deletePaymentById(dynamodb, 'id-4')
    await deletePaymentById(dynamodb, 'id-5')
    await deletePaymentById(dynamodb, 'id-6')
  }
})

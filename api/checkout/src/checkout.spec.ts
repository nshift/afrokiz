import { beforeEach, describe, expect, it } from '@jest/globals'
import { GetOrders, UploadQrCode } from './adapters/document/storage.gateway'
import { confirmationEmail } from './adapters/email/email.confirmation'
import { SendingBulkEmails, SendingEmail } from './adapters/email/email.gateway'
import { paymentConfirmationEmail } from './adapters/email/email.payment.confirmation'
import { CreatingPaymentIntent } from './adapters/payment/payment.gateway'
import { ImportOrderQueueRequest } from './adapters/queue.gateway'
import { UUIDGenerator } from './adapters/uuid.generator'
import { Checkout } from './checkout'
import {
  directPaymentStructure,
  order as fakeOrder,
  orderWithOptions as fakeOrderWithOptions,
  paymentIntent as fakePaymentIntent,
  qrCode as fakeQrCode,
  qrCodeUrl as fakeQrCodeUrl,
  stripeCustomer as fakeStripeCustomer,
  installmentPaymentStructure,
  installmentPaymentStructureSchema,
  massagePromotion,
  romainCustomer,
} from './doubles/fixtures'
import { mock } from './doubles/mock'
import { InMemoryRepository } from './doubles/repository.in-memory'
import { Currency } from './types/currency'
import { PaymentIntent } from './types/payment-intent'

let checkout: Checkout
let emailGateway: SendingEmail & SendingBulkEmails
let queueAdapter: ImportOrderQueueRequest
let paymentAdapter: CreatingPaymentIntent
let repository: InMemoryRepository
let storageAdapter: GetOrders & UploadQrCode
let uuidGenerator: UUIDGenerator

beforeEach(() => {
  uuidGenerator = { generate: () => '1' }
  emailGateway = mock()
  storageAdapter = mock({
    uploadQrCode: jest.fn(async () => fakeQrCodeUrl),
    getOrdersFromImports: jest.fn(async () => []),
    getQrCodeUrl: jest.fn(async () => fakeQrCodeUrl),
  })
  queueAdapter = mock()
  paymentAdapter = mock({
    createPaymentIntent: jest.fn(
      async (input: {
        order: { id: string }
        total: { amount: number; currency: Currency }
      }): Promise<PaymentIntent> => ({
        id: fakePaymentIntent.id,
        secret: fakePaymentIntent.secret,
      })
    ),
    createPaymentIntentForInstallment: jest.fn(async () => ({
      id: fakePaymentIntent.id,
      secret: fakePaymentIntent.secret,
    })),
    createCustomer: jest.fn(async () => fakeStripeCustomer),
    chargeCustomerInstallment: jest.fn(),
  })
  repository = new InMemoryRepository(uuidGenerator)
  checkout = new Checkout(
    repository,
    paymentAdapter,
    emailGateway,
    { generateOrderQrCode: async (order: { id: string }) => fakeQrCode },
    storageAdapter,
    queueAdapter,
    { today: () => new Date('2024-01-01') },
    uuidGenerator
  )
})

describe('Create an order when checking out', () => {
  it('should save an order', async () => {
    const { order } = await checkout.proceed({
      newOrder: fakeOrder,
      customer: romainCustomer,
      paymentOption: { method: 'card', structure: 'direct' },
      promoCode: null,
    })

    expect({
      order: { ...fakeOrder, id: expect.any(String), status: 'pending' },
      payment: { status: 'pending', intent: fakePaymentIntent, customer: fakeStripeCustomer },
      paymentStructures: [{ ...directPaymentStructure(30000), paymentId: '1' }],
      customer: romainCustomer,
      promoCode: null,
      checkedIn: false,
    }).toEqual(await repository.getOrderById(order.id))
  })
  it('should create a payment intent', async () => {
    const { payment } = await checkout.proceed({
      newOrder: fakeOrder,
      customer: romainCustomer,
      paymentOption: { method: 'card', structure: 'direct' },
      promoCode: null,
    })
    expect(fakePaymentIntent.secret).toEqual(payment.intent.secret)
  })
  describe('with existing order', () => {
    it('should create a payment intent with the amount of the new items', async () => {
      const { order: oldOrder } = await checkout.proceed({
        newOrder: fakeOrder,
        customer: romainCustomer,
        paymentOption: { method: 'card', structure: 'direct' },
        promoCode: null,
      })

      const { order: newOrder } = await checkout.proceed({
        newOrder: { ...fakeOrderWithOptions, id: oldOrder.id },
        customer: romainCustomer,
        paymentOption: { method: 'card', structure: 'direct' },
        promoCode: null,
      })

      expect(paymentAdapter.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          total: { amount: 20000, currency: 'USD' },
        })
      )
      expect({
        order: { ...newOrder, id: oldOrder.id, status: 'pending' },
        payment: { status: 'pending', intent: fakePaymentIntent, customer: fakeStripeCustomer },
        paymentStructures: [
          { ...directPaymentStructure(30000), paymentId: '1' },
          { ...directPaymentStructure(20000), paymentId: '1' },
        ],
        customer: romainCustomer,
        promoCode: null,
        checkedIn: false,
      }).toEqual(await repository.getOrderById(oldOrder.id))
    })
  })
  describe('when the payment option is installment', () => {
    it('should create a payment intent', async () => {
      const { order } = await checkout.proceed({
        newOrder: fakeOrder,
        customer: romainCustomer,
        paymentOption: { method: 'card', structure: 'installment3x' },
        promoCode: null,
      })

      expect(paymentAdapter.createPaymentIntentForInstallment).toHaveBeenCalledWith({
        order: expect.objectContaining({ id: order.id }),
        total: { amount: 10000, currency: 'USD' },
        customer: fakeStripeCustomer,
      })
      let installmentPaymentStructures = installmentPaymentStructure(30000, [10000, 10000, 10000])
      expect({
        order: { ...fakeOrder, id: order.id, status: 'pending' },
        payment: { status: 'pending', intent: fakePaymentIntent, customer: fakeStripeCustomer },
        paymentStructures: [
          {
            ...installmentPaymentStructures,
            dueDates: installmentPaymentStructures.dueDates.map((dueDate) => ({
              ...dueDate,
              paymentId: '1',
            })),
          },
        ],
        customer: romainCustomer,
        promoCode: null,
        checkedIn: false,
      }).toEqual(await repository.getOrderById(order.id))
    })
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
      paymentOption: { method: 'card', structure: 'direct' },
      promoCode: null,
    })

    await checkout.handlePayment({
      orderId: newOrder.id,
      payment: { stripeId: fakePaymentIntent.id, status: 'completed' },
    })

    const updatedOrder = await repository.getOrderById(newOrder.id)
    expect(updatedOrder).toEqual({
      order: { ...fakeOrder, id: newOrder.id, status: 'pending' },
      payment: { status: 'completed', intent: fakePaymentIntent, customer: fakeStripeCustomer },
      paymentStructures: [{ ...directPaymentStructure(30000), paymentId: '1' }],
      customer: romainCustomer,
      promoCode: null,
      checkedIn: false,
    })
  })
  it('should send a confirmation email', async () => {
    const { order: newOrder } = await checkout.proceed({
      newOrder: fakeOrder,
      customer: romainCustomer,
      paymentOption: { method: 'card', structure: 'direct' },
      promoCode: null,
    })

    await checkout.handlePayment({
      orderId: newOrder.id,
      payment: { stripeId: fakePaymentIntent.id, status: 'completed' },
    })

    expect(emailGateway.sendBulkEmails).toHaveBeenCalledWith(
      confirmationEmail(
        [
          {
            order: { ...fakeOrder, id: newOrder.id },
            customer: romainCustomer,
            qrCodeUrl: fakeQrCodeUrl,
          },
        ],
        uuidGenerator
      )
    )
  })
  describe('when the payment is not the first one', () => {
    it.skip('should send a payment confirmation email', async () => {
      const { order: newOrder } = await checkout.proceed({
        newOrder: fakeOrder,
        customer: romainCustomer,
        paymentOption: { method: 'card', structure: 'installment3x' },
        promoCode: null,
      })

      await checkout.handlePayment({
        orderId: newOrder.id,
        payment: { stripeId: fakePaymentIntent.id, status: 'completed' },
      })
      await checkout.handlePayment({
        orderId: newOrder.id,
        payment: { stripeId: fakePaymentIntent.id, status: 'completed' },
      })

      let expectedInstallment = installmentPaymentStructureSchema(30000, [10000, 10000, 10000])
      expect(emailGateway.sendBulkEmails).toHaveBeenCalledWith(
        paymentConfirmationEmail(
          [
            {
              order: { ...fakeOrder, id: newOrder.id },
              customer: romainCustomer,
              installment: {
                ...expectedInstallment,
                dueDates: expectedInstallment.dueDates.map((dueDate, index) =>
                  index != 0 ? { ...dueDate } : { ...dueDate, status: 'completed' }
                ),
              },
            },
          ],
          uuidGenerator
        )
      )
    })
  })
})

describe('Handling failing payment when checking out', () => {
  it('should update the payment status', async () => {
    const { order: newOrder } = await checkout.proceed({
      newOrder: fakeOrder,
      customer: romainCustomer,
      paymentOption: { method: 'card', structure: 'direct' },
      promoCode: null,
    })

    await checkout.handlePayment({
      orderId: newOrder.id,
      payment: { stripeId: fakePaymentIntent.id, status: 'failed' },
    })

    const updatedOrder = await repository.getOrderById(newOrder.id)
    expect(updatedOrder).toEqual({
      order: { ...fakeOrder, id: newOrder.id, status: 'pending' },
      payment: { status: 'failed', intent: fakePaymentIntent, customer: fakeStripeCustomer },
      paymentStructures: [{ ...directPaymentStructure(30000), paymentId: '1' }],
      customer: romainCustomer,
      promoCode: null,
      checkedIn: false,
    })
  })
})

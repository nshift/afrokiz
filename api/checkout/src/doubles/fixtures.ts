import { DeleteCommand, DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import fs from 'fs'
import { DateTime } from 'luxon'
import path from 'path'
import { Email } from '../adapters/email/email'
import { EmailTemplate } from '../adapters/email/email.template'
import { CreateOrder } from '../adapters/repository/events/create-order.event'
import { SuccessfulPaymentOrder } from '../adapters/repository/events/successful-payment.event'
import { makeDiscountPromotion, makeGiveAwayPromotion } from '../adapters/repository/promotions'
import { DirectPaymentSchema, InstallmentPaymentSchema, SaleSchema } from '../adapters/repository/requests'
import { Environment } from '../environment'
import { Customer } from '../types/customer'
import { InstallmentPayment } from '../types/installment'
import { Order } from '../types/order'
import { DirectPayment } from '../types/payment'
import { PaymentIntent } from '../types/payment-intent'
import { DiscountPromotion, GiveAwayPromotion } from '../types/promotion'
import { Sales } from '../types/sales'

export const testEmailTemplate: EmailTemplate = {
  name: 'EmailDoublesTemplate',
  subject: 'Email template testing',
  html: `
  Hi,

  This is a test made by {{author}}.

  Best regards,
  `.replace(/\n/g, '<br />'),
  destinations: [{ toAddresses: ['romain.asnar@gmail.com'], data: { author: 'Uncle Bob' } }],
}

export const fakeQrCode = () => fs.readFileSync(path.join(__dirname, './qr-code.png'))

export const testEmail: Email = {
  subject: 'Email testing',
  destinations: ['romain.asnar@gmail.com'],
  cc: ['romain.a@nshift.co.th'],
  html: `
  Hi,

  This is a test made by Uncle Bob.

  Best regards,
  `.replace(/\n/g, '<br />'),
  attachments: [
    {
      filename: 'qr-code.png',
      content: fakeQrCode(),
    },
  ],
}

export const paymentIntent: PaymentIntent = {
  id: 'payment-intent-1',
  secret: 'client-secret',
}

export const stripeCustomer: { id: string } = {
  id: 'stripe-customer-1',
}

export const directPaymentStructure = (amount: number): DirectPayment => ({
  amount,
  currency: 'USD',
  status: 'pending',
})

export const directPaymentStructureSchema = (amount: number): DirectPaymentSchema => ({
  amount,
  currency: 'USD',
  status: 'pending',
  paymentId: 'id-1',
})

export const installmentPaymentStructure = (amount: number, dueDatesAmount: number[]): InstallmentPayment => ({
  principalAmount: amount,
  currency: 'USD',
  frequency: 'monthly',
  term: 2,
  dueDates: dueDatesAmount.map((amount, index) => ({
    amount,
    currency: 'USD',
    dueDate: DateTime.fromJSDate(new Date('2024-01-01')).plus({ month: index }).toJSDate(),
    status: 'pending',
  })),
})

export const installmentPaymentStructureSchema = (
  amount: number,
  dueDatesAmount: number[]
): InstallmentPaymentSchema => ({
  principalAmount: amount,
  currency: 'USD',
  frequency: 'monthly',
  term: 3,
  dueDates: dueDatesAmount.map((amount, index) => ({
    amount,
    currency: 'USD',
    dueDate: DateTime.fromJSDate(new Date('2024-01-01')).plus({ month: index }).toJSDate(),
    status: 'pending',
    paymentId: 'id-' + (index + 1),
  })),
})

export const order: Order = {
  id: 'order-1',
  date: new Date('1990-01-01'),
  status: 'paid',
  items: [
    {
      id: 'vip-gold',
      title: 'VIP Gold Pass',
      includes: ['All parties and workshops'],
      amount: 1,
      total: { amount: 30000, currency: 'USD' },
    },
  ],
  total: { amount: 30000, currency: 'USD' },
}

export const orderWithOptions: Order = {
  id: 'order-1',
  status: 'pending',
  date: new Date('1990-01-01'),
  items: [
    {
      id: 'vip-gold',
      title: 'VIP Gold Pass',
      includes: ['All parties and workshops'],
      amount: 1,
      total: { amount: 30000, currency: 'USD' },
    },
    {
      id: 'special-option',
      title: 'Special Option',
      includes: ['Special option'],
      amount: 1,
      total: { amount: 20000, currency: 'USD' },
    },
  ],
  total: { amount: 50000, currency: 'USD' },
}

export const romainCustomer: Customer = {
  email: 'romain.asnar@gmail.com',
  fullname: 'Romain Asnar',
  type: 'leader',
}

export const createOrder: CreateOrder = {
  id: 'order-1',
  passId: 'pass-1',
  date: new Date('1990-01-01'),
  promoCode: null,
  paymentIntentId: paymentIntent.id,
  paymentStatus: 'pending',
  items: [
    {
      id: 'item-1',
      title: 'VIP Gold Pass',
      includes: ['All parties and workshops'],
      amount: 1,
      total: { amount: 30000, currency: 'USD' },
    },
  ],
  dancerType: 'leader',
  email: romainCustomer.email,
  fullname: romainCustomer.fullname,
}

export const successfulPaymentOrder: SuccessfulPaymentOrder = {
  id: 'order-1',
  passId: 'pass-1',
  date: new Date('1990-01-01'),
  promoCode: null,
  paymentIntentId: paymentIntent.id,
  paymentStatus: 'success',
  items: [
    {
      id: 'item-1',
      title: 'VIP Gold Pass',
      includes: ['All parties and workshops'],
      amount: 1,
      total: { amount: 30000, currency: 'USD' },
    },
  ],
  dancerType: 'leader',
  email: romainCustomer.email,
  fullname: romainCustomer.fullname,
}

export const massagePromotion: GiveAwayPromotion = makeGiveAwayPromotion({
  id: 'massage',
  code: 'MASSAGE',
  expirationDate: new Date('3000-01-01'),
  isActive: true,
  options: [
    {
      title: '1H tradtional massage.',
      description: '1H tradtional massage.',
    },
  ],
  isAppliable: () => true,
})

export const discountPromotion: DiscountPromotion = makeDiscountPromotion({
  id: '5off',
  code: '5OFF',
  expirationDate: new Date('3000-01-01'),
  isActive: false,
  discount: 0.5,
  isAppliable: () => true,
})

export const qrCode = fs.readFileSync(path.join(__dirname, 'qr-code.png'))

export const qrCodeUrl = 'https://afrokizbkk.com/qr-code/42.png'

export const checkoutEvent = {
  id: 'id-4',
  name: 'ProceedToCheckoutV2',
  time: new Date('1990-01-02 10:03'),
  data: {
    checkout: {
      order,
      customer: romainCustomer,
      paymentStructures: [directPaymentStructureSchema(30000)],
      checkedIn: false,
      promoCode: undefined,
    },
    payments: [
      {
        id: 'id-1',
        orderId: order.id,
        amount: 30000,
        currency: 'USD',
        status: 'pending',
        stripeCustomerId: stripeCustomer.id,
        stripePaymentIntentId: paymentIntent.id,
        stripePaymentIntentSecret: paymentIntent.secret,
      },
    ],
  },
}

export const checkoutInstallmentEvent = {
  id: 'id-4',
  name: 'ProceedToCheckoutV2',
  time: new Date('1990-01-02 10:05'),
  data: {
    checkout: {
      order,
      customer: romainCustomer,
      paymentStructures: [installmentPaymentStructureSchema(30000, [10000, 10000, 10000])],
      checkedIn: false,
      promoCode: undefined,
    },
    payments: [
      {
        id: 'id-1',
        orderId: order.id,
        amount: 10000,
        currency: 'USD',
        status: 'pending',
        dueDate: new Date('2024-01-01'),
        stripeCustomerId: stripeCustomer.id,
        stripePaymentIntentId: paymentIntent.id,
        stripePaymentIntentSecret: paymentIntent.secret,
      },
      {
        id: 'id-2',
        orderId: order.id,
        amount: 10000,
        currency: 'USD',
        status: 'pending',
        dueDate: new Date('2024-02-01'),
        stripeCustomerId: stripeCustomer.id,
        stripePaymentIntentId: null,
        stripePaymentIntentSecret: null,
      },
      {
        id: 'id-3',
        orderId: order.id,
        amount: 10000,
        currency: 'USD',
        status: 'pending',
        dueDate: new Date('2024-03-01'),
        stripeCustomerId: stripeCustomer.id,
        stripePaymentIntentId: null,
        stripePaymentIntentSecret: null,
      },
    ],
  },
}

export const sales: Sales = {
  id: 'order-1',
  date: new Date('1990-01-02'),
  email: 'romain.asnar+1@gmail.com',
  fullname: romainCustomer.fullname,
  customerType: romainCustomer.type,
  pass: 'vip-gold',
  promoCode: '',
  paymentStatus: 'success',
  items: [
    {
      id: 'item-1',
      title: 'VIP Gold Pass',
      includes: ['All parties and workshops'],
      amount: 1,
      total: { amount: 30000, currency: 'USD' },
    },
  ],
  total: {
    amount: 51000,
    currency: 'USD',
  },
}

export const salesSchema: SaleSchema = {
  id: 'id-3',
  orderId: 'order-1',
  date: new Date('1990-01-02'),
  customer: romainCustomer,
  passId: 'vip-gold',
  items: [
    {
      id: 'vip-gold',
      title: 'VIP Gold Pass',
      includes: ['All parties and workshops'],
      amount: 1,
    },
  ],
  total: { amount: 30000, currency: 'USD' },
  promoCode: null,
}

export const successPaymentStatusEvent = {
  id: 'id-2',
  name: 'UpdatePaymentStatus',
  time: new Date('1990-01-02 10:03'),
  data: {
    sales: {
      ...salesSchema,
      id: 'id-3',
      date: new Date('1990-01-02 10:03'),
    },
    orderId: order.id,
    paymentStatus: 'completed',
  },
}

export const successPaymentStatusEvent3 = {
  id: 'id-3',
  name: 'UpdatePaymentStatusV2',
  time: new Date('1990-01-02 10:04'),
  data: {
    orderId: order.id,
    paymentId: 'id-1',
    paymentStatus: 'completed',
  },
}

export const failedPaymentStatusEvent = {
  id: 'id-3',
  name: 'UpdatePaymentStatusV2',
  time: new Date('1990-01-02 10:04'),
  data: {
    orderId: order.id,
    paymentId: 'id-1',
    paymentStatus: 'failed',
  },
}

export function getEventById(dynamodb: DynamoDBDocumentClient, id: string) {
  return dynamoDbQueryById(dynamodb, { tableName: Environment.EventTableName(), id })
}

export function deleteEventById(dynamodb: DynamoDBDocumentClient, id: string) {
  return dynamodb.send(new DeleteCommand({ TableName: Environment.EventTableName(), Key: { id } }))
}

export function deleteOrderById(dynamodb: DynamoDBDocumentClient, id: string) {
  return dynamodb.send(new DeleteCommand({ TableName: Environment.OrderTableName(), Key: { id } }))
}

export function deleteSalesById(dynamodb: DynamoDBDocumentClient, id: string) {
  return dynamodb.send(new DeleteCommand({ TableName: Environment.SalesTableName(), Key: { id } }))
}

export function deletePaymentById(dynamodb: DynamoDBDocumentClient, id: string) {
  return dynamodb.send(new DeleteCommand({ TableName: Environment.PaymentTableName(), Key: { id } }))
}

export async function dynamoDbQueryById(
  dynamodb: DynamoDBDocumentClient,
  query: { tableName: string; id: string }
): Promise<Record<string, any>[]> {
  return executeDynamodbQueryRequest(
    dynamodb,
    new QueryCommand({
      TableName: query.tableName,
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: { '#id': 'id' },
      ExpressionAttributeValues: { ':id': query.id },
    })
  )
}

export async function executeDynamodbQueryRequest(
  dynamodb: DynamoDBDocumentClient,
  command: QueryCommand
): Promise<Record<string, any>[]> {
  const response = await dynamodb.send(command)
  return response.Items ?? []
}

export function formatDynamoDbJson(data: any): any {
  return JSON.parse(
    JSON.stringify(data, function (key, value) {
      if (this[key] instanceof Date) {
        return this[key].toISOString()
      }
      if (this[key] === null) {
        return undefined
      }
      return value
    })
  )
}

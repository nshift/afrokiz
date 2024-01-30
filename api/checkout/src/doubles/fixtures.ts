import { DeleteCommand, DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import fs from 'fs'
import path from 'path'
import { Email } from '../adapters/email/email'
import { EmailTemplate } from '../adapters/email/email.template'
import { CreateOrder } from '../adapters/repository/events/create-order.event'
import { SuccessfulPaymentOrder } from '../adapters/repository/events/successful-payment.event'
import { makeDiscountPromotion, makeGiveAwayPromotion } from '../adapters/repository/promotions'
import { SaleSchema } from '../adapters/repository/requests'
import { Environment } from '../environment'
import { Customer } from '../types/customer'
import { Order } from '../types/order'
import { PaymentIntent } from '../types/payment-intent'
import { DiscountPromotion, GiveAwayPromotion } from '../types/promotion'

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
      content: fs.readFileSync(path.join(__dirname, './qr-code.png')),
    },
  ],
}

export const paymentIntent: PaymentIntent = {
  id: 'payment-intent-1',
  secret: 'client-secret',
}

export const order: Order = {
  id: 'order-1',
  // passId: 'pass-1',
  date: new Date('1990-01-01'),
  // promoCode: 'MASSAGE',
  // paymentIntentId: paymentIntent.id,
  // paymentStatus: 'pending',
  items: [
    {
      id: 'item-1',
      title: 'VIP Gold Pass',
      includes: ['All parties and workshops'],
      amount: 1,
      total: { amount: 30000, currency: 'USD' },
    },
  ],
  total: { amount: 30000, currency: 'USD' },
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
  // promoCode: 'MASSAGE',
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
  // promoCode: 'MASSAGE',
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
})

export const discountPromotion: DiscountPromotion = makeDiscountPromotion({
  id: '5off',
  code: '5OFF',
  expirationDate: new Date('3000-01-01'),
  isActive: false,
  discount: 0.5,
})

export const qrCode = fs.readFileSync(path.join(__dirname, 'qr-code.png'))

export const checkoutEvent = {
  id: 'id-1',
  name: 'ProceedToCheckout',
  time: new Date('1990-01-02 10:02'),
  data: {
    order,
    total: { amount: 30000, currency: 'USD' },
    customer: romainCustomer,
    payment: { status: 'pending', intent: paymentIntent },
  },
}

export const sales: SaleSchema = {
  id: 'id-2',
  orderId: 'order-1',
  date: new Date('1990-01-02'),
  customer: romainCustomer,
  passId: 'item-1',
  items: [
    {
      id: 'item-1',
      title: 'VIP Gold Pass',
      includes: ['All parties and workshops'],
      amount: 1,
    },
  ],
  total: { amount: 30000, currency: 'USD' },
}

export const successPaymentStatusEvent = {
  id: 'id-2',
  name: 'UpdatePaymentStatus',
  time: new Date('1990-01-02 10:03'),
  data: {
    sales: {
      ...sales,
      id: 'id-3',
      date: new Date('1990-01-02 10:03'),
    },
    orderId: order.id,
    paymentStatus: 'success',
  },
}

export const successPaymentStatusEvent3 = {
  id: 'id-3',
  name: 'UpdatePaymentStatus',
  time: new Date('1990-01-02 10:04'),
  data: {
    sales: {
      ...sales,
      id: 'id-2',
      date: new Date('1990-01-02 10:03'),
    },
    orderId: order.id,
    paymentStatus: 'success',
  },
}

export const failedPaymentStatusEvent = {
  id: 'id-3',
  name: 'UpdatePaymentStatus',
  time: new Date('1990-01-02 10:04'),
  data: {
    orderId: order.id,
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
      if (this[key] === undefined) {
        return null
      }
      return value
    })
  )
}

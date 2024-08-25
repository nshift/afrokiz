import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { S3 } from '@aws-sdk/client-s3'
import { SQSClient } from '@aws-sdk/client-sqs'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { APIGatewayEvent, APIGatewayProxyResult, Context, SQSEvent } from 'aws-lambda'
import Stripe from 'stripe'
import { v4 as uuid } from 'uuid'
import { Checkout } from '../../checkout'
import { Environment } from '../../environment'
import { StorageAdapter } from '../document/storage.adapter'
import { S3Storage } from '../document/storage.s3'
import { SESEmailService } from '../email/ses'
import { StripePaymentAdapter } from '../payment/stripe'
import { QrCodeGenerator } from '../qr-code/qr-code.generator'
import { QueueAdapter } from '../queue.adapter'
import { DynamoDbRepository } from '../repository/dynamodb'
import {
  buildImportOrderRequest,
  buildMarkPaymentAsSucceedRequest,
  buildProceedToCheckoutRequest,
  buildRequestImportOrdersRequest,
  buildResendConfirmationEmailRequest,
  buildUpdateOrderPaymentRequest,
} from './request'
import { buildOrderResponse, buildPromotionResponse } from './response'

const dynamodb = DynamoDBDocumentClient.from(new DynamoDB({}), {
  marshallOptions: { removeUndefinedValues: true },
})
const dateGenerator = { today: () => new Date() }
const repository = new DynamoDbRepository(dynamodb, { generate: uuid }, dateGenerator)
const stripe = new Stripe(Environment.StripeSecretKey())
const paymentAdapter = new StripePaymentAdapter(stripe)
const emailApi = new SESEmailService({ email: 'afrokiz.bkk@gmail.com', name: 'AfroKiz BKK' })
const qrCodeGenerator = new QrCodeGenerator()
const s3Client = new S3Storage(new S3({}), Environment.DocumentBucketName())
const documentAdapter = new StorageAdapter(s3Client, dateGenerator)
const queueAdapter = new QueueAdapter(new SQSClient({}))
const checkout = new Checkout(
  repository,
  paymentAdapter,
  emailApi,
  qrCodeGenerator,
  documentAdapter,
  queueAdapter,
  dateGenerator
)

export const proceedToCheckout = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body ?? '{}')
  const request = buildProceedToCheckoutRequest(body)
  try {
    const { order, customer, promoCode, payment } = await checkout.proceed(request)
    return successResponse({
      ...buildOrderResponse({ order, customer, promoCode, payment }),
      clientSecret: payment.intent.secret,
    })
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const updateOrderPaymentStatus = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const request = buildUpdateOrderPaymentRequest(event, stripe)
  try {
    switch (request.type) {
      case 'payment_intent.succeeded':
        await checkout.handlePayment({ orderId: request.orderId, payment: { status: 'success' } })
        break
      case 'payment_intent.payment_failed':
        await checkout.handlePayment({ orderId: request.orderId, payment: { status: 'failed' } })
        break
      default:
        break
    }
    return successfullyCreatedResponse()
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const markPaymentAsSucceed = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const request = buildMarkPaymentAsSucceedRequest(event)
    console.log('[markPaymentAsSucceed] Request.', { request })
    await checkout.handlePayment({ orderId: request.orderId, payment: { status: 'success' } })
    return successfullyCreatedResponse()
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const getOrder = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const orderId = event.pathParameters?.id
  if (!orderId) {
    return notFoundErrorResponse('Order id is required.')
  }
  try {
    const order = await checkout.getOrder(orderId)
    if (!order) {
      return notFoundErrorResponse(`Order (${orderId}) is not found.`)
    }
    return successResponse(buildOrderResponse(order))
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const getPromotion = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event.pathParameters) {
    return invalidRequestErrorResponse(`Invalid Request.`)
  }
  const { passId, code } = event.pathParameters
  if (!code) {
    return notFoundErrorResponse(`Code is required in the request.`)
  }
  if (!passId) {
    return notFoundErrorResponse(`Pass Id is required in the request.`)
  }
  try {
    const promotion = await checkout.getPromotion(passId, code)
    if (!promotion || !promotion.isActive) {
      return notFoundErrorResponse(`Promotion ${code} is not available.`)
    }
    return successResponse(buildPromotionResponse(promotion))
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const resendConfirmationEmail = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const request = buildResendConfirmationEmailRequest(event)
  try {
    await checkout.resendConfirmationEmail(request.orderId)
    return successfullyCreatedResponse()
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const requestImportOrders = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const request = buildRequestImportOrdersRequest(event)
  try {
    const orders = await checkout.requestImportOrders(request.csvPath)
    return successResponse({
      numberOfImports: orders.length,
      orderIds: orders.map((order) => order.id),
    })
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const importOrder = async (event: SQSEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (event.Records.length > 1) {
    console.error('There is more than one record.', { records: event.Records })
  }
  const record = event.Records[0]
  if (!record) {
    console.error('There is no record.', { event })
  }
  const request = buildImportOrderRequest(record)
  try {
    await checkout.importOrder(request.orderId)
    return successfullyCreatedResponse()
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const sendRegistrationCampaign = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const data = await checkout.sendRegistrationCampaign()
    return successResponse({ numberOfOrderProcessed: data.length, orders: data.map((order) => order.sale.id) })
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

// const unauthorizedErrorResponse = (message: string) => ({
//   statusCode: 401,
//   headers,
//   body: JSON.stringify({ message }),
// })

const notFoundErrorResponse = (message: string) => ({
  statusCode: 404,
  headers,
  body: JSON.stringify({ message }),
})

const invalidRequestErrorResponse = (message: string) => ({
  statusCode: 400,
  headers,
  body: JSON.stringify({ message }),
})

const successfullyCreatedResponse = () => ({
  statusCode: 201,
  headers,
  body: '',
})

const successResponse = (body: any) => ({
  statusCode: 200,
  headers,
  body: JSON.stringify(body),
})

const internalServerErrorResponse = (error: any) => ({
  statusCode: 500,
  headers,
  body: JSON.stringify({ message: error?.message ?? `Unknown error: ${error}` }),
})

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

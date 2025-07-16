import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { S3 } from '@aws-sdk/client-s3'
import { SQSClient } from '@aws-sdk/client-sqs'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { APIGatewayEvent, APIGatewayProxyResult, Context, SQSEvent } from 'aws-lambda'
import Stripe from 'stripe'
import { v4 as uuid } from 'uuid'
import { Checkout } from '../../checkout'
import { Environment } from '../../environment'
import {
  mapCustomer as mapEdition2Customer,
  mapOrder as mapEdition2Order,
  mapPromoCode as mapEdition2PromoCode,
} from '../document/csv/edition2-order.map'
import { mapCustomer, mapOrder, mapPromoCode } from '../document/csv/edition3-order.map'
import { StorageAdapter } from '../document/storage.adapter'
import { S3Storage } from '../document/storage.s3'
import { SESEmailService } from '../email/ses'
import { StripePaymentAdapter } from '../payment/stripe'
import { QrCodeGenerator } from '../qr-code/qr-code.generator'
import { QueueAdapter } from '../queue.adapter'
import { DynamoDbRepository } from '../repository/dynamodb'
import {
  buildCreatePaymentAuthorizationRequest,
  buildImportOrderRequest,
  buildMarkPaymentAsSucceedRequest,
  buildProceedToCheckoutRequest,
  buildRequestImportOrdersRequest,
  buildResendConfirmationEmailRequest,
  buildUpdateOrderPaymentRequest,
} from './request'
import { buildOrderResponse, buildPaymentIntentResponse, buildPaymentIntentsResponse, buildPaymentResponse, buildPaymentsResponse, buildPromotionResponse } from './response'

export const proceedToCheckout = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body ?? '{}')
  const request = buildProceedToCheckoutRequest(body)
  try {
    const { order, customer, promoCode, payment, paymentStructures, checkedIn } = await checkout.proceed(request)
    return successResponse({
      ...buildOrderResponse({ order, paymentStructures, customer, promoCode, checkedIn }),
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
        await checkout.handlePayment({
          orderId: request.orderId,
          payment: { stripeId: request.stripeId, status: 'completed' },
        })
        break
      case 'payment_intent.payment_failed':
        await checkout.handlePayment({
          orderId: request.orderId,
          payment: { stripeId: request.stripeId, status: 'failed' },
        })
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

export const processPendingPayments = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const paymentIntents = await checkout.processPendingPayments()
    return successResponse(buildPaymentIntentsResponse(paymentIntents))
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
    await checkout.handlePayment({
      orderId: request.orderId,
      payment: { stripeId: request.stripeId, status: 'completed' },
    })
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

export const getPayment = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const paymentId = event.pathParameters?.id
  if (!paymentId) {
    return notFoundErrorResponse('Payment id is required.')
  }
  try {
    const order = await checkout.getPayment(paymentId)
    if (!order) {
      return notFoundErrorResponse(`Payment (${paymentId}) is not found.`)
    }
    return successResponse(buildPaymentResponse(order))
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const getLatePayments = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const payments = await checkout.getLatePayments()
    return successResponse(buildPaymentsResponse(payments))
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const createPaymentAuthorization = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const paymentId = event.pathParameters?.id
  if (!paymentId) {
    return notFoundErrorResponse('Payment id is required.')
  }
  let request = buildCreatePaymentAuthorizationRequest(event)
  if (!request.paymentMethodId) {
    return notFoundErrorResponse('Payment method id is required.')
  }
  try {
    const paymentIntent = await checkout.createPaymentAuthorization(paymentId, request.paymentMethodId)
    if (!paymentIntent) {
      return notFoundErrorResponse(`Payment (${paymentId}) is not found.`)
    }
    return successResponse(buildPaymentIntentResponse(paymentIntent))
  } catch (error: any) {
    console.error(error)
    if (error.code) {
      return stripeErrorResponse(error)
    }
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
  const checkout = makeEdition2Checkout()
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

export const requestImportEdition3Orders = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const request = buildRequestImportOrdersRequest(event)
  try {
    const orders = await checkout.requestImportEdition3Orders(request.csvPath)
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

export const sendDinnerCruiseCampaign = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const data = await checkout.sendDinnerCruiseCampaign()
    return successResponse({ numberOfOrderProcessed: data.length, orders: data.map((order) => order.sale.id) })
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const sendRegistrationReminderCampaign = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const data = await checkout.sendRegistrationReminderCampaign()
    return successResponse({ numberOfOrderProcessed: data.length, orders: data.map((order) => order.sale.id) })
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const sendTicketOptionCampaign = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const data = await checkout.sendTicketOptionCampaign()
    return successResponse({ numberOfOrderProcessed: data.length, orders: data.map((order) => order.id) })
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const checkIn = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const orderId = event.pathParameters?.id
  if (!orderId) {
    return notFoundErrorResponse('Order id is required.')
  }
  try {
    await checkout.checkIn(orderId)
    return successfullyCreatedResponse()
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

const makeCheckout = () => {
  const dynamodb = DynamoDBDocumentClient.from(new DynamoDB({}), {
    marshallOptions: { removeUndefinedValues: true },
  })
  let uuidGenerator = { generate: uuid }
  const dateGenerator = { today: () => new Date() }
  const repository = new DynamoDbRepository(dynamodb, uuidGenerator, dateGenerator)
  const paymentAdapter = new StripePaymentAdapter(stripe)
  const emailApi = new SESEmailService({ email: 'afrokiz.bkk@gmail.com', name: 'AfroKiz BKK' })
  const qrCodeGenerator = new QrCodeGenerator()
  const s3Client = new S3Storage(new S3({}), Environment.DocumentBucketName())
  const documentAdapter = new StorageAdapter(s3Client, { mapCustomer, mapOrder, mapPromoCode }, dateGenerator)
  const queueAdapter = new QueueAdapter(new SQSClient({}))
  const checkout = new Checkout(
    repository,
    paymentAdapter,
    emailApi,
    qrCodeGenerator,
    documentAdapter,
    queueAdapter,
    dateGenerator,
    uuidGenerator
  )
  return checkout
}

const makeEdition2Checkout = () => {
  const dynamodb = DynamoDBDocumentClient.from(new DynamoDB({}), {
    marshallOptions: { removeUndefinedValues: true },
  })
  let uuidGenerator = { generate: uuid }
  const dateGenerator = { today: () => new Date() }
  const repository = new DynamoDbRepository(dynamodb, uuidGenerator, dateGenerator)
  const paymentAdapter = new StripePaymentAdapter(stripe)
  const emailApi = new SESEmailService({ email: 'afrokiz.bkk@gmail.com', name: 'AfroKiz BKK' })
  const qrCodeGenerator = new QrCodeGenerator()
  const s3Client = new S3Storage(new S3({}), Environment.DocumentBucketName())
  const documentAdapter = new StorageAdapter(
    s3Client,
    { mapCustomer: mapEdition2Customer, mapOrder: mapEdition2Order, mapPromoCode: mapEdition2PromoCode },
    dateGenerator
  )
  const queueAdapter = new QueueAdapter(new SQSClient({}))
  const checkout = new Checkout(
    repository,
    paymentAdapter,
    emailApi,
    qrCodeGenerator,
    documentAdapter,
    queueAdapter,
    dateGenerator,
    uuidGenerator
  )
  return checkout
}

const stripe = new Stripe(Environment.StripeSecretKey())
const checkout = makeCheckout()

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

const stripeErrorResponse = (error: any) => ({
  statusCode: error?.statusCode ?? 500,
  headers,
  body: JSON.stringify({
    code: error?.code,
    message: error?.message ?? error?.raw?.message ?? `Unknown error: ${error}`
  }),
})

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

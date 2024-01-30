import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import Stripe from 'stripe'
import { v4 as uuid } from 'uuid'
import { Checkout } from '../../checkout'
import { Environment } from '../../environment'
import { SESEmailService } from '../email/ses'
import { StripePaymentAdapter } from '../payment/stripe'
import { QrCodeGenerator } from '../qr-code/qr-code.generator'
import { DynamoDbRepository } from '../repository/dynamodb'
import { buildProceedToCheckoutRequest, buildUpdateOrderPaymentRequest } from './request'
import { buildOrderResponse, buildPromotionResponse } from './response'

const dynamodb = DynamoDBDocumentClient.from(new DynamoDB({}), {
  marshallOptions: { removeUndefinedValues: true },
})
const dateGenerator = { today: () => new Date() }
const repository = new DynamoDbRepository(dynamodb, { generate: uuid }, dateGenerator)
const stripe = new Stripe(Environment.StripeSecretKey())
const paymentAdapter = new StripePaymentAdapter(stripe)
const emailApi = new SESEmailService({ email: 'afrokiz.bkk@gmail.com', name: 'DJ Ploy' })
const qrCodeGenerator = new QrCodeGenerator()
const checkout = new Checkout(repository, paymentAdapter, emailApi, qrCodeGenerator, dateGenerator)

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
  const code = event.pathParameters?.code
  if (!code) {
    return notFoundErrorResponse(`Code is required in the request.`)
  }
  try {
    const promotion = await checkout.getPromotion(code)
    if (!promotion || !promotion.isActive) {
      return notFoundErrorResponse(`Promotion ${code} is not available.`)
    }
    return successResponse(buildPromotionResponse(promotion))
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const unauthorizedErrorResponse = (message: string) => ({
  statusCode: 401,
  headers,
  body: JSON.stringify({ message }),
})

export const notFoundErrorResponse = (message: string) => ({
  statusCode: 404,
  headers,
  body: JSON.stringify({ message }),
})

export const successfullyCreatedResponse = () => ({
  statusCode: 201,
  headers,
  body: '',
})

export const successResponse = (body: any) => ({
  statusCode: 200,
  headers,
  body: JSON.stringify(body),
})

export const internalServerErrorResponse = (error: any) => ({
  statusCode: 500,
  headers,
  body: JSON.stringify({ message: error?.message ?? `Unknown error: ${error}` }),
})

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

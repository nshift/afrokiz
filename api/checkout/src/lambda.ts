import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import Stripe from 'stripe'
import { CheckingOut } from './checkout'
import { EmailApi } from './email'
import { buildCreateOrderRequest, buildUpdateOrderPaymentRequest } from './lambda.request'
import { buildOrderResponse } from './lambda.response'

const stripe = new Stripe(
  'sk_test_51MBYkWIoxYWCQwEMsloSpT6iCxutoN2rpEcAXowLNWRdZ0rhIUVFY3X6Q6UVzwOzZLEMPrSw9r23pJmHCc7oPqbm00rX3nWEtp'
)
const dynamodb = DynamoDBDocumentClient.from(new DynamoDB({}), {
  marshallOptions: { removeUndefinedValues: true },
})
const emailApi = new EmailApi({ email: 'romain.a@nshift.co.th', name: 'Romain Asnar' })

export const createOrder = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body ?? '{}')
  const request = buildCreateOrderRequest(body)
  try {
    const checkout = new CheckingOut(stripe, dynamodb, emailApi)
    const { order, clientSecret } = await checkout.createOrder(request)
    return successResponse({ ...buildOrderResponse(order), clientSecret })
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
  console.log(request)
  try {
    const checkout = new CheckingOut(stripe, dynamodb, emailApi)
    switch (request.type) {
      case 'payment_intent.succeeded':
        await checkout.handleSuccessfulPayment(request.data.object)
        break
      case 'payment_intent.payment_failed':
        await checkout.handleFailurePayment(request.data.object)
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
    const checkout = new CheckingOut(stripe, dynamodb, emailApi)
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

const headers = { 'Content-Type': 'application/json' }

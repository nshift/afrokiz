import { APIGatewayEvent } from 'aws-lambda'
import { z } from 'zod'
import { allCurrencies } from '../entities/currency'

export const PriceSchema = z.record(z.enum(allCurrencies), z.number().nonnegative())

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

export const invalidRequestErrorResponse = (message: string) => ({
  statusCode: 400,
  headers,
  body: JSON.stringify({ message }),
})

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

export const internalServerErrorResponse = (error: any) => ({
  statusCode: 500,
  headers,
  body: JSON.stringify({ message: error?.message ?? `Unknown error: ${error}` }),
})

export const getAuthenticatedUser = (event: APIGatewayEvent) => {
  let claims = event.requestContext.authorizer?.jwt.claims
  if (!claims) {
    return null
  }
  return { id: claims?.sub }
}

export const headers = { 'Content-Type': 'application/json' }

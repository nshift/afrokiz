import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { InMemoryRepository } from '../../../doubles/repository.in-memory'
import { TicketingAdministration } from '../../../use-cases/ticketing-administration'
import {
  getAuthenticatedUser,
  internalServerErrorResponse,
  invalidRequestErrorResponse,
  PriceSchema,
  successfullyCreatedResponse,
} from '../../lambda'

export const addTickets = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  let request: Request
  try {
    request = buildRequest(event)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return invalidRequestErrorResponse(error.message)
    }
    return internalServerErrorResponse(error)
  }
  try {
    let merchAdministration = new TicketingAdministration(new InMemoryRepository(), { generate: uuid })
    await merchAdministration.addTickets(request.eventId, request.tickets)
    return successfullyCreatedResponse()
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

const RequestSchema = z.object({
  eventId: z.string().min(1, 'Event id is required'),
  userId: z.string().min(1, 'User id is required'),
  tickets: z.array(
    z.object({
      name: z.string().min(1, 'Name is required'),
      price: PriceSchema,
      discountedPrice: PriceSchema.optional(),
      includes: z.array(z.string()),
      isPromoted: z.boolean(),
      isSoldOut: z.boolean(),
      options: z.array(z.string()),
    })
  ),
})

type Request = z.infer<typeof RequestSchema>

const buildRequest = (event: APIGatewayEvent) => {
  let user = getAuthenticatedUser(event)
  const body = JSON.parse(event.body ?? '{}')
  return RequestSchema.parse({ ...body, userId: user?.id })
}

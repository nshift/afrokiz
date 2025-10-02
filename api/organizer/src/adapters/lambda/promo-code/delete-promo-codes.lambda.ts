import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { z } from 'zod'
import { InMemoryRepository } from '../../../doubles/repository.in-memory'
import { PromoCodeAdministration } from '../../../use-cases/promo-code-administration'
import {
  getAuthenticatedUser,
  internalServerErrorResponse,
  invalidRequestErrorResponse,
  successfullyCreatedResponse,
} from '../../lambda'

export const deletePromoCodes = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
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
    let merchAdministration = new PromoCodeAdministration(new InMemoryRepository())
    await merchAdministration.removePromoCodes(request.eventId, request.promoCodes)
    return successfullyCreatedResponse()
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

const RequestSchema = z.object({
  eventId: z.string().min(1, 'Event id is required'),
  userId: z.string().min(1, 'User id is required'),
  promoCodes: z.array(z.string().min(1, 'Promo code is required')),
})

type Request = z.infer<typeof RequestSchema>

const buildRequest = (event: APIGatewayEvent) => {
  let user = getAuthenticatedUser(event)
  const body = JSON.parse(event.body ?? '{}')
  return RequestSchema.parse({ ...body, userId: user?.id })
}

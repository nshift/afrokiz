import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { InMemoryRepository } from '../../../doubles/repository.in-memory'
import { MerchAdministration } from '../../../use-cases/merch-administration'
import {
  getAuthenticatedUser,
  internalServerErrorResponse,
  invalidRequestErrorResponse,
  successResponse,
} from '../../lambda'

export const listMerch = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
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
    let merchAdministration = new MerchAdministration(new InMemoryRepository(), { generate: uuid })
    let merchs = await merchAdministration.listMerch(request.eventId)
    return successResponse({ merchs })
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

const RequestSchema = z.object({
  eventId: z.string().min(1, 'Event id is required'),
  userId: z.string().min(1, 'User id is required'),
})

type Request = z.infer<typeof RequestSchema>

const buildRequest = (event: APIGatewayEvent) => {
  let user = getAuthenticatedUser(event)
  const body = JSON.parse(event.body ?? '{}')
  return RequestSchema.parse({ ...body, userId: user?.id })
}

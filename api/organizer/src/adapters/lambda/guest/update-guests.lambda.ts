import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { z } from 'zod'
import { internalServerErrorResponse, invalidRequestErrorResponse, successfullyCreatedResponse } from '../../lambda'

export const updateGuests = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
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
    return successfullyCreatedResponse()
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

const RequestSchema = z.object({
  eventId: z.string().min(1, 'Event id is required'),
  guests: z.array(
    z.object({
      id: z.string().min(1, 'Id is required'),
      fullName: z.string().min(1, 'Full name is required'),
      email: z.email(),
      dancerType: z.enum(['leader', 'follower']),
    })
  ),
})

type Request = z.infer<typeof RequestSchema>

const buildRequest = (event: APIGatewayEvent) => {
  const body = JSON.parse(event.body ?? '{}')
  return RequestSchema.parse(body)
}

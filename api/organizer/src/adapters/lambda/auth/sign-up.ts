import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { z } from 'zod'
import { makeDefaultContext } from '../../../context'
import { internalServerErrorResponse, invalidRequestErrorResponse, successResponse } from '../../lambda'

export const handle = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
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
    let context = makeDefaultContext()
    let userId = await context.authenticationAdapter.signUp(request.username, request.password)
    return successResponse({ userId })
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

const RequestSchema = z.object({
  username: z.string().min(1, 'Username required'),
  password: z.string().min(1, 'Password is required'),
})

type Request = z.infer<typeof RequestSchema>

const buildRequest = (event: APIGatewayEvent) => {
  const body = JSON.parse(event.body ?? '{}')
  return RequestSchema.parse(body)
}

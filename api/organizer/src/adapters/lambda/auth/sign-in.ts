import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { z } from 'zod'
import { makeDefaultContext } from '../../../context'
import {
  internalServerErrorResponse,
  invalidRequestErrorResponse,
  notFoundErrorResponse,
  successResponse,
} from '../../lambda'

export const handle = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  let request: Request
  try {
    request = buildRequest(event)
  } catch (error) {
    console.error(error)
    if (error instanceof z.ZodError) {
      return invalidRequestErrorResponse(error.message)
    }
    return internalServerErrorResponse(error)
  }
  try {
    let context = makeDefaultContext()
    let access = await context.authenticationAdapter.signIn(request.username, request.password)
    if (!access) {
      return notFoundErrorResponse(`${request.username} is not found.`)
    }
    return successResponse({
      accessToken: access.accessToken,
      refreshToken: access.refreshToken,
      idToken: access.idToken,
      expiresIn: access.expiresIn,
    })
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

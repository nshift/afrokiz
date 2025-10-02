import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { makeDefaultContext } from '../../../context'
import { EventAdministration } from '../../../use-cases/event-administration'
import {
  getAuthenticatedUser,
  internalServerErrorResponse,
  successResponse,
  unauthorizedErrorResponse,
} from '../../lambda'

export const handle = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  let user = getAuthenticatedUser(event)
  if (!user) {
    return unauthorizedErrorResponse('User id is missing in the request.')
  }
  try {
    let context = makeDefaultContext()
    let eventAdministration = new EventAdministration(context.repository, context.uuidGenerator)
    let events = await eventAdministration.listEvent(user.id)
    return successResponse({ events })
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

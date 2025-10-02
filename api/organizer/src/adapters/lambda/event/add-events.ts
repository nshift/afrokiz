import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { z } from 'zod'
import { makeDefaultContext } from '../../../context'
import { EventAdministration } from '../../../use-cases/event-administration'
import {
  getAuthenticatedUser,
  internalServerErrorResponse,
  invalidRequestErrorResponse,
  PriceSchema,
  successfullyCreatedResponse,
} from '../../lambda'

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
    let eventAdministration = new EventAdministration(context.repository, context.uuidGenerator)
    await eventAdministration.addEvents(request.events, request.userId)
    return successfullyCreatedResponse()
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

const RequestSchema = z.object({
  userId: z.string().min(1, 'User id is required'),
  events: z.array(
    z.object({
      name: z.string().min(1, 'Name is required'),
      date: z.object({ start: z.coerce.date(), end: z.coerce.date() }).optional(),
      location: z.string().optional(),
      merchs: z.array(
        z.object({
          name: z.string().min(1, 'Name is required'),
          price: PriceSchema,
          discountedPrice: PriceSchema.optional(),
          isSoldOut: z.boolean(),
          variants: z.array(
            z.object({
              sku: z.string().min(1, 'SKU is required'),
              attributes: z.object({
                color: z.string().min(1, 'Color is required'),
                size: z.string().min(1, 'Size is required'),
              }),
              additionalPrice: PriceSchema,
              stockQuantity: z.number().nonnegative(),
            })
          ),
        })
      ),
      promoCodes: z.array(
        z.object({
          code: z.string().min(1, 'Promo code is required'),
          discountInPercent: z.number().int().positive(),
        })
      ),
      tickets: z.array(
        z.object({
          name: z.string().min(1, 'Name is required'),
          price: PriceSchema,
          discountedPrice: PriceSchema.optional(),
          includes: z.array(z.string()),
          isPromoted: z.boolean(),
          isSoldOut: z.boolean(),
          options: z.array(
            z.object({
              name: z.string().min(1, 'Name is required'),
              price: PriceSchema,
              discountedPrice: PriceSchema.optional(),
              isSoldOut: z.boolean(),
              isDefault: z.boolean(),
            })
          ),
        })
      ),
    })
  ),
})

type Request = z.infer<typeof RequestSchema>

const buildRequest = (event: APIGatewayEvent) => {
  let user = getAuthenticatedUser(event)
  let body = JSON.parse(event.body ?? '{}')
  return RequestSchema.parse({ ...body, userId: user?.id })
}

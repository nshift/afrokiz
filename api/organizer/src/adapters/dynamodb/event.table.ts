import {
  BatchGetCommand,
  BatchGetCommandOutput,
  NativeAttributeValue,
  QueryCommand,
  QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb'
import { z } from 'zod'
import { makeDictionary } from '../../dictionary'
import { allCurrencies } from '../../entities/currency'
import { EventConfiguration } from '../../entities/event-configuration'
import { Identifier } from '../../entities/identifier'
import { Merch, MerchVariant } from '../../entities/merch'
import { PromoCode } from '../../entities/promo-code'
import { Ticket, TicketOption } from '../../entities/ticket'
import { Environment } from '../../environment'

export const tableName = Environment.EventConfigurationTableName()

type PutRequestType = { PutRequest: { Item: Record<string, NativeAttributeValue> | undefined } }
type DeleteRequestType = { DeleteRequest: { Key: Record<string, NativeAttributeValue> | undefined } }

export const makePrimaryKey = (eventId: Identifier) => eventId
export const makeEventSortKey = () => 'EVENT'

export const buildGetAllEventsByUserIdRequest = (userId: Identifier, keys?: string[]) =>
  new QueryCommand({
    TableName: tableName,
    IndexName: 'UserIdGSI',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
    ProjectionExpression: keys?.join(', '),
  })

export const buildQueryRequest = (input: { pk: string; sk?: string; keys?: string[] }) =>
  new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: input.sk ? 'pk = :pk AND begins_with(sk, :sk)' : 'pk = :pk',
    ExpressionAttributeValues: input.sk ? { ':pk': input.pk, ':sk': input.sk } : { ':pk': input.pk },
    ProjectionExpression: input.keys?.join(', '),
  })

export const buildBatchQueryRequest = (items: { pk: string; sk?: string }[], keys?: string[]) =>
  new BatchGetCommand({
    RequestItems: {
      [tableName]: {
        Keys: items.map(({ pk, sk }) => (sk ? { pk, sk } : { pk })),
        ProjectionExpression: keys?.join(', '),
      },
    },
  })

export const buildEventPutRequestItem = (event: EventConfiguration): PutRequestType => ({
  PutRequest: {
    Item: {
      pk: makePrimaryKey(event.id),
      sk: makeEventSortKey(),
      id: event.id,
      name: event.name,
      userId: event.userId,
      date: event.date && { start: event.date.start.toISOString(), end: event.date.end.toISOString() },
      location: event.location,
    },
  },
})

export const buildBatchDeleteRequestItem = (key: { pk: string; sk: string }): DeleteRequestType => ({
  DeleteRequest: { Key: { pk: key.pk, sk: key.sk } },
})

export const makeTicketSortKey = (ticketId: Identifier) => 'TICKET#' + ticketId

export const buildTicketPutRequestItem = (eventId: Identifier, ticket: Ticket): PutRequestType => ({
  PutRequest: {
    Item: {
      pk: makePrimaryKey(eventId),
      sk: makeTicketSortKey(ticket.id),
      id: ticket.id,
      name: ticket.name,
      price: ticket.price,
      discountedPrice: ticket.discountedPrice,
      includes: ticket.includes,
      isPromoted: ticket.isPromoted,
      isSoldOut: ticket.isSoldOut,
      options: ticket.options.map((option) => option.id),
    },
  },
})

export const makeTicketOptionSortKey = (ticketOptionId: Identifier) => 'TCKTOPT#' + ticketOptionId

export const buildTicketOptionPutRequestItem = (eventId: Identifier, ticketOption: TicketOption): PutRequestType => ({
  PutRequest: {
    Item: {
      pk: makePrimaryKey(eventId),
      sk: makeTicketOptionSortKey(ticketOption.id),
      id: ticketOption.id,
      name: ticketOption.name,
      price: ticketOption.price,
      discountedPrice: ticketOption.discountedPrice,
      isDefault: ticketOption.isDefault,
      isSoldOut: ticketOption.isSoldOut,
    },
  },
})

export const makeMerchSortKey = (merchId: Identifier) => 'MERCH#' + merchId

export const buildMerchPutRequestItem = (eventId: Identifier, merch: Merch): PutRequestType => ({
  PutRequest: {
    Item: {
      pk: makePrimaryKey(eventId),
      sk: makeMerchSortKey(merch.id),
      id: merch.id,
      name: merch.name,
      price: merch.price,
      discountedPrice: merch.discountedPrice,
      isSoldOut: merch.isSoldOut,
    },
  },
})

export const makeMerchVariantSortKey = (merchId: Identifier, variantSKU: Identifier) => `MERCH#${merchId}#${variantSKU}`

export const buildMerchVariantPutRequestItem = (
  eventId: Identifier,
  merch: Merch,
  variant: MerchVariant
): PutRequestType => ({
  PutRequest: {
    Item: {
      pk: makePrimaryKey(eventId),
      sk: makeMerchVariantSortKey(merch.id, variant.sku),
      sku: variant.sku,
      attributes: {
        color: variant.attributes.color,
        size: variant.attributes.size,
      },
      additionalPrice: variant.additionalPrice,
      stockQuantity: variant.stockQuantity,
    },
  },
})

export const makePromoCodeSortKey = (promoCode: string) => `PROMO#${promoCode}`

export const buildPromoCodePutRequestItem = (eventId: Identifier, promoCode: PromoCode): PutRequestType => ({
  PutRequest: {
    Item: {
      pk: makePrimaryKey(eventId),
      sk: makePromoCodeSortKey(promoCode.code),
      code: promoCode.code,
      discountInPercent: promoCode.discountInPercent,
    },
  },
})

export const buildEventResponse = (response: QueryCommandOutput): EventConfiguration[] => {
  let items = buildEventResponseItems(response)
  return z
    .array(EventResponseSchema)
    .parse(items)
    .map((event) => {
      let ticketOptions = makeDictionary(event.ticketOptions)
      return {
        id: event.id,
        name: event.name,
        userId: event.userId,
        date: event.date && { start: new Date(event.date.start), end: new Date(event.date.end) },
        location: event.location,
        tickets: event.tickets.map((ticket) => mapToTicket(ticket, ticketOptions)),
        merchs: event.merchs.map(mapToMerch),
        promoCodes: event.promoCodes.map(mapToPromoCode),
      }
    })
}

export const buildMerchResponse = (response: QueryCommandOutput): Merch[] => {
  let items = buildEventResponseItems(response)
  return z
    .array(MerchResponseSchema)
    .parse(items.flatMap(({ merchs }) => merchs))
    .map(mapToMerch)
}

export const buildPromoCodeResponse = (response: QueryCommandOutput): PromoCode[] => {
  let items = buildEventResponseItems(response)
  return z
    .array(PromoCodeResponseSchema)
    .parse(Object.values(items).flatMap(({ promoCodes }) => promoCodes))
    .map(mapToPromoCode)
}

export const buildTicketOptionResponse = (response: QueryCommandOutput): TicketOption[] => {
  let items = buildEventResponseItems(response)
  return z
    .array(TicketOptionResponseSchema)
    .parse(Object.values(items).flatMap(({ ticketOptions }) => ticketOptions))
    .map(mapToTicketOption)
}

export const buildTicketOptionBatchGetResponse = (response: BatchGetCommandOutput): TicketOption[] => {
  let items = response.Responses?.[tableName]
  if (!items) {
    return []
  }
  return z.array(TicketOptionResponseSchema).parse(items).map(mapToTicketOption)
}

export const buildTicketResponse = (
  response: QueryCommandOutput,
  ticketOptions: Record<string, TicketOption>
): Ticket[] => {
  let items = buildEventResponseItems(response)
  return z
    .array(TicketResponseSchema)
    .parse(Object.values(items).flatMap(({ tickets }) => tickets))
    .map((ticket) => mapToTicket(ticket, ticketOptions))
}

const buildEventResponseItems = (response: QueryCommandOutput) => {
  if (!response.Items) {
    return []
  }
  let items = response.Items.reduce((acc, item) => {
    acc[item.pk] = acc[item.pk] ?? {}
    if (!item.sk) {
      return acc
    }
    if (item.sk == 'EVENT') {
      acc[item.pk] = { ...acc[item.pk], ...item }
    } else if (item.sk.startsWith('MERCH')) {
      acc[item.pk] = { ...acc[item.pk], merchs: buildMerchResponseItems(item, acc[item.pk].merchs ?? {}) }
    } else if (item.sk.startsWith('PROMO')) {
      acc[item.pk] = { ...acc[item.pk], promoCodes: (acc[item.pk].promoCodes ?? []).concat(item) }
    } else if (item.sk.startsWith('TICKET')) {
      acc[item.pk] = { ...acc[item.pk], tickets: (acc[item.pk].tickets ?? []).concat(item) }
    } else if (item.sk.startsWith('TCKTOPT')) {
      acc[item.pk] = { ...acc[item.pk], ticketOptions: (acc[item.pk].ticketOptions ?? []).concat(item) }
    }
    return acc
  }, {} as Record<Identifier, any>)
  return Object.values(items).map((item) => ({
    ...item,
    promoCodes: item.promoCodes ?? [],
    tickets: item.tickets ?? [],
    ticketOptions: item.ticketOptions ?? [],
    merchs: item.merchs ? Object.values(item.merchs) : [],
  }))
}

const buildMerchResponseItems = (item: Record<string, any>, merchs: Record<string, any>): Record<string, any> => {
  let sk = item.sk.split('#')
  if (sk.length - 1 == 1) {
    return { ...merchs, [item.id]: { ...(merchs[item.id] ?? {}), ...item } }
  } else {
    let merch = merchs[sk[1]] ?? {}
    return { ...merchs, [sk[1]]: { ...merch, variants: (merch.variants ?? []).concat(item) } }
  }
}

const PriceSchema = z.record(z.enum(allCurrencies), z.number().nonnegative())

const MerchResponseSchema = z.object({
  id: z.string().min(1, 'Merch id is required'),
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

const TicketResponseSchema = z.object({
  id: z.string().min(1, 'Ticket id is required'),
  name: z.string().min(1, 'Name is required'),
  price: PriceSchema,
  discountedPrice: PriceSchema.optional(),
  includes: z.array(z.string()),
  isPromoted: z.boolean(),
  isSoldOut: z.boolean(),
  options: z.array(z.string()),
})

const TicketOptionResponseSchema = z.object({
  id: z.string().min(1, 'Ticket option id is required'),
  name: z.string().min(1, 'Name is required'),
  price: PriceSchema,
  discountedPrice: PriceSchema.optional(),
  isSoldOut: z.boolean(),
  isDefault: z.boolean(),
})

const PromoCodeResponseSchema = z.object({
  code: z.string().min(1, 'Promo code is required'),
  discountInPercent: z.number().int().positive(),
})

const EventResponseSchema = z.object({
  id: z.string().min(1, 'Event id is required'),
  name: z.string().min(1, 'Name is required'),
  userId: z.string().min(1, 'User id is required'),
  date: z
    .object({ start: z.string().min(1, 'Start is required'), end: z.string().min(1, 'End is required') })
    .optional(),
  location: z.string().optional(),
  ticketOptions: z.array(TicketOptionResponseSchema),
  tickets: z.array(TicketResponseSchema),
  merchs: z.array(MerchResponseSchema),
  promoCodes: z.array(PromoCodeResponseSchema),
})

const mapToMerch = (merch: z.infer<typeof MerchResponseSchema>): Merch => ({
  id: merch.id,
  name: merch.name,
  price: merch.price,
  discountedPrice: merch.discountedPrice,
  isSoldOut: merch.isSoldOut,
  variants: merch.variants.map((variant) => ({
    sku: variant.sku,
    attributes: { color: variant.attributes.color, size: variant.attributes.size },
    additionalPrice: variant.additionalPrice,
    stockQuantity: variant.stockQuantity,
  })),
})

const mapToTicketOption = (ticketOption: z.infer<typeof TicketOptionResponseSchema>): TicketOption => {
  return {
    id: ticketOption.id,
    name: ticketOption.name,
    price: ticketOption.price,
    discountedPrice: ticketOption.discountedPrice,
    isSoldOut: ticketOption.isSoldOut,
    isDefault: ticketOption.isDefault,
  }
}

const mapToTicket = (
  ticket: z.infer<typeof TicketResponseSchema>,
  ticketOptions: Record<string, z.infer<typeof TicketOptionResponseSchema>>
): Ticket => {
  return {
    id: ticket.id,
    name: ticket.name,
    price: ticket.price,
    discountedPrice: ticket.discountedPrice,
    includes: ticket.includes,
    isPromoted: ticket.isPromoted,
    isSoldOut: ticket.isSoldOut,
    options: ticket.options.map((id) => ticketOptions[id] ?? undefined).filter((option) => option != undefined),
  }
}

const mapToPromoCode = (promoCode: z.infer<typeof PromoCodeResponseSchema>): PromoCode => ({
  code: promoCode.code,
  discountInPercent: promoCode.discountInPercent,
})

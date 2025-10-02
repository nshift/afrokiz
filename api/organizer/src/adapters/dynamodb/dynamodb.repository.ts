import {
  BatchWriteCommand,
  BatchWriteCommandInput,
  BatchWriteCommandOutput,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'
import { makeDictionary } from '../../dictionary'
import { EventConfiguration } from '../../entities/event-configuration'
import { Identifier } from '../../entities/identifier'
import { Merch } from '../../entities/merch'
import { PromoCode } from '../../entities/promo-code'
import { Ticket, TicketOption } from '../../entities/ticket'
import { Repository } from '../repository'
import {
  buildBatchDeleteRequestItem,
  buildBatchQueryRequest,
  buildEventPutRequestItem,
  buildEventResponse,
  buildGetAllEventsByUserIdRequest,
  buildMerchPutRequestItem,
  buildMerchResponse,
  buildMerchVariantPutRequestItem,
  buildPromoCodePutRequestItem,
  buildPromoCodeResponse,
  buildQueryRequest,
  buildTicketOptionBatchGetResponse,
  buildTicketOptionPutRequestItem,
  buildTicketOptionResponse,
  buildTicketPutRequestItem,
  buildTicketResponse,
  makeEventSortKey,
  makeMerchSortKey,
  makeMerchVariantSortKey,
  makePromoCodeSortKey,
  makeTicketOptionSortKey,
  makeTicketSortKey,
  tableName,
} from './event.table'

export class DynamoDbRepository implements Repository {
  constructor(private readonly dynamodb: DynamoDBDocumentClient) {}

  async getAllUserEvents(userId: Identifier): Promise<EventConfiguration[]> {
    let userEventsResponse = await this.dynamodb.send(buildGetAllEventsByUserIdRequest(userId, ['pk']))
    if (!userEventsResponse.Items) {
      return []
    }
    let response = await Promise.all(
      userEventsResponse.Items.map(({ pk }) => this.dynamodb.send(buildQueryRequest({ pk })))
    )
    return response.flatMap((item) => buildEventResponse(item))
  }

  async getEventOwners(eventIds: Identifier[]): Promise<{ eventId: Identifier; userId: Identifier }[]> {
    let request = buildBatchQueryRequest(
      eventIds.map((eventId) => ({ pk: eventId, sk: makeEventSortKey() })),
      ['pk', 'sk', 'id', 'userId']
    )
    let response = await this.dynamodb.send(request)
    return (response.Responses?.[tableName] ?? []).map((item) => ({ eventId: item.id, userId: item.userId }))
  }

  async saveEvents(events: EventConfiguration[]): Promise<void> {
    let requests = events.map((event) => buildEventPutRequestItem(event))
    await this.executeBatchWriteRequests({ [tableName]: requests })
  }

  async deleteEvents(eventIds: Identifier[]): Promise<void> {
    let events = await Promise.all(
      eventIds.map((eventId) => this.dynamodb.send(buildQueryRequest({ pk: eventId, keys: ['pk', 'sk'] })))
    )
    let requests = events
      .flatMap((event) => event.Items?.map((item) => ({ pk: item.pk, sk: item.sk })) ?? [])
      .map((key) => buildBatchDeleteRequestItem(key))
    await this.executeBatchWriteRequests({ [tableName]: requests })
  }

  async getAllMerchs(eventId: Identifier): Promise<Merch[]> {
    let response = await this.dynamodb.send(buildQueryRequest({ pk: eventId, sk: 'MERCH#' }))
    return buildMerchResponse(response)
  }

  async saveMerchs(eventId: string, merchs: Merch[]): Promise<void> {
    let merchPutRequestItems = merchs.map((merch) => buildMerchPutRequestItem(eventId, merch))
    let merchVariantPutRequestItems = merchs.flatMap((merch) =>
      merch.variants.map((variant) => buildMerchVariantPutRequestItem(eventId, merch, variant))
    )
    let requests = merchPutRequestItems.concat(merchVariantPutRequestItems)
    await this.executeBatchWriteRequests({ [tableName]: requests })
  }

  async deleteMerchs(eventId: Identifier, merchIds: Identifier[]): Promise<void> {
    let merchItems = await Promise.all(
      merchIds.map(() => this.dynamodb.send(buildQueryRequest({ pk: eventId, sk: 'MERCH#', keys: ['pk', 'sk'] })))
    )
    let variantKeys = merchItems
      .flatMap((event) => event.Items?.map((item) => ({ pk: item.pk, sk: item.sk })) ?? [])
      .filter((item) => item.sk.split('#').length - 1 > 1)
    let merchKeys = merchIds.map((merchId) => ({ pk: eventId, sk: makeMerchSortKey(merchId) }))
    let requests = merchKeys.concat(variantKeys).map((key) => buildBatchDeleteRequestItem(key))
    await this.executeBatchWriteRequests({ [tableName]: requests })
  }

  async deleteMerchVariants(eventId: Identifier, variants: Record<Identifier, Identifier[]>): Promise<void> {
    let requests = Object.keys(variants)
      .flatMap((merchId) =>
        variants[merchId].map((variantSKU) => ({ pk: eventId, sk: makeMerchVariantSortKey(merchId, variantSKU) }))
      )
      .map((key) => buildBatchDeleteRequestItem(key))
    await this.executeBatchWriteRequests({ [tableName]: requests })
  }

  async getAllPromoCodes(eventId: Identifier): Promise<PromoCode[]> {
    let response = await this.dynamodb.send(buildQueryRequest({ pk: eventId, sk: 'PROMO#' }))
    return buildPromoCodeResponse(response)
  }

  async savePromoCodes(eventId: Identifier, promoCodes: PromoCode[]): Promise<void> {
    let requests = promoCodes.map((promoCode) => buildPromoCodePutRequestItem(eventId, promoCode))
    await this.executeBatchWriteRequests({ [tableName]: requests })
  }

  async deletePromoCodes(eventId: Identifier, promoCodes: string[]): Promise<void> {
    let keys = promoCodes.map((code) => ({ pk: eventId, sk: makePromoCodeSortKey(code) }))
    let requests = keys.map((key) => buildBatchDeleteRequestItem(key))
    await this.executeBatchWriteRequests({ [tableName]: requests })
  }

  async getAllTickets(eventId: Identifier): Promise<Ticket[]> {
    let ticketOptionResponse = await this.dynamodb.send(buildQueryRequest({ pk: eventId, sk: 'TCKTOPT#' }))
    let ticketOptions = buildTicketOptionResponse(ticketOptionResponse)
    let response = await this.dynamodb.send(buildQueryRequest({ pk: eventId, sk: 'TICKET#' }))
    return buildTicketResponse(response, makeDictionary(ticketOptions))
  }

  async saveTickets(eventId: Identifier, tickets: Ticket[]): Promise<void> {
    let requests = tickets.map((ticket) => buildTicketPutRequestItem(eventId, ticket))
    await this.executeBatchWriteRequests({ [tableName]: requests })
  }

  async deleteTickets(eventId: Identifier, ticketIds: Identifier[]): Promise<void> {
    let keys = ticketIds.map((ticketId) => ({ pk: eventId, sk: makeTicketSortKey(ticketId) }))
    let requests = keys.map((key) => buildBatchDeleteRequestItem(key))
    await this.executeBatchWriteRequests({ [tableName]: requests })
  }

  async getAllTicketOptions(eventId: Identifier): Promise<TicketOption[]> {
    let response = await this.dynamodb.send(buildQueryRequest({ pk: eventId, sk: 'TCKTOPT#' }))
    return buildTicketOptionResponse(response)
  }

  async saveTicketOptions(eventId: Identifier, ticketOptions: TicketOption[]): Promise<void> {
    let requests = ticketOptions.map((option) => buildTicketOptionPutRequestItem(eventId, option))
    await this.executeBatchWriteRequests({ [tableName]: requests })
  }

  async deleteTicketOptions(eventId: Identifier, ticketOptionIds: Identifier[]): Promise<void> {
    let tickets = await this.dynamodb.send(buildQueryRequest({ pk: eventId, sk: 'TICKET#' }))
    let ticketToUpdateRequests =
      tickets.Items?.filter((item) =>
        (item.options ?? []).some((option: string) => ticketOptionIds.includes(option))
      ).map((ticket) => ({
        PutRequest: {
          Item: {
            ...ticket,
            options: ticket.options?.filter((option: string) => !ticketOptionIds.includes(option)) ?? [],
          },
        },
      })) ?? []
    let keys = ticketOptionIds.map((ticketOptionId) => ({ pk: eventId, sk: makeTicketOptionSortKey(ticketOptionId) }))
    let requests = keys.map((key) => buildBatchDeleteRequestItem(key))
    await this.executeBatchWriteRequests({ [tableName]: [...requests, ...ticketToUpdateRequests] })
  }

  async getTicketOptionByIds(eventId: Identifier, ids: Identifier[]): Promise<TicketOption[]> {
    let response = await this.dynamodb.send(
      buildBatchQueryRequest(ids.map((id) => ({ pk: eventId, sk: 'TCKTOPT#' + id })))
    )
    return buildTicketOptionBatchGetResponse(response)
  }

  executeBatchWriteRequests(items: BatchWriteCommandInput['RequestItems']): Promise<BatchWriteCommandOutput> {
    return this.dynamodb.send(new BatchWriteCommand({ RequestItems: items }))
  }
}

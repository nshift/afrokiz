import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { chunk } from '../../chunk'
import { UUIDGenerator } from '../uuid.generator'
import { EventStore } from './event-store'
import { Event } from './events/event'
import { transformCreateOrderEvent, transformFailedPaymentEvent, transformSuccessfulPaymentEvent } from './migration'
import {
  eventResponse,
  getEventFromRangeRequest,
  getOrderByIdRequest,
  orderResponse,
  OrderSchema,
  saveEventsRequest,
} from './requests'

export class DynamoDbRepository {
  static WriteBulkLimit = 25

  constructor(private readonly dynamodb: DynamoDBDocumentClient, private readonly uuidGenerator: UUIDGenerator) {}

  async getOrderById(id: string): Promise<OrderSchema | null> {
    const response = await this.dynamodb.send(getOrderByIdRequest(id))
    const orders = orderResponse(response.Items)
    return orders[0] ?? null
  }

  async replayEvents(range: { from: Date; to: Date }): Promise<Event<any>[]> {
    const response = await this.dynamodb.send(getEventFromRangeRequest(range.from, range.to))
    const events = eventResponse(response.Items)
    const eventStore = new EventStore(this.dynamodb)
    await eventStore.process(events)
    return events
  }

  async migrateEvents(range: { from: Date; to: Date }): Promise<Event<any>[]> {
    const response = await this.dynamodb.send(getEventFromRangeRequest(range.from, range.to))
    const events = eventResponse(response.Items).reduce(
      (events, event) => {
        const transformableEvents: { [key: string]: (event: Event<any>) => Event<any> } = {
          CreateOrder: (event) => transformCreateOrderEvent(event, this.uuidGenerator),
          SuccessfulPayment: (event) => transformSuccessfulPaymentEvent(event, this.uuidGenerator),
          FailurePayment: (event: Event<any>) => transformFailedPaymentEvent(event),
        }
        const transformableEvent = transformableEvents[event.name]?.(event)
        if (transformableEvent) {
          events.eventsToAdd.push(transformableEvent)
          events.eventsToDelete.push(event)
        }
        events.eventsToPlay.push(transformableEvent ?? event)
        return events
      },
      { eventsToDelete: [], eventsToAdd: [], eventsToPlay: [] } as {
        eventsToDelete: Event<any>[]
        eventsToAdd: Event<any>[]
        eventsToPlay: Event<any>[]
      }
    )
    // await this.dynamodb.send(deleteEventsRequest(events.eventsToDelete.map((event) => event.id)))
    await Promise.all(
      chunk(events.eventsToAdd, DynamoDbRepository.WriteBulkLimit).map((events) =>
        this.dynamodb.send(saveEventsRequest(events))
      )
    )
    const eventStore = new EventStore(this.dynamodb)
    const eventsToPlay = events.eventsToPlay.sort((a, b) => a.time.getTime() - b.time.getTime())
    await Promise.all(chunk(eventsToPlay, DynamoDbRepository.WriteBulkLimit).map((event) => eventStore.process(event)))
    return events.eventsToPlay
  }
}

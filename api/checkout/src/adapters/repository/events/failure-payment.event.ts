// import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
// import { Order } from '../../../types/order'
// import { UUIDGenerator } from '../../uuid.generator'
// import { EventStore } from '../event-store'
// import { saveCheckoutRequest } from '../requests'
import { Event } from './event'

export interface FailurePaymentEvent
  extends Event<{
    orders: {
      id: string
      email: string
      fullname: string
      dancerType: 'leader' | 'follower' | 'couple'
      passId: string
      date: Date
      promoCode?: string
      paymentIntentId: string
      paymentStatus: 'pending' | 'success' | 'failed'
      items: {
        id: string
        title: string
        includes: string[]
        amount: number
        total: { amount: number; currency: 'USD' | 'EUR' | 'THB' }
      }[]
    }[]
    paymentIntentId: string
  }> {}

// export const processFailurePaymentEvent = (
//   dynamodb: DynamoDBDocumentClient,
//   uuidGenerator: UUIDGenerator,
//   data: { orders: Order[]; paymentIntentId: string }
// ) => {
//   const event: FailurePaymentEvent = {
//     id: uuidGenerator.generate(),
//     name: 'FailurePayment',
//     time: new Date(),
//     data: { orders: data.orders, paymentIntentId: data.paymentIntentId },
//     process: () => [saveCheckoutRequest(data.orders)],
//   }
//   const eventStore = new EventStore(dynamodb)
//   return eventStore.process([event])
// }

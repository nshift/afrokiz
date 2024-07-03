import { Order } from '../types/order'

export interface ImportOrderQueueRequest {
  requestImportOrder(orders: Order[]): Promise<void>
}

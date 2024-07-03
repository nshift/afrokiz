import { Customer } from '../../types/customer'
import { Order } from '../../types/order'

export interface GetOrders {
  getOrdersFromImports(path: string): Promise<{ customer: Customer; order: Order; promoCode: string | null }[]>
}

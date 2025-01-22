import { Customer } from '../../../types/customer'
import { Order } from '../../../types/order'

export interface OrderMapping {
  mapCustomer: (customer: any) => Customer
  mapPromoCode: (item: any) => string | null
  mapOrder: (order: any, today: Date) => Order
}

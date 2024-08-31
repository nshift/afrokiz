import { Currency } from '../../types/currency'
import { Customer } from '../../types/customer'
import { ImportOrder, Order } from '../../types/order'
import { PaymentStatus } from '../../types/payment'
import { PaymentIntent } from '../../types/payment-intent'
import { Promotion } from '../../types/promotion'
import { Sales } from '../../types/sales'

export interface SavingCheckout {
  saveCheckout(checkout: {
    order: Order
    total: { amount: number; currency: Currency }
    customer: Customer
    promoCode: string | null
    payment: { status: PaymentStatus; intent: PaymentIntent | null }
    checkedIn: boolean
  }): Promise<void>
  saveCheckouts(
    checkout: {
      order: Order
      total: { amount: number; currency: Currency }
      customer: Customer
      promoCode: string | null
      payment: { status: PaymentStatus; intent: PaymentIntent | null }
      checkedIn: boolean
    }[]
  ): Promise<void>
}

export interface GettingOrders {
  getOrderById(id: string): Promise<{
    order: Order
    customer: Customer
    promoCode: string | null
    payment: { status: PaymentStatus; intent: PaymentIntent | null }
    checkedIn: boolean
  } | null>
  // getOrderByPaymentIntentId(paymentIntentId: string): Promise<Order | null>
}

export interface GettingPromotions {
  getAllPromotions(passId: string): Promise<{ [key: string]: Promotion }>
}

export interface SavingPayment {
  // savePaymentSuccessfulOrder(order: Order): Promise<void>
  // savePaymentFailedOrder(order: Order): Promise<void>
  savePaymentStatus(_: { order: { id: string }; payment: { status: PaymentStatus } }): Promise<void>
}

export interface SavingImportOrder {
  saveImportOrders(orders: ImportOrder[]): Promise<void>
}

export interface GettingImportOrder {
  getImportOrdersByFingerprints(fingerprints: string[]): Promise<ImportOrder[]>
}

export interface GettingSales {
  getAllRegistrationCampaignSales(): Promise<Sales[]>
  getAllCruiseCampaignSales(): Promise<Sales[]>
}

export interface SavingSales {
  updateOrdersForRegistrationCampaign(orderIds: string[]): Promise<void>
  updateOrdersForCruiseCampaign(orderIds: string[]): Promise<void>
}

export interface UpdatingOrder {
  updateOrderCheckIn(orderId: string, value: boolean): Promise<void>
}

export interface Repository
  extends GettingOrders,
    GettingPromotions,
    SavingPayment,
    SavingCheckout,
    SavingImportOrder,
    GettingImportOrder,
    SavingSales,
    GettingSales,
    UpdatingOrder {}

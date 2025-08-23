import { Currency } from '../../types/currency'
import { Customer } from '../../types/customer'
import { ImportOrder, Order } from '../../types/order'
import { Payment, PaymentStatus, PaymentStructure } from '../../types/payment'
import { PaymentIntent } from '../../types/payment-intent'
import { Promotion } from '../../types/promotion'
import { Sales } from '../../types/sales'

export interface SavingCheckout {
  saveCheckout(checkout: {
    order: Order
    total: { amount: number; currency: Currency }
    customer: Customer
    promoCode: string | null
    payment: { status: PaymentStatus; intent: PaymentIntent | null; customer: { id: string } }
    paymentStructures: PaymentStructure[]
    checkedIn: boolean
  }): Promise<void>
  saveCheckouts(
    checkout: {
      order: Order
      total: { amount: number; currency: Currency }
      customer: Customer
      promoCode: string | null
      payment: { status: PaymentStatus; intent: PaymentIntent | null; customer: { id: string } }
      paymentStructures: PaymentStructure[]
      checkedIn: boolean
    }[]
  ): Promise<void>
}

export interface GettingOrders {
  getOrderById(id: string): Promise<{
    order: Order
    customer: Customer
    promoCode: string | null
    paymentStructures: PaymentStructure[]
    checkedIn: boolean
  } | null>
  getOrderByIds(ids: string[]): Promise<{
    order: Order
    customer: Customer
    promoCode: string | null
    paymentStructures: PaymentStructure[]
    checkedIn: boolean
  }[]>
  // getOrderByPaymentIntentId(paymentIntentId: string): Promise<Order | null>
}

export interface GettingPromotions {
  getAllPromotions(passId: string): Promise<{ [key: string]: Promotion }>
}

export interface SavingPayment {
  // savePaymentSuccessfulOrder(order: Order): Promise<void>
  // savePaymentFailedOrder(order: Order): Promise<void>
  savePaymentStatus(_: { order: { id: string }; payment: { id: string; status: PaymentStatus } }): Promise<void>
  savePayment(payment: Payment): Promise<void>
}

export interface GettingPayment {
  getPaymentById(id: string): Promise<Payment | null>
  getPendingPayments(before: Date): Promise<Payment[]>
  getPaymentByStripeId(stripeId: string): Promise<Payment | null>
}

export interface SavingImportOrder {
  saveImportOrders(orders: ImportOrder[]): Promise<void>
}

export interface GettingImportOrder {
  getImportOrdersByFingerprints(fingerprints: string[]): Promise<ImportOrder[]>
}

export interface GettingSales {
  getAllRegistrationCampaignSales(): Promise<Sales[]>
  getAllRegistrationReminderCampaignSales(): Promise<Sales[]>
  getAllCruiseCampaignSales(): Promise<Sales[]>
  getAllTicketOptionCampaignSales(): Promise<Sales[]>
}

export interface SavingSales {
  updateOrdersForRegistrationCampaign(orderIds: string[]): Promise<void>
  updateOrdersForRegistrationReminderCampaign(orderIds: string[]): Promise<void>
  updateOrdersForCruiseCampaign(orderIds: string[]): Promise<void>
  updateOrdersForTicketOptionCampaign(orderIds: string[]): Promise<void>
}

export interface UpdatingOrder {
  updateOrderCheckIn(orderId: string, value: boolean): Promise<void>
}

export interface Repository
  extends GettingOrders,
    GettingPromotions,
    SavingPayment,
    GettingPayment,
    SavingCheckout,
    SavingImportOrder,
    GettingImportOrder,
    SavingSales,
    GettingSales,
    UpdatingOrder {}

import { Currency } from '../../types/currency'
import { Customer } from '../../types/customer'
import { Order } from '../../types/order'
import { PaymentStatus } from '../../types/payment'
import { PaymentIntent } from '../../types/payment-intent'
import { Promotion } from '../../types/promotion'

export interface SavingCheckout {
  saveCheckout(checkout: {
    order: Order
    total: { amount: number; currency: Currency }
    customer: Customer
    promoCode: string | undefined
    payment: { status: PaymentStatus; intent: PaymentIntent }
  }): Promise<void>
}

export interface GettingOrders {
  getOrderById(id: string): Promise<{
    order: Order
    customer: Customer
    promoCode: string | undefined
    payment: { status: PaymentStatus; intent: PaymentIntent }
  } | null>
  // getOrderByPaymentIntentId(paymentIntentId: string): Promise<Order | null>
}

export interface GettingPromotions {
  getAllPromotions(): Promise<{ [key: string]: Promotion }>
}

export interface SavingPayment {
  // savePaymentSuccessfulOrder(order: Order): Promise<void>
  // savePaymentFailedOrder(order: Order): Promise<void>
  savePaymentStatus(_: { order: { id: string }; payment: { status: PaymentStatus } }): Promise<void>
}

export interface Repository extends GettingOrders, GettingPromotions, SavingPayment, SavingCheckout {}

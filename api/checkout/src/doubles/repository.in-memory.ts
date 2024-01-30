import { Repository } from '../adapters/repository/repository'
import { Currency } from '../types/currency'
import { Customer } from '../types/customer'
import { Order } from '../types/order'
import { PaymentStatus } from '../types/payment'
import { PaymentIntent } from '../types/payment-intent'
import { Promotion } from '../types/promotion'
import { discountPromotion, massagePromotion } from './fixtures'

export class InMemoryRepository implements Repository {
  private orders: {
    [key: string]: {
      order: Order
      customer: Customer
      promoCode: string | undefined
      payment: { status: PaymentStatus; intent: PaymentIntent }
    }
  } = {}

  async savePaymentStatus({
    order,
    payment,
  }: {
    order: { id: string }
    payment: { status: PaymentStatus }
  }): Promise<void> {
    const updatedOrder = this.orders[order.id]
    updatedOrder.payment.status = payment.status
  }

  async saveCheckout(checkout: {
    order: Order
    total: { amount: number; currency: Currency }
    customer: Customer
    promoCode?: string
    payment: { status: PaymentStatus; intent: PaymentIntent }
  }): Promise<void> {
    this.orders[checkout.order.id] = {
      order: checkout.order,
      customer: checkout.customer,
      promoCode: checkout.promoCode,
      payment: checkout.payment,
    }
  }

  async getOrderById(id: string): Promise<{
    order: Order
    customer: Customer
    promoCode: string | undefined
    payment: { status: PaymentStatus; intent: PaymentIntent }
  } | null> {
    return this.orders[id] ?? null
  }

  async getAllPromotions(): Promise<{ [key: string]: Promotion }> {
    return {
      MASSAGE: massagePromotion,
      '5OFF': discountPromotion,
    }
  }

  // async createOrder(order: Order): Promise<void> {
  //   this.orders[order.id] = order
  // }

  // async getOrderByPaymentIntentId(paymentIntentId: string): Promise<Order | null> {
  //   return Object.values(this.orders).filter((order) => order.paymentIntentId == paymentIntentId)[0] ?? null
  // }

  // async savePaymentSuccessfulOrder(order: Order): Promise<void> {
  //   this.orders[order.id] = order
  // }

  // async savePaymentFailedOrder(order: Order): Promise<void> {
  //   this.orders[order.id] = order
  // }
}

import { Repository } from '../adapters/repository/repository'
import { UUIDGenerator } from '../adapters/uuid.generator'
import { Currency } from '../types/currency'
import { Customer } from '../types/customer'
import { ImportOrder, Order } from '../types/order'
import { isInstallment, Payment, PaymentStatus, PaymentStructure } from '../types/payment'
import { PaymentIntent } from '../types/payment-intent'
import { Promotion } from '../types/promotion'
import { Sales } from '../types/sales'
import { discountPromotion, massagePromotion } from './fixtures'

export class InMemoryRepository implements Repository {
  constructor(private uuidGenerator: UUIDGenerator) {}

  private payments: { [key: string]: Payment } = {}
  private orders: {
    [key: string]: {
      order: Order
      customer: Customer
      promoCode: string | null
      payment: { status: PaymentStatus; intent: PaymentIntent | null; customer: { id: string } }
      paymentStructures: PaymentStructure[]
      checkedIn: boolean
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
    promoCode: string | null
    payment: { status: PaymentStatus; intent: PaymentIntent | null; customer: { id: string } }
    paymentStructures: PaymentStructure[]
    checkedIn: boolean
  }): Promise<void> {
    let payments: Payment[] = checkout.paymentStructures.flatMap((paymentStructure) =>
      isInstallment(paymentStructure)
        ? paymentStructure.dueDates.map((dueDate, index) => ({
            id: this.uuidGenerator.generate(),
            orderId: checkout.order.id,
            amount: dueDate.amount,
            currency: dueDate.currency,
            dueDate: dueDate.dueDate,
            status: dueDate.status,
            stripe: {
              id: checkout.payment.intent?.id ?? null,
              secret: checkout.payment.intent?.secret ?? null,
              customerId: checkout.payment.customer.id,
            },
          }))
        : [
            {
              id: this.uuidGenerator.generate(),
              orderId: checkout.order.id,
              amount: paymentStructure.amount,
              currency: paymentStructure.currency,
              status: paymentStructure.status,
              stripe: {
                id: checkout.payment.intent?.id ?? null,
                secret: checkout.payment.intent?.secret ?? null,
                customerId: checkout.payment.customer.id,
              },
            },
          ]
    )
    payments.forEach((payment) => (this.payments[payment.id] = payment))
    this.orders[checkout.order.id] = {
      order: checkout.order,
      customer: checkout.customer,
      promoCode: checkout.promoCode,
      payment: checkout.payment,
      paymentStructures: checkout.paymentStructures.map((paymentStructure) =>
        isInstallment(paymentStructure)
          ? {
              ...paymentStructure,
              dueDates: paymentStructure.dueDates.map((dueDate, index) => ({
                ...dueDate,
                paymentId: payments[index].id,
              })),
            }
          : { ...paymentStructure, paymentId: payments[0].id }
      ),
      checkedIn: checkout.checkedIn,
    }
  }

  async getOrderById(id: string): Promise<{
    order: Order
    customer: Customer
    promoCode: string | null
    payment: { status: PaymentStatus; intent: PaymentIntent | null; customer: { id: string } }
    paymentStructures: PaymentStructure[]
    checkedIn: boolean
  } | null> {
    return this.orders[id] ?? null
  }

  async savePayment(payment: Payment): Promise<void> {
    this.payments[payment.id] = payment
  }

  async getPendingPayments(before: Date): Promise<Payment[]> {
    return Object.values(this.payments).filter(
      (payment) => payment.status == 'pending' && payment.dueDate && payment.dueDate.getTime() < before.getTime()
    )
  }

  async getPaymentByStripeId(stripeId: string): Promise<Payment | null> {
    return Object.values(this.payments).find((payment) => payment.stripe.id == stripeId) ?? null
  }

  async getAllPromotions(): Promise<{ [key: string]: Promotion }> {
    return {
      MASSAGE: massagePromotion,
      '5OFF': discountPromotion,
    }
  }

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
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }

  // TODO: TO MOVE.

  updateOrderCheckIn(orderId: string, value: boolean): Promise<void> {
    throw new Error('Method not implemented.')
  }
  saveImportOrders(orders: ImportOrder[]): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getImportOrdersByFingerprints(fingerprints: string[]): Promise<ImportOrder[]> {
    throw new Error('Method not implemented.')
  }
  updateOrdersForRegistrationCampaign(orderIds: string[]): Promise<void> {
    throw new Error('Method not implemented.')
  }
  updateOrdersForRegistrationReminderCampaign(orderIds: string[]): Promise<void> {
    throw new Error('Method not implemented.')
  }
  updateOrdersForCruiseCampaign(orderIds: string[]): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getAllRegistrationCampaignSales(): Promise<Sales[]> {
    throw new Error('Method not implemented.')
  }
  getAllRegistrationReminderCampaignSales(): Promise<Sales[]> {
    throw new Error('Method not implemented.')
  }
  getAllCruiseCampaignSales(): Promise<Sales[]> {
    throw new Error('Method not implemented.')
  }
  updateOrdersForTicketOptionCampaign(orderIds: string[]): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getAllTicketOptionCampaignSales(): Promise<Sales[]> {
    throw new Error('Method not implemented.')
  }
}

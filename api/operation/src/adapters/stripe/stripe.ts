import Stripe from 'stripe'
import { Currency } from '../../entities/currency'
import { Payment } from '../../entities/payment'

export class StripeAdapter {
  constructor(private readonly stripe: Stripe) {}

  async listSucceedPayment(): Promise<Payment[]> {
    var payments: Payment[] = []
    const query = { query: "status:'succeeded'", limit: 5 }
    var paymentIntents = await this.stripe.paymentIntents.search(query)
    payments.push(...this.mapPayment(paymentIntents.data))
    var hasMore = paymentIntents.has_more
    while (hasMore) {
      paymentIntents = await this.stripe.paymentIntents.search({
        ...query,
        page: paymentIntents.next_page ?? undefined,
      })
      payments.push(...this.mapPayment(paymentIntents.data))
      hasMore = paymentIntents.has_more
    }
    return payments
  }

  private mapCurrency = (currency: string): Currency => {
    switch (currency) {
      case 'usd':
        return 'USD'
      case 'eur':
        return 'EUR'
      case 'thb':
        return 'THB'
      default:
        return 'UNKNOWN'
    }
  }

  private mapPayment = (paymentIntents: Stripe.PaymentIntent[]) =>
    paymentIntents.map((paymentIntent) => ({
      orderId: paymentIntent.metadata.orderId,
      createdAt: new Date(paymentIntent.created * 1000),
      amount: paymentIntent.amount,
      currency: this.mapCurrency(paymentIntent.currency),
    }))
}

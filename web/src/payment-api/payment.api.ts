import { Environment } from '../environment'
import type { DiscountPromotion, GiveAwayPromotion, Promotion } from './promotion'
export class PaymentAPI {
  async createOrder(
    newOrder: Omit<Order, 'id' | 'paymentIntentId' | 'paymentStatus'>
  ): Promise<{ order: Order; clientSecret: string }> {
    const json = await this.request({
      method: 'POST',
      path: '/checkout',
      body: JSON.stringify({
        email: newOrder.email,
        fullname: newOrder.fullname,
        dancer_type: newOrder.dancerType,
        pass_id: newOrder.passId,
        date: newOrder.date,
        promo_code: newOrder.promoCode,
        items: newOrder.items.map((item) => ({
          id: item.id,
          title: item.title,
          includes: item.includes,
          amount: item.amount,
          total: { amount: item.total.amount, currency: item.total.currency },
        })),
      }),
    })
    const order: Order = {
      id: json.id,
      email: json.email,
      fullname: json.fullname,
      dancerType: json.dancer_type,
      passId: json.pass_id,
      date: json.date,
      paymentIntentId: json.paymentIntentId,
      paymentStatus: json.paymentStatus,
      items: json.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        includes: item.includes,
        amount: item.amount,
        total: { amount: item.total.amount, currency: item.total.currency },
      })),
    }
    return { order, clientSecret: json.clientSecret }
  }

  async getOrderById(id: string): Promise<Order> {
    const json = await this.request({ method: 'GET', path: '/checkout/' + id })
    return {
      id: json.id,
      email: json.email,
      fullname: json.fullname,
      dancerType: json.dancer_type,
      passId: json.pass_id,
      date: json.date,
      paymentIntentId: json.paymentIntentId,
      paymentStatus: json.paymentStatus,
      items: json.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        includes: item.includes,
        amount: item.amount,
        total: { amount: item.total.amount, currency: item.total.currency },
      })),
    }
  }

  async applyPromoCode(code: string): Promise<Promotion> {
    const response = await this.request({ method: 'GET', path: '/promotion/' + code })
    return {
      id: response.id,
      expirationDate: new Date(response.expirationDate),
      discount: response.discount,
      options: response.options
        ? response.options.map((option: any) => ({
            title: option.title,
            description: option.description,
          }))
        : undefined,
    } as DiscountPromotion | GiveAwayPromotion
  }

  async request(options: {
    path: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: { [key: string]: any }
    body?: BodyInit
  }) {
    const response = await fetch(Environment.PaymentApiHost() + options.path, {
      method: options.method,
      headers: {
        ...options.headers,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: options.body,
    })
    const json = await response.json()
    if (response.status < 200 || response.status > 299) {
      throw new Error(`Failed to request ${options.path}: ${JSON.stringify(json)}`)
    }
    return json
  }
}

export type Order = {
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
}

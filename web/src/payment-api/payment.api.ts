import type { Currency } from '../data/pass'
import { Environment } from '../environment'
import type { DiscountPromotion, GiveAwayPromotion, Promotion } from './promotion'
export class PaymentAPI {
  async createOrder(
    newOrder: NewOrder,
    paymentOption: PaymentOption,
    paymentMethodId: string
  ): Promise<{ order: Order; clientSecret: string }> {
    const json = await this.request({
      method: 'POST',
      path: '/checkout',
      body: JSON.stringify({
        id: newOrder.id,
        email: newOrder.email,
        fullname: newOrder.fullname,
        dancer_type: newOrder.dancerType,
        pass_id: newOrder.passId,
        date: newOrder.date.toISOString(),
        promo_code: newOrder.promoCode,
        payment_options: {
          method: paymentOption.method,
          structure: paymentOption.structure,
          payment_method_id: paymentMethodId,
        },
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
      date: new Date(json.date),
      checkedIn: false,
      paymentIntentId: json.paymentIntentId,
      paymentStatus: json.paymentStatus,
      items: json.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        includes: item.includes,
        amount: item.amount,
        total: { amount: item.total.amount, currency: item.total.currency },
      })),
      paymentStructures:
        json.paymentStructures?.map((paymentStructure: any) =>
          isInstallment(paymentStructure)
            ? {
                principalAmount: paymentStructure.principalAmount,
                currency: paymentStructure.currency,
                frequency: paymentStructure.frequency,
                term: paymentStructure.term,
                dueDates:
                  paymentStructure.dueDates?.map((dueDate) => ({
                    amount: dueDate.amount,
                    currency: dueDate.currency,
                    dueDate: new Date(dueDate.dueDate),
                    status: dueDate.status,
                  })) ?? [],
              }
            : {
                amount: paymentStructure.amount,
                currency: paymentStructure.currency,
                status: paymentStructure.status,
              }
        ) ?? [],
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
      date: new Date(json.date),
      paymentIntentId: json.paymentIntentId,
      paymentStatus: json.paymentStatus,
      checkedIn: json.checked_in,
      items: json.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        includes: item.includes,
        amount: item.amount,
        total: { amount: item.total.amount, currency: item.total.currency },
      })),
      paymentStructures:
        json.paymentStructures?.map((paymentStructure: any) =>
          isInstallment(paymentStructure)
            ? {
                principalAmount: paymentStructure.principalAmount,
                currency: paymentStructure.currency,
                frequency: paymentStructure.frequency,
                term: paymentStructure.term,
                dueDates:
                  paymentStructure.dueDates?.map((dueDate) => ({
                    amount: dueDate.amount,
                    currency: dueDate.currency,
                    dueDate: new Date(dueDate.dueDate),
                    status: dueDate.status,
                  })) ?? [],
              }
            : {
                amount: paymentStructure.amount,
                currency: paymentStructure.currency,
                status: paymentStructure.status,
              }
        ) ?? [],
    }
  }

  async applyPromoCode(passId: string, code: string): Promise<Promotion> {
    const response = await this.request({ method: 'GET', path: `/promotion/${passId}/${code}` })
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

  async checkIn(orderId: string): Promise<void> {
    await this.request({
      method: 'POST',
      path: `/check-in/${orderId}`,
      body: JSON.stringify({}),
    })
  }

  async guestCheckIn(email: string): Promise<void> {
    await this.request({
      method: 'POST',
      path: `/guests/check-in`,
      body: JSON.stringify({ email }),
    })
  }

  async preRegister({ email, fullname }: { email: string; fullname: string }) {
    await this.request({
      method: 'POST',
      path: `/guests/pregister`,
      body: JSON.stringify({ email, fullname }),
    })
  }

  async preRegisterSametGetaway({ email, fullname }: { email: string; fullname: string }) {
    await this.request({
      method: 'POST',
      path: `/samet/pre-register`,
      body: JSON.stringify({ email, fullname }),
    })
  }

  async getGuest(email: string): Promise<Guest> {
    const json = await this.request({ method: 'GET', path: '/guests/' + email })
    return {
      id: json.id,
      email: json.email,
      fullname: json.fullname,
      checkedIn: json.checked_in ?? false,
    }
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
    if (response.status == 201) {
      return {}
    }
    const json = await response.json()
    if (response.status < 200 || response.status > 299) {
      throw new Error(`Failed to request ${options.path}: ${JSON.stringify(json)}`)
    }
    return json
  }
}

export type PaymentStatus = 'pending' | 'overdue' | 'default' | 'completed' | 'failed'

export type PaymentOption = {
  method: string
  structure: 'direct' | 'installment3x'
}

export type DirectPayment = {
  amount: number
  currency: Currency
  status: PaymentStatus
}

export type InstallmentFrequency = 'monthly'

export type PaymentDueDate = {
  amount: number
  currency: Currency
  dueDate: Date
  status: PaymentStatus
}

export type InstallmentPayment = {
  principalAmount: number
  currency: Currency
  frequency: InstallmentFrequency
  term: number
  dueDates: PaymentDueDate[]
}

export type PaymentStructure = DirectPayment | InstallmentPayment

export function isInstallment(payment: DirectPayment | InstallmentPayment): payment is InstallmentPayment {
  return (<InstallmentPayment>payment).dueDates !== undefined
}

export type Order = {
  id: string
  email: string
  fullname: string
  dancerType: 'leader' | 'follower' | 'couple'
  passId: string
  date: Date
  promoCode?: string
  checkedIn: boolean
  paymentIntentId: string
  paymentStatus: 'pending' | 'success' | 'failed'
  items: {
    id: string
    title: string
    includes: string[]
    amount: number
    total: { amount: number; currency: 'USD' | 'EUR' | 'THB' }
  }[]
  paymentStructures: PaymentStructure[]
}

export type NewOrder = {
  id?: string
  email: string
  fullname: string
  dancerType: 'leader' | 'follower' | 'couple'
  passId: string
  date: Date
  promoCode?: string
  items: {
    id: string
    title: string
    includes: string[]
    amount: number
    total: { amount: number; currency: 'USD' | 'EUR' | 'THB' }
  }[]
}

export type Guest = {
  id: string
  email: string
  fullname: string
  checkedIn: boolean
}

const HOST = 'https://wkfdzb62gc.execute-api.ap-southeast-1.amazonaws.com/afrokiz-pr-api-stage-name'
export class PaymentAPI {
  async createOrder(
    newOrder: Omit<Order, 'id' | 'paymentIntentId' | 'paymentStatus'>
  ): Promise<{ order: Order; clientSecret: string }> {
    const response = await fetch(HOST + '/checkout', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: newOrder.email,
        fullname: newOrder.fullname,
        pass_id: newOrder.passId,
        date: newOrder.date,
        items: newOrder.items.map((item) => ({
          id: item.id,
          title: item.title,
          includes: item.includes,
          amount: item.amount,
          total: { amount: item.total.amount, currency: item.total.currency },
        })),
      }),
    })
    const json = await response.json()
    const order: Order = {
      id: json.id,
      email: json.email,
      fullname: json.fullname,
      passId: json.passId,
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
    const path = '/checkout/' + id
    const response = await fetch(HOST + path, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    const json = await response.json()
    if (response.status < 200 || response.status > 299) {
      throw new Error(`Failed to request ${path}: ${JSON.stringify(json)}`)
    }
    return {
      id: json.id,
      email: json.email,
      fullname: json.fullname,
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
}

export type Order = {
  id: string
  email: string
  fullname: string
  passId: string
  date: Date
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

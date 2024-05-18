import { beforeEach, describe, expect, it } from '@jest/globals'
import Stripe from 'stripe'
import { Environment } from '../../environment'
import { StripeAdapter } from './stripe'

let stripe: Stripe
let stripeAdapter: StripeAdapter

beforeEach(() => {
  stripe = new Stripe(Environment.StripeSecretKey())
  stripeAdapter = new StripeAdapter(stripe)
})

describe('List all succeeded payments', () => {
  it('should get all payment intents', async () => {
    const payments = await stripeAdapter.listSucceedPayment()
    expect(payments.length).toBeGreaterThan(0)
  })
})

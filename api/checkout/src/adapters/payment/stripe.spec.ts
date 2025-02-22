import { describe, it } from '@jest/globals'
import Stripe from 'stripe'
import { Environment } from '../../environment'
import { Currency } from '../../types/currency'
import { StripePaymentAdapter } from './stripe'

describe.skip('Stripe', () => {
  it('should create payment intent for direct payment', async () => {
    const stripe = new Stripe(Environment.StripeSecretKey())
    let stripeAdapter = new StripePaymentAdapter(stripe)
    let order = { id: '42' }
    let total: { amount: number; currency: Currency } = { amount: 2000, currency: 'EUR' }
    let customer = await stripeAdapter.createCustomer({ name: 'Romain', email: 'romain.asnar@gmail.com' })
    let paymentIntent = await stripeAdapter.createPaymentIntent({ order, total, customer })
    console.log('>>>> ', paymentIntent)
  })
  it('should create payment intent for installment', async () => {
    const stripe = new Stripe(Environment.StripeSecretKey())
    let stripeAdapter = new StripePaymentAdapter(stripe)
    let order = { id: '42' }
    let total: { amount: number; currency: Currency } = { amount: 3000, currency: 'EUR' }
    let customer = await stripeAdapter.createCustomer({ name: 'Romain', email: 'romain.asnar@gmail.com' })
    let paymentIntent = await stripeAdapter.createPaymentIntentForInstallment({ order, total, customer })
    console.log('>>>> ', paymentIntent)
  })
  it.only('should charge customer for installment', async () => {
    const stripe = new Stripe(Environment.StripeSecretKey())
    let stripeAdapter = new StripePaymentAdapter(stripe)
    let order = { id: 'b902df' }
    let customer = { id: 'cus_RniwE96s1WR9Cm' }
    let total: { amount: number; currency: Currency } = { amount: 50000, currency: 'USD' }
    let paymentIntent = await stripeAdapter.chargeCustomerInstallment({ order, total, customer })
    console.log('>>>> ', paymentIntent)
  })
})

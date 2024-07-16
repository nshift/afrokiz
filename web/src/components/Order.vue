<script setup lang="ts">
import { onMounted, ref, type Ref, inject, watch } from 'vue'
import Card from '../components/Card.vue'
import { type Pass, sumPrices } from '../data/pass'
import { loadStripe, Stripe, type StripeElements } from '../stripe'
import { PaymentAPI, type Order } from '../payment-api/payment.api'
import type { Option } from '../data/options'

const { pass, order } = defineProps<{ pass: Pass; order: Order }>()
const defaultCurrency = 'USD'
let stripe: Stripe
let elements: StripeElements
const currency: Ref<'USD' | 'EUR' | 'THB'> | undefined = inject('currency')
const submitting = ref(false)
const cardDeclinedError = ref(false)
const cardDeclinedErrorMessage = ref('')
const options: Option[] = Object.values(pass.options)
  .filter((option) => !['couple-option'].includes(option.id))
  .filter(
    (option) =>
      !(
        order.items.map((item) => item.id).includes(option.id) ||
        (order.items.map((item) => item.id).includes('all-mc-option') &&
          ['said-mc-option', 'heneco-mc-option'].includes(option.id))
      )
  )
let optionsFeatures: () => string[] = () =>
  optionIds.value.flatMap((option) => pass.options[option].includes).filter((x): x is string => x !== undefined)
const optionIds = ref<string[]>(
  Object.values(options)
    .filter((option) => option.selected)
    .map((option) => option.id)
)
const calculatePrice = () => {
  const selectedOptions = Object.values(options).filter((option) => optionIds.value.includes(option.id))
  return sumPrices(selectedOptions.map((option) => option.price))[currency?.value ?? defaultCurrency]
}
const total = ref(calculatePrice())

onMounted(async () => {
  stripe = await loadStripe()
  const price = calculatePrice()
  elements = stripe.elements({
    amount: price > 0 ? price : 100,
    currency: (currency?.value ?? defaultCurrency).toLowerCase(),
  })
  stripe.mountElements(elements, '#payment-element')
})

if (currency) {
  watch(currency, () => {
    total.value = calculatePrice()
    elements = stripe.elements({
      amount: calculatePrice(),
      currency: (currency?.value ?? defaultCurrency).toLowerCase(),
    })
    stripe.mountElements(elements, '#payment-element')
  })
}

watch(optionIds, () => {
  total.value = calculatePrice()
})

const submit = async () => {
  submitting.value = true
  const selectedOptions = optionIds.value.map((option) => pass.options[option])
  order.items = order.items.concat(
    ...selectedOptions.flatMap((option) =>
      option.includes.map((include) => ({
        id: option.id,
        title: include,
        includes: [include],
        amount: optionIds.value.includes('couple-option') && option.id != 'couple-option' ? 2 : 1,
        total: {
          amount:
            option.price[currency?.value ?? defaultCurrency] *
            (optionIds.value.includes('couple-option') && option.id != 'couple-option' ? 2 : 1),
          currency: currency?.value ?? defaultCurrency,
        },
      }))
    )
  )
  const { error } = await stripe.confirmPayment(elements, order)
  submitting.value = false
  if (error) {
    cardDeclinedError.value = true
    cardDeclinedErrorMessage.value = error.message ?? 'Your card has been declined.'
    return console.error('Confirm payment error: ', error)
  }
}

const selectOption = (id: string) => {
  const disbaled = shouldDisabled(id)
  if (disbaled) {
    return
  }
  optionIds.value = optionIds.value.includes(pass.options[id].id)
    ? optionIds.value.filter((option) => option != pass.options[id].id)
    : optionIds.value.concat([pass.options[id].id])
  if (optionIds.value.includes('said-mc-option') && optionIds.value.includes('heneco-mc-option')) {
    optionIds.value = optionIds.value.concat(['all-mc-option'])
  }
  if (optionIds.value.includes('all-mc-option')) {
    optionIds.value = optionIds.value.filter((option) => !['said-mc-option', 'heneco-mc-option'].includes(option))
  }
}

const shouldDisabled = (id: string) => {
  return (
    (optionIds.value.includes('all-mc-option') && ['said-mc-option', 'heneco-mc-option'].includes(id)) ||
    pass.options[id].selected == true ||
    order.items.map((item) => item.id).includes(id)
  )
}
</script>

<template>
  <form class="grid" @submit.prevent="submit">
    <Card :class="['checkout-card']">
      <div class="title">
        <p>Order #{{ order.id }}</p>
        <h2><i class="fa-solid fa-circle-check"></i> Your purchase of {{ pass.name }} has been confirmed.</h2>
      </div>
      <div class="content">
        <div class="section">
          <div class="checkout-details">
            <table class="items">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in order.items">
                  <td>
                    <p>{{ item.title }}</p>
                    <ul v-if="item.includes.length > 0">
                      <li v-for="include in item.includes">{{ include }}</li>
                    </ul>
                  </td>
                  <td>{{ item.amount }}</td>
                  <td>{{ item.total.currency }} {{ (item.total.amount / 100).toFixed(2) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td></td>
                  <td>
                    {{ Array.from(new Set(order.items.map((item) => item.total.currency)))[0] }}
                    {{ (order.items.reduce((total, item) => (total += item.total.amount), 0) / 100).toFixed(2) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <div class="section" v-if="options.length > 0">
          <Card :class="['options']">
            <h3 v-if="Object.keys(options).length > 0">Addons</h3>
            <ul class="options" v-if="Object.keys(options).length > 0">
              <li v-for="option in Object.values(options)" :key="option.id" @click="selectOption(option.id)">
                <div :class="['option-container', option.id]">
                  <input type="checkbox" :value="option.id" v-model="optionIds" :disabled="shouldDisabled(option.id)" />
                  <div class="option">
                    <i :class="['fa-solid', option.icon]"></i>
                    <h4>{{ option.title }}</h4>
                    <p v-for="description in option.includesInShortDescription ?? option.includes">{{ description }}</p>
                  </div>
                </div>
                <div class="price">
                  <p>
                    {{ currency }}
                    {{ (option.price[currency ?? defaultCurrency] / 100).toFixed(2) }}
                  </p>
                </div>
              </li>
            </ul>
          </Card>
          <Card :class="['payment']">
            <div class="container">
              <div class="total">
                <h2>Total: {{ currency }} {{ (total / 100).toFixed(2) }}</h2>
              </div>
              <div id="payment-element"></div>
              <button class="button action" v-if="submitting" disabled><span class="loader"></span></button>
              <button class="button action" v-if="!submitting && optionIds.length > 0">Pay</button>
              <button class="button action disabled" v-if="!submitting && optionIds.length == 0" disabled>Pay</button>
              <p class="validation-error card-error" v-if="cardDeclinedError">{{ cardDeclinedErrorMessage }}</p>
            </div>
          </Card>
        </div>
      </div>
    </Card>
  </form>
</template>

<style>
.grid {
  align-items: start;
}
.payment .container {
  padding: var(--lg-padding);
  display: flex;
  flex-direction: column;
  gap: var(--grid-m-gap);
}

.payment {
  grid-column: span 5;
  color: rgb(26, 26, 26) !important;
  background-color: white !important;
  min-height: 400px !important;
  align-items: start !important;
  justify-content: start !important;
}

@media only screen and (max-width: 920px) {
  .payment {
    grid-column: span 12;
  }
}

.payment .text {
  width: 100%;
}

ul {
  list-style: none;
  padding: 0;
}

.options {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--grid-lg-gap);
  list-style: none;
}
.options li {
  display: flex;
  flex-direction: column;
  justify-content: stretch;
}
.options .option-container {
  flex: 1;
  display: flex;
}
.options input[type='checkbox'] {
  position: absolute;
  transform: translate(-8px, -8px) scale(1.3);
}
.options .price {
  padding: var(--m-padding);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}
.options .option {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.5rem;
  padding: var(--m-padding);
  background-color: var(--primary-very-dark-color);
  border-radius: 8px;
  border: 1px solid white;
  width: 100px;
  min-height: 100px;
}
.options .option h4 {
  margin: 0;
  font-size: var(--h4-font-size);
}

.couple-option {
  display: flex;
  flex-direction: row;
  gap: var(--grid-m-gap);
  font-weight: bold;
}

.information-element {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field.validation-error {
  border: 2px solid rgb(223, 27, 65);
}

p.validation-error {
  color: rgb(223, 27, 65);
}
p.card-error {
  text-align: center;
}
.field-container {
  display: flex;
  flex-direction: row;
  gap: var(--grid-m-gap);
}
</style>

<style>
.section {
  display: flex;
  flex-direction: row;
  gap: var(--grid-lg-gap);
  min-height: 250px;
  align-items: start;
}
.section > * {
  flex-basis: 0;
  flex-grow: 1;
}
.section .text {
  align-self: center;
  justify-self: center;
  display: flex;
  flex-direction: column;
  gap: var(--grid-m-gap);
}
.section .container {
  position: relative;
}
.section .background {
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  z-index: 0;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
}
.section img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}
.content .items {
  flex: 1;
  text-align: left;
  padding: var(--lg-padding);
  border-collapse: collapse;
}
.content .items td,
.content .items th {
  padding: var(--s-padding) var(--xs-padding);
}
.content .items td,
.content .items th {
  border-bottom: 1px solid white;
}
.content .items ul {
  padding: 0 var(--m-padding);
}
.checkout-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--grid-lg-gap);
  margin-bottom: var(--lg-padding);
}
</style>

<style is:global>
.card.payment {
  align-items: start !important;
  justify-content: start !important;
}
</style>

<script setup lang="ts">
import { onMounted, ref, type Ref, inject, watch } from 'vue'
import Card from '../components/Card.vue'
import { type Pass } from '../data/pass'
import { loadStripe, Stripe, type StripeElements } from '../stripe'
import type { Order } from '../payment-api/payment.api'

const { pass } = defineProps<{ pass: Pass }>()
const defaultCurrency = 'USD'
let stripe: Stripe
let elements: StripeElements
const currency: Ref<'USD' | 'EUR' | 'THB'> | undefined = inject('currency')
const submitting = ref(false)
const fullNameValidationError = ref(false)
const fullName = ref('')
const emailValidationError = ref(false)
const cardDeclinedError = ref(false)
const cardDeclinedErrorMessage = ref('')
const email = ref('')
let optionsFeatures: () => string[] = () =>
  optionIds.value.map((option) => pass.options[option].description).filter((x): x is string => x !== undefined)
const optionIds = ref<string[]>([])
const calculateTotal = () => {
  let total = pass.price[currency?.value ?? defaultCurrency]
  total += Object.values(pass.options).reduce(
    (total, option) =>
      (total += optionIds.value.includes(option.id) ? option.price[currency?.value ?? defaultCurrency] : 0),
    0
  )
  return total
}
const total = ref(calculateTotal())

onMounted(async () => {
  stripe = await loadStripe()
  elements = stripe.elements({
    amount: calculateTotal(),
    currency: (currency?.value ?? defaultCurrency).toLowerCase(),
  })
  stripe.mountElements(elements, '#payment-element')
})

if (currency) {
  watch(currency, () => {
    total.value = calculateTotal()
    elements = stripe.elements({
      amount: calculateTotal(),
      currency: (currency?.value ?? defaultCurrency).toLowerCase(),
    })
    stripe.mountElements(elements, '#payment-element')
  })
}

watch(optionIds, () => {
  total.value = calculateTotal()
})

const submit = async () => {
  submitting.value = true
  fullNameValidationError.value = !fullName.value
  emailValidationError.value = !email.value
  const options = optionIds.value.map((option) => pass.options[option])
  const order: Omit<Order, 'id' | 'paymentIntentId' | 'paymentStatus'> = {
    email: email.value,
    fullname: fullName.value,
    passId: pass.id,
    date: new Date(),
    items: [
      {
        id: pass.id,
        title: pass.name,
        includes: pass.includes,
        amount: 1,
        total: { amount: pass.price[currency?.value ?? defaultCurrency], currency: currency?.value ?? defaultCurrency },
      },
    ].concat(
      options.map((option) => ({
        id: option.id,
        title: option.title,
        includes: [],
        amount: 1,
        total: {
          amount: option.price[currency?.value ?? defaultCurrency],
          currency: currency?.value ?? defaultCurrency,
        },
      }))
    ),
  }
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
  if (optionIds.value.includes('said-mc-option') && optionIds.value.includes('henoco-mc-option')) {
    optionIds.value = optionIds.value.concat(['all-mc-option'])
  }
  if (optionIds.value.includes('all-mc-option')) {
    optionIds.value = optionIds.value.filter((option) => !['said-mc-option', 'henoco-mc-option'].includes(option))
  }
}

const shouldDisabled = (id: string) => {
  return optionIds.value.includes('all-mc-option') && ['said-mc-option', 'henoco-mc-option'].includes(id)
}
</script>

<template>
  <form class="grid" @submit.prevent="submit">
    <Card :class="['ticket']">
      <div class="title">
        <h2>{{ pass.name }}</h2>
        <div class="promotion-price" v-if="pass.price.EUR != pass.doorPrice.EUR">
          <p>
            <b>
              {{ currency }}
              {{ (pass.price[currency ?? defaultCurrency] / 100).toFixed(2) }}
            </b>
          </p>
          <p>
            <s>
              {{ currency }}
              {{ (pass.doorPrice[currency ?? defaultCurrency] / 100).toFixed(2) }}</s
            >
          </p>
        </div>
      </div>
      <div class="description">
        <h3>Includes</h3>
        <div class="features">
          <ul class="pass-features">
            <li v-for="feature in pass.includes" :key="feature">
              {{ feature }}
            </li>
          </ul>
          <ul class="option-features">
            <li v-for="feature in optionsFeatures()" :key="feature">
              {{ feature }}
            </li>
          </ul>
        </div>
        <h3>Options</h3>
        <ul class="options">
          <li v-for="option in Object.values(pass.options)" :key="option.id" @click="selectOption(option.id)">
            <div :class="['option-container', option.id]">
              <input type="checkbox" :value="option.id" v-model="optionIds" :disabled="shouldDisabled(option.id)" />
              <div class="option">
                <i :class="['fa-solid', option.icon]"></i>
                <h4>{{ option.title }}</h4>
                <p>{{ option.description }}</p>
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
      </div>
    </Card>
    <Card :class="['payment']">
      <div class="container">
        <div class="total">
          <h2>Total: {{ currency }} {{ (total / 100).toFixed(2) }}</h2>
        </div>
        <div class="information-element">
          <label>Full name</label>
          <div style="display: flex">
            <input
              :class="['field', fullNameValidationError ? 'validation-error' : '']"
              type="text"
              placeholder="Full name"
              v-model="fullName"
            />
          </div>
          <p class="validation-error" v-if="fullNameValidationError">Your full name is incomplete.</p>
        </div>
        <div class="information-element">
          <label>Email</label>
          <div style="display: flex">
            <input
              :class="['field', emailValidationError ? 'validation-error' : '']"
              type="text"
              placeholder="Email"
              v-model="email"
            />
          </div>
          <p class="validation-error" v-if="emailValidationError">Your email is incomplete.</p>
        </div>
        <div id="payment-element"></div>
        <button class="button action" v-if="submitting" disabled><span class="loader"></span></button>
        <button id="payment-action" class="button action" v-if="!submitting && !pass.isSoldOut">Pay</button>
        <button id="payment-action" class="button action disabled" v-if="!submitting && pass.isSoldOut" disabled>
          Sold Out
        </button>
        <p class="validation-error card-error" v-if="cardDeclinedError">{{ cardDeclinedErrorMessage }}</p>
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
  gap: var(--grid-lg-gap);
}

.ticket {
  grid-column: span 7;
  min-height: var(--card-lg-height) !important;
  align-items: start !important;
  justify-content: start !important;
}
.ticket .title {
  padding: var(--lg-padding);
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  background-color: var(--secondary-color);
  display: flex;
  flex-direction: row;
  gap: var(--grid-m-gap);
  align-items: center;
  justify-content: space-between;
}
.ticket .promotion-price {
  display: flex;
  flex-direction: column;
  gap: 0rem;
}
.ticket .description {
  padding: var(--lg-padding);
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
  .ticket,
  .payment {
    grid-column: span 12;
  }
}

.ticket .text,
.payment .text {
  width: 100%;
}

ul {
  list-style: none;
  padding: 0;
}

.features {
  display: flex;
  flex-direction: row;
  gap: var(--grid-lg-gap);
}

.features > ul {
  list-style: disc;
  padding-left: 1rem;
  margin-bottom: var(--lg-padding);
  margin-top: var(--m-padding);
}

.features > ul.pass-features {
  min-width: 50%;
}

.features > ul.option-features,
.features > ul.pass-features {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.options {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--grid-lg-gap);
  list-style: none;
  margin-top: var(--lg-padding);
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
  background-color: black;
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

@media only screen and (max-width: 920px) {
}
</style>

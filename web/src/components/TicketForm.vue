<script setup lang="ts">
import { onMounted, ref, type Ref, inject, watch } from 'vue'
import Card from '../components/Card.vue'
import { type Pass, calculateTotal } from '../data/pass'
import { loadStripe, Stripe, type StripeElements } from '../stripe'
import { PaymentAPI, type NewOrder, type Order } from '../payment-api/payment.api'
import { type DiscountPromotion, type GiveAwayPromotion } from '../payment-api/promotion'

const { pass } = defineProps<{ pass: Pass }>()
const defaultCurrency = 'USD'
let stripe: Stripe
let elements: StripeElements
const currency: Ref<'USD' | 'EUR' | 'THB'> | undefined = inject('currency')
const submitting = ref(false)
const applying = ref(false)
const applied = ref(false)
const fullNameValidationError = ref(false)
const fullName = ref('')
const promoCode = ref<string | undefined>(undefined)
const promoCodeValidationError = ref(false)
const emailValidationError = ref(false)
const dancerTypeValidationError = ref(false)
const dancerType = ref<('leader' | 'follower')[]>([])
const cardDeclinedError = ref(false)
const cardDeclinedErrorMessage = ref('')
const email = ref('')
const discount = ref(1)
const giveAways = ref<string[]>([])
let optionsFeatures: () => string[] = () =>
  optionIds.value.flatMap((option) => pass.options[option].includes).filter((x): x is string => x !== undefined)
const optionIds = ref<string[]>(
  Object.values(pass.options)
    .filter((option) => option.selected)
    .map((option) => option.id)
)
const calculatePrice = () => {
  return calculateTotal(pass, optionIds.value, discount.value)[currency?.value ?? defaultCurrency]
}
const total = ref(calculatePrice())

onMounted(async () => {
  stripe = await loadStripe()
  elements = stripe.elements({
    amount: calculatePrice(),
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

watch(discount, () => {
  total.value = calculatePrice()
})

watch(optionIds, () => {
  total.value = calculatePrice()
})

const submit = async () => {
  submitting.value = true
  fullNameValidationError.value = !fullName.value
  emailValidationError.value = !email.value
  dancerTypeValidationError.value = dancerType.value.length == 0
  const options = optionIds.value.map((option) => pass.options[option])
  const order: NewOrder = {
    email: email.value,
    fullname: fullName.value,
    dancerType: optionIds.value.includes('couple-option') ? 'couple' : dancerType.value[0],
    passId: pass.id,
    date: new Date(),
    promoCode: promoCode.value ?? undefined,
    items: [
      {
        id: pass.id,
        title: pass.name,
        includes: pass.includes,
        amount: 1,
        total: { amount: pass.price[currency?.value ?? defaultCurrency], currency: currency?.value ?? defaultCurrency },
      },
    ].concat(
      ...(discount.value != 1
        ? [
            {
              id: 'dicount',
              title: `Discount ${(100 - discount.value * 100).toFixed(0)}% off`,
              includes: [],
              amount: 1,
              total: {
                amount: Math.round((total.value / discount.value - total.value) * -1),
                currency: currency?.value ?? defaultCurrency,
              },
            },
          ]
        : []),
      ...giveAways.value.map((item) => ({
        id: 'give-away',
        title: item,
        includes: [],
        amount: optionIds.value.includes('couple-option') ? 2 : 1,
        total: {
          amount: 0,
          currency: currency?.value ?? defaultCurrency,
        },
      })),
      ...options.flatMap((option) =>
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

const applyPromoCode = async () => {
  applying.value = true
  const api = new PaymentAPI()
  if (promoCode.value) {
    try {
      const promotion = await api.applyPromoCode(pass.id, promoCode.value)
      promoCodeValidationError.value = false
      applying.value = false
      const dicountPromotion = promotion as DiscountPromotion
      const giveAwayPromotion = promotion as GiveAwayPromotion
      applied.value = true
      if (dicountPromotion.discount) {
        discount.value = dicountPromotion.discount
      } else if (giveAwayPromotion.options) {
        giveAways.value = giveAwayPromotion.options.map((option) => option.description)
      } else {
        applied.value = false
      }
    } catch (error) {
      applying.value = false
      applied.value = false
      promoCodeValidationError.value = true
    }
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
  if (optionIds.value.includes('vip-silver-upgrade')) {
    optionIds.value = optionIds.value.filter((option) => !['cruise-option'].includes(option))
  }
  if (optionIds.value.includes('vip-gold-upgrade')) {
    optionIds.value = optionIds.value.filter((option) => !['cruise-option', 'vip-silver-upgrade'].includes(option))
  }
}

const shouldDisabled = (id: string) => {
  return (
    (optionIds.value.includes('all-mc-option') && ['said-mc-option', 'heneco-mc-option'].includes(id)) ||
    (optionIds.value.includes('vip-silver-upgrade') && ['cruise-option'].includes(id)) ||
    (optionIds.value.includes('vip-gold-upgrade') && ['cruise-option', 'vip-silver-upgrade'].includes(id)) ||
    pass.options[id].soldOut == true
  )
}
</script>

<template>
  <form class="grid" @submit.prevent="submit">
    <Card :class="['ticket']">
      <div class="title">
        <h2>
          {{
            optionIds.includes('couple-option')
              ? 'Couple ' + pass.name
              : pass.id != 'fullpass-edition3'
              ? 'Single ' + pass.name
              : pass.name
          }}
        </h2>
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
            <li v-for="feature in giveAways" :key="feature">
              {{ feature }}
            </li>
            <li v-for="feature in optionsFeatures()" :key="feature">
              {{ feature }}
            </li>
          </ul>
        </div>
        <h3 v-if="Object.keys(pass.options).length > 0">Options</h3>
        <ul class="options" v-if="Object.keys(pass.options).length > 0">
          <li
            v-for="option in Object.values(pass.options).filter((option) => !option.soldOut)"
            :key="option.id"
            @click="selectOption(option.id)"
          >
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
      </div>
    </Card>
    <Card :class="['payment']">
      <div class="container">
        <div class="total">
          <h2>Total: {{ currency }} {{ (total / 100).toFixed(2) }}</h2>
        </div>
        <div class="information-element" v-if="!optionIds.includes('couple-option') && pass.id != 'dj'">
          <div class="dancer-type-options">
            <div
              :class="[
                'dancer-type-option',
                'field',
                dancerTypeValidationError ? 'validation-error' : '',
                dancerType.includes('leader') ? 'selected' : '',
              ]"
              @click="dancerType = ['leader']"
            >
              <input type="checkbox" value="leader" v-model="dancerType" />
              <div class="option"><p>Leader</p></div>
            </div>
            <div
              :class="[
                'dancer-type-option',
                'field',
                dancerTypeValidationError ? 'validation-error' : '',
                dancerType.includes('follower') ? 'selected' : '',
              ]"
              @click="dancerType = ['follower']"
            >
              <input type="checkbox" value="follower" v-model="dancerType" />
              <div class="option"><p>Follower</p></div>
            </div>
          </div>
          <p v-if="!dancerTypeValidationError">We are aiming for a reasonable balance between leaders and followers.</p>
          <p class="validation-error" v-if="dancerTypeValidationError">Your dancer type is incomplete.</p>
        </div>
        <div class="information-element">
          <label>Full name</label>
          <div class="field-container">
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
          <div class="field-container">
            <input
              :class="['field', emailValidationError ? 'validation-error' : '']"
              type="email"
              placeholder="Email"
              v-model="email"
            />
          </div>
          <p class="validation-error" v-if="emailValidationError">Your email is incomplete.</p>
        </div>
        <div id="payment-element"></div>
        <div class="information-element" v-if="pass.id != 'fullpass-edition3'">
          <label>Promo Code</label>
          <div class="field-container">
            <input
              :class="['field', promoCodeValidationError ? 'validation-error' : '']"
              type="text"
              placeholder="Promo Code"
              v-model="promoCode"
              :disabled="applied"
            />
            <button class="button action" v-if="!applying && !applied" @click="applyPromoCode">Apply</button>
            <button class="button action disabled" v-if="!applying && applied" disabled>Applied</button>
            <button class="button action" v-if="applying" disabled><span class="loader"></span></button>
          </div>
          <p class="validation-error" v-if="promoCodeValidationError">The promo code is not valid.</p>
        </div>
        <button class="button action" v-if="submitting" disabled><span class="loader"></span></button>
        <button class="button action" v-if="!submitting && !pass.isSoldOut">Pay</button>
        <button class="button action disabled" v-if="!submitting && pass.isSoldOut" disabled>Sold Out</button>
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
  gap: var(--grid-m-gap);
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
  max-width: 50%;
}

.features > ul.option-features,
.features > ul.pass-features {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 50%;
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
.dancer-type-options {
  display: flex;
  flex-direction: row;
  gap: var(--grid-m-gap);
  cursor: pointer;
}
.dancer-type-option p {
  text-align: center;
}
.dancer-type-option input[type='checkbox'] {
  position: absolute;
  transform: translate(-18px, -18px) scale(1.3);
}
@media only screen and (max-width: 920px) {
}
</style>

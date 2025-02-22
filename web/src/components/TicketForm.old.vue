<script setup lang="ts">
import { onMounted, ref, type Ref, inject, watch } from 'vue'
import Card from '../components/Card.vue'
import { type Pass, calculateFirstInstallment, calculateTotal } from '../data/pass'
import { loadStripe, Stripe, type StripeElements } from '../stripe'
import { PaymentAPI, type NewOrder, type PaymentOption } from '../payment-api/payment.api'
import { type DiscountPromotion, type GiveAwayPromotion } from '../payment-api/promotion'
import { makeMonthlyDueDates, type PaymentDueDate } from '../installment'
import { v4 as uuid } from 'uuid'
import { DateTime } from 'luxon'

const { pass } = defineProps<{ pass: Pass }>()
const isValentinePass = [
  'fullpass-edition3',
  'fullpass-valentine',
  'vip-silver-valentine',
  'vip-gold-valentine',
].includes(pass.id)
const defaultCurrency = 'USD'
let stripe: Stripe
let elements: StripeElements
const currency: Ref<'USD' | 'EUR' | 'THB'> | undefined = inject('currency')
const submitting = ref(false)
const applying = ref(false)
const applied = ref(false)
const fullNameValidationError = ref(false)
const fullName = ref('')
const fullName2 = ref('')
const promoCode = ref<string | undefined>(undefined)
const promoCodeValidationError = ref(false)
const emailValidationError = ref(false)
const dancerTypeValidationError = ref(false)
const dancerType = ref<('leader' | 'follower')[]>([])
const installmentTermsApprovement = ref<('approved')[]>([])
const installmentTermsApprovementError = ref(false)
const cardDeclinedError = ref(false)
const cardDeclinedErrorMessage = ref('')
const paymentOption = ref<PaymentOption['structure']>('direct')
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

const calculateTotalPrice = () => {
  return calculateTotal(pass, optionIds.value, discount.value)[currency?.value ?? defaultCurrency]
}

const calculatePrice = () => {
  if (paymentOption.value == 'direct') {
    return calculateTotal(pass, optionIds.value, discount.value)[currency?.value ?? defaultCurrency]
  }
  else {
    return calculateFirstInstallment(pass, optionIds.value, discount.value)[currency?.value ?? defaultCurrency]
  }
}
const total = ref(calculateTotalPrice())
const createMonthlyDueDates = (): (PaymentDueDate & { id: string})[] => makeMonthlyDueDates(
    { 
      term: 3, 
      amountToBePaid: { amount: total.value, currency: (currency?.value ?? defaultCurrency) }, 
      today: new Date()
    }
  ).map((installment) => ({ ...installment, id: uuid() }))
const installments = ref<(PaymentDueDate & { id: string })[]>(createMonthlyDueDates())

onMounted(async () => {
  stripe = await loadStripe()
  elements = stripe.elements({
    amount: calculatePrice(),
    currency: (currency?.value ?? defaultCurrency).toLowerCase(),
    isInstallment: paymentOption.value != 'direct'
  })
  stripe.mountElements(elements, '#payment-element')
})

if (currency) {
  watch(currency, () => {
    total.value = calculateTotalPrice()
    installments.value = createMonthlyDueDates()
    // elements.update({ currency: (currency?.value ?? defaultCurrency).toLowerCase() })
    elements = stripe.elements({
      amount: calculatePrice(),
      currency: (currency?.value ?? defaultCurrency).toLowerCase(),
      isInstallment: paymentOption.value != 'direct'
    })
  })
}

watch(discount, () => {
  total.value = calculateTotalPrice()
  installments.value = createMonthlyDueDates()
  elements.update({ amount: calculatePrice() })
})

watch(optionIds, () => {
  total.value = calculateTotalPrice()
  installments.value = createMonthlyDueDates()
  elements.update({ amount: calculatePrice() })
})

watch(paymentOption, () => {
  total.value = calculateTotalPrice()
  elements = stripe.elements({
    amount: calculatePrice(),
    currency: (currency?.value ?? defaultCurrency).toLowerCase(),
    isInstallment: paymentOption.value != 'direct'
  })
  stripe.mountElements(elements, '#payment-element')
})

const submit = async () => {
  submitting.value = true
  fullNameValidationError.value = !fullName.value
  emailValidationError.value = !email.value
  dancerTypeValidationError.value = dancerType.value.length == 0
  installmentTermsApprovementError.value = !installmentTermsApprovement.value.includes('approved')
  const { error: submitError } = await elements.submit()
  if (submitError) {
    cardDeclinedError.value = true
    cardDeclinedErrorMessage.value = submitError.message ?? 'Your card has been declined.'
    console.error('Confirm payment error: ', submitError)
  }
  if (cardDeclinedError.value || fullNameValidationError.value || emailValidationError.value || dancerTypeValidationError.value || installmentTermsApprovementError.value) {
    submitting.value = false
    return
  }
  const options = optionIds.value.map((option) => pass.options[option])
  const order: NewOrder = {
    email: email.value,
    fullname: [fullName.value, fullName2.value].join(', '),
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
  const { error } = await stripe.confirmPayment(elements, order, { method: 'automatic', structure: paymentOption.value })
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
  if (
    optionIds.value.includes('asia-masterclass') &&
    optionIds.value.includes('tpeak-masterclass') &&
    optionIds.value.includes('audi-laura-masterclass')
  ) {
    optionIds.value = optionIds.value.concat(['all-masterclass'])
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
  if (optionIds.value.includes('all-masterclass')) {
    optionIds.value = optionIds.value.filter(
      (option) => !['asia-masterclass', 'tpeak-masterclass', 'audi-laura-masterclass'].includes(option)
    )
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
        <p>
          <h2>
            {{
              optionIds.includes('couple-option')
                ? 'Couple ' + pass.name
                : !['fullpass-edition3', 'fullpass-valentine', 'vip-silver-valentine', 'vip-gold-valentine'].includes(
                    pass.id
                  )
                ? 'Single ' + pass.name
                : pass.name
            }}
          </h2>
          <p v-if="isValentinePass">This pass is strictly reserved to a female and male participants.</p>
        </p>
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
        <!-- <div class="total">
          <h2>Total: {{ currency }} {{ (total / 100).toFixed(2) }}</h2>
        </div> -->
        <div
          class="information-element"
          v-if="
            !optionIds.includes('couple-option') &&
            !['dj', 'fullpass-valentine', 'vip-silver-valentine', 'vip-gold-valentine'].includes(pass.id)
          "
        >
        <div class="payment-options">
            <div
              :class="[
                'payment-option',
                'field',
                paymentOption == 'direct' ? 'selected' : '',
              ]"
              @click="paymentOption = 'direct'"
            >
              <div class="option">
                <p class="title">{{ currency }} {{ (total / 100).toFixed(2) }}</p>
                <p class="subtitle">full amount</p>
              </div>
            </div>
            <div
              :class="[
                'payment-option',
                'field',
                paymentOption == 'installment3x' ? 'selected' : '',
              ]"
              @click="paymentOption = 'installment3x'"
            >
              <div class="option">
                <div>
                  <p class="title">{{ currency }} {{ ((total - ((Math.floor(total / 3)) * 2)) / 100).toFixed(2) }}</p>
                  <p style="line-height: calc(var(--text-font-size) * 0.5);"><small>per month</small></p>
                </div>
                <p class="subtitle" style="margin-top: calc(var(--text-font-size) * 0.5);">3 months installment</p>
              </div>
            </div>
          </div>
          <div class="installment-container" v-if="paymentOption == 'installment3x'">
            <p class="subtitle validation-error" style="padding-bottom: 0.5rem;" v-if="installmentTermsApprovementError">You need to agree on the installment program terms.</p>
            <p class="subtitle">
              <label :class="['checkbox', installmentTermsApprovementError ? 'validation-error-checkbox' : '']"><input type="checkbox" value="approved" v-model="installmentTermsApprovement"/></label> By using the installment program, the ticket will not be refundable and transferable.
            </p>
            <ul class="steplist installments">
              <li v-for="installment in installments" :key="installment.id" class="installment">
                <div :class="['circle-container', 'circle-blue']"><div class="circle"></div></div>
                <p>
                  <p class="title">{{ installment.currency }} {{ (installment.amount / 100).toFixed(2) }}</p>
                  <p><small>{{ DateTime.fromJSDate(installment.dueDate).toISODate() }}</small></p>
                </p>
              </li>
            </ul>
          </div>
          <hr />
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
              <div class="option"><p>Male</p></div>
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
              <div class="option"><p>Female</p></div>
            </div>
          </div>
          <p class="validation-error" v-if="dancerTypeValidationError">Your gender is incomplete.</p>
        </div>
        <div class="information-element">
          <label>{{ isValentinePass ? 'Miss full name' : 'Full name' }}</label>
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
        <div class="information-element" v-if="isValentinePass">
          <label>Mister full name</label>
          <div class="field-container">
            <input
              :class="['field', fullNameValidationError ? 'validation-error' : '']"
              type="text"
              placeholder="Full name"
              v-model="fullName2"
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
            <button class="button action" v-if="!applying && !applied" @click="applyPromoCode" style="padding-left: 1.5rem; padding-right: 1.5rem;">Apply</button>
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
hr {
  width: 100%;
  margin: 1.5rem 0;
}
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
.dancer-type-option.selected {
  border: 3px solid blue;
}
.dancer-type-option p {
  text-align: center;
}
.dancer-type-option input[type='checkbox'] {
  position: absolute;
  transform: translate(-18px, -18px) scale(1.3);
}

.installment-container {
  margin-top: 1rem;
}

.installment-container .subtitle {
  font-size: calc(var(--text-font-size) * 0.9);
}

.payment-options {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  cursor: pointer;
}
.payment-option p {
  text-align: center;
}
.payment-option.selected {
  border: 3px solid blue;
}
.payment-option input[type='checkbox'] {
  position: absolute;
  transform: translate(-18px, -18px) scale(1.3);
}
.payment-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 0.75rem;
}

.payment-option .option .title {
  font-size: calc(var(--text-font-size) * 1.25);
  font-weight: bold;
}
.payment-option .option .title small {
  font-weight: normal;
  font-size: calc(var(--text-font-size) * 0.9);
}
.payment-option .option .subtitle {
  font-size: calc(var(--text-font-size) * 0.8);
}

.installment .title {
  font-weight: bold;
}
.installment small {
  font-weight: normal;
}

.installments {
  padding-bottom: 0;
}

.checkbox {
  /* display: inline-block; */
}

.checkbox input[type=checkbox] {
  margin: 0;
  padding: 0;
}

.validation-error-checkbox {
  padding: 1px 3.5px 1px 2.5px;
  border: 2px solid red;
  border-radius: 4px;
}

@media only screen and (max-width: 920px) {
  .button.action {
    min-height: 42px;
  }
  .payment-option {
    padding: 1rem 0.5rem;
  }
}
</style>

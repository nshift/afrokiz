<template>
  <Card :class="[...(classes ?? [])]">
    <form class="container" @submit.prevent="submit">
      <div class="information-element">
        <div class="payment-options">
          <div
            :class="['payment-option', 'field', paymentOption == 'direct' ? 'selected' : '']"
            @click="paymentOption = 'direct'"
          >
            <div class="option">
              <p class="title">{{ currency }} {{ ((total * discount) / 100).toFixed(2) }}</p>
              <p class="subtitle">Pay full amount today.</p>
            </div>
          </div>
          <div
            :class="['payment-option', 'field', 'disabled']"
            v-if="showInstallment !== false && !canUseInstallmentProgram(total * discount, currency)"
          >
            <div class="option">
              <p class="title">Pay over 2 months</p>
              <p class="subtitle">
                {{ currency }} {{ (minimumAmountForInstallmentProgram[currency] / 100).toFixed(2) }} minimum
              </p>
            </div>
          </div>
          <div
            :class="['payment-option', 'field', paymentOption == 'installment3x' ? 'selected' : '']"
            @click="paymentOption = 'installment3x'"
            v-if="showInstallment !== false && canUseInstallmentProgram(total, currency)"
          >
            <div class="option">
              <div>
                <p class="title">
                  {{ currency }} {{ ((total * discount - Math.floor((total * discount) / 4) * 2) / 100).toFixed(2) }}
                </p>
                <p style="line-height: calc(var(--text-font-size) * 0.5)"><small>per month</small></p>
              </div>
              <p class="subtitle" style="margin-top: calc(var(--text-font-size) * 0.5)">2 months installment</p>
            </div>
          </div>
        </div>
        <div
          class="installment-container"
          v-if="paymentOption == 'installment3x' && canUseInstallmentProgram(total, currency)"
        >
          <p class="subtitle validation-error" style="padding-bottom: 0.5rem" v-if="installmentTermsApprovementError">
            You need to agree on the installment program terms.
          </p>
          <p class="subtitle">
            <label :class="['checkbox', installmentTermsApprovementError ? 'validation-error-checkbox' : '']"
              ><input type="checkbox" value="approved" v-model="installmentTermsApprovement"
            /></label>
            By using the installment program, you agree on the
            <a href="/terms-conditions" target="_blank">Terms & Conditions</a>.
          </p>
          <ul class="steplist installments">
            <li v-for="(installment, index) in installments" :key="installment.id" class="installment">
              <div :class="['circle-container', index == 0 ? 'circle-blue' : '']"><div class="circle"></div></div>
              <div class="installment-text">
                <p class="title">{{ installment.currency }} {{ (installment.amount / 100).toFixed(2) }}</p>
                <p>
                  <small v-if="index == 0">Today</small>
                  <small v-if="index != 0">In {{ index }} month{{ index > 1 ? 's' : '' }}</small>
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <hr />
      <div
        class="information-element"
        v-if="
          !optionIds.includes('couple-option') &&
          !['dj', 'fullpass-valentine', 'vip-silver-valentine', 'vip-gold-valentine'].includes(pass.id) &&
          shouldRequestPersonalInformation &&
          pass.id != 'none'
        "
      >
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
      <div class="information-element" v-if="shouldRequestPersonalInformation && !shouldRequestOrderId">
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
      <div class="information-element" v-if="isValentinePass && shouldRequestPersonalInformation && !shouldRequestOrderId">
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
      <div class="information-element" v-if="shouldRequestPersonalInformation && !shouldRequestOrderId">
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
      <div class="information-element" v-if="shouldRequestOrderId">
        <label>Order Id</label>
        <div class="field-container">
          <input
            :class="['field', orderIdValidationError ? 'validation-error' : '']"
            type="text"
            placeholder="AB3456"
            v-model="requestedOrderId"
          />
        </div>
        <p class="validation-error" v-if="orderIdValidationError">Your order does not exist.</p>
      </div>
      <div id="payment-element"></div>
      <div class="information-element" v-if="pass.id != 'fullpass-edition3' && !shouldRequestOrderId">
        <label>Promo Code</label>
        <div class="field-container">
          <input
            :class="['field', promoCodeValidationError ? 'validation-error' : '']"
            type="text"
            placeholder="Promo Code"
            v-model="promoCode"
            :disabled="applied"
          />
          <button
            class="button action"
            v-if="!applying && !applied"
            @click="applyPromoCode"
            style="padding-left: 1.5rem; padding-right: 1.5rem"
          >
            Apply
          </button>
          <button class="button action disabled" v-if="!applying && applied" disabled>Applied</button>
          <button class="button action" v-if="applying" disabled><span class="loader"></span></button>
        </div>
        <p class="validation-error" v-if="promoCodeValidationError">The promo code is not valid.</p>
      </div>
      <hr />
      <button class="button action" v-if="submitting" disabled><span class="loader"></span></button>
      <button class="button action" v-if="!submitting && (forcePayment || !pass.isSoldOut) && total > 0 && props.enablePayment">Pay</button>
      <button class="button action disabled" v-if="!submitting && (total <= 0 && (forcePayment || !pass.isSoldOut)) || !props.enablePayment" disabled>Pay</button>
      <button class="button action disabled" v-if="!submitting && (pass.isSoldOut && !forcePayment) && props.enablePayment" disabled>Sold Out</button>
      <p class="validation-error card-error" v-if="cardDeclinedError">{{ cardDeclinedErrorMessage }}</p>
    </form>
  </Card>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, watchEffect } from 'vue'
import { PaymentAPI, type NewOrder, type Order, type Payment, type PaymentOption } from '../payment-api/payment.api'
import type { Currency, Pass } from '../data/pass'
import { makeMonthlyDueDates, type PaymentDueDate } from '../installment'
import { v4 as uuid } from 'uuid'
import type { DiscountPromotion, GiveAwayPromotion } from '../payment-api/promotion'
import type { StripeElements } from '@stripe/stripe-js'
import { loadStripe, type Stripe } from '../stripe'
import Card from './Card.vue'
import { defaultPasses } from '../data/edition3/pass'

function createMonthlyDueDates(): (PaymentDueDate & { id: string })[] {
  return makeMonthlyDueDates({
    term: 2,
    amountToBePaid: { amount: total.value * discount.value, currency: currency.value },
    today: new Date(),
  }).map((installment) => ({ ...installment, id: uuid() }))
}

const props = defineProps<{
  pass: Pass
  currency: Currency
  total: number
  optionIds: string[]
  order?: Order
  classes?: string[]
  showInstallment?: boolean
  payment?: Payment
  forcePayment?: boolean
  items: Order['items']
  enablePayment: boolean
}>()
let stripe: Stripe
let elements: StripeElements
const isValentinePass = ['fullpass-valentine', 'vip-silver-valentine', 'vip-gold-valentine'].includes(props.pass.id)
const total = ref<number>(props.total)
const currency = ref<Currency>(props.currency)
const paymentOption = ref<PaymentOption['structure']>('direct')
const dancerType = ref<('leader' | 'follower' | 'couple')[]>(
  props.order?.dancerType ? [props.order.dancerType] : isValentinePass ? ['couple'] : []
)
const dancerTypeValidationError = ref(false)
const fullNameValidationError = ref(false)
const fullName = ref(props.order?.fullname ?? '')
const fullName2 = ref('')
const emailValidationError = ref(false)
const email = ref(props.order?.email ?? '')
const promoCode = ref<string | undefined>(undefined)
const promoCodeValidationError = ref(false)
const submitting = ref(false)
const applying = ref(false)
const applied = ref(false)
const discount = ref(1)
const giveAways = ref<string[]>([])
const cardDeclinedError = ref(false)
const cardDeclinedErrorMessage = ref('')
const installmentTermsApprovement = ref<'approved'[]>([])
const installmentTermsApprovementError = ref(false)
const installments = ref<(PaymentDueDate & { id: string })[]>(createMonthlyDueDates())
const minimumAmountForInstallmentProgram =  defaultPasses.fullPass.price
const canUseInstallmentProgram = (amount: number, currency: Currency) =>
  props.pass.id == 'testpass' || amount > minimumAmountForInstallmentProgram[currency]
const shouldRequestPersonalInformation = props.order === undefined
const shouldRequestOrderId = props.pass.id == 'none'
const orderIdValidationError = ref(false)
const requestedOrderId = ref('')

const getStripeAmount = () => {
  return total.value > 0 ? total.value * discount.value : 100
}

onMounted(async () => {
  stripe = await loadStripe()
  elements = stripe.elements({
    amount: getStripeAmount(),
    currency: currency.value.toLowerCase(),
    isInstallment: paymentOption.value != 'direct',
  })
  stripe.mountElements(elements, '#payment-element')
})

watchEffect(() => {
  total.value = props.total
  currency.value = props.currency
})

watch(discount, () => {
  elements.update({ amount: getStripeAmount() })
  installments.value = createMonthlyDueDates()
})

watch(total, () => {
  elements.update({ amount: getStripeAmount() })
  installments.value = createMonthlyDueDates()
  if (paymentOption.value == 'installment3x' && !canUseInstallmentProgram(total.value, currency.value)) {
    paymentOption.value = 'direct'
  }
})

watch(currency, () => {
  elements = stripe.elements({
    amount: getStripeAmount(),
    currency: currency.value.toLowerCase(),
    isInstallment: paymentOption.value != 'direct',
  })
  stripe.mountElements(elements, '#payment-element')
  installments.value = createMonthlyDueDates()
})

watch(paymentOption, () => {
  elements = stripe.elements({
    amount: getStripeAmount(),
    currency: currency.value.toLowerCase(),
    isInstallment: paymentOption.value != 'direct',
  })
  stripe.mountElements(elements, '#payment-element')
})

async function applyPromoCode() {
  applying.value = true
  const api = new PaymentAPI()
  if (promoCode.value) {
    try {
      const promotion = await api.applyPromoCode(props.pass.id, promoCode.value)
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

async function submit() {
  if (shouldRequestOrderId) {
    submitting.value = true
    if (requestedOrderId.value.length == 0) {
      orderIdValidationError.value = true
      submitting.value = false
      return
    }
    const paymentApi = new PaymentAPI()
    try {
      const order = await paymentApi.getOrderById(requestedOrderId.value)
      const pass = Object.values(defaultPasses).filter((pass) => pass.id == order.passId)[0]
      await confirmPayment(pass, props.items, order)
      submitting.value = false
    } catch (error: any) {
      orderIdValidationError.value = true
      submitting.value = false
    }
    return
  }
  submitting.value = true
  fullNameValidationError.value = !fullName.value
  emailValidationError.value = !email.value
  dancerTypeValidationError.value = dancerType.value.length == 0
  orderIdValidationError.value = shouldRequestOrderId ? requestedOrderId.value.length == 0 : false
  installmentTermsApprovementError.value = !installmentTermsApprovement.value.includes('approved')
  await confirmPayment(props.pass, props.items, props.order)
  submitting.value = false
}

async function confirmPayment(pass: Pass, items: Order['items'], order?: Order) {
  const { error: submitError } = await elements.submit()
  if (submitError) {
    cardDeclinedError.value = true
    cardDeclinedErrorMessage.value = submitError.message ?? 'Your card has been declined.'
    console.error('Confirm payment error: ', submitError)
  }
  if (
    cardDeclinedError.value ||
    fullNameValidationError.value ||
    emailValidationError.value ||
    dancerTypeValidationError.value ||
    orderIdValidationError.value ||
    (paymentOption.value == 'installment3x' && installmentTermsApprovementError.value)
  ) {
    submitting.value = false
    return
  }
  const options = props.optionIds.map((option) => pass.options[option])
  const newOrder: NewOrder = {
    id: order?.id,
    email: order?.email ?? email.value,
    fullname: order?.fullname ?? [fullName.value, fullName2.value].join(', '),
    dancerType: order?.dancerType ?? (props.optionIds.includes('couple-option') ? 'couple' : dancerType.value[0]),
    passId: pass.id,
    date: new Date(),
    promoCode: order?.promoCode ?? promoCode.value ?? undefined,
    items: (order
      ? order.items
      : [
          {
            id: pass.id,
            title: pass.name,
            includes: pass.includes,
            amount: 1,
            total: { amount: pass.price[currency.value], currency: currency.value },
          },
        ]
    )
    .concat(items)
    .concat(
      ...(discount.value != 1
        ? [
            {
              id: 'dicount',
              title: `Discount ${(100 - discount.value * 100).toFixed(0)}% off`,
              includes: [],
              amount: 1,
              total: {
                amount: Math.round((total.value / discount.value - total.value) * -1),
                currency: currency.value,
              },
            },
          ]
        : []),
      ...giveAways.value.map((item) => ({
        id: 'give-away',
        title: item,
        includes: [],
        amount: props.optionIds.includes('couple-option') ? 2 : 1,
        total: {
          amount: 0,
          currency: currency.value,
        },
      })),
      ...options.map((option) => ({
        id: option.id,
        title: option.title,
        includes: option.includes,
        amount: props.optionIds.includes('couple-option') && option.id != 'couple-option' ? 2 : 1,
        total: {
          amount:
            option.price[currency.value] *
            (props.optionIds.includes('couple-option') && option.id != 'couple-option' ? 2 : 1),
          currency: currency.value,
        },
      }))
    ),
  }
  const payment = props.payment
  try {
    const { error } =  payment 
      ? await stripe.confirmPayment(elements, payment, newOrder) 
      : await stripe.createPayment(elements, newOrder, {
          method: 'automatic',
          structure: paymentOption.value,
        })
    if (error) {
      cardDeclinedError.value = true
      cardDeclinedErrorMessage.value = error.message ?? 'Your card has been declined.'
    }
  }
  catch (error: any) {
    cardDeclinedError.value = true
    cardDeclinedErrorMessage.value = error.message ?? 'Your card has been declined.'
  }
}
</script>

<style>
hr {
  width: 100%;
  margin: 0.5rem 0;
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
.installment .installment-text {
  padding: 0 0.5rem;
}

.installments {
  padding-bottom: 0;
}

.checkbox {
  /* display: inline-block; */
}

.checkbox input[type='checkbox'] {
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

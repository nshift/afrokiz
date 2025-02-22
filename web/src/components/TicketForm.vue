<script setup lang="ts">
import { ref, type Ref, inject, watch } from 'vue'
import Card from '../components/Card.vue'
import { type Pass, calculateTotal } from '../data/pass'
import Payment from './Payment.vue'

const { pass } = defineProps<{ pass: Pass }>()
const isValentinePass = [
  'fullpass-edition3',
  'fullpass-valentine',
  'vip-silver-valentine',
  'vip-gold-valentine',
].includes(pass.id)
const defaultCurrency = 'USD'
const currency: Ref<'USD' | 'EUR' | 'THB'> | undefined = inject('currency')
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
const total = ref(calculateTotalPrice())

if (currency) {
  watch(currency, () => {
    total.value = calculateTotalPrice()
  })
}

watch(discount, () => {
  total.value = calculateTotalPrice()
})

watch(optionIds, () => {
  total.value = calculateTotalPrice()
})

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
  <div class="grid">
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
    <Payment 
      :class="['payment']"  
      :pass="pass" 
      :total="total" 
      :currency="currency ?? defaultCurrency" 
      :optionIds="optionIds" 
      />
  </div>
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

</style>

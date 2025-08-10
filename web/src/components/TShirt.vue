<script setup lang="ts">
import { inject, ref, watch, type Ref } from 'vue';
import type { TShirt } from '../data/tshirt';
import Payment from './Payment.vue';
import { defaultPasses } from '../data/edition3/pass';
import Card from '../components/Card.vue'
import type { Order } from '../payment-api/payment.api';

const props = defineProps<{
  item: TShirt
}>()
const defaultCurrency = 'USD'
const currency: Ref<'USD' | 'EUR' | 'THB'> | undefined = inject('currency')

const calculateTotalPrice = () => {
  return props.item.price[currency?.value ?? defaultCurrency]
}

const total = ref(calculateTotalPrice())
const pass = defaultPasses.none

const selectedSize = ref<string[]>([])
const selectSize = (size: string) => {
  selectedSize.value = [size]
}

const selectedColor = ref<string[]>([props.item.colors[0]])
const selectColor = (color: string) => {
  selectedColor.value = [color]
}

const makeItem = () => {
  if (selectedSize.value.length == 0) {
    return
  }
  items.value = [{
    id: props.item.id,
    title: props.item.name,
    includes: [`${props.item.name} ${selectedColor.value[0]} ${selectedSize.value[0]}`],
    amount: 1,
    total: {
        amount: calculateTotalPrice(),
        currency: currency?.value ?? defaultCurrency
    }
  }]
}
const items = ref<Order['items']>([])

watch(selectedColor, () => {
  makeItem()
})

watch(selectedSize, () => {
  makeItem()
})
</script>

<template>
  <div class="grid">
    <Card :class="['ticket']">
      <div class="title">
        <p>
          <h2>{{ props.item.name }}</h2>
        </p>
      </div>
      <div class="description">
        <div class="split">
          <ul style="padding: 0; list-style: none; margin: 0;">
            <li v-for="image in props.item.pictures[selectedColor[0]]" :key="image" style="margin: 0; padding: 0;">
              <img
                class="picture"
                :src="image"
                style="height: 100%; width: 100%; object-fit: cover"
              />
            </li>
          </ul>
          <div>
            <h3>Colors</h3>
            <ul class="options">
              <li
                v-for="color in props.item.colors"
                :key="color"
                @click="selectColor(color)"
              >
                <div :class="['option-container']">
                  <input type="checkbox" :value="color" v-model="selectedColor" />
                  <div class="option">
                    <h4>{{ color }}</h4>
                  </div>
                </div>
              </li>
            </ul>
            <h3>Sizes</h3>
            <ul class="options">
              <li
                v-for="size in props.item.sizes"
                :key="size"
                @click="selectSize(size)"
              >
                <div :class="['option-container']">
                  <input type="checkbox" :value="size" v-model="selectedSize" />
                  <div class="option">
                    <h4>{{ size }}</h4>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          
        </div>
      </div>
    </Card>
    <Payment
      :class="['payment']"
      :pass="pass"
      :total="total"
      :currency="currency ?? defaultCurrency"
      :optionIds="[]"
      :showInstallment="false"
      :items="items"
      :enablePayment="selectedSize.length > 0 && selectedColor.length > 0"
    />
  </div>
</template>

<style>
.grid {
  align-items: start;
}
.ticket {
  grid-column: span 7;
  /* min-height: var(--card-lg-height) !important; */
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
.ticket .description {
  padding: var(--lg-padding);
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
.ticket .text,
.payment .text {
  width: 100%;
}

.split {
  display: flex;
  flex-direction: row;
  gap: var(--grid-m-gap);
}
.split > * {
  flex: 1;
}

.options {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--grid-lg-gap);
  list-style: none;
  padding: 0 0 0 var(--m-padding);
  margin: var(--m-padding) 0;
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
  background-color: var(--primary-very-dark-color);
  border-radius: 8px;
  border: 1px solid white;
  padding: var(--s-padding);
}
.options .option h4 {
  margin: 0;
  font-size: var(--h4-font-size);
}
.picture {
  border-radius: 16px;
}

@media only screen and (max-width: 920px) {
  .ticket,
  .payment {
    grid-column: span 12;
  }

  .options {
    padding: 0 0 0 var(--lg-padding);
    margin: var(--lg-padding) 0;
  }
  .options .option {
    width: 100%;
    padding: var(--m-padding);
    min-height: auto;
  }
}
</style>
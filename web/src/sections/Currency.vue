<script setup>
import { onMounted, inject } from 'vue'

const { localStorage } = window
const currencies = ['USD', 'THB', 'EUR']
const defaultCurrency = currencies[0]
const selectedCurrency = inject('currency')

onMounted(() => {
  const userLocale = localStorage.getItem('state.currency')
  if (!userLocale) {
    localStorage.setItem('state.currency', defaultCurrency)
  }
  selectedCurrency.value = userLocale ?? defaultCurrency
})

const changeCurrency = () => {
  localStorage.setItem('state.currency', selectedCurrency.value)
}
</script>

<template>
  <select class="currencies form-control" v-model="selectedCurrency" @change="changeCurrency">
    <option v-for="currency in Object.values(currencies)" :value="currency" :key="currency">
      {{ currency }}
    </option>
  </select>
</template>

<style scoped>
.currencies {
  cursor: pointer;
  font-weight: bold;
  border: 0;
  border-radius: 0;
  text-align: center;
  background-color: var(--background-color);
  color: var(--text-primary-color);
  padding: calc(var(--m-padding) / 2) var(--m-padding);
}
.currencies:hover {
  background-color: var(--primary-darker-color);
  transition: 0.5s;
}
.currencies option {
  padding: 2rem;
  text-align: center;
}
.form-control {
  width: auto;
}
@media only screen and (max-width: 920px) {
  .currencies {
    padding: calc(var(--s-padding) / 2) var(--s-padding);
  }
}
</style>

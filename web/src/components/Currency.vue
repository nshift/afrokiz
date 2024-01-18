<script setup lang="ts">
import { type Ref, inject } from 'vue'
import { type Pass } from '../data/pass'

const { price } = defineProps<{ price: Pass['price'] }>()
const currency: Ref<'USD' | 'EUR' | 'THB'> | undefined = inject('currency')
</script>

<template>
  <p>
    {{ currency }}
    {{ (price[currency ?? 'USD'] / 100).toFixed(2) }}
  </p>
</template>

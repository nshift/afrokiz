<script setup lang="ts">
import { type Ref, inject } from 'vue'
import { makeMonthlyDueDates } from '../installment'

const { term, amountToBePaid, today } = defineProps<{
  term: number
  amountToBePaid: {
    USD: number
    EUR: number
    THB: number
  }
  today: Date
}>()
const currency: Ref<'USD' | 'EUR' | 'THB'> | undefined = inject('currency')
</script>

<template>
  <p>
    {{ currency }}
    {{
      makeMonthlyDueDates({
        term,
        amountToBePaid: { amount: amountToBePaid[currency ?? 'USD'] / 100, currency: currency ?? 'USD' },
        today,
      })[1].amount.toFixed(2)
    }}/mo
  </p>
</template>

<script setup lang="ts">
import { ref, type Ref } from 'vue'
import Card from '../components/Card.vue'
import { type Pass } from '../data/pass'
import { isInstallment, type Order, type Payment } from '../payment-api/payment.api'
import PaymentComponent from './Payment.vue'
import { DateTime } from 'luxon'

const { pass, order, payment } = defineProps<{ pass: Pass; order: Order; payment: Payment }>()
const currency: Ref<'USD' | 'EUR' | 'THB'> = ref(payment.currency)
const total = ref(payment.status == 'completed' ? 0 : payment.amount)

const paymentStatusIcon = {
  pending: 'fa-circle-pause',
  overdue: 'fa-circle-exclamation',
  default: 'fa-circle-exclamation',
  completed: 'fa-circle-check',
  success: 'fa-circle-check',
  failed: 'fa-circle-exclamation',
}
</script>

<template>
  <div class="grid">
    <Card :class="['checkout-card']">
      <div :class="['title', payment.status == 'completed' ? 'success' : 'pending' ]">
        <p>Order #{{ order.id }}</p>
        <h2>Your payment is {{ payment.status == 'completed' ? 'completed' : 'pending' }}</h2>
      </div>
      <div class="content">
        <div class="section">
          <div class="checkout-details">
            <div class="payment-section">
              <div>
                <h3>Payments</h3>
                <table class="payment-structures">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody v-for="(paymentStructure, index) in order.paymentStructures" :key="'ps-' + index">
                    <tr
                      v-if="isInstallment(paymentStructure)"
                      v-for="(installment, installmentIndex) in paymentStructure.dueDates"
                      :key="'ins-' + index + installmentIndex"
                    >
                      <td><i :class="['fa-solid', paymentStatusIcon[installment.status] ?? '']"></i></td>
                      <td>{{ installment.currency }} {{ (installment.amount / 100).toFixed(2) }}</td>
                      <td>{{ DateTime.fromJSDate(installment.dueDate).toISODate() }}</td>
                      <td>{{ installment.status }}</td>
                      <td><a :href="`/payment?id=${installment.paymentId}`" v-if="['pending', 'overdue', 'default'].includes(installment.status)">Pay</a></td>
                    </tr>
                    <tr v-if="!isInstallment(paymentStructure)">
                      <td><i :class="['fa-solid', paymentStatusIcon[paymentStructure.status] ?? '']"></i></td>
                      <td>{{ paymentStructure.currency }} {{ (paymentStructure.amount / 100).toFixed(2) }}</td>
                      <td>{{ DateTime.fromJSDate(order.date).toISODate() ?? 'null' }}</td>
                      <td>{{ paymentStructure.status }}</td>
                      <td><a :href="`/payment?id=${paymentStructure.paymentId}`" v-if="['pending', 'overdue', 'default'].includes(paymentStructure.status)">Pay</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
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
          <PaymentComponent
            :class="['payment']"
            :order="order"
            :pass="pass"
            :total="total"
            :currency="currency"
            :optionIds="[]"
            :showInstallment="false"
            :payment="payment"
            :forcePayment="true"
            :items="[]"
            :enablePayment="true"
          />
        </div>
      </div>
    </Card>
  </div>
</template>

<style>
.grid {
  align-items: start;
}

ul {
  list-style: none;
  padding: 0;
}

.options {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--grid-m-gap);
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
  padding: var(--xs-padding);
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
  padding: var(--s-padding);
  background-color: var(--primary-very-dark-color);
  border-radius: 8px;
  border: 1px solid white;
  width: 70px;
  font-size: 0.9rem;
}
.options .option h4 {
  margin: 0;
  font-size: 1.1rem;
}

.couple-option {
  display: flex;
  flex-direction: row;
  gap: var(--grid-m-gap);
  font-weight: bold;
}

.checkout-card {
  grid-column: span 12;
  align-items: start !important;
  justify-content: start !important;
}
.checkout-card a {
  color: white;
  font-weight: bold;
}
.checkout-card > .text > .title {
  text-align: center;
  padding: var(--m-padding);
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.checkout-card > .text > .title.pending {
  background-color: #4580ff;
}
.checkout-card > .text > .title.success {
  background-color: var(--success-color);
}
.checkout-card .content {
  padding: var(--lg-padding);
  display: flex;
  flex-direction: column;
  gap: var(--grid-lg-gap);
}
.checkout-card .text {
  width: 100%;
}
.payments {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.payment-structure {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.payment-structures {
  padding-top: 1.5rem;
  width: 100%;
}
.payment-structures tbody tr td,
.payment-structures thead tr th {
  text-align: left;
  padding: 0.5rem;
}
.payment-structures .fa-circle-pause {
  font-size: 1.25rem;
  color: #4580ff;
}
.payment-structures .fa-circle-exclamation {
  font-size: 1.25rem;
  color: #ffca45;
}
.payment-structures .fa-circle-check {
  font-size: 1.25rem;
  color: #85e645;
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
.checkout-details > * {
  width: 100%;
}
@media only screen and (max-width: 920px) {
  .section {
    flex-direction: column;
  }
  .section > * {
    width: 100%;
  }
  .options {
    gap: 1.5rem;
  }
  .options .option {
    width: 60px;
    font-size: 0.7rem;
  }
  .options .option h4 {
    margin: 0;
    font-size: 0.9rem;
  }
  .options .price {
    width: 60px;
  }
}
</style>

<style is:global>
.card.payment {
  align-items: start !important;
  justify-content: start !important;
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
  align-items: start !important;
  justify-content: start !important;
}
.payment .text {
  width: 100%;
}

@media only screen and (max-width: 920px) {
  .payment {
    grid-column: span 12;
  }
}
</style>

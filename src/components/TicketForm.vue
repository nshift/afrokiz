<script setup lang="ts">
import { onMounted, ref, type Ref, inject, watch } from "vue";
import Card from "../components/Card.vue";
import { type Pass } from "../data/pass";
import { loadStripe, Stripe, type StripeElements } from "../stripe";

const { pass } = defineProps<{ pass: Pass }>();
console.log({ pass });
let stripe: Stripe;
let elements: StripeElements;
const currency: Ref<"USD" | "EUR" | "THB"> | undefined = inject("currency");
const fullNameValidationError = ref(false);
const fullName = ref("");
let optionsFeatures: () => string[] = () =>
  options.value
    .map((option) => pass.options[option].description)
    .filter((x): x is string => x !== undefined);
const options = ref<string[]>([]);
const calculateTotal = () => {
  let total = pass.price[currency?.value ?? "THB"];
  total += Object.values(pass.options).reduce(
    (total, option) =>
      (total += options.value.includes(option.id)
        ? option.price[currency?.value ?? "THB"]
        : 0),
    0
  );
  return total;
};
const total = ref(calculateTotal());

onMounted(async () => {
  stripe = await loadStripe();
  elements = stripe.elements({
    amount: calculateTotal(),
    currency: (currency?.value ?? "THB").toLowerCase(),
  });
  stripe.mountElements(elements, "#payment-element");
});

if (currency) {
  watch(currency, () => {
    total.value = calculateTotal();
    elements = stripe.elements({
      amount: calculateTotal(),
      currency: (currency?.value ?? "THB").toLowerCase(),
    });
    stripe.mountElements(elements, "#payment-element");
  });
}

watch(options, () => {
  total.value = calculateTotal();
});

const submit = async () => {
  fullNameValidationError.value = !fullName.value;
  const { error } = await stripe.confirmPayment(elements, fullName.value);
  if (error) {
    return console.error("Confirm payment error: ", error);
  }
};

const selectOption = (id: string) => {
  const disbaled = shouldDisabled(id);
  if (disbaled) {
    return;
  }
  options.value = options.value.includes(pass.options[id].id)
    ? options.value.filter((option) => option != pass.options[id].id)
    : options.value.concat([pass.options[id].id]);
  if (
    options.value.includes("said-mc-option") &&
    options.value.includes("henoco-mc-option")
  ) {
    options.value = options.value.concat(["all-mc-option"]);
  }
  if (options.value.includes("all-mc-option")) {
    options.value = options.value.filter(
      (option) => !["said-mc-option", "henoco-mc-option"].includes(option)
    );
  }
};

const shouldDisabled = (id: string) => {
  return (
    options.value.includes("all-mc-option") &&
    ["said-mc-option", "henoco-mc-option"].includes(id)
  );
};
</script>

<template>
  <form class="grid" @submit.prevent="submit">
    <Card :class="['ticket']">
      <div class="title">
        <h2>{{ pass.name }}</h2>
        <div
          class="promotion-price"
          v-if="pass.price.EUR != pass.doorPrice.EUR"
        >
          <p>
            <b>
              {{ currency }}
              {{ (pass.price[currency ?? "THB"] / 100).toFixed(2) }}
            </b>
          </p>
          <p>
            <s>
              {{ currency }}
              {{ (pass.doorPrice[currency ?? "THB"] / 100).toFixed(2) }}</s
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
          <li
            v-for="option in Object.values(pass.options)"
            :key="option.id"
            @click="selectOption(option.id)"
          >
            <div :class="['option-container', option.id]">
              <input
                type="checkbox"
                :value="option.id"
                v-model="options"
                :disabled="shouldDisabled(option.id)"
              />
              <div class="option">
                <i :class="['fa-solid', option.icon]"></i>
                <h4>{{ option.title }}</h4>
                <p>{{ option.description }}</p>
              </div>
            </div>
            <div class="price">
              <p>
                {{ currency }}
                {{ (option.price[currency ?? "THB"] / 100).toFixed(2) }}
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
        <div id="address-element">
          <label>Full name</label>
          <div style="display: flex">
            <input
              :class="[
                'field',
                fullNameValidationError ? 'validation-error' : '',
              ]"
              type="text"
              placeholder="Full name"
              v-model="fullName"
            />
          </div>
          <p class="validation-error" v-if="fullNameValidationError">
            Your full name is incomplete.
          </p>
        </div>
        <div id="payment-element"></div>
        <button
          id="payment-action"
          class="button action"
          v-if="!pass.isSoldOut"
        >
          Pay
        </button>
        <button
          id="payment-action"
          class="button action disabled"
          v-if="pass.isSoldOut"
          disabled
        >
          Sold Out
        </button>
      </div>
    </Card>
  </form>
</template>

<style>
.grid {
  align-items: start;
}
.container {
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
.options input[type="checkbox"] {
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

#address-element {
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
@media only screen and (max-width: 920px) {
}
</style>

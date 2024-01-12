import { type App, ref } from "vue";
const selectedCurrency = ref<string | null>(null);

export default (app: App) => {
  app.provide("currency", selectedCurrency);
};

import { ref, type App } from 'vue'
const selectedCurrency = ref<string>('USD')

export default (app: App) => {
  app.provide('currency', selectedCurrency)
}

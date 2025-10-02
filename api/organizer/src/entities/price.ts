import { Currency } from './currency'

export type Price = {
  [key in Currency]: number
}

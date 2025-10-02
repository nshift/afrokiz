import { Currency } from '../../../entities/currency'

export type PriceSchema = {
  [key in Currency]: number
}

import { Identifier } from './entities/identifier'

export const makeDictionary = <T extends { id: Identifier }>(arr: T[]): Record<Identifier, T> =>
  Object.fromEntries(arr.map((item) => [item.id, item])) as Record<Identifier, T>

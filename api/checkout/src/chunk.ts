export const chunk = <T>(arr: Array<T>, size: number): Array<Array<T>> =>
  arr.length > size ? [arr.slice(0, size), ...chunk(arr.slice(size), size)] : [arr]

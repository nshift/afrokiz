export const mock = <T>(mocks?: Partial<T>) => {
  return new Proxy(
    {},
    {
      get: (target, property) => {
        target[property] = (mocks && mocks[property]) || target[property] || jest.fn()
        return target[property]
      },
    }
  ) as T
}

export const getCalls = <T>(method: T) => (method as jest.Mock).mock.calls

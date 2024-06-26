import * as path from 'path'

export const CheckoutModule = (...paths: string[]) => path.resolve('../checkout', ...paths)
export const OperationModule = (...paths: string[]) => path.resolve('../operation', ...paths)

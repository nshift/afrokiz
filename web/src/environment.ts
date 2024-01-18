export class Environment {
  static Host = () => required('PUBLIC_HOST')
  static PaymentApiHost = () => required('PUBLIC_PAYMENT_API_HOST')
}

function required(environmentName: string) {
  const environmentVariable = import.meta.env[environmentName]
  if (!environmentVariable) {
    throw new Error(`Environment variable ${environmentName} is required.`)
  }
  return environmentVariable
}

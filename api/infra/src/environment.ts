export class Environment {
  static StripeSecretKeyName = () => required('STRIPE_SECRET_KEY_NAME')
}

function required(environmentName: string) {
  const environmentVariable = process.env[environmentName]
  if (!environmentVariable) {
    throw new Error(`Environment variable ${environmentName} is required.`)
  }
  return environmentVariable
}

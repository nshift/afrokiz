export class Environment {
  static StripeSecretKeysName = () => required('STRIPE_SECRET_KEYS_NAME')
  static WebAppHost = () => required('WEB_APP_HOST')
}

function required(environmentName: string) {
  const environmentVariable = process.env[environmentName]
  if (!environmentVariable) {
    throw new Error(`Environment variable ${environmentName} is required.`)
  }
  return environmentVariable
}

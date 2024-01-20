export class Environment {
  static SecretKeysName = () => required('SECRET_KEYS_NAME')
  static WebAppHost = () => required('WEB_APP_HOST')
  static StripeSecretApiKeyName = () => required('STRIPE_SECRET_KEY_NAME')
  static StripeWebhookSecretApiKeyName = () => required('STRIPE_WEBHOOK_SECRET_KEY_NAME')
}

function required(environmentName: string) {
  const environmentVariable = process.env[environmentName]
  if (!environmentVariable) {
    throw new Error(`Environment variable ${environmentName} is required.`)
  }
  return environmentVariable
}

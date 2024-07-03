import * as cdk from 'aws-cdk-lib'
import { Environment } from './environment'

export const getStripeSecrets = (stack: cdk.Stack) => {
  const secretKeyManager = cdk.aws_secretsmanager.Secret.fromSecretNameV2(
    stack,
    'aws/secretsmanager',
    Environment.SecretKeysName()
  )
  const stripeSecretKey = secretKeyManager.secretValueFromJson(Environment.StripeSecretApiKeyName()).unsafeUnwrap()
  const stripeWebhookSecretKey = secretKeyManager
    .secretValueFromJson(Environment.StripeWebhookSecretApiKeyName())
    .unsafeUnwrap()
  return { secret: stripeSecretKey, webhook: stripeWebhookSecretKey }
}

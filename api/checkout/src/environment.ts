export class Environment {
  static EventTableName = () => required('EVENT_TABLE_NAME')
  static OrderTableName = () => required('ORDER_TABLE_NAME')
  static StripeSecretKey = () => required('STRIPE_SECRET_KEY')
  static Region = () => process.env['AWS_REGION']
  static AwsAccessKeyId = () => process.env['AWS_ACCESS_KEY_ID']
  static AwsSecretAccessKey = () => process.env['AWS_SECRET_ACCESS_KEY']
}

function required(environmentName: string) {
  const environmentVariable = process.env[environmentName]
  if (!environmentVariable) {
    throw new Error(`Environment variable ${environmentName} is required.`)
  }
  return environmentVariable
}

export class Environment {
  static EventConfigurationTableName = () => required('EVENT_CONFIGURATION_TABLE_NAME')
  static UserPoolId = () => required('COGNITO_USER_POOL_ID')
  static UserPoolClientId = () => required('COGNITO_USER_POOL_CLIENT_ID')
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

export class Environment {
  static Host = () => required("PUBLIC_HOST");
}

function required(environmentName: string) {
  const environmentVariable = import.meta.env[environmentName];
  if (!environmentVariable) {
    throw new Error(`Environment variable ${environmentName} is required.`);
  }
  return environmentVariable;
}

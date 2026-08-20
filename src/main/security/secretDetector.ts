const SECRET_NAME_PATTERNS = [
  'PASSWORD',
  'PASS',
  'TOKEN',
  'SECRET',
  'API_KEY',
  'APIKEY',
  'AUTH',
  'PRIVATE_KEY',
  'ACCESS_KEY',
  'CREDENTIAL',
] as const

const SECRET_NAME_REGEX = new RegExp(SECRET_NAME_PATTERNS.join('|'), 'i')
const ASSIGNMENT_SECRET_REGEX = new RegExp(
  `\\b([A-Z0-9_]*(?:${SECRET_NAME_PATTERNS.join('|')})[A-Z0-9_]*)\\s*=\\s*([^\\s;]+)`,
  'gi',
)

export function isPotentialSecretName(name: string): boolean {
  return SECRET_NAME_REGEX.test(name)
}

export function redactSecrets(text: string): string {
  return text.replace(ASSIGNMENT_SECRET_REGEX, '$1=[REDACTED]')
}

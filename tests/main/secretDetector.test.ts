import { describe, expect, it } from 'vitest'
import { isPotentialSecretName, redactSecrets } from '@main/security/secretDetector'

describe('secretDetector', () => {
  it('identifies sensitive environment names', () => {
    expect(isPotentialSecretName('GITHUB_TOKEN')).toBe(true)
    expect(isPotentialSecretName('JAVA_HOME')).toBe(false)
  })

  it('redacts values from technical logs', () => {
    expect(redactSecrets('API_KEY=abc123 NODE_HOME=C:\\Node')).toBe(
      'API_KEY=[REDACTED] NODE_HOME=C:\\Node',
    )
  })
})

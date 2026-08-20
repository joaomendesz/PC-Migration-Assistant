import { describe, expect, it } from 'vitest'
import { mergeApplications, normalizeApplicationName } from '@main/scanners/appNormalizer'

describe('appNormalizer', () => {
  it('normalizes common architecture suffixes', () => {
    expect(normalizeApplicationName('Google Chrome (64-bit)')).toBe('google chrome')
    expect(normalizeApplicationName('Google Chrome x64')).toBe('google chrome')
  })

  it('deduplicates registry entries and attaches matching winget package', () => {
    const apps = mergeApplications(
      [
        {
          name: 'Google Chrome (64-bit)',
          version: '126',
          publisher: 'Google LLC',
        },
        {
          name: 'Google Chrome',
          publisher: 'Google LLC',
        },
      ],
      [
        {
          name: 'Google Chrome',
          packageId: 'Google.Chrome',
          version: '126',
          source: 'winget',
        },
      ],
    )

    expect(apps).toHaveLength(1)
    expect(apps[0].winget?.packageId).toBe('Google.Chrome')
    expect(apps[0].restoreMethod).toBe('winget')
  })
})

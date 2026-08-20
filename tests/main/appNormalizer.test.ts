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

  it('matches short registry names when publisher and package tokens agree', () => {
    const apps = mergeApplications(
      [
        {
          name: 'Chrome',
          version: '126',
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

    expect(apps[0].winget?.packageId).toBe('Google.Chrome')
  })

  it('does not attach unrelated packages on weak token overlap', () => {
    const apps = mergeApplications(
      [
        {
          name: 'Python Launcher',
          publisher: 'Python Software Foundation',
        },
      ],
      [
        {
          name: 'Python 3.13',
          packageId: 'Python.Python.3.13',
          source: 'winget',
        },
      ],
    )

    const launcher = apps.find((app) => app.name === 'Python Launcher')

    expect(launcher?.winget).toBeUndefined()
    expect(launcher?.restoreMethod).toBe('manual')
  })
})

import { describe, expect, it } from 'vitest'
import { strFromU8, unzipSync } from 'fflate'
import { SnapshotBuilder, sha256 } from '@main/snapshot/snapshotBuilder'

describe('SnapshotBuilder', () => {
  it('creates a pcma archive with manifest, data files and checksums', () => {
    const snapshot = new SnapshotBuilder().build({
      appVersion: '0.1.0',
      createdAt: '2026-08-20T22:30:00.000Z',
      system: {
        computerName: 'DESKTOP-JOAO',
        osName: 'Windows',
        osVersion: '11',
        osBuild: '26100',
        architecture: 'x64',
        cpu: 'AMD Ryzen',
        memoryGB: 32,
      },
      winget: {
        available: true,
        version: 'v1.8.0',
        resolvedFrom: 'path',
      },
      applications: [
        {
          id: 'chrome',
          name: 'Google Chrome',
          version: '126.0.0',
          publisher: 'Google LLC',
          winget: {
            packageId: 'Google.Chrome',
            source: 'winget',
            version: '126.0.0',
            detectedBy: 'list-and-export',
          },
          restoreMethod: 'winget',
        },
      ],
    })

    const files = unzipSync(snapshot.archive)
    const manifest = JSON.parse(strFromU8(files['manifest.json']))
    const applications = JSON.parse(strFromU8(files['data/applications.json']))

    expect(Object.keys(files).sort()).toEqual([
      'data/applications.json',
      'data/system.json',
      'data/winget.json',
      'manifest.json',
    ])
    expect(manifest.format).toBe('pcma')
    expect(manifest.schemaVersion).toBe(1)
    expect(manifest.computer.name).toBe('DESKTOP-JOAO')
    expect(applications.selectedCount).toBe(1)

    for (const [path, checksum] of Object.entries<{
      sha256: string
      sizeBytes: number
    }>(manifest.checksums)) {
      expect(files[path]).toBeDefined()
      expect(checksum.sha256).toBe(sha256(files[path]))
      expect(checksum.sizeBytes).toBe(files[path].byteLength)
    }
  })

  it('rejects empty application snapshots', () => {
    expect(() =>
      new SnapshotBuilder().build({
        appVersion: '0.1.0',
        createdAt: '2026-08-20T22:30:00.000Z',
        system: {
          computerName: 'DESKTOP-JOAO',
          osName: 'Windows',
          osVersion: '11',
          osBuild: '26100',
          architecture: 'x64',
          cpu: 'AMD Ryzen',
          memoryGB: 32,
        },
        winget: {
          available: false,
        },
        applications: [],
      }),
    ).toThrow()
  })
})

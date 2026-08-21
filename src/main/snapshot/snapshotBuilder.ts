import { createHash } from 'node:crypto'
import { strToU8, zipSync } from 'fflate'
import type {
  SnapshotApplicationsData,
  SnapshotArchive,
  SnapshotArchiveInput,
  SnapshotManifest,
  SnapshotWingetData,
} from '@shared/types/snapshot'
import { SnapshotArchiveInputSchema, SnapshotManifestSchema } from '@shared/schemas/snapshotSchemas'

const JSON_INDENT = 2

export class SnapshotBuilder {
  build(input: SnapshotArchiveInput): SnapshotArchive {
    const safeInput = SnapshotArchiveInputSchema.parse(input)

    const files: Record<string, Uint8Array> = {
      'data/system.json': toJsonBytes(safeInput.system),
      'data/applications.json': toJsonBytes({
        applications: safeInput.applications,
        selectedCount: safeInput.applications.length,
      } satisfies SnapshotApplicationsData),
      'data/winget.json': toJsonBytes({
        status: safeInput.winget,
        packages: safeInput.applications
          .filter((app) => app.winget)
          .map((app) => ({
            packageId: app.winget?.packageId ?? '',
            name: app.name,
            version: app.winget?.version,
            source: app.winget?.source,
          }))
          .filter((item) => item.packageId.length > 0),
      } satisfies SnapshotWingetData),
    }

    const checksums = Object.fromEntries(
      Object.entries(files).map(([path, bytes]) => [
        path,
        {
          sha256: sha256(bytes),
          sizeBytes: bytes.byteLength,
        },
      ]),
    )

    const manifest = SnapshotManifestSchema.parse({
      format: 'pcma',
      schemaVersion: 1,
      appVersion: safeInput.appVersion,
      createdAt: safeInput.createdAt,
      computer: {
        name: safeInput.system.computerName,
      },
      contents: {
        applications: true,
        developerEnvironment: false,
        vscode: false,
        fonts: false,
        startup: false,
        environment: false,
        files: false,
      },
      checksums,
    } satisfies SnapshotManifest)

    return {
      manifest,
      archive: Buffer.from(
        zipSync(
          {
            'manifest.json': toJsonBytes(manifest),
            ...files,
          },
          {
            level: 6,
            mtime: new Date(safeInput.createdAt),
          },
        ),
      ),
    }
  }
}

export function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function toJsonBytes(value: unknown): Uint8Array {
  return strToU8(`${JSON.stringify(value, null, JSON_INDENT)}\n`)
}

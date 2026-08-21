import { writeFile } from 'node:fs/promises'
import type { SnapshotArchiveInput } from '@shared/types/snapshot'
import { SnapshotBuilder } from './snapshotBuilder'

export class SnapshotService {
  constructor(private readonly builder = new SnapshotBuilder()) {}

  async createSnapshotFile(input: SnapshotArchiveInput, filePath: string) {
    const snapshot = this.builder.build(input)
    await writeFile(filePath, snapshot.archive)

    return {
      filePath,
      sizeBytes: snapshot.archive.byteLength,
      manifest: snapshot.manifest,
    }
  }
}

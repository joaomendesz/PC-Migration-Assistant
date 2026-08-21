import type { InstalledApplication, WingetStatus } from './app'
import type { SystemInfo } from './system'

export interface SnapshotChecksum {
  sha256: string
  sizeBytes: number
}

export interface SnapshotManifest {
  format: 'pcma'
  schemaVersion: 1
  appVersion: string
  createdAt: string
  computer: {
    name: string
  }
  contents: {
    applications: boolean
    developerEnvironment: boolean
    vscode: boolean
    fonts: boolean
    startup: boolean
    environment: boolean
    files: boolean
  }
  checksums: Record<string, SnapshotChecksum>
}

export interface SnapshotApplicationsData {
  applications: InstalledApplication[]
  selectedCount: number
}

export interface SnapshotWingetData {
  status: WingetStatus
  packages: Array<{
    packageId: string
    name: string
    version?: string
    source?: string
  }>
}

export interface SnapshotArchiveInput {
  appVersion: string
  createdAt: string
  system: SystemInfo
  applications: InstalledApplication[]
  winget: WingetStatus
}

export interface SnapshotArchive {
  archive: Uint8Array
  manifest: SnapshotManifest
}

export interface CreateSnapshotPayload {
  applications: InstalledApplication[]
  winget: WingetStatus
}

export interface CreateSnapshotResult {
  cancelled: boolean
  filePath?: string
  sizeBytes?: number
  manifest?: SnapshotManifest
}

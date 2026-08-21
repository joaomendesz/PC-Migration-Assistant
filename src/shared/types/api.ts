import type { ScanAppsResult, ScanProgressEvent, WingetStatus } from './app'
import type { CreateSnapshotPayload, CreateSnapshotResult } from './snapshot'
import type { SystemInfo } from './system'

export interface PcMigrationApi {
  scanApps: () => Promise<ScanAppsResult>
  createSnapshot: (payload: CreateSnapshotPayload) => Promise<CreateSnapshotResult>
  getSystemInfo: () => Promise<SystemInfo>
  getWingetStatus: () => Promise<WingetStatus>
  onScanProgress: (callback: (event: ScanProgressEvent) => void) => () => void
}

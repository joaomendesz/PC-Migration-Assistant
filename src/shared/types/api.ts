import type { ScanAppsResult, ScanProgressEvent, WingetStatus } from './app'
import type { SystemInfo } from './system'

export interface PcMigrationApi {
  scanApps: () => Promise<ScanAppsResult>
  getSystemInfo: () => Promise<SystemInfo>
  getWingetStatus: () => Promise<WingetStatus>
  onScanProgress: (callback: (event: ScanProgressEvent) => void) => () => void
}

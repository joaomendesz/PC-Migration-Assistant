export type RestoreMethod = 'winget' | 'manual' | 'unknown'

export type ScanItemStatus = 'pending' | 'running' | 'done' | 'failed'

export interface WingetPackage {
  name: string
  packageId: string
  version?: string
  availableVersion?: string
  source?: string
}

export interface WingetStatus {
  available: boolean
  version?: string
  error?: string
}

export interface RegistryApplication {
  name: string
  version?: string
  publisher?: string
  installLocation?: string
  icon?: string
  uninstallString?: string
  registryKey?: string
  registryRoot?: string
}

export interface InstalledApplication {
  id: string
  name: string
  version?: string
  publisher?: string
  installLocation?: string
  icon?: string
  winget?: {
    packageId: string
    source?: string
    version?: string
  }
  restoreMethod: RestoreMethod
}

export interface ScanProgressEvent {
  scanner: 'system' | 'registry' | 'winget' | 'normalization'
  label: string
  status: ScanItemStatus
  message?: string
}

export interface ScanAppsResult {
  apps: InstalledApplication[]
  winget: WingetStatus
  scannedAt: string
  sourceCounts: {
    registry: number
    winget: number
    merged: number
  }
}

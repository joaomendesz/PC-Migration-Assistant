export const IPC_CHANNELS = {
  APPS_SCAN: 'apps:scan',
  SYSTEM_GET: 'system:get',
  SNAPSHOT_CREATE: 'snapshot:create',
  WINGET_STATUS: 'winget:status',
} as const

export const IPC_EVENTS = {
  SCAN_PROGRESS: 'scan:progress',
} as const

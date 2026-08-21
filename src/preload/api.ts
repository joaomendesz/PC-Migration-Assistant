import { ipcRenderer } from 'electron'
import { IPC_CHANNELS, IPC_EVENTS } from '@shared/constants/ipc'
import { ScanAppsResultSchema, ScanProgressEventSchema } from '@shared/schemas/appSchemas'
import {
  CreateSnapshotPayloadSchema,
  CreateSnapshotResultSchema,
} from '@shared/schemas/snapshotSchemas'
import type { PcMigrationApi } from '@shared/types/api'

export const pcMigrationApi: PcMigrationApi = {
  async scanApps() {
    const result = await ipcRenderer.invoke(IPC_CHANNELS.APPS_SCAN, {})
    return ScanAppsResultSchema.parse(result)
  },

  async createSnapshot(payload) {
    const safePayload = CreateSnapshotPayloadSchema.parse(payload)
    const result = await ipcRenderer.invoke(IPC_CHANNELS.SNAPSHOT_CREATE, safePayload)
    return CreateSnapshotResultSchema.parse(result)
  },

  async getSystemInfo() {
    return ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET, {})
  },

  async getWingetStatus() {
    return ipcRenderer.invoke(IPC_CHANNELS.WINGET_STATUS, {})
  },

  onScanProgress(callback) {
    const listener = (_event: Electron.IpcRendererEvent, payload: unknown): void => {
      callback(ScanProgressEventSchema.parse(payload))
    }

    ipcRenderer.on(IPC_EVENTS.SCAN_PROGRESS, listener)
    return () => {
      ipcRenderer.removeListener(IPC_EVENTS.SCAN_PROGRESS, listener)
    }
  },
}

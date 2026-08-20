import { ipcMain } from 'electron'
import { IPC_CHANNELS, IPC_EVENTS } from '@shared/constants/ipc'
import { NoPayloadSchema } from '@shared/schemas/ipcSchemas'
import { ScanAppsResultSchema, ScanProgressEventSchema } from '@shared/schemas/appSchemas'
import { getSystemInfo } from '@main/scanners/systemInfoScanner'
import { InstalledAppsScanner } from '@main/scanners/installedAppsScanner'
import { WingetService } from '@main/scanners/wingetService'

export function registerAppIpc(): void {
  ipcMain.handle(IPC_CHANNELS.APPS_SCAN, async (event, payload: unknown) => {
    NoPayloadSchema.parse(payload ?? {})

    const scanner = new InstalledAppsScanner()
    const result = await scanner.scan((progress) => {
      const safeProgress = ScanProgressEventSchema.parse(progress)
      event.sender.send(IPC_EVENTS.SCAN_PROGRESS, safeProgress)
    })

    return ScanAppsResultSchema.parse(result)
  })

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET, (_event, payload: unknown) => {
    NoPayloadSchema.parse(payload ?? {})
    return getSystemInfo()
  })

  ipcMain.handle(IPC_CHANNELS.WINGET_STATUS, async (_event, payload: unknown) => {
    NoPayloadSchema.parse(payload ?? {})
    return new WingetService().detect()
  })
}

import { app, dialog, ipcMain } from 'electron'
import { extname, join } from 'node:path'
import { IPC_CHANNELS, IPC_EVENTS } from '@shared/constants/ipc'
import { NoPayloadSchema } from '@shared/schemas/ipcSchemas'
import { ScanAppsResultSchema, ScanProgressEventSchema } from '@shared/schemas/appSchemas'
import {
  CreateSnapshotPayloadSchema,
  CreateSnapshotResultSchema,
} from '@shared/schemas/snapshotSchemas'
import { getSystemInfo } from '@main/scanners/systemInfoScanner'
import { InstalledAppsScanner } from '@main/scanners/installedAppsScanner'
import { WingetService } from '@main/scanners/wingetService'
import { SnapshotService } from '@main/snapshot/snapshotService'

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

  ipcMain.handle(IPC_CHANNELS.SNAPSHOT_CREATE, async (_event, payload: unknown) => {
    const safePayload = CreateSnapshotPayloadSchema.parse(payload)
    const createdAt = new Date().toISOString()

    const saveResult = await dialog.showSaveDialog({
      title: 'Salvar snapshot',
      defaultPath: join(app.getPath('documents'), createSuggestedSnapshotName(createdAt)),
      filters: [
        {
          name: 'PC Migration Assistant Snapshot',
          extensions: ['pcma'],
        },
      ],
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    })

    if (saveResult.canceled || !saveResult.filePath) {
      return CreateSnapshotResultSchema.parse({ cancelled: true })
    }

    const filePath = ensurePcmaExtension(saveResult.filePath)
    const snapshot = await new SnapshotService().createSnapshotFile(
      {
        appVersion: app.getVersion(),
        createdAt,
        system: getSystemInfo(),
        applications: safePayload.applications,
        winget: safePayload.winget,
      },
      filePath,
    )

    return CreateSnapshotResultSchema.parse({
      cancelled: false,
      ...snapshot,
    })
  })

  ipcMain.handle(IPC_CHANNELS.WINGET_STATUS, async (_event, payload: unknown) => {
    NoPayloadSchema.parse(payload ?? {})
    return new WingetService().detect()
  })
}

function createSuggestedSnapshotName(createdAt: string): string {
  const datePart = createdAt.slice(0, 10)
  return `PC-Migration-${datePart}.pcma`
}

function ensurePcmaExtension(filePath: string): string {
  return extname(filePath).toLowerCase() === '.pcma' ? filePath : `${filePath}.pcma`
}

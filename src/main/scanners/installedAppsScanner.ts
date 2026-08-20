import type { ScanAppsResult, ScanProgressEvent } from '@shared/types/app'
import { RegistryScanner } from './registryScanner'
import { WingetService } from './wingetService'
import { mergeApplications } from './appNormalizer'
import { createMockScanResult } from './mockApps'

type ProgressReporter = (event: ScanProgressEvent) => void

export class InstalledAppsScanner {
  constructor(
    private readonly registryScanner = new RegistryScanner(),
    private readonly wingetService = new WingetService(),
  ) {}

  async scan(onProgress?: ProgressReporter): Promise<ScanAppsResult> {
    if (process.env.PCMA_MOCK_MODE === 'true') {
      return createMockScanResult()
    }

    onProgress?.({
      scanner: 'system',
      label: 'Sistema operacional',
      status: 'done',
      message: process.platform === 'win32' ? 'Windows detectado' : 'Sistema não Windows',
    })

    onProgress?.({
      scanner: 'registry',
      label: 'Programas instalados',
      status: 'running',
    })

    const registryApps = await this.registryScanner.scanInstalledApplications()

    onProgress?.({
      scanner: 'registry',
      label: 'Programas instalados',
      status: 'done',
      message: `${registryApps.length} entradas encontradas`,
    })

    onProgress?.({
      scanner: 'winget',
      label: 'Winget',
      status: 'running',
    })

    const winget = await this.wingetService.detect()
    const wingetPackages = winget.available ? await this.wingetService.listInstalledPackages() : []

    onProgress?.({
      scanner: 'winget',
      label: 'Winget',
      status: winget.available ? 'done' : 'failed',
      message: winget.available
        ? `${wingetPackages.length} pacotes compatíveis via ${
            winget.resolvedFrom === 'windowsApps' ? 'WindowsApps' : 'PATH'
          }`
        : winget.error || 'Winget indisponível',
    })

    onProgress?.({
      scanner: 'normalization',
      label: 'Normalização',
      status: 'running',
    })

    const apps = mergeApplications(registryApps, wingetPackages)

    onProgress?.({
      scanner: 'normalization',
      label: 'Normalização',
      status: 'done',
      message: `${apps.length} aplicativos consolidados`,
    })

    return {
      apps,
      winget,
      scannedAt: new Date().toISOString(),
      sourceCounts: {
        registry: registryApps.length,
        winget: wingetPackages.length,
        merged: apps.length,
      },
    }
  }
}

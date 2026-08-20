import type { ScanAppsResult } from '@shared/types/app'

export function createMockScanResult(): ScanAppsResult {
  return {
    scannedAt: new Date().toISOString(),
    winget: {
      available: true,
      version: 'v1.8.0-mock',
    },
    sourceCounts: {
      registry: 5,
      winget: 4,
      merged: 5,
    },
    apps: [
      {
        id: 'mock-chrome',
        name: 'Google Chrome',
        version: '126.0.0',
        publisher: 'Google LLC',
        winget: {
          packageId: 'Google.Chrome',
          source: 'winget',
          version: '126.0.0',
        },
        restoreMethod: 'winget',
      },
      {
        id: 'mock-discord',
        name: 'Discord',
        version: '1.0.9148',
        publisher: 'Discord Inc.',
        winget: {
          packageId: 'Discord.Discord',
          source: 'winget',
          version: '1.0.9148',
        },
        restoreMethod: 'winget',
      },
      {
        id: 'mock-vscode',
        name: 'Microsoft Visual Studio Code',
        version: '1.91.0',
        publisher: 'Microsoft Corporation',
        winget: {
          packageId: 'Microsoft.VisualStudioCode',
          source: 'winget',
          version: '1.91.0',
        },
        restoreMethod: 'winget',
      },
      {
        id: 'mock-photoshop',
        name: 'Adobe Photoshop',
        version: '25.0',
        publisher: 'Adobe Inc.',
        restoreMethod: 'manual',
      },
      {
        id: 'mock-unknown-tool',
        name: 'Ferramenta interna',
        version: '2.3',
        restoreMethod: 'manual',
      },
    ],
  }
}

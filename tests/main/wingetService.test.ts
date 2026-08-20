import { describe, expect, it } from 'vitest'
import { WingetService } from '@main/scanners/wingetService'

describe('WingetService', () => {
  it('parses fixed-width winget list output with available version and source', () => {
    const output = `
Name                           Id                           Version      Available    Source
--------------------------------------------------------------------------------------------
Google Chrome                  Google.Chrome                126.0.0      127.0.0      winget
Microsoft Visual Studio Code   Microsoft.VisualStudioCode   1.91.0                    winget
`

    const packages = new WingetService().parseWingetList(output)

    expect(packages).toEqual([
      {
        name: 'Google Chrome',
        packageId: 'Google.Chrome',
        version: '126.0.0',
        availableVersion: '127.0.0',
        source: 'winget',
        detectedBy: 'list',
      },
      {
        name: 'Microsoft Visual Studio Code',
        packageId: 'Microsoft.VisualStudioCode',
        version: '1.91.0',
        source: 'winget',
        detectedBy: 'list',
      },
    ])
  })

  it('parses loose localized winget list output', () => {
    const output = `
Nome             Id                Versão     Origem
----------------------------------------------------
Discord          Discord.Discord   1.0.9148   winget
`

    const packages = new WingetService().parseWingetList(output)

    expect(packages).toEqual([
      {
        name: 'Discord',
        packageId: 'Discord.Discord',
        version: '1.0.9148',
        source: 'winget',
        detectedBy: 'list',
      },
    ])
  })

  it('parses winget export manifests', () => {
    const manifest = JSON.stringify({
      Sources: [
        {
          SourceDetails: {
            Name: 'winget',
          },
          Packages: [
            {
              PackageIdentifier: 'Google.Chrome',
              Version: '126.0.0',
            },
          ],
        },
      ],
    })

    const packages = new WingetService().parseWingetExportManifest(manifest)

    expect(packages).toEqual([
      {
        name: 'Google.Chrome',
        packageId: 'Google.Chrome',
        version: '126.0.0',
        source: 'winget',
        detectedBy: 'export',
      },
    ])
  })
})

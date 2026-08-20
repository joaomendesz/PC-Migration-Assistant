import { describe, expect, it } from 'vitest'
import { InstalledAppsScanner } from '@main/scanners/installedAppsScanner'

const runIntegration = process.env.PCMA_RUN_INTEGRATION === 'true'
const describeIntegration = runIntegration ? describe : describe.skip

describeIntegration('InstalledAppsScanner integration', () => {
  it('scans installed applications from the current Windows environment', async () => {
    const result = await new InstalledAppsScanner().scan()

    expect(result.sourceCounts.merged).toBeGreaterThan(0)

    if (process.platform === 'win32') {
      expect(result.sourceCounts.registry).toBeGreaterThan(0)
    }

    console.info(
      JSON.stringify(
        {
          merged: result.sourceCounts.merged,
          registry: result.sourceCounts.registry,
          winget: result.sourceCounts.winget,
          wingetAvailable: result.winget.available,
          sample: result.apps.slice(0, 5).map((app) => ({
            name: app.name,
            packageId: app.winget?.packageId,
            restoreMethod: app.restoreMethod,
          })),
        },
        null,
        2,
      ),
    )
  }, 180_000)
})

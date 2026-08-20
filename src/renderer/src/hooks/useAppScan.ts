import { useCallback, useEffect, useState } from 'react'
import type { ScanAppsResult, ScanProgressEvent } from '@shared/types/app'

export function useAppScan() {
  const [scanResult, setScanResult] = useState<ScanAppsResult | undefined>()
  const [progress, setProgress] = useState<ScanProgressEvent[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    return window.pcMigration.onScanProgress((event) => {
      setProgress((current) => {
        const withoutCurrent = current.filter((item) => item.scanner !== event.scanner)
        return [...withoutCurrent, event]
      })
    })
  }, [])

  const scanApps = useCallback(async () => {
    setIsScanning(true)
    setError(undefined)
    setProgress([])

    try {
      const result = await window.pcMigration.scanApps()
      setScanResult(result)
      return result
    } catch (scanError) {
      const message =
        scanError instanceof Error ? scanError.message : 'Falha ao escanear aplicativos.'
      setError(message)
      throw scanError
    } finally {
      setIsScanning(false)
    }
  }, [])

  return {
    scanResult,
    progress,
    isScanning,
    error,
    scanApps,
  }
}

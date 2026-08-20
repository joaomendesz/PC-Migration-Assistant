import { useEffect, useState } from 'react'
import { Gauge } from 'lucide-react'
import type { ScanAppsResult } from '@shared/types/app'
import { ApplicationList } from '@renderer/components/ApplicationList'
import { EmptyState } from '@renderer/components/EmptyState'
import { SectionHeader } from '@renderer/components/SectionHeader'
import { StatusBadge } from '@renderer/components/StatusBadge'

interface ProgramsPageProps {
  scanResult?: ScanAppsResult
  isScanning: boolean
  onScan: () => Promise<ScanAppsResult>
}

export function ProgramsPage({ scanResult, isScanning, onScan }: ProgramsPageProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!scanResult) return
    setSelectedIds(
      new Set(scanResult.apps.filter((app) => app.restoreMethod === 'winget').map((app) => app.id)),
    )
  }, [scanResult])

  const toggleApp = (id: string): void => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectWingetApps = (): void => {
    if (!scanResult) return
    setSelectedIds(
      new Set(scanResult.apps.filter((app) => app.restoreMethod === 'winget').map((app) => app.id)),
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Inventário"
        title="Programas"
        description="Lista real consolidada a partir do Registro do Windows e do Winget."
        action={
          <button
            type="button"
            disabled={isScanning}
            onClick={() => void onScan()}
            className="rounded-md bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 outline-none transition hover:bg-sky-300 focus:ring-2 focus:ring-sky-400/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isScanning ? 'Escaneando...' : 'Escanear agora'}
          </button>
        }
      />

      {scanResult ? (
        <section className="rounded-md border border-slate-700 bg-slate-900 p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-50">
                Programas encontrados{' '}
                <span className="text-slate-500">{scanResult.apps.length}</span>
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {scanResult.sourceCounts.registry} entradas no Registro ·{' '}
                {scanResult.sourceCounts.winget} pacotes no Winget
              </p>
            </div>
            <StatusBadge tone={scanResult.winget.available ? 'success' : 'warning'}>
              {scanResult.winget.available ? 'Winget detectado' : 'Winget indisponível'}
            </StatusBadge>
          </div>
          <ApplicationList
            apps={scanResult.apps}
            selectedIds={selectedIds}
            onToggle={toggleApp}
            onSelectWinget={selectWingetApps}
            onClearSelection={() => setSelectedIds(new Set())}
          />
        </section>
      ) : (
        <EmptyState
          icon={<Gauge aria-hidden className="h-6 w-6" />}
          title="Nenhum programa analisado."
          description="Execute o scanner para montar o inventário deste Windows."
          action={
            <button
              type="button"
              onClick={() => void onScan()}
              className="rounded-md bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 outline-none transition hover:bg-sky-300 focus:ring-2 focus:ring-sky-400/30"
            >
              Escanear programas
            </button>
          }
        />
      )}
    </div>
  )
}

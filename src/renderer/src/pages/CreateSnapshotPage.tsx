import { useEffect, useMemo, useState } from 'react'
import { Camera, CheckCircle2 } from 'lucide-react'
import type { ScanAppsResult, ScanProgressEvent } from '@shared/types/app'
import { ApplicationList } from '@renderer/components/ApplicationList'
import { ScannerProgress } from '@renderer/components/ScannerProgress'
import { SectionHeader } from '@renderer/components/SectionHeader'
import { StatusBadge } from '@renderer/components/StatusBadge'

interface CreateSnapshotPageProps {
  scanResult?: ScanAppsResult
  progress: ScanProgressEvent[]
  isScanning: boolean
  error?: string
  onScan: () => Promise<ScanAppsResult>
}

export function CreateSnapshotPage({
  scanResult,
  progress,
  isScanning,
  error,
  onScan,
}: CreateSnapshotPageProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!scanResult) return
    setSelectedIds(
      new Set(scanResult.apps.filter((app) => app.restoreMethod === 'winget').map((app) => app.id)),
    )
  }, [scanResult])

  const selectedApps = useMemo(() => {
    if (!scanResult) return []
    return scanResult.apps.filter((app) => selectedIds.has(app.id))
  }, [scanResult, selectedIds])

  const wingetCount = scanResult?.apps.filter((app) => app.restoreMethod === 'winget').length ?? 0

  const toggleApp = (id: string): void => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
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
        eyebrow="Snapshots"
        title="Criar snapshot"
        description="Escaneie este PC e escolha os programas que devem entrar no inventário inicial."
        action={
          <button
            type="button"
            onClick={() => void onScan()}
            disabled={isScanning}
            className="inline-flex items-center gap-2 rounded-md bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 outline-none transition hover:bg-sky-300 focus:ring-2 focus:ring-sky-400/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Camera aria-hidden className="h-4 w-4" />
            {isScanning ? 'Analisando...' : scanResult ? 'Escanear novamente' : 'Criar snapshot'}
          </button>
        }
      />

      {error ? (
        <div className="rounded-md border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {(isScanning || progress.length > 0) && <ScannerProgress progress={progress} />}

      {scanResult ? (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <SummaryTile label="Programas encontrados" value={scanResult.apps.length} />
            <SummaryTile label="Compatíveis Winget" value={wingetCount} />
            <SummaryTile label="Selecionados" value={selectedApps.length} />
            <SummaryTile
              label="Winget"
              value={
                scanResult.winget.available
                  ? (scanResult.winget.version ?? 'Detectado')
                  : 'Indisponível'
              }
            />
          </section>

          <section className="rounded-md border border-slate-700 bg-slate-900 p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-50">Programas encontrados</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Selecione os itens que farão parte do snapshot na próxima fase.
                </p>
              </div>
              <StatusBadge tone="success">
                <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
                Scanner concluído
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
        </>
      ) : (
        <section className="rounded-md border border-slate-700 bg-slate-900 p-6">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-slate-50">Preparar este computador</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              O primeiro scanner lê programas instalados no Registro do Windows e tenta relacionar
              os itens ao catálogo local do Winget. Nenhuma instalação é executada nesta etapa.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 truncate text-xl font-semibold text-slate-50">{value}</p>
    </div>
  )
}

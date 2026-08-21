import { useEffect, useMemo, useState } from 'react'
import { Camera, CheckCircle2, FileArchive, Save } from 'lucide-react'
import type { ScanAppsResult, ScanProgressEvent } from '@shared/types/app'
import type { CreateSnapshotResult } from '@shared/types/snapshot'
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
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false)
  const [snapshotResult, setSnapshotResult] = useState<CreateSnapshotResult | undefined>()
  const [snapshotError, setSnapshotError] = useState<string | undefined>()

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

  const createSnapshot = async (): Promise<void> => {
    if (!scanResult || selectedApps.length === 0) return

    setIsCreatingSnapshot(true)
    setSnapshotError(undefined)

    try {
      const result = await window.pcMigration.createSnapshot({
        applications: selectedApps,
        winget: scanResult.winget,
      })

      if (!result.cancelled) {
        setSnapshotResult(result)
      }
    } catch (createError) {
      setSnapshotError(
        createError instanceof Error ? createError.message : 'Não foi possível criar o snapshot.',
      )
    } finally {
      setIsCreatingSnapshot(false)
    }
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

      {snapshotError ? (
        <div className="rounded-md border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
          {snapshotError}
        </div>
      ) : null}

      {snapshotResult?.filePath ? (
        <div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-100">Snapshot criado com sucesso</p>
              <p className="mt-1 truncate text-sm text-emerald-100/80">{snapshotResult.filePath}</p>
              <p className="mt-1 text-xs text-emerald-100/70">
                {snapshotResult.manifest?.checksums
                  ? Object.keys(snapshotResult.manifest.checksums).length
                  : 0}{' '}
                arquivos internos validados · {formatBytes(snapshotResult.sizeBytes ?? 0)}
              </p>
            </div>
          </div>
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
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-slate-700 bg-slate-950 text-sky-300">
                  <FileArchive aria-hidden className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-slate-50">
                    Snapshot pronto para salvar
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    O arquivo incluirá manifesto, informações do sistema, aplicativos selecionados,
                    dados do Winget e checksums SHA-256.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                    <span className="rounded border border-slate-700 px-2 py-1">
                      {selectedApps.length} apps selecionados
                    </span>
                    <span className="rounded border border-slate-700 px-2 py-1">
                      {selectedApps.filter((app) => app.restoreMethod === 'winget').length} via
                      Winget
                    </span>
                    <span className="rounded border border-slate-700 px-2 py-1">Formato .pcma</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void createSnapshot()}
                disabled={selectedApps.length === 0 || isCreatingSnapshot}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 outline-none transition hover:bg-sky-300 focus:ring-2 focus:ring-sky-400/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save aria-hidden className="h-4 w-4" />
                {isCreatingSnapshot ? 'Criando snapshot...' : 'Criar arquivo .pcma'}
              </button>
            </div>
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

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

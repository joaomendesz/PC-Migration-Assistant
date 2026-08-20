import { useEffect, useState } from 'react'
import { Archive, ArrowDownToLine, Camera, Monitor, ShieldCheck } from 'lucide-react'
import type { ScanAppsResult } from '@shared/types/app'
import type { SystemInfo } from '@shared/types/system'
import { EmptyState } from '@renderer/components/EmptyState'
import { SectionHeader } from '@renderer/components/SectionHeader'
import { StatusBadge } from '@renderer/components/StatusBadge'

interface DashboardPageProps {
  scanResult?: ScanAppsResult
  onCreateSnapshot: () => void
  onPrograms: () => void
}

export function DashboardPage({ scanResult, onCreateSnapshot, onPrograms }: DashboardPageProps) {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | undefined>()

  useEffect(() => {
    void window.pcMigration.getSystemInfo().then(setSystemInfo)
  }, [])

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Início"
        title="Bom dia"
        description="Proteja seu ambiente antes de formatar o PC."
      />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <button
          type="button"
          onClick={onCreateSnapshot}
          className="group min-h-[210px] rounded-md border border-slate-700 bg-slate-900 p-6 text-left shadow-soft outline-none transition hover:border-sky-400/70 focus:ring-2 focus:ring-sky-400/30"
        >
          <div className="flex h-full flex-col justify-between gap-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">
                  Criar snapshot
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-50">
                  Analise programas, configurações e ambiente.
                </h2>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-md bg-sky-400 text-slate-950 transition group-hover:scale-105">
                <Camera aria-hidden className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Inventário local, scanner por IPC e comparação preparada para restauração futura.
            </p>
          </div>
        </button>

        <button
          type="button"
          className="min-h-[210px] rounded-md border border-slate-700 bg-slate-900/70 p-6 text-left outline-none transition hover:border-slate-500 focus:ring-2 focus:ring-sky-400/30"
        >
          <div className="flex h-full flex-col justify-between gap-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Restaurar computador
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-50">Importar snapshot</h2>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-md border border-slate-700 text-slate-300">
                <ArrowDownToLine aria-hidden className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm text-slate-400">A importação entra na fase seguinte do MVP.</p>
          </div>
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard
          icon={<Monitor aria-hidden className="h-5 w-5" />}
          label="Computador"
          value={systemInfo?.computerName ?? 'Detectando...'}
          detail={systemInfo ? `${systemInfo.osName} ${systemInfo.osVersion}` : 'Sistema local'}
        />
        <InfoCard
          icon={<ShieldCheck aria-hidden className="h-5 w-5" />}
          label="Privacidade"
          value="Local-first"
          detail="Sem upload de dados no MVP"
        />
        <InfoCard
          icon={<Archive aria-hidden className="h-5 w-5" />}
          label="Programas"
          value={scanResult ? String(scanResult.apps.length) : 'Ainda não analisado'}
          detail={
            scanResult
              ? `${scanResult.sourceCounts.winget} com informação do Winget`
              : 'Execute o scanner para ver resultados'
          }
        />
      </section>

      {scanResult ? (
        <section className="rounded-md border border-slate-700 bg-slate-900 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-50">Última análise</p>
              <p className="mt-1 text-sm text-slate-400">
                {new Date(scanResult.scannedAt).toLocaleString()} · {scanResult.apps.length}{' '}
                programas
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={scanResult.winget.available ? 'success' : 'warning'}>
                {scanResult.winget.available ? 'Winget detectado' : 'Winget indisponível'}
              </StatusBadge>
              <button
                type="button"
                onClick={onPrograms}
                className="rounded-md bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 outline-none transition hover:bg-sky-300 focus:ring-2 focus:ring-sky-400/30"
              >
                Ver programas
              </button>
            </div>
          </div>
        </section>
      ) : (
        <EmptyState
          icon={<Archive aria-hidden className="h-6 w-6" />}
          title="Nenhum snapshot criado ainda."
          description="Crie um snapshot antes de formatar seu computador."
          action={
            <button
              type="button"
              onClick={onCreateSnapshot}
              className="rounded-md bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 outline-none transition hover:bg-sky-300 focus:ring-2 focus:ring-sky-400/30"
            >
              Criar primeiro snapshot
            </button>
          }
        />
      )}
    </div>
  )
}

function InfoCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/70 p-5">
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-md border border-slate-700 text-sky-300">
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 truncate text-lg font-semibold text-slate-50">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{detail}</p>
    </div>
  )
}

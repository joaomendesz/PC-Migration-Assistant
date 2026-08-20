import { Package } from 'lucide-react'
import type { InstalledApplication } from '@shared/types/app'
import { cn } from '@renderer/utils/cn'
import { StatusBadge } from './StatusBadge'

interface AppCardProps {
  app: InstalledApplication
  selected: boolean
  onToggle: (id: string) => void
}

export function AppCard({ app, selected, onToggle }: AppCardProps) {
  const badge =
    app.restoreMethod === 'winget' ? (
      <StatusBadge tone="success">Pode ser restaurado</StatusBadge>
    ) : app.restoreMethod === 'manual' ? (
      <StatusBadge tone="warning">Instalação manual</StatusBadge>
    ) : (
      <StatusBadge tone="muted">Não identificado</StatusBadge>
    )

  return (
    <label
      className={cn(
        'grid cursor-pointer grid-cols-[auto_1fr] gap-3 rounded-md border p-4 transition',
        selected
          ? 'border-sky-400/70 bg-sky-400/10'
          : 'border-slate-700 bg-slate-900/60 hover:border-slate-500',
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(app.id)}
        className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-sky-400 focus:ring-sky-400/30"
      />
      <div className="min-w-0">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-slate-700 bg-slate-950 text-slate-300">
              <Package aria-hidden className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-50">{app.name}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                {app.publisher ? <span>{app.publisher}</span> : null}
                {app.version ? <span>Versão {app.version}</span> : null}
              </div>
              {app.winget ? (
                <p className="mt-2 font-mono text-xs text-sky-200">{app.winget.packageId}</p>
              ) : null}
            </div>
          </div>
          <div className="shrink-0">{badge}</div>
        </div>
      </div>
    </label>
  )
}

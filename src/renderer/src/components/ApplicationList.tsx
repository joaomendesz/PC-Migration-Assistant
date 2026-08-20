import { useMemo, useState } from 'react'
import type { InstalledApplication } from '@shared/types/app'
import { AppCard } from './AppCard'
import { FilterTabs } from './FilterTabs'
import { SearchInput } from './SearchInput'

type AppFilter = 'all' | 'winget' | 'manual' | 'unknown' | 'selected'

const FILTERS: Array<{ value: AppFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'winget', label: 'Winget' },
  { value: 'manual', label: 'Manual' },
  { value: 'unknown', label: 'Não identificado' },
  { value: 'selected', label: 'Selecionados' },
]

interface ApplicationListProps {
  apps: InstalledApplication[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onSelectWinget: () => void
  onClearSelection: () => void
}

export function ApplicationList({
  apps,
  selectedIds,
  onToggle,
  onSelectWinget,
  onClearSelection,
}: ApplicationListProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<AppFilter>('all')

  const filteredApps = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return apps.filter((app) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        app.name.toLowerCase().includes(normalizedQuery) ||
        app.publisher?.toLowerCase().includes(normalizedQuery) ||
        app.winget?.packageId.toLowerCase().includes(normalizedQuery)

      if (!matchesQuery) return false
      if (filter === 'selected') return selectedIds.has(app.id)
      if (filter === 'all') return true
      return app.restoreMethod === filter
    })
  }, [apps, filter, query, selectedIds])

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_auto]">
        <SearchInput value={query} onChange={setQuery} placeholder="Pesquisar programas..." />
        <FilterTabs value={filter} options={FILTERS} onChange={setFilter} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          {filteredApps.length} de {apps.length} programas visíveis
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSelectWinget}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 outline-none transition hover:border-sky-400 hover:text-white focus:ring-2 focus:ring-sky-400/30"
          >
            Selecionar compatíveis
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 outline-none transition hover:border-slate-500 hover:text-white focus:ring-2 focus:ring-sky-400/30"
          >
            Limpar seleção
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredApps.map((app) => (
          <AppCard key={app.id} app={app} selected={selectedIds.has(app.id)} onToggle={onToggle} />
        ))}
      </div>
    </div>
  )
}

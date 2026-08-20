import {
  Archive,
  Code2,
  Folder,
  Gauge,
  History,
  Home,
  PanelLeft,
  Rocket,
  Settings,
  Type,
} from 'lucide-react'
import { cn } from '@renderer/utils/cn'
import type { PageId } from '@renderer/pages/pageTypes'

interface SidebarProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
}

const primaryItems: Array<{
  id: PageId
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: 'dashboard', label: 'Início', icon: Home },
  { id: 'snapshots', label: 'Snapshots', icon: Archive },
  { id: 'programs', label: 'Programas', icon: Gauge },
  { id: 'dev', label: 'Ambiente Dev', icon: Code2 },
  { id: 'files', label: 'Arquivos', icon: Folder },
  { id: 'fonts', label: 'Fontes', icon: Type },
  { id: 'startup', label: 'Inicialização', icon: Rocket },
  { id: 'history', label: 'Histórico', icon: History },
]

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950 px-4 py-5">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-md border border-sky-400/30 bg-sky-400/10 text-sky-200">
          <PanelLeft aria-hidden className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-50">PC Migration Assistant</p>
          <p className="truncate text-xs text-slate-400">Formatei meu PC, e agora?</p>
        </div>
      </div>

      <nav className="space-y-1" aria-label="Navegação principal">
        {primaryItems.map((item) => (
          <NavButton
            key={item.id}
            active={activePage === item.id}
            label={item.label}
            icon={item.icon}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-800 pt-4">
        <NavButton
          active={activePage === 'settings'}
          label="Configurações"
          icon={Settings}
          onClick={() => onNavigate('settings')}
        />
      </div>
    </aside>
  )
}

function NavButton({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium outline-none transition focus:ring-2 focus:ring-sky-400/30',
        active ? 'bg-sky-400 text-slate-950' : 'text-slate-300 hover:bg-slate-900 hover:text-white',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  )
}

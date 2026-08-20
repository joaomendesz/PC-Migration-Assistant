import type { ThemeMode } from '@renderer/hooks/useTheme'
import { SectionHeader } from '@renderer/components/SectionHeader'
import { cn } from '@renderer/utils/cn'

interface SettingsPageProps {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
}

export function SettingsPage({ theme, onThemeChange }: SettingsPageProps) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Preferências"
        title="Configurações"
        description="Ajustes locais do aplicativo."
      />

      <section className="rounded-md border border-slate-700 bg-slate-900 p-5">
        <h2 className="text-lg font-semibold text-slate-50">Aparência</h2>
        <div className="mt-4 grid max-w-md grid-cols-2 gap-2 rounded-md border border-slate-700 bg-slate-950/30 p-1">
          {(['dark', 'light'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onThemeChange(option)}
              className={cn(
                'rounded px-3 py-2 text-sm font-medium outline-none transition focus:ring-2 focus:ring-sky-400/30',
                theme === option
                  ? 'bg-sky-400 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )}
            >
              {option === 'dark' ? 'Escuro' : 'Claro'}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-slate-700 bg-slate-900 p-5">
        <h2 className="text-lg font-semibold text-slate-50">Privacidade</h2>
        <label className="mt-4 flex items-center gap-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked
            readOnly
            className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-sky-400"
          />
          Manter tudo localmente
        </label>
      </section>
    </div>
  )
}

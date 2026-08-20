import { cn } from '@renderer/utils/cn'

interface FilterTabsProps<T extends string> {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}

export function FilterTabs<T extends string>({ value, options, onChange }: FilterTabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1 rounded-md border border-slate-700 bg-slate-950/30 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded px-3 py-1.5 text-sm font-medium outline-none transition focus:ring-2 focus:ring-sky-400/30',
            value === option.value
              ? 'bg-sky-400 text-slate-950'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

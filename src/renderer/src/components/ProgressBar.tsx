interface ProgressBarProps {
  value: number
}

export function ProgressBar({ value }: ProgressBarProps) {
  const normalizedValue = Math.max(0, Math.min(100, value))

  return (
    <div className="h-2 w-full overflow-hidden rounded-sm bg-slate-700/70" aria-hidden>
      <div
        className="h-full rounded-sm bg-sky-400 transition-all duration-300"
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  )
}

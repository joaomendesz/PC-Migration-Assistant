interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-md border border-dashed border-slate-700 bg-slate-950/20 px-8 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-md border border-slate-700 bg-slate-900 text-sky-300">
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

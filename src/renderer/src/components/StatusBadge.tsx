import { CheckCircle2, HelpCircle, Loader2, TriangleAlert } from 'lucide-react'
import { cn } from '@renderer/utils/cn'

type BadgeTone = 'success' | 'warning' | 'danger' | 'muted' | 'info'

interface StatusBadgeProps {
  tone: BadgeTone
  children: React.ReactNode
}

const toneClasses: Record<BadgeTone, string> = {
  success:
    'border-emerald-400/30 bg-emerald-400/10 text-emerald-200 dark:border-emerald-400/30 dark:bg-emerald-400/10',
  warning:
    'border-amber-400/30 bg-amber-400/10 text-amber-200 dark:border-amber-400/30 dark:bg-amber-400/10',
  danger: 'border-red-400/30 bg-red-400/10 text-red-200 dark:border-red-400/30 dark:bg-red-400/10',
  muted: 'border-slate-300/30 bg-slate-400/10 text-slate-300',
  info: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
}

const toneIcons: Record<BadgeTone, React.ReactNode> = {
  success: <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />,
  warning: <TriangleAlert aria-hidden className="h-3.5 w-3.5" />,
  danger: <TriangleAlert aria-hidden className="h-3.5 w-3.5" />,
  muted: <HelpCircle aria-hidden className="h-3.5 w-3.5" />,
  info: <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />,
}

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium',
        toneClasses[tone],
      )}
    >
      {toneIcons[tone]}
      {children}
    </span>
  )
}

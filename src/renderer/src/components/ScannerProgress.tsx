import { CheckCircle2, Circle, Loader2, TriangleAlert } from 'lucide-react'
import type { ScanProgressEvent } from '@shared/types/app'
import { cn } from '@renderer/utils/cn'
import { ProgressBar } from './ProgressBar'

const SCAN_STEPS: Array<Pick<ScanProgressEvent, 'scanner' | 'label'>> = [
  { scanner: 'system', label: 'Sistema operacional' },
  { scanner: 'registry', label: 'Programas instalados' },
  { scanner: 'winget', label: 'Winget' },
  { scanner: 'normalization', label: 'Normalização' },
]

interface ScannerProgressProps {
  progress: ScanProgressEvent[]
}

export function ScannerProgress({ progress }: ScannerProgressProps) {
  const progressByScanner = new Map(progress.map((item) => [item.scanner, item]))
  const completeCount = SCAN_STEPS.filter(
    (step) => progressByScanner.get(step.scanner)?.status === 'done',
  ).length
  const progressValue = (completeCount / SCAN_STEPS.length) * 100

  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/70 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Analisando seu computador</h2>
          <p className="mt-1 text-sm text-slate-400">Os scanners rodam no processo principal.</p>
        </div>
        <span className="text-sm font-medium text-slate-300">{Math.round(progressValue)}%</span>
      </div>
      <ProgressBar value={progressValue} />
      <div className="mt-5 space-y-3">
        {SCAN_STEPS.map((step) => {
          const event = progressByScanner.get(step.scanner)
          const status = event?.status ?? 'pending'

          return (
            <div key={step.scanner} className="flex items-center gap-3 text-sm">
              <StepIcon status={status} />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'font-medium',
                    status === 'failed' ? 'text-amber-200' : 'text-slate-100',
                  )}
                >
                  {event?.label ?? step.label}
                </p>
                {event?.message ? <p className="text-xs text-slate-400">{event.message}</p> : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StepIcon({ status }: { status: ScanProgressEvent['status'] }) {
  if (status === 'done') return <CheckCircle2 aria-hidden className="h-5 w-5 text-emerald-300" />
  if (status === 'running')
    return <Loader2 aria-hidden className="h-5 w-5 animate-spin text-sky-300" />
  if (status === 'failed') return <TriangleAlert aria-hidden className="h-5 w-5 text-amber-300" />
  return <Circle aria-hidden className="h-5 w-5 text-slate-500" />
}

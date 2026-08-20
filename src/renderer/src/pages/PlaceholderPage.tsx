import { SectionHeader } from '@renderer/components/SectionHeader'

interface PlaceholderPageProps {
  eyebrow: string
  title: string
  description: string
}

export function PlaceholderPage({ eyebrow, title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="rounded-md border border-slate-700 bg-slate-900 p-8">
        <p className="text-sm leading-6 text-slate-400">
          Esta área já está encaixada na navegação e será preenchida conforme o MVP avançar.
        </p>
      </div>
    </div>
  )
}

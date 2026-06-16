import Image from 'next/image'
import type { Game } from '@/lib/types'

export function TopList({
  title,
  icon,
  items,
  metric,
  progress,
  extra,
}: {
  title: string
  icon: React.ReactNode
  items: Game[]
  metric: (g: Game) => string
  progress: (g: Game) => number
  extra?: (g: Game) => React.ReactNode
}) {
  if (!items.length) {
    return (
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          {icon}
          <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
        </div>
        <p className="text-sm text-text-muted">Aucune donnée</p>
      </div>
    )
  }

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
      </div>
      <ol className="space-y-3">
        {items.map((g, i) => (
          <li key={`${g.title}-${i}`} className="flex items-center gap-3">
            <span className="w-5 text-xs font-mono text-text-muted text-right">{i + 1}</span>
            <div className="relative w-9 h-12 flex-shrink-0 rounded-md overflow-hidden bg-bg-tertiary border border-border-subtle">
              {g.coverUrl ? (
                <Image src={g.coverUrl} alt={g.title} fill sizes="36px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[9px] text-text-muted font-display">
                  {g.title.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate font-medium">{g.title}</p>
              <div className="mt-1 h-1 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-earth-moss to-earth-fern"
                  style={{ width: `${Math.min(100, progress(g) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex flex-col items-end text-xs gap-0.5">
              <span className="font-mono font-semibold text-text-primary">{metric(g)}</span>
              {extra ? <span>{extra(g)}</span> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

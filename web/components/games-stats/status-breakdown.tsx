import { CheckCircle2 } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  Fini: '#5a7d4a',
  'En cours': '#d9a441',
  Abandonné: '#b06868',
  'À faire': '#7ba896',
}

export function StatusBreakdown({
  items,
  total,
}: {
  items: { label: string; count: number }[]
  total: number
}) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle2 className="w-5 h-5 text-earth-moss" />
        <h3 className="text-sm font-semibold text-text-secondary">
          Répartition par statut
        </h3>
        <span className="text-xs text-text-muted ml-auto">
          {total} entrées (par plateforme)
        </span>
      </div>
      <div className="space-y-3">
        {items.map(({ label, count }) => {
          const pct = total ? (count / total) * 100 : 0
          const color = STATUS_COLORS[label] ?? '#7ba896'
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="text-sm text-text-primary">{label}</span>
                </div>
                <span className="text-xs font-mono text-text-secondary">
                  {count} · {pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

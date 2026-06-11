export function RankingBars({
  title,
  icon,
  items,
  unit,
  max,
}: {
  title: string
  icon: React.ReactNode
  items: { label: string; value: number; count: number }[]
  unit: string
  max: number
}) {
  if (!items.length) {
    return (
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          {icon}
          <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
        </div>
        <p className="text-sm text-text-muted">Pas assez de données notées</p>
      </div>
    )
  }
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
      </div>
      <div className="space-y-2.5">
        {items.map(({ label, value, count }) => {
          const pct = (value / max) * 100
          return (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-text-primary w-32 truncate">
                {label}
              </span>
              <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-earth-fern to-earth-moss rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-mono text-text-secondary w-20 text-right">
                {value.toFixed(1)}{unit}
                <span className="text-text-muted ml-1">({count})</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

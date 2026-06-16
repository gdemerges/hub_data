import { Calendar } from 'lucide-react'

export function HoursByDecade({ items }: { items: { decade: string; hours: number }[] }) {
  if (!items.length) return null
  const max = Math.max(...items.map((i) => i.hours))
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-5 h-5 text-earth-terracotta" />
        <h3 className="text-sm font-semibold text-text-secondary">Heures par décennie de sortie</h3>
      </div>
      <div className="flex items-end gap-3 h-40">
        {items.map(({ decade, hours }) => {
          const h = max ? (hours / max) * 100 : 0
          return (
            <div
              key={decade}
              className="flex-1 h-full flex flex-col items-center justify-end gap-2"
            >
              <span className="text-xs font-mono text-text-secondary">{Math.round(hours)}h</span>
              <div
                className="w-full rounded-t bg-gradient-to-t from-earth-terracotta to-earth-saffron"
                style={{ height: `${h}%` }}
              />
              <span className="text-xs font-mono text-text-muted">{decade}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { Clock } from '@phosphor-icons/react/dist/ssr'
import type { MonthlyGamePlaytime } from '@/lib/play-log'

interface MonthlyPlaytimeProps {
  month: string
  playtime: MonthlyGamePlaytime[]
}

const MONTH_LABELS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
]

function formatMonth(month: string): string {
  const [y, m] = month.split('-')
  return `${MONTH_LABELS_FR[parseInt(m, 10) - 1]} ${y}`
}

function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} min`
  return `${h.toFixed(1)} h`
}

export function MonthlyPlaytime({ month, playtime }: MonthlyPlaytimeProps) {
  const totalHours = playtime.reduce((s, p) => s + p.hours, 0)
  const top = playtime.slice(0, 8)
  const maxHours = top[0]?.hours || 1

  return (
    <div className="tech-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-earth-moss/10 border border-earth-moss/30 rounded">
            <Clock size={20} weight="duotone" className="text-earth-moss" />
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
              Heures de jeu
            </div>
            <h3 className="font-display text-xl font-medium tracking-tight text-text-primary capitalize">
              {formatMonth(month)}
            </h3>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-medium text-earth-moss tabular-nums">
            {formatHours(totalHours)}
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-text-tertiary">
            {playtime.length} jeu{playtime.length > 1 ? 'x' : ''}
          </div>
        </div>
      </div>

      {top.length === 0 ? (
        <div className="py-8 text-center text-text-tertiary">
          <p className="font-mono text-xs uppercase tracking-wider mb-2">
            Aucune session enregistrée
          </p>
          <p className="text-sm">
            Le suivi quotidien démarre dès que deux snapshots SerieBox auront été capturés.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {top.map((g) => {
            const pct = (g.hours / maxHours) * 100
            return (
              <li key={`${g.title}::${g.support}`} className="group">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="text-sm text-text-primary truncate" title={g.title}>
                    {g.title}
                  </span>
                  <span className="font-mono text-xs text-text-secondary tabular-nums whitespace-nowrap">
                    {formatHours(g.hours)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-earth-moss/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-earth-moss/70 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary whitespace-nowrap">
                    {g.support} · {g.daysPlayed}j
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

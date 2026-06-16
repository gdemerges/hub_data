import { CheckCircle2, Clock, Star, Trophy } from 'lucide-react'

export function KpiRow({
  totalGames,
  totalHours,
  finished,
  completionRate,
  avgRating,
  avgVsCrowd,
  backlogCount,
}: {
  totalGames: number
  totalHours: number
  finished: number
  completionRate: number
  avgRating: number
  avgVsCrowd: number
  backlogCount: number
}) {
  const catalogTotal = totalGames + backlogCount
  const items = [
    {
      label: 'Joués',
      value: totalGames.toString(),
      sub: backlogCount ? `+ ${backlogCount} dans le backlog (${catalogTotal} total)` : 'jeux',
      icon: <Trophy className="w-5 h-5" />,
      color: 'text-earth-moss',
      bg: 'bg-earth-moss/10',
    },
    {
      label: 'Temps total',
      value: `${Math.round(totalHours).toLocaleString('fr-FR')}h`,
      sub: 'toutes plateformes',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-earth-fern',
      bg: 'bg-earth-fern/10',
    },
    {
      label: 'Finis',
      value: finished.toString(),
      sub: `${completionRate.toFixed(0)}% du backlog`,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-earth-leaf',
      bg: 'bg-earth-leaf/10',
    },
    {
      label: 'Note moyenne',
      value: avgRating > 0 ? `${avgRating.toFixed(1)}/20` : '—',
      sub:
        avgVsCrowd > 0.05
          ? `+${avgVsCrowd.toFixed(1)} vs moyenne`
          : avgVsCrowd < -0.05
            ? `${avgVsCrowd.toFixed(1)} vs moyenne`
            : 'aligné sur la moyenne',
      icon: <Star className="w-5 h-5" />,
      color: 'text-earth-saffron',
      bg: 'bg-earth-saffron/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((it) => (
        <div key={it.label} className="bg-bg-card border border-border-subtle rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${it.bg} ${it.color}`}>{it.icon}</div>
            <p className="text-xs text-text-secondary uppercase tracking-wide">{it.label}</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{it.value}</p>
          <p className="text-xs text-text-muted mt-1">{it.sub}</p>
        </div>
      ))}
    </div>
  )
}

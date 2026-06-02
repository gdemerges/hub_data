'use client'

import { LineChart, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { SectionCard } from '@/components'
import { paceProgression, formatPace, type SportActivity } from '@/lib/sport'

interface Props {
  runs: SportActivity[]
}

const fmt = (pace: number) => `${formatPace(60 / pace)}/km`

export function SportPaceProgression({ runs }: Props) {
  const points = paceProgression(runs, 12)
  const withData = points.filter((p) => p.equivPace !== null)
  if (withData.length < 2) return null

  const paces = withData.map((p) => p.equivPace as number)
  const min = Math.min(...paces) // le plus rapide
  const max = Math.max(...paces) // le plus lent
  const range = max - min || 1

  // Plus rapide = plus haut (allure faible en haut). Coordonnées arrondies à 3
  // décimales : la précision flottante complète diffère au dernier chiffre entre
  // SSR et client et casse l'hydratation.
  const round3 = (n: number) => Math.round(n * 1000) / 1000
  const toY = (pace: number) => round3(((pace - min) / range) * 100)
  const toX = (i: number) => round3((i / (points.length - 1)) * 100)

  const linePoints = points
    .map((p, i) => (p.equivPace !== null ? `${toX(i)},${toY(p.equivPace)}` : null))
    .filter((s): s is string => s !== null)
    .join(' ')

  // Tendance : moyenne des 3 derniers points avec données vs 3 précédents.
  const recent = paces.slice(-3)
  const prior = paces.slice(-6, -3)
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
  let trend: 'up' | 'down' | 'flat' = 'flat'
  if (prior.length > 0 && recent.length > 0) {
    const delta = avg(recent) - avg(prior) // négatif = plus rapide = progrès
    if (delta < -0.05) trend = 'up'
    else if (delta > 0.05) trend = 'down'
  }
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up' ? 'text-earth-moss' : trend === 'down' ? 'text-earth-clay' : 'text-text-muted'
  const trendLabel =
    trend === 'up' ? 'En progrès' : trend === 'down' ? 'En recul' : 'Stable'

  return (
    <SectionCard title="Progression d'allure" icon={LineChart} accent="fern">
      <div className="flex items-center gap-2 mb-5 text-sm">
        <TrendIcon className={`w-4 h-4 ${trendColor}`} strokeWidth={2} />
        <span className={trendColor}>{trendLabel}</span>
        <span className="text-text-muted">· allure équivalente 10 km, par mois</span>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col justify-between h-40 text-xs num text-text-muted py-1 shrink-0">
          <span className="text-earth-fern">{fmt(min)}</span>
          <span>{fmt(min + range / 2)}</span>
          <span>{fmt(max)}</span>
        </div>
        <div className="flex-1 relative h-40">
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t" style={{ borderColor: 'rgb(var(--dv-grid) / 0.4)' }} />
            ))}
          </div>
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            role="img"
            aria-label={`Progression d'allure équivalente 10 km, de ${fmt(max)} à ${fmt(min)}`}
          >
            <polyline
              points={linePoints}
              fill="none"
              stroke="rgb(var(--dv-1))"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              className="chart-line-draw"
            />
            {points.map((p, i) =>
              p.equivPace !== null ? (
                <circle
                  key={p.month}
                  cx={toX(i)}
                  cy={toY(p.equivPace)}
                  r={2}
                  fill="rgb(var(--bg-card))"
                  stroke="rgb(var(--dv-1))"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              ) : null
            )}
          </svg>
        </div>
      </div>

      <div className="flex justify-between mt-2 ml-[4.5rem] text-[9px] uppercase tracking-[0.12em] text-text-muted">
        {points.map((p) => (
          <span key={p.month} className="flex-1 text-center">
            {p.label}
          </span>
        ))}
      </div>
    </SectionCard>
  )
}

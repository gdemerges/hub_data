'use client'

import { FitnessMetrics } from '@/lib/types'
import { TrendingUp, Activity, Zap } from 'lucide-react'

interface FitnessChartProps {
  data: FitnessMetrics[]
}

export function FitnessChart({ data }: FitnessChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted text-sm">
        Pas assez de données pour calculer les métriques de forme.
      </div>
    )
  }

  // Prendre les 90 derniers jours
  const recentData = data.slice(-90)
  const latestMetrics = recentData[recentData.length - 1]

  // Calculer les min/max pour le scaling
  const ctlValues = recentData.map(d => d.ctl)
  const atlValues = recentData.map(d => d.atl)
  const tsbValues = recentData.map(d => d.tsb)

  const maxCTL = Math.max(...ctlValues)
  const maxATL = Math.max(...atlValues)
  const maxTSB = Math.max(...tsbValues)
  const minTSB = Math.min(...tsbValues)

  const maxValue = Math.max(maxCTL, maxATL, maxTSB, Math.abs(minTSB))
  const chartHeight = 200

  // Interpréter le TSB
  const getFormStatus = (tsb: number) => {
    if (tsb > 10) return { status: 'Forme optimale', color: 'text-earth-moss', icon: TrendingUp }
    if (tsb > -10) return { status: 'Forme stable', color: 'text-earth-fern', icon: Activity }
    return { status: 'Fatigue élevée', color: 'text-earth-saffron', icon: Zap }
  }

  const formStatus = getFormStatus(latestMetrics.tsb)
  const StatusIcon = formStatus.icon

  // Générer les points du graphique (sample tous les 3 jours pour la lisibilité)
  const sampledData = recentData.filter((_, i) => i % 3 === 0 || i === recentData.length - 1)

  return (
    <div className="tech-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-earth-fern/10 border border-earth-fern/30 rounded-xl">
          <TrendingUp className="w-4 h-4 text-earth-fern" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-medium tracking-tight text-text-primary">
            Fitness · CTL / ATL / TSB
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Forme et fatigue sur 90 jours
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="tech-card-flat p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted mb-2">CTL · Fitness</p>
          <p className="font-display text-3xl font-medium tracking-tight num text-earth-indigo leading-none">
            {latestMetrics.ctl.toFixed(1)}
          </p>
          <p className="text-[11px] text-text-muted mt-2">Forme long terme</p>
        </div>
        <div className="tech-card-flat p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted mb-2">ATL · Fatigue</p>
          <p className="font-display text-3xl font-medium tracking-tight num text-earth-terracotta leading-none">
            {latestMetrics.atl.toFixed(1)}
          </p>
          <p className="text-[11px] text-text-muted mt-2">Charge récente</p>
        </div>
        <div className="tech-card-flat p-4">
          <div className="flex items-center gap-2 mb-2">
            <StatusIcon className={`w-3.5 h-3.5 ${formStatus.color}`} strokeWidth={1.75} />
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">TSB · Forme</p>
          </div>
          <p className={`font-display text-3xl font-medium tracking-tight num leading-none ${formStatus.color}`}>
            {latestMetrics.tsb > 0 ? '+' : ''}
            {latestMetrics.tsb.toFixed(1)}
          </p>
          <p className={`text-[11px] mt-2 ${formStatus.color}`}>{formStatus.status}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: chartHeight }}>
        {/* Grille horizontale */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="border-t border-border-subtle/30" />
          ))}
        </div>

        {/* Zero line pour TSB */}
        <div
          className="absolute left-0 right-0 border-t border-text-muted/30"
          style={{ top: `${(maxValue / (maxValue * 2)) * 100}%` }}
        />

        {/* CTL Line (indigo) */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <polyline
            points={sampledData
              .map((d, i) => {
                const x = (i / (sampledData.length - 1)) * 100
                const y = ((maxValue - d.ctl) / (maxValue * 2)) * 100 + 50
                return `${x},${y}`
              })
              .join(' ')}
            fill="none"
            stroke="rgb(61 81 112)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* ATL Line (terracotta) */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <polyline
            points={sampledData
              .map((d, i) => {
                const x = (i / (sampledData.length - 1)) * 100
                const y = ((maxValue - d.atl) / (maxValue * 2)) * 100 + 50
                return `${x},${y}`
              })
              .join(' ')}
            fill="none"
            stroke="rgb(184 107 60)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* TSB Area (moss, dashed) */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <polyline
            points={sampledData
              .map((d, i) => {
                const x = (i / (sampledData.length - 1)) * 100
                const y = ((maxValue - d.tsb) / (maxValue * 2)) * 100 + 50
                return `${x},${y}`
              })
              .join(' ')}
            fill="none"
            stroke="rgb(90 125 74)"
            strokeWidth="2"
            strokeDasharray="4,4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="flex items-center justify-center gap-6 mt-6 text-xs">
        <LegendItem color="rgb(61 81 112)" label="CTL · Fitness" />
        <LegendItem color="rgb(184 107 60)" label="ATL · Fatigue" />
        <LegendItem color="rgb(90 125 74)" label="TSB · Forme" dashed />
      </div>

      <div className="mt-6 tech-card-flat p-4">
        <p className="text-xs text-text-secondary leading-relaxed">
          <span className="text-earth-indigo font-medium">CTL</span> (Chronic Training Load) mesure ta fitness long
          terme (42 j). <span className="text-earth-terracotta font-medium">ATL</span> (Acute Training Load) mesure
          ta fatigue récente (7 j). <span className="text-earth-moss font-medium">TSB</span> = CTL − ATL : positif
          tu es frais, négatif tu accumules de la fatigue.
        </p>
      </div>
    </div>
  )
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-text-muted">
      <span
        className="block w-5 h-0.5"
        style={
          dashed
            ? { backgroundImage: `linear-gradient(to right, ${color} 50%, transparent 50%)`, backgroundSize: '6px 100%' }
            : { backgroundColor: color }
        }
        aria-hidden
      />
      <span>{label}</span>
    </div>
  )
}

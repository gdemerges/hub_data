'use client'

import { FitnessMetrics } from '@/lib/types'
import { TrendingUp, Activity, Zap } from 'lucide-react'

interface FitnessChartProps {
  data: FitnessMetrics[]
}

export function FitnessChart({ data }: FitnessChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted font-mono text-sm">
        Pas assez de données pour calculer les métriques de forme
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
    if (tsb > 10) return { status: 'Forme optimale', color: 'text-neon-green', icon: TrendingUp }
    if (tsb > -10) return { status: 'Forme stable', color: 'text-neon-cyan', icon: Activity }
    return { status: 'Fatigue élevée', color: 'text-neon-yellow', icon: Zap }
  }

  const formStatus = getFormStatus(latestMetrics.tsb)
  const StatusIcon = formStatus.icon

  // Générer les points du graphique (sample tous les 3 jours pour la lisibilité)
  const sampledData = recentData.filter((_, i) => i % 3 === 0 || i === recentData.length - 1)

  return (
    <div className="tech-card p-6 border-neon-cyan/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
          <TrendingUp className="w-5 h-5 text-neon-cyan" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Fitness_Metrics // CTL/ATL/TSB
          </h3>
          <p className="text-xs font-mono text-text-muted mt-1">
            Analyse de ta forme physique et fatigue sur 90 jours
          </p>
        </div>
      </div>

      {/* Current metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-bg-primary p-4 rounded-lg border border-blue-500/20">
          <p className="text-xs font-mono text-text-muted mb-1">CTL (Fitness)</p>
          <p className="text-2xl font-mono font-bold text-blue-400">
            {latestMetrics.ctl.toFixed(1)}
          </p>
          <p className="text-xs font-mono text-text-muted mt-1">Forme long terme</p>
        </div>
        <div className="bg-bg-primary p-4 rounded-lg border border-neon-magenta/20">
          <p className="text-xs font-mono text-text-muted mb-1">ATL (Fatigue)</p>
          <p className="text-2xl font-mono font-bold text-neon-magenta">
            {latestMetrics.atl.toFixed(1)}
          </p>
          <p className="text-xs font-mono text-text-muted mt-1">Charge récente</p>
        </div>
        <div className="bg-bg-primary p-4 rounded-lg border border-neon-green/20">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon className={`w-4 h-4 ${formStatus.color}`} />
            <p className="text-xs font-mono text-text-muted">TSB (Forme)</p>
          </div>
          <p className={`text-2xl font-mono font-bold ${formStatus.color}`}>
            {latestMetrics.tsb > 0 ? '+' : ''}{latestMetrics.tsb.toFixed(1)}
          </p>
          <p className={`text-xs font-mono mt-1 ${formStatus.color}`}>{formStatus.status}</p>
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

        {/* CTL Line (Blue) */}
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
            stroke="rgb(96, 165, 250)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* ATL Line (Magenta) */}
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
            stroke="rgb(255, 0, 255)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* TSB Area (Green/Yellow) */}
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
            stroke="rgb(0, 255, 136)"
            strokeWidth="2"
            strokeDasharray="4,4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-400" />
          <span className="text-text-muted">CTL (Fitness)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-neon-magenta" />
          <span className="text-text-muted">ATL (Fatigue)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-neon-green border-dashed" style={{ borderTop: '2px dashed' }} />
          <span className="text-text-muted">TSB (Forme)</span>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-6 p-4 bg-bg-primary rounded-lg border border-border-subtle">
        <p className="text-xs font-mono text-text-secondary leading-relaxed">
          <span className="text-neon-cyan">CTL</span> (Chronic Training Load) mesure ta fitness long terme (42 jours).
          <span className="text-neon-magenta ml-2">ATL</span> (Acute Training Load) mesure ta fatigue récente (7 jours).
          <span className="text-neon-green ml-2">TSB</span> = CTL - ATL. Un TSB positif indique que tu es en forme,
          un TSB négatif indique de la fatigue accumulée.
        </p>
      </div>
    </div>
  )
}

'use client'

import { FitnessMetrics } from '@/lib/types'
import { TrendingUp, Activity, Zap } from 'lucide-react'
import { EmptyState } from './empty-state'

// CTL = indigo (dv-4), ATL = terracotta (dv-2), TSB = moss (dv-1).
const C_CTL = 'rgb(var(--dv-4))'
const C_ATL = 'rgb(var(--dv-2))'
const C_TSB = 'rgb(var(--dv-1))'

interface FitnessChartProps {
  data: FitnessMetrics[]
}

export function FitnessChart({ data }: FitnessChartProps) {
  if (data.length === 0) {
    return (
      <div className="tech-card p-6">
        <EmptyState
          icon={Activity}
          title="Métriques de forme indisponibles"
          description="Pas assez d'activités pour calculer CTL / ATL / TSB."
        />
      </div>
    )
  }

  // Prendre les 90 derniers jours
  const recentData = data.slice(-90)
  const latestMetrics = recentData[recentData.length - 1]

  const ctlValues = recentData.map((d) => d.ctl)
  const atlValues = recentData.map((d) => d.atl)
  const tsbValues = recentData.map((d) => d.tsb)

  const maxCTL = Math.max(...ctlValues)
  const maxATL = Math.max(...atlValues)
  const maxTSB = Math.max(...tsbValues)
  const minTSB = Math.min(...tsbValues)

  const maxValue = Math.max(maxCTL, maxATL, maxTSB, Math.abs(minTSB))
  const chartHeight = 200

  const getFormStatus = (tsb: number) => {
    if (tsb > 10) return { status: 'Forme optimale', color: C_TSB, icon: TrendingUp }
    if (tsb > -10) return { status: 'Forme stable', color: C_CTL, icon: Activity }
    return { status: 'Fatigue élevée', color: 'rgb(var(--dv-7))', icon: Zap }
  }

  const formStatus = getFormStatus(latestMetrics.tsb)
  const StatusIcon = formStatus.icon

  // Sample tous les 3 jours pour la lisibilité
  const sampledData = recentData.filter((_, i) => i % 3 === 0 || i === recentData.length - 1)

  const coord = (key: 'ctl' | 'atl' | 'tsb', i: number) => ({
    x: (i / (sampledData.length - 1)) * 100,
    y: ((maxValue - sampledData[i][key]) / (maxValue * 2)) * 100 + 50,
  })

  const linePoints = (key: 'ctl' | 'atl' | 'tsb') =>
    sampledData.map((_, i) => { const p = coord(key, i); return `${p.x},${p.y}` }).join(' ')

  // Annotations : pic de forme (CTL max) et creux de fraîcheur (TSB min).
  const peakCtlIdx = sampledData.reduce((b, d, i) => (d.ctl > sampledData[b].ctl ? i : b), 0)
  const lowTsbIdx = sampledData.reduce((b, d, i) => (d.tsb < sampledData[b].tsb ? i : b), 0)
  const annotations = [
    { ...coord('ctl', peakCtlIdx), color: C_CTL, label: `Pic ${sampledData[peakCtlIdx].ctl.toFixed(0)}` },
    { ...coord('tsb', lowTsbIdx), color: 'rgb(var(--dv-7))', label: `Fatigue ${sampledData[lowTsbIdx].tsb.toFixed(0)}` },
  ]

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
          <p className="text-xs text-text-muted mt-0.5">Forme et fatigue sur 90 jours</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="tech-card-flat p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted mb-2">CTL · Fitness</p>
          <p
            className="font-display text-3xl font-medium tracking-tight num leading-none"
            style={{ color: C_CTL }}
          >
            {latestMetrics.ctl.toFixed(1)}
          </p>
          <p className="text-[11px] text-text-muted mt-2">Forme long terme</p>
        </div>
        <div className="tech-card-flat p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted mb-2">ATL · Fatigue</p>
          <p
            className="font-display text-3xl font-medium tracking-tight num leading-none"
            style={{ color: C_ATL }}
          >
            {latestMetrics.atl.toFixed(1)}
          </p>
          <p className="text-[11px] text-text-muted mt-2">Charge récente</p>
        </div>
        <div className="tech-card-flat p-4">
          <div className="flex items-center gap-2 mb-2">
            <StatusIcon className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: formStatus.color }} />
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">TSB · Forme</p>
          </div>
          <p
            className="font-display text-3xl font-medium tracking-tight num leading-none"
            style={{ color: formStatus.color }}
          >
            {latestMetrics.tsb > 0 ? '+' : ''}
            {latestMetrics.tsb.toFixed(1)}
          </p>
          <p className="text-[11px] mt-2" style={{ color: formStatus.color }}>
            {formStatus.status}
          </p>
        </div>
      </div>

      <div className="relative" style={{ height: chartHeight }}>
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="border-t" style={{ borderColor: 'rgb(var(--dv-grid) / 0.4)' }} />
          ))}
        </div>

        <div
          className="absolute left-0 right-0 border-t border-dashed"
          style={{ top: '50%', borderColor: 'rgb(var(--dv-axis) / 0.5)' }}
        />

        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Courbe de forme sur 90 jours — CTL (forme) ${Math.round(
            latestMetrics.ctl
          )}, ATL (fatigue) ${Math.round(latestMetrics.atl)}, TSB (fraîcheur) ${Math.round(
            latestMetrics.tsb
          )}`}
        >
          <polyline
            points={linePoints('ctl')}
            fill="none"
            stroke={C_CTL}
            strokeWidth="2"
            pathLength={1}
            vectorEffect="non-scaling-stroke"
            className="chart-line-draw"
            style={{ ['--i' as string]: 0 }}
          />
          <polyline
            points={linePoints('atl')}
            fill="none"
            stroke={C_ATL}
            strokeWidth="2"
            pathLength={1}
            vectorEffect="non-scaling-stroke"
            className="chart-line-draw"
            style={{ ['--i' as string]: 1 }}
          />
          <polyline
            points={linePoints('tsb')}
            fill="none"
            stroke={C_TSB}
            strokeWidth="2"
            strokeDasharray="4,4"
            vectorEffect="non-scaling-stroke"
          />

          {/* Annotations : pic de forme & fatigue max — mêmes coordonnées que les courbes */}
          {annotations.map((a, i) => (
            <g key={i}>
              <circle cx={a.x} cy={a.y} r={5} fill={a.color} opacity={0.18} />
              <circle
                cx={a.x}
                cy={a.y}
                r={2.5}
                fill="rgb(var(--bg-card))"
                stroke={a.color}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={a.x}
                y={a.y - 6}
                fill={a.color}
                fontSize={7}
                fontFamily="var(--font-mono)"
                fontWeight={600}
                textAnchor={a.x > 80 ? 'end' : a.x < 20 ? 'start' : 'middle'}
              >
                {a.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-center gap-6 mt-6 text-xs">
        <LegendItem color={C_CTL} label="CTL · Fitness" />
        <LegendItem color={C_ATL} label="ATL · Fatigue" />
        <LegendItem color={C_TSB} label="TSB · Forme" dashed />
      </div>

      <div className="mt-6 tech-card-flat p-4">
        <p className="text-xs text-text-secondary leading-relaxed">
          <span className="font-medium" style={{ color: C_CTL }}>
            CTL
          </span>{' '}
          (Chronic Training Load) mesure ta fitness long terme (42 j).{' '}
          <span className="font-medium" style={{ color: C_ATL }}>
            ATL
          </span>{' '}
          (Acute Training Load) mesure ta fatigue récente (7 j).{' '}
          <span className="font-medium" style={{ color: C_TSB }}>
            TSB
          </span>{' '}
          = CTL − ATL : positif tu es frais, négatif tu accumules de la fatigue.
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
            ? {
                backgroundImage: `linear-gradient(to right, ${color} 50%, transparent 50%)`,
                backgroundSize: '6px 100%',
              }
            : { backgroundColor: color }
        }
        aria-hidden
      />
      <span>{label}</span>
    </div>
  )
}

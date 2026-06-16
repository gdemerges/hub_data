'use client'

import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { ExpandableSection } from '@/components'
import { computeTrainingAnalysis, type SportActivity, type WeeklyVolume } from '@/lib/sport'

interface Props {
  runs: SportActivity[]
}

export function SportTrainingAnalysis({ runs }: Props) {
  const a = computeTrainingAnalysis(runs)
  const subtitle = a.alerts[0]?.message || 'Analyse hebdomadaire disponible'

  return (
    <ExpandableSection
      title="Analyse d'entraînement"
      subtitle={subtitle}
      icon={<Target className="w-5 h-5 text-earth-fern" />}
      defaultExpanded={false}
    >
      {a.alerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {a.alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                alert.type === 'danger'
                  ? 'bg-earth-clay/10 border-earth-clay/30 text-earth-clay'
                  : alert.type === 'warning'
                    ? 'bg-earth-saffron/10 border-earth-saffron/30 text-earth-saffron'
                    : 'bg-earth-moss/10 border-earth-moss/30 text-earth-moss'
              }`}
            >
              {alert.type === 'success' ? (
                <CheckCircle className="w-5 h-5 shrink-0" strokeWidth={1.75} />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0" strokeWidth={1.75} />
              )}
              <span className="text-sm">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MiniStat
          label="Cette semaine"
          value={`${a.currentWeekDistance.toFixed(1)} km`}
          sub={`${a.currentWeekRuns} sortie(s)`}
          tone="fern"
        />
        <MiniStat
          label="Semaine dernière"
          value={`${a.lastWeekDistance.toFixed(1)} km`}
          extra={
            a.increaseFromLastWeek !== 0 ? (
              <span
                className={`inline-flex items-center gap-1 num ${
                  a.increaseFromLastWeek > 10 ? 'text-earth-saffron' : 'text-earth-moss'
                }`}
              >
                {a.increaseFromLastWeek > 0 ? (
                  <TrendingUp className="w-3 h-3" strokeWidth={2} />
                ) : (
                  <TrendingDown className="w-3 h-3" strokeWidth={2} />
                )}
                {a.increaseFromLastWeek > 0 ? '+' : ''}
                {Math.round(a.increaseFromLastWeek)}%
              </span>
            ) : undefined
          }
        />
        <MiniStat
          label="Moyenne 4 sem."
          value={`${a.avgDistance4Weeks.toFixed(1)} km`}
          sub={`${a.avgRunsPerWeek.toFixed(1)} sortie(s)/sem`}
        />
        <MiniStat
          label="Dernière sortie"
          value={
            a.daysSinceLastRun !== null
              ? a.daysSinceLastRun === 0
                ? "Aujourd'hui"
                : `Il y a ${a.daysSinceLastRun}j`
              : '—'
          }
          sub={a.lastRun ? `${a.lastRun.distance.toFixed(1)} km` : undefined}
        />
      </div>

      {a.weeklyVolumes.length > 1 && (
        <div className="border-t border-border-subtle pt-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-earth-fern" strokeWidth={1.75} />
            <h4 className="font-display text-base font-medium tracking-tight text-text-primary">
              Volume hebdomadaire
            </h4>
            <span className="h-px flex-1 ml-3 bg-earth-fern/15" aria-hidden />
            <span className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
              {a.weeklyVolumes.length} sem.
            </span>
          </div>
          <WeeklyVolumeChart weeks={a.weeklyVolumes} />
        </div>
      )}

      <div className="border-t border-border-subtle pt-6">
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-4 h-4 text-earth-terracotta" strokeWidth={1.75} />
          <h4 className="font-display text-base font-medium tracking-tight text-text-primary">
            Recommandations
          </h4>
          <span className="h-px flex-1 ml-3 bg-earth-terracotta/15" aria-hidden />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MiniStat
            label="Objectif semaine"
            value={`${a.predictedWeeklyDistance.toFixed(0)} km`}
            sub="+5% progressif"
            tone="moss"
          />
          <MiniStat
            label="Sortie longue max"
            value={`${a.recommendedLongRun.toFixed(1)} km`}
            sub={`+10% vs moy. (${a.avgLongestRun.toFixed(1)} km)`}
            tone="terracotta"
          />
          <MiniStat
            label="Projection mensuelle"
            value={`${a.predictedMonthlyDistance.toFixed(0)} km`}
            sub="Sur base du rythme actuel"
            tone="fern"
          />
        </div>
      </div>
    </ExpandableSection>
  )
}

function WeeklyVolumeChart({ weeks }: { weeks: WeeklyVolume[] }) {
  const maxDistance = Math.max(...weeks.map((w) => w.distance), 1)
  const lastIdx = weeks.length - 1
  return (
    <div className="flex items-end justify-between gap-2 h-40">
      {weeks.map((w, i) => {
        const height = Math.round((w.distance / maxDistance) * 1000) / 10
        const isCurrent = i === lastIdx
        const monday = new Date(w.weekStart)
        const label = monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' })
        return (
          <div key={w.weekStart} className="flex-1 flex flex-col items-center gap-2 group min-w-0">
            <span
              className={`text-[11px] num leading-none ${isCurrent ? 'text-earth-fern font-medium' : 'text-text-muted'}`}
            >
              {w.distance.toFixed(0)}
            </span>
            <div className="w-full h-24 flex items-end">
              <div
                role="img"
                className={`w-full rounded-t-md transition-all duration-500 ease-out ${
                  isCurrent
                    ? 'bg-gradient-to-t from-earth-fern/50 to-earth-fern'
                    : 'bg-gradient-to-t from-earth-fern/20 to-earth-fern/45 group-hover:to-earth-fern/70'
                }`}
                style={{ height: `${height}%`, minHeight: w.distance > 0 ? '4px' : '0' }}
                aria-label={`Semaine du ${label} : ${w.distance.toFixed(1)} km, ${w.runs} sortie(s)`}
              />
            </div>
            <span className="text-[9px] uppercase tracking-[0.12em] text-text-muted num">
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function MiniStat({
  label,
  value,
  sub,
  extra,
  tone,
}: {
  label: string
  value: string
  sub?: string
  extra?: React.ReactNode
  tone?: 'fern' | 'moss' | 'terracotta'
}) {
  const valueClass = tone
    ? { fern: 'text-earth-fern', moss: 'text-earth-moss', terracotta: 'text-earth-terracotta' }[
        tone
      ]
    : 'text-text-primary'
  return (
    <div className="tech-card-flat p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted mb-2">{label}</p>
      <p className={`font-display text-2xl tracking-tight num leading-none ${valueClass}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-text-muted mt-2 num">{sub}</p>}
      {extra && <div className="text-[11px] mt-2">{extra}</div>}
    </div>
  )
}

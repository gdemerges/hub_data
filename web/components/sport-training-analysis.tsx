'use client'

import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp, Target, Zap } from 'lucide-react'
import { ExpandableSection } from '@/components'
import { computeTrainingAnalysis, SportActivity } from '@/lib/sport'

interface Props {
  runs: SportActivity[]
}

export function SportTrainingAnalysis({ runs }: Props) {
  const a = computeTrainingAnalysis(runs)
  const subtitle = a.alerts[0]?.message || 'Analyse hebdomadaire disponible'

  return (
    <ExpandableSection
      title="Training_Analysis"
      subtitle={subtitle}
      icon={<Target className="w-5 h-5 text-neon-cyan" />}
      defaultExpanded={false}
    >
      {a.alerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {a.alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                alert.type === 'danger'
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : alert.type === 'warning'
                  ? 'bg-neon-yellow/10 border-neon-yellow/30 text-neon-yellow'
                  : 'bg-neon-green/10 border-neon-green/30 text-neon-green'
              }`}
            >
              {alert.type === 'success' ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0" />
              )}
              <span className="font-mono text-sm">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-primary p-4 rounded-lg border border-border-subtle">
          <p className="text-xs font-mono text-text-muted mb-1">Cette semaine</p>
          <p className="text-2xl font-mono font-bold text-neon-cyan">
            {a.currentWeekDistance.toFixed(1)} km
          </p>
          <p className="text-xs font-mono text-text-muted">{a.currentWeekRuns} sortie(s)</p>
        </div>
        <div className="bg-bg-primary p-4 rounded-lg border border-border-subtle">
          <p className="text-xs font-mono text-text-muted mb-1">Semaine dernière</p>
          <p className="text-2xl font-mono font-bold text-text-primary">
            {a.lastWeekDistance.toFixed(1)} km
          </p>
          {a.increaseFromLastWeek !== 0 && (
            <p
              className={`text-xs font-mono flex items-center gap-1 ${
                a.increaseFromLastWeek > 10 ? 'text-neon-yellow' : 'text-neon-green'
              }`}
            >
              {a.increaseFromLastWeek > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {a.increaseFromLastWeek > 0 ? '+' : ''}
              {Math.round(a.increaseFromLastWeek)}%
            </p>
          )}
        </div>
        <div className="bg-bg-primary p-4 rounded-lg border border-border-subtle">
          <p className="text-xs font-mono text-text-muted mb-1">Moyenne (4 sem.)</p>
          <p className="text-2xl font-mono font-bold text-text-primary">
            {a.avgDistance4Weeks.toFixed(1)} km
          </p>
          <p className="text-xs font-mono text-text-muted">
            {a.avgRunsPerWeek.toFixed(1)} sortie(s)/sem
          </p>
        </div>
        <div className="bg-bg-primary p-4 rounded-lg border border-border-subtle">
          <p className="text-xs font-mono text-text-muted mb-1">Dernière sortie</p>
          <p className="text-2xl font-mono font-bold text-text-primary">
            {a.daysSinceLastRun !== null
              ? a.daysSinceLastRun === 0
                ? "Aujourd'hui"
                : `Il y a ${a.daysSinceLastRun}j`
              : '-'}
          </p>
          {a.lastRun && (
            <p className="text-xs font-mono text-text-muted">
              {a.lastRun.distance.toFixed(1)} km
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-border-subtle pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-neon-magenta" />
          <h4 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Recommandations
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-bg-primary p-4 rounded-lg border border-neon-green/20">
            <p className="text-xs font-mono text-neon-green mb-2">Objectif semaine</p>
            <p className="text-xl font-mono font-bold text-text-primary">
              {a.predictedWeeklyDistance.toFixed(0)} km
            </p>
            <p className="text-xs font-mono text-text-muted mt-1">+5% progressif recommandé</p>
          </div>
          <div className="bg-bg-primary p-4 rounded-lg border border-neon-magenta/20">
            <p className="text-xs font-mono text-neon-magenta mb-2">Sortie longue max</p>
            <p className="text-xl font-mono font-bold text-text-primary">
              {a.recommendedLongRun.toFixed(1)} km
            </p>
            <p className="text-xs font-mono text-text-muted mt-1">
              +10% vs moyenne ({a.avgLongestRun.toFixed(1)} km)
            </p>
          </div>
          <div className="bg-bg-primary p-4 rounded-lg border border-neon-cyan/20">
            <p className="text-xs font-mono text-neon-cyan mb-2">Projection mensuelle</p>
            <p className="text-xl font-mono font-bold text-text-primary">
              {a.predictedMonthlyDistance.toFixed(0)} km
            </p>
            <p className="text-xs font-mono text-text-muted mt-1">Sur base du rythme actuel</p>
          </div>
        </div>
      </div>
    </ExpandableSection>
  )
}

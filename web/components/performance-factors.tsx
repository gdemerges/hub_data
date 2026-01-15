'use client'

import { PerformanceAnalysis } from '@/lib/types'
import { TrendingUp, Calendar, Clock, Coffee, Lightbulb, BarChart3 } from 'lucide-react'

interface PerformanceFactorsProps {
  analysis: PerformanceAnalysis
}

export function PerformanceFactors({ analysis }: PerformanceFactorsProps) {
  const getImprovementColor = (improvement: number) => {
    if (improvement >= 5) return 'text-neon-green'
    if (improvement >= 0) return 'text-neon-cyan'
    if (improvement >= -5) return 'text-neon-yellow'
    return 'text-neon-orange'
  }

  const getImprovementBg = (improvement: number) => {
    if (improvement >= 5) return 'bg-neon-green/10 border-neon-green/30'
    if (improvement >= 0) return 'bg-neon-cyan/10 border-neon-cyan/30'
    if (improvement >= -5) return 'bg-neon-yellow/10 border-neon-yellow/30'
    return 'bg-neon-orange/10 border-neon-orange/30'
  }

  const formatSpeed = (speed: number) => {
    const pace = 60 / speed // min/km
    const mins = Math.floor(pace)
    const secs = Math.round((pace - mins) * 60)
    return `${mins}:${secs.toString().padStart(2, '0')} /km`
  }

  // Générer un insight textuel personnalisé
  const generateSmartInsight = () => {
    const { bestDayOfWeek, bestTimeOfDay, bestRestDays } = analysis

    const dayImprovement = Math.round(bestDayOfWeek.improvement)
    const timeImprovement = Math.round(bestTimeOfDay.improvement)
    const restImprovement = Math.round(bestRestDays.improvement)

    const improvements = [
      { factor: 'le ' + bestDayOfWeek.label, value: dayImprovement },
      { factor: bestTimeOfDay.label.toLowerCase(), value: timeImprovement },
      { factor: 'après ' + bestRestDays.label + ' de repos', value: restImprovement },
    ].sort((a, b) => b.value - a.value)

    if (improvements[0].value >= 5 && improvements[1].value >= 5) {
      return `Tu cours ${Math.abs(improvements[0].value)}% plus vite ${improvements[0].factor} et ${Math.abs(improvements[1].value)}% mieux ${improvements[1].factor}`
    } else if (improvements[0].value >= 5) {
      return `Tu cours ${Math.abs(improvements[0].value)}% plus vite ${improvements[0].factor}`
    } else if (improvements[0].value > 0) {
      return `Tes meilleures performances sont ${improvements[0].factor}`
    } else {
      return 'Tes performances sont relativement constantes peu importe les conditions'
    }
  }

  // Grouper les insights par facteur
  const dayInsights = analysis.insights.filter(i => i.factor === 'day').slice(0, 7)
  const timeInsights = analysis.insights.filter(i => i.factor === 'time')
  const restInsights = analysis.insights.filter(i => i.factor === 'rest')

  return (
    <div className="tech-card p-6 border-neon-magenta/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-neon-magenta/10 border border-neon-magenta/30 rounded">
          <BarChart3 className="w-5 h-5 text-neon-magenta" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Performance_Factors // Facteurs de performance
          </h3>
          <p className="text-xs font-mono text-text-muted mt-1">
            Analyse des corrélations entre tes performances et les conditions
          </p>
        </div>
      </div>

      {/* Smart Insight */}
      <div className="mb-6 p-4 bg-neon-magenta/10 border border-neon-magenta/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-6 h-6 text-neon-magenta shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-mono font-semibold text-neon-magenta mb-1">
              Insight principal
            </p>
            <p className="text-sm font-mono text-text-secondary leading-relaxed">
              {generateSmartInsight()}
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Best Day */}
        <div className={`p-4 rounded-lg border ${getImprovementBg(analysis.bestDayOfWeek.improvement)}`}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-neon-cyan" />
            <p className="text-xs font-mono text-text-muted">Meilleur jour</p>
          </div>
          <p className="text-lg font-mono font-bold text-text-primary mb-1">
            {analysis.bestDayOfWeek.label}
          </p>
          <p className={`text-xs font-mono ${getImprovementColor(analysis.bestDayOfWeek.improvement)}`}>
            {analysis.bestDayOfWeek.improvement > 0 ? '+' : ''}
            {Math.round(analysis.bestDayOfWeek.improvement)}% vs moyenne
          </p>
          <p className="text-xs font-mono text-text-muted mt-2">
            {formatSpeed(analysis.bestDayOfWeek.avgSpeed)} • {analysis.bestDayOfWeek.activityCount} sorties
          </p>
        </div>

        {/* Best Time */}
        <div className={`p-4 rounded-lg border ${getImprovementBg(analysis.bestTimeOfDay.improvement)}`}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-neon-green" />
            <p className="text-xs font-mono text-text-muted">Meilleure heure</p>
          </div>
          <p className="text-lg font-mono font-bold text-text-primary mb-1">
            {analysis.bestTimeOfDay.label}
          </p>
          <p className={`text-xs font-mono ${getImprovementColor(analysis.bestTimeOfDay.improvement)}`}>
            {analysis.bestTimeOfDay.improvement > 0 ? '+' : ''}
            {Math.round(analysis.bestTimeOfDay.improvement)}% vs moyenne
          </p>
          <p className="text-xs font-mono text-text-muted mt-2">
            {formatSpeed(analysis.bestTimeOfDay.avgSpeed)} • {analysis.bestTimeOfDay.activityCount} sorties
          </p>
        </div>

        {/* Best Rest */}
        <div className={`p-4 rounded-lg border ${getImprovementBg(analysis.bestRestDays.improvement)}`}>
          <div className="flex items-center gap-2 mb-2">
            <Coffee className="w-4 h-4 text-neon-yellow" />
            <p className="text-xs font-mono text-text-muted">Meilleur repos</p>
          </div>
          <p className="text-lg font-mono font-bold text-text-primary mb-1">
            {analysis.bestRestDays.label}
          </p>
          <p className={`text-xs font-mono ${getImprovementColor(analysis.bestRestDays.improvement)}`}>
            {analysis.bestRestDays.improvement > 0 ? '+' : ''}
            {Math.round(analysis.bestRestDays.improvement)}% vs moyenne
          </p>
          <p className="text-xs font-mono text-text-muted mt-2">
            {formatSpeed(analysis.bestRestDays.avgSpeed)} • {analysis.bestRestDays.activityCount} sorties
          </p>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="space-y-6">
        {/* Day of Week */}
        <div>
          <h4 className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neon-cyan" />
            Par jour de la semaine
          </h4>
          <div className="space-y-2">
            {dayInsights.map((insight) => (
              <div key={insight.label} className="flex items-center gap-3">
                <div className="w-24 text-xs font-mono text-text-secondary">{insight.label}</div>
                <div className="flex-1 relative h-2 bg-bg-card rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      insight.improvement >= 0 ? 'bg-neon-green' : 'bg-neon-orange'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.abs(insight.improvement) * 10)}%`,
                    }}
                  />
                </div>
                <div className="w-16 text-right">
                  <span className={`text-xs font-mono font-bold ${getImprovementColor(insight.improvement)}`}>
                    {insight.improvement > 0 ? '+' : ''}
                    {Math.round(insight.improvement)}%
                  </span>
                </div>
                <div className="w-20 text-xs font-mono text-text-muted text-right">
                  {insight.activityCount} sorties
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time of Day */}
        <div>
          <h4 className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-neon-green" />
            Par heure de la journée
          </h4>
          <div className="space-y-2">
            {timeInsights.map((insight) => (
              <div key={insight.label} className="flex items-center gap-3">
                <div className="w-32 text-xs font-mono text-text-secondary">{insight.label}</div>
                <div className="flex-1 relative h-2 bg-bg-card rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      insight.improvement >= 0 ? 'bg-neon-green' : 'bg-neon-orange'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.abs(insight.improvement) * 10)}%`,
                    }}
                  />
                </div>
                <div className="w-16 text-right">
                  <span className={`text-xs font-mono font-bold ${getImprovementColor(insight.improvement)}`}>
                    {insight.improvement > 0 ? '+' : ''}
                    {Math.round(insight.improvement)}%
                  </span>
                </div>
                <div className="w-20 text-xs font-mono text-text-muted text-right">
                  {insight.activityCount} sorties
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rest Days */}
        <div>
          <h4 className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
            <Coffee className="w-4 h-4 text-neon-yellow" />
            Par jours de repos
          </h4>
          <div className="space-y-2">
            {restInsights.map((insight) => (
              <div key={insight.label} className="flex items-center gap-3">
                <div className="w-24 text-xs font-mono text-text-secondary">{insight.label}</div>
                <div className="flex-1 relative h-2 bg-bg-card rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      insight.improvement >= 0 ? 'bg-neon-green' : 'bg-neon-orange'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.abs(insight.improvement) * 10)}%`,
                    }}
                  />
                </div>
                <div className="w-16 text-right">
                  <span className={`text-xs font-mono font-bold ${getImprovementColor(insight.improvement)}`}>
                    {insight.improvement > 0 ? '+' : ''}
                    {Math.round(insight.improvement)}%
                  </span>
                </div>
                <div className="w-20 text-xs font-mono text-text-muted text-right">
                  {insight.activityCount} sorties
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-bg-primary rounded-lg border border-border-subtle">
        <p className="text-xs font-mono text-text-secondary leading-relaxed">
          <span className="text-neon-magenta">Vitesse moyenne globale:</span> {formatSpeed(analysis.globalAvgSpeed)} ({analysis.globalAvgSpeed.toFixed(1)} km/h).
          Les pourcentages montrent l'amélioration de performance relative à cette moyenne dans différentes conditions.
        </p>
      </div>
    </div>
  )
}

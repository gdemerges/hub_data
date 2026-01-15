'use client'

import { RecoveryAdvice } from '@/lib/types'
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface RecoveryAdvisorProps {
  advice: RecoveryAdvice
}

export function RecoveryAdvisor({ advice }: RecoveryAdvisorProps) {
  const getStatusConfig = () => {
    switch (advice.status) {
      case 'ready':
        return {
          icon: CheckCircle,
          textColor: 'text-neon-green',
          bgColor: 'bg-neon-green/10',
          borderColor: 'border-neon-green/30',
          title: 'READY_TO_TRAIN',
          message: 'Tu es prêt pour une nouvelle séance !',
        }
      case 'caution':
        return {
          icon: AlertTriangle,
          textColor: 'text-neon-yellow',
          bgColor: 'bg-neon-yellow/10',
          borderColor: 'border-neon-yellow/30',
          title: 'CAUTION_MODE',
          message: 'Sortie légère recommandée ou repos.',
        }
      case 'rest':
        return {
          icon: Shield,
          textColor: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          title: 'REST_REQUIRED',
          message: 'Repos fortement recommandé pour éviter les blessures.',
        }
    }
  }

  const config = getStatusConfig()
  const StatusIcon = config.icon

  const getRiskBarColor = () => {
    if (advice.riskScore >= 70) return 'bg-red-500'
    if (advice.riskScore >= 40) return 'bg-neon-yellow'
    return 'bg-neon-green'
  }

  const formatHours = (hours: number) => {
    if (hours === 0) return 'Aucun'
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    if (remainingHours === 0) return `${days}j`
    return `${days}j ${remainingHours}h`
  }

  return (
    <div className={`tech-card p-6 ${config.borderColor}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 ${config.bgColor} border ${config.borderColor} rounded`}>
          <Shield className={`w-5 h-5 ${config.textColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Recovery_Advisor // Conseils de récupération
          </h3>
          <p className="text-xs font-mono text-text-muted mt-1">
            Analyse intelligente de ta charge d'entraînement
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-6 mb-6`}>
        <div className="flex items-center gap-4 mb-4">
          <StatusIcon className={`w-12 h-12 ${config.textColor}`} />
          <div className="flex-1">
            <h4 className={`text-lg font-mono font-bold ${config.textColor} tracking-wider`}>
              {config.title}
            </h4>
            <p className={`text-sm font-mono ${config.textColor}/80 mt-1`}>
              {config.message}
            </p>
          </div>
        </div>

        {/* Risk Score Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-text-muted">Score de risque</span>
            <span className={`text-sm font-mono font-bold ${config.textColor}`}>
              {advice.riskScore}/100
            </span>
          </div>
          <div className="h-2 bg-bg-card rounded-full overflow-hidden">
            <div
              className={`h-full ${getRiskBarColor()} transition-all duration-500`}
              style={{ width: `${advice.riskScore}%` }}
            />
          </div>
        </div>

        {/* Reason */}
        <div className={`p-3 bg-bg-primary rounded border ${config.borderColor}`}>
          <p className={`text-xs font-mono text-text-secondary leading-relaxed`}>
            <span className={`${config.textColor} font-semibold`}>&gt;</span> {advice.reason}
          </p>
        </div>
      </div>

      {/* Recovery Time */}
      {advice.hoursRecommended > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-bg-primary p-4 rounded-lg border border-border-subtle">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-neon-cyan" />
              <p className="text-xs font-mono text-text-muted">Repos recommandé</p>
            </div>
            <p className="text-2xl font-mono font-bold text-neon-cyan">
              {formatHours(advice.hoursRecommended)}
            </p>
          </div>
          <div className="bg-bg-primary p-4 rounded-lg border border-border-subtle">
            <p className="text-xs font-mono text-text-muted mb-2">Prochaine sortie</p>
            <p className="text-lg font-mono font-bold text-text-primary">
              {new Date(Date.now() + advice.hoursRecommended * 60 * 60 * 1000).toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </p>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="border-t border-border-subtle pt-6">
        <h4 className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider mb-3">
          Recommandations
        </h4>
        <div className="space-y-2">
          {advice.status === 'ready' && (
            <>
              <div className="flex items-start gap-2 text-xs font-mono text-text-secondary">
                <span className="text-neon-green mt-0.5">✓</span>
                <span>Tu peux faire une sortie intensive ou longue</span>
              </div>
              <div className="flex items-start gap-2 text-xs font-mono text-text-secondary">
                <span className="text-neon-green mt-0.5">✓</span>
                <span>Maintiens une bonne hydratation et nutrition</span>
              </div>
              <div className="flex items-start gap-2 text-xs font-mono text-text-secondary">
                <span className="text-neon-green mt-0.5">✓</span>
                <span>Écoute ton corps pendant l'effort</span>
              </div>
            </>
          )}
          {advice.status === 'caution' && (
            <>
              <div className="flex items-start gap-2 text-xs font-mono text-text-secondary">
                <span className="text-neon-yellow mt-0.5">⚠</span>
                <span>Privilégie une sortie en endurance douce</span>
              </div>
              <div className="flex items-start gap-2 text-xs font-mono text-text-secondary">
                <span className="text-neon-yellow mt-0.5">⚠</span>
                <span>Évite les efforts intenses ou le fractionné</span>
              </div>
              <div className="flex items-start gap-2 text-xs font-mono text-text-secondary">
                <span className="text-neon-yellow mt-0.5">⚠</span>
                <span>Fais attention aux signaux de fatigue</span>
              </div>
            </>
          )}
          {advice.status === 'rest' && (
            <>
              <div className="flex items-start gap-2 text-xs font-mono text-text-secondary">
                <span className="text-neon-red mt-0.5">✗</span>
                <span>Prends un jour de repos complet</span>
              </div>
              <div className="flex items-start gap-2 text-xs font-mono text-text-secondary">
                <span className="text-neon-red mt-0.5">✗</span>
                <span>Favorise le sommeil et la récupération active (marche, étirements)</span>
              </div>
              <div className="flex items-start gap-2 text-xs font-mono text-text-secondary">
                <span className="text-neon-red mt-0.5">✗</span>
                <span>Évite toute activité intense pour réduire le risque de blessure</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-bg-primary rounded-lg border border-border-subtle">
        <p className="text-xs font-mono text-text-secondary leading-relaxed">
          Le <span className="text-neon-cyan">score de risque</span> est calculé en fonction de l'augmentation de
          charge hebdomadaire, de l'intensité récente, du temps de récupération et de la fréquence des sorties.
          Un score &gt;50 indique un risque élevé de blessure.
        </p>
      </div>
    </div>
  )
}

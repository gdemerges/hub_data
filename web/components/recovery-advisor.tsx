'use client'

import { useEffect, useState } from 'react'
import type { RecoveryAdvice } from '@/lib/types'
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface RecoveryAdvisorProps {
  advice: RecoveryAdvice
}

export function RecoveryAdvisor({ advice }: RecoveryAdvisorProps) {
  // « Prochaine sortie » dépend de Date.now() + du fuseau : non déterministe
  // entre SSR et client → on ne la calcule qu'après montage pour éviter le
  // mismatch d'hydratation.
  const [nextSession, setNextSession] = useState<string | null>(null)
  useEffect(() => {
    setNextSession(
      new Date(Date.now() + advice.hoursRecommended * 60 * 60 * 1000).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    )
  }, [advice.hoursRecommended])

  const getStatusConfig = () => {
    switch (advice.status) {
      case 'ready':
        return {
          icon: CheckCircle,
          textColor: 'text-earth-moss',
          bgColor: 'bg-earth-moss/10',
          borderColor: 'border-earth-moss/30',
          title: 'Prêt à reprendre',
          message: 'Tu es prêt pour une nouvelle séance.',
        }
      case 'caution':
        return {
          icon: AlertTriangle,
          textColor: 'text-earth-saffron',
          bgColor: 'bg-earth-saffron/10',
          borderColor: 'border-earth-saffron/30',
          title: 'Prudence',
          message: 'Sortie légère recommandée ou repos.',
        }
      case 'rest':
        return {
          icon: Shield,
          textColor: 'text-earth-clay',
          bgColor: 'bg-earth-clay/10',
          borderColor: 'border-earth-clay/30',
          title: 'Repos requis',
          message: 'Repos fortement recommandé pour éviter les blessures.',
        }
    }
  }

  const config = getStatusConfig()
  const StatusIcon = config.icon

  const getRiskBarColor = () => {
    if (advice.riskScore >= 70) return 'bg-earth-clay'
    if (advice.riskScore >= 40) return 'bg-earth-saffron'
    return 'bg-earth-moss'
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
        <div className={`p-2 rounded-xl border ${config.bgColor} ${config.borderColor}`}>
          <Shield className={`w-4 h-4 ${config.textColor}`} strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-medium tracking-tight text-text-primary">
            Conseils de récupération
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Charge d'entraînement et signaux corporels
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-6 mb-6`}>
        <div className="flex items-center gap-4 mb-4">
          <StatusIcon className={`w-12 h-12 ${config.textColor}`} />
          <div className="flex-1">
            <h4 className={`font-display text-xl font-medium tracking-tight ${config.textColor}`}>
              {config.title}
            </h4>
            <p className="text-sm text-text-secondary mt-1">
              {config.message}
            </p>
          </div>
        </div>

        {/* Risk Score Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Score de risque</span>
            <span className={`font-display text-base font-medium num ${config.textColor}`}>
              {advice.riskScore}<span className="text-text-muted">/100</span>
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
        <div className={`p-3 bg-bg-card/60 rounded-xl border ${config.borderColor}`}>
          <p className="text-xs text-text-secondary leading-relaxed">
            <span className={`${config.textColor} font-medium mr-1`}>·</span>{advice.reason}
          </p>
        </div>
      </div>

      {/* Recovery Time */}
      {advice.hoursRecommended > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="tech-card-flat p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-earth-fern" strokeWidth={1.75} />
              <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Repos recommandé</p>
            </div>
            <p className="font-display text-2xl font-medium tracking-tight num text-earth-fern leading-none">
              {formatHours(advice.hoursRecommended)}
            </p>
          </div>
          <div className="tech-card-flat p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted mb-2">Prochaine sortie</p>
            <p
              className="font-display text-2xl font-medium tracking-tight text-text-primary leading-none"
              suppressHydrationWarning
            >
              {nextSession ?? '—'}
            </p>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="border-t border-border-subtle pt-6">
        <h4 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-secondary mb-3">
          Recommandations
        </h4>
        <div className="space-y-2">
          {advice.status === 'ready' && (
            <>
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-earth-moss mt-0.5">✓</span>
                <span>Tu peux faire une sortie intensive ou longue</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-earth-moss mt-0.5">✓</span>
                <span>Maintiens une bonne hydratation et nutrition</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-earth-moss mt-0.5">✓</span>
                <span>Écoute ton corps pendant l'effort</span>
              </div>
            </>
          )}
          {advice.status === 'caution' && (
            <>
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-earth-saffron mt-0.5">⚠</span>
                <span>Privilégie une sortie en endurance douce</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-earth-saffron mt-0.5">⚠</span>
                <span>Évite les efforts intenses ou le fractionné</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-earth-saffron mt-0.5">⚠</span>
                <span>Fais attention aux signaux de fatigue</span>
              </div>
            </>
          )}
          {advice.status === 'rest' && (
            <>
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-earth-clay mt-0.5">✗</span>
                <span>Prends un jour de repos complet</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-earth-clay mt-0.5">✗</span>
                <span>Favorise le sommeil et la récupération active (marche, étirements)</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-earth-clay mt-0.5">✗</span>
                <span>Évite toute activité intense pour réduire le risque de blessure</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 tech-card-flat p-4">
        <p className="text-xs text-text-secondary leading-relaxed">
          Le{' '}
          <span className="text-earth-fern font-medium">score de risque</span>{' '}
          {
            "est calculé en fonction de l'augmentation de charge hebdomadaire, de l'intensité récente, du temps de récupération et de la fréquence des sorties. Un score > 50 indique un risque élevé de blessure."
          }
        </p>
      </div>
    </div>
  )
}

'use client'

import { Heart, TrendingUp, Zap } from 'lucide-react'
import { Pulse } from '@phosphor-icons/react/dist/ssr'
import { EmptyState } from './empty-state'

interface Activity {
  startDate: string
  distance: number
  movingTime: number
  averageHeartrate?: number
  type: string
}

interface HeartRateZonesProps {
  activities: Activity[]
  lthr: number
}

const HR_ZONES = [
  {
    zone: 1,
    name: 'Récupération',
    minPercent: 50,
    maxPercent: 60,
    rgb: '61 81 112', // earth.indigo
    text: 'text-earth-indigo',
    bg: 'bg-earth-indigo/10',
    border: 'border-earth-indigo/30',
    description: 'Récupération active, endurance de base',
  },
  {
    zone: 2,
    name: 'Endurance',
    minPercent: 60,
    maxPercent: 70,
    rgb: '138 178 116', // earth.mossSoft
    text: 'text-earth-mossSoft',
    bg: 'bg-earth-mossSoft/10',
    border: 'border-earth-mossSoft/30',
    description: "Développement de l'endurance aérobie",
  },
  {
    zone: 3,
    name: 'Tempo',
    minPercent: 70,
    maxPercent: 80,
    rgb: '217 164 65', // earth.saffron
    text: 'text-earth-saffron',
    bg: 'bg-earth-saffron/10',
    border: 'border-earth-saffron/30',
    description: 'Amélioration du seuil lactique',
  },
  {
    zone: 4,
    name: 'Seuil',
    minPercent: 80,
    maxPercent: 90,
    rgb: '168 85 44', // earth.rust
    text: 'text-earth-rust',
    bg: 'bg-earth-rust/10',
    border: 'border-earth-rust/30',
    description: 'Travail au seuil anaérobie',
  },
  {
    zone: 5,
    name: 'VO2 Max',
    minPercent: 90,
    maxPercent: 100,
    rgb: '176 104 104', // earth.clay
    text: 'text-earth-clay',
    bg: 'bg-earth-clay/10',
    border: 'border-earth-clay/30',
    description: 'Efforts maximaux, développement VO2max',
  },
]

function calculateZoneDistribution(activities: Activity[], lthr: number) {
  const activitiesWithHR = activities.filter((a) => a.averageHeartrate && a.averageHeartrate > 0)

  if (activitiesWithHR.length === 0) {
    return HR_ZONES.map((zone) => ({ ...zone, minutes: 0, percentage: 0 }))
  }

  const zoneMinutes = HR_ZONES.map(() => 0)
  let totalMinutes = 0

  for (const activity of activitiesWithHR) {
    const hr = activity.averageHeartrate!
    const minutes = activity.movingTime

    for (let i = 0; i < HR_ZONES.length; i++) {
      const zone = HR_ZONES[i]
      const minHR = lthr * (zone.minPercent / 100)
      const maxHR = lthr * (zone.maxPercent / 100)

      if (hr >= minHR && hr < maxHR) {
        zoneMinutes[i] += minutes
        totalMinutes += minutes
        break
      }
    }

    if (hr >= lthr) {
      zoneMinutes[4] += minutes
      totalMinutes += minutes
    }
  }

  return HR_ZONES.map((zone, i) => ({
    ...zone,
    minutes: zoneMinutes[i],
    percentage: totalMinutes > 0 ? (zoneMinutes[i] / totalMinutes) * 100 : 0,
  }))
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours > 0) {
    return `${hours}h${mins > 0 ? `${mins}m` : ''}`
  }
  return `${mins}m`
}

export function HeartRateZones({ activities, lthr }: HeartRateZonesProps) {
  const activitiesWithHR = activities.filter((a) => a.averageHeartrate && a.averageHeartrate > 0)
  const zones = calculateZoneDistribution(activities, lthr)
  const estimatedMaxHR = Math.round(lthr / 0.9)
  const dominantZone = zones.reduce((max, zone) => (zone.minutes > max.minutes ? zone : max), zones[0])
  const avgHR =
    activitiesWithHR.length > 0
      ? Math.round(
          activitiesWithHR.reduce((sum, a) => sum + (a.averageHeartrate || 0), 0) / activitiesWithHR.length,
        )
      : 0

  const getRecommendation = () => {
    const zone2Percent = zones[1].percentage
    const zone4And5Percent = zones[3].percentage + zones[4].percentage
    if (zone2Percent < 60) {
      return {
        message: `Tu passes seulement ${zone2Percent.toFixed(0)}% du temps en zone 2. Augmente ton volume en endurance de base.`,
        color: 'text-earth-saffron',
      }
    }
    if (zone4And5Percent > 30) {
      return {
        message: `${zone4And5Percent.toFixed(0)}% du temps en zones intenses. Attention au surentraînement.`,
        color: 'text-earth-rust',
      }
    }
    return {
      message: "Distribution équilibrée des zones d'entraînement. Continue comme ça.",
      color: 'text-earth-moss',
    }
  }
  const recommendation = getRecommendation()

  if (activitiesWithHR.length === 0) {
    return (
      <div className="tech-card p-6">
        <Header />
        <EmptyState
          icon={Pulse}
          title="Aucune donnée de fréquence cardiaque"
          description="Connecte ton capteur FC à Strava — les calculs de TSS gagnent en précision avec ces données."
        />
      </div>
    )
  }

  return (
    <div className="tech-card p-6">
      <Header />

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <KeyMetric label="LTHR" value={lthr} sub="bpm (seuil lactique)" tone="clay" icon={Heart} />
        <KeyMetric label="FC max estimée" value={estimatedMaxHR} sub="bpm" />
        <KeyMetric label="FC moyenne" value={avgHR} sub="bpm récent" />
      </div>

      {/* Zone Distribution */}
      <div className="mb-6">
        <h4 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-secondary mb-4">
          Distribution par zone
        </h4>
        <div className="space-y-4">
          {zones.map((zone) => (
            <div key={zone.zone}>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`font-display text-sm font-medium num shrink-0 ${zone.text}`}
                    aria-label={`Zone ${zone.zone}`}
                  >
                    Z{zone.zone}
                  </span>
                  <span className="text-text-primary font-medium">{zone.name}</span>
                  <span className="text-text-muted num hidden sm:inline">
                    {Math.round((lthr * zone.minPercent) / 100)}–{Math.round((lthr * zone.maxPercent) / 100)} bpm
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-text-muted num">{formatMinutes(zone.minutes)}</span>
                  <span className="font-display font-medium num text-text-primary w-10 text-right">
                    {zone.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="relative h-1.5 bg-bg-tertiary/30 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-700 ease-out rounded-full"
                  style={{
                    width: `${zone.percentage}%`,
                    backgroundColor: `rgb(${zone.rgb})`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dominant Zone */}
      <div className={`p-4 rounded-xl border ${dominantZone.border} ${dominantZone.bg} mb-6`}>
        <div className="flex items-center gap-2 mb-1.5">
          <TrendingUp className={`w-4 h-4 ${dominantZone.text}`} strokeWidth={1.75} />
          <p className="text-sm font-medium text-text-primary">
            Zone dominante : <span className={dominantZone.text}>{dominantZone.name}</span>{' '}
            <span className="text-text-muted num">({dominantZone.percentage.toFixed(0)}%)</span>
          </p>
        </div>
        <p className="text-xs text-text-secondary">{dominantZone.description}</p>
      </div>

      {/* Recommendation */}
      <div className="border-t border-border-subtle pt-5">
        <div className="flex items-start gap-3">
          <Zap className={`w-4 h-4 ${recommendation.color} mt-0.5 shrink-0`} strokeWidth={1.75} />
          <div>
            <p className={`text-sm font-medium ${recommendation.color}`}>Recommandation</p>
            <p className="text-xs text-text-secondary leading-relaxed mt-1">{recommendation.message}</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 tech-card-flat p-4">
        <p className="text-xs text-text-secondary leading-relaxed">
          La <span className="text-earth-clay font-medium">LTHR</span> (Lactate Threshold HR) est calculée
          automatiquement à partir de tes efforts intenses récents. Les calculs de{' '}
          <span className="text-earth-fern font-medium">TSS</span> utilisent la fréquence cardiaque quand elle est
          disponible.
        </p>
      </div>
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-earth-clay/10 border border-earth-clay/30 rounded-xl">
        <Heart className="w-4 h-4 text-earth-clay" strokeWidth={1.75} />
      </div>
      <div>
        <h3 className="font-display text-lg font-medium tracking-tight text-text-primary">
          Zones de fréquence cardiaque
        </h3>
        <p className="text-xs text-text-muted mt-0.5">Distribution de l'entraînement par intensité</p>
      </div>
    </div>
  )
}

type KeyMetricProps = {
  label: string
  value: number
  sub: string
  tone?: 'clay'
  icon?: typeof Heart
}

function KeyMetric({ label, value, sub, tone, icon: Icon }: KeyMetricProps) {
  const valueClass = tone === 'clay' ? 'text-earth-clay' : 'text-text-primary'
  return (
    <div className="tech-card-flat p-4">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={`w-3.5 h-3.5 ${valueClass}`} strokeWidth={1.75} />}
        <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">{label}</p>
      </div>
      <p className={`font-display text-3xl font-medium tracking-tight num leading-none ${valueClass}`}>{value}</p>
      <p className="text-[11px] text-text-muted mt-2">{sub}</p>
    </div>
  )
}

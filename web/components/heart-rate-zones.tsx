'use client'

import { Heart, TrendingUp, Zap } from 'lucide-react'

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
    color: 'rgb(147, 197, 253)', // blue-300
    bgColor: 'bg-blue-300/10',
    borderColor: 'border-blue-300/30',
    description: 'Récupération active, endurance de base',
  },
  {
    zone: 2,
    name: 'Endurance',
    minPercent: 60,
    maxPercent: 70,
    color: 'rgb(134, 239, 172)', // green-300
    bgColor: 'bg-green-300/10',
    borderColor: 'border-green-300/30',
    description: 'Développement de l\'endurance aérobie',
  },
  {
    zone: 3,
    name: 'Tempo',
    minPercent: 70,
    maxPercent: 80,
    color: 'rgb(253, 224, 71)', // yellow-300
    bgColor: 'bg-yellow-300/10',
    borderColor: 'border-yellow-300/30',
    description: 'Amélioration du seuil lactique',
  },
  {
    zone: 4,
    name: 'Seuil',
    minPercent: 80,
    maxPercent: 90,
    color: 'rgb(251, 146, 60)', // orange-400
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-400/30',
    description: 'Travail au seuil anaérobie',
  },
  {
    zone: 5,
    name: 'VO2 Max',
    minPercent: 90,
    maxPercent: 100,
    color: 'rgb(239, 68, 68)', // red-500
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    description: 'Efforts maximaux, développement VO2max',
  },
]

function calculateZoneDistribution(activities: Activity[], lthr: number) {
  const activitiesWithHR = activities.filter(a => a.averageHeartrate && a.averageHeartrate > 0)

  if (activitiesWithHR.length === 0) {
    return HR_ZONES.map(zone => ({ ...zone, minutes: 0, percentage: 0 }))
  }

  const zoneMinutes = HR_ZONES.map(() => 0)
  let totalMinutes = 0

  for (const activity of activitiesWithHR) {
    const hr = activity.averageHeartrate!
    const minutes = activity.movingTime

    // Déterminer dans quelle zone se trouve cette activité
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

    // Si au-dessus de la zone 5
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
    return `${hours}h${mins > 0 ? mins + 'm' : ''}`
  }
  return `${mins}m`
}

export function HeartRateZones({ activities, lthr }: HeartRateZonesProps) {
  const activitiesWithHR = activities.filter(a => a.averageHeartrate && a.averageHeartrate > 0)
  const zones = calculateZoneDistribution(activities, lthr)

  // Calcul de la FC max estimée (LTHR ≈ 90% FCmax)
  const estimatedMaxHR = Math.round(lthr / 0.90)

  // Trouver la zone dominante
  const dominantZone = zones.reduce((max, zone) => zone.minutes > max.minutes ? zone : max, zones[0])

  // Calculer la FC moyenne de toutes les activités
  const avgHR = activitiesWithHR.length > 0
    ? Math.round(activitiesWithHR.reduce((sum, a) => sum + (a.averageHeartrate || 0), 0) / activitiesWithHR.length)
    : 0

  // Recommandations basées sur la distribution
  const getRecommendation = () => {
    const zone2Percent = zones[1].percentage
    const zone4And5Percent = zones[3].percentage + zones[4].percentage

    if (zone2Percent < 60) {
      return {
        type: 'warning',
        message: `Tu passes seulement ${zone2Percent.toFixed(0)}% du temps en zone 2. Augmente ton volume en endurance de base.`,
        color: 'text-neon-yellow',
      }
    }

    if (zone4And5Percent > 30) {
      return {
        type: 'caution',
        message: `${zone4And5Percent.toFixed(0)}% du temps en zones intenses. Attention au surentraînement.`,
        color: 'text-neon-orange',
      }
    }

    return {
      type: 'good',
      message: 'Distribution équilibrée des zones d\'entraînement. Continue comme ça !',
      color: 'text-neon-green',
    }
  }

  const recommendation = getRecommendation()

  if (activitiesWithHR.length === 0) {
    return (
      <div className="tech-card p-6 border-border-subtle">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded">
            <Heart className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
              Heart_Rate_Zones // Zones FC
            </h3>
            <p className="text-xs font-mono text-text-muted mt-1">
              Aucune donnée de fréquence cardiaque disponible
            </p>
          </div>
        </div>
        <p className="text-sm font-mono text-text-secondary">
          Les données de fréquence cardiaque permettent des calculs de TSS plus précis.
          Assure-toi que ton capteur FC est bien connecté à Strava.
        </p>
      </div>
    )
  }

  return (
    <div className="tech-card p-6 border-red-500/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded">
          <Heart className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Heart_Rate_Zones // Analyse FC
          </h3>
          <p className="text-xs font-mono text-text-muted mt-1">
            Distribution de l'entraînement par zones de fréquence cardiaque
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-bg-primary p-4 rounded-lg border border-red-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-red-500" />
            <p className="text-xs font-mono text-text-muted">LTHR</p>
          </div>
          <p className="text-2xl font-mono font-bold text-red-500">{lthr}</p>
          <p className="text-xs font-mono text-text-muted mt-1">bpm (seuil lactique)</p>
        </div>
        <div className="bg-bg-primary p-4 rounded-lg border border-border-subtle">
          <p className="text-xs font-mono text-text-muted mb-1">FC max estimée</p>
          <p className="text-2xl font-mono font-bold text-text-primary">{estimatedMaxHR}</p>
          <p className="text-xs font-mono text-text-muted mt-1">bpm</p>
        </div>
        <div className="bg-bg-primary p-4 rounded-lg border border-border-subtle">
          <p className="text-xs font-mono text-text-muted mb-1">FC moyenne</p>
          <p className="text-2xl font-mono font-bold text-text-primary">{avgHR}</p>
          <p className="text-xs font-mono text-text-muted mt-1">bpm (récent)</p>
        </div>
      </div>

      {/* Zone Distribution */}
      <div className="mb-6">
        <h4 className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider mb-3">
          Distribution par zone
        </h4>
        <div className="space-y-3">
          {zones.map((zone) => (
            <div key={zone.zone}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-text-primary">
                    Z{zone.zone}
                  </span>
                  <span className="text-xs font-mono text-text-secondary">{zone.name}</span>
                  <span className="text-xs font-mono text-text-muted">
                    ({Math.round(lthr * zone.minPercent / 100)}-{Math.round(lthr * zone.maxPercent / 100)} bpm)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-text-muted">{formatMinutes(zone.minutes)}</span>
                  <span className="text-xs font-mono font-bold text-text-primary w-12 text-right">
                    {zone.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="relative h-2 bg-bg-card rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${zone.percentage}%`,
                    backgroundColor: zone.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dominant Zone */}
      <div className={`p-4 rounded-lg border ${dominantZone.borderColor} ${dominantZone.bgColor} mb-6`}>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4" style={{ color: dominantZone.color }} />
          <p className="text-xs font-mono font-semibold text-text-primary">
            Zone dominante: {dominantZone.name} ({dominantZone.percentage.toFixed(0)}%)
          </p>
        </div>
        <p className="text-xs font-mono text-text-secondary">{dominantZone.description}</p>
      </div>

      {/* Recommendation */}
      <div className="border-t border-border-subtle pt-4">
        <div className="flex items-start gap-3">
          <Zap className={`w-5 h-5 ${recommendation.color} mt-0.5`} />
          <div>
            <p className={`text-sm font-mono font-semibold ${recommendation.color} mb-1`}>
              Recommandation
            </p>
            <p className="text-xs font-mono text-text-secondary leading-relaxed">
              {recommendation.message}
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-bg-primary rounded-lg border border-border-subtle">
        <p className="text-xs font-mono text-text-secondary leading-relaxed">
          <span className="text-red-500">LTHR</span> (Lactate Threshold Heart Rate) est calculé automatiquement
          à partir de tes efforts intenses récents. Les calculs de <span className="text-neon-cyan">TSS</span> utilisent
          maintenant la fréquence cardiaque pour plus de précision quand disponible.
        </p>
      </div>
    </div>
  )
}

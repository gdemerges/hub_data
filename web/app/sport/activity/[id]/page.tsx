'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Route,
  Timer,
  Mountain,
  Heart,
  Flame,
  TrendingUp,
  Clock,
  Zap,
  Activity,
  Bike,
  Footprints,
  Gauge,
  type LucideIcon,
} from 'lucide-react'
import { StatCard, SectionCard } from '@/components'
import { formatPace } from '@/lib/sport'

interface ActivityDetail {
  id: number
  name: string
  type: string
  distance: number
  movingTime: number
  elapsedTime: number
  totalElevationGain: number
  startDate: string
  averageSpeed: number
  maxSpeed: number
  averageHeartrate?: number
  maxHeartrate?: number
  calories?: number
  description?: string
  polyline?: string
  startLatlng?: [number, number]
  endLatlng?: [number, number]
  averageCadence?: number
  sufferScore?: number
  deviceName?: string
}

interface Lap {
  name: string
  distance: number
  movingTime: number
  elapsedTime: number
  averageSpeed: number
  averageHeartrate?: number
  maxHeartrate?: number
  totalElevationGain: number
  lapIndex: number
}

interface ActivityData {
  activity: ActivityDetail
  streams: {
    latlng?: [number, number][]
    altitude?: number[]
    heartrate?: number[]
    time?: number[]
    distance?: number[]
    velocity?: number[]
    cadence?: number[]
  } | null
  laps: Lap[]
}

// Decode polyline (Google's algorithm)
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = []
  let index = 0, lat = 0, lng = 0

  while (index < encoded.length) {
    let b = 0, shift = 0, result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1)
    lat += dlat

    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1)
    lng += dlng

    points.push([lat / 1e5, lng / 1e5])
  }
  return points
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
  return `${minutes}m ${secs}s`
}

const TYPE_ICON: Record<string, LucideIcon> = {
  run: Footprints,
  ride: Bike,
}
function typeIcon(type: string): LucideIcon {
  return TYPE_ICON[type.toLowerCase()] ?? Activity
}
function typeLabel(type: string): string {
  switch (type.toLowerCase()) {
    case 'run': return 'Course'
    case 'ride': return 'Vélo'
    default: return type
  }
}

export default function ActivityPage() {
  const params = useParams()
  const [data, setData] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActivity() {
      try {
        const response = await fetch(`/api/strava/activity/${params.id}`)
        if (response.ok) {
          setData(await response.json())
        } else {
          setError('Activité non trouvée')
        }
      } catch {
        setError('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchActivity()
  }, [params.id])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-bg-card rounded" />
          <div className="h-64 bg-bg-card rounded-3xl" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-bg-card rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="tech-card p-8 text-center">
          <p className="text-earth-clay mb-4">{error || 'Erreur'}</p>
          <Link href="/sport" className="text-earth-rust hover:underline">
            ← Retour
          </Link>
        </div>
      </div>
    )
  }

  const { activity, streams, laps } = data
  const routePoints = activity.polyline ? decodePolyline(activity.polyline) : streams?.latlng || []
  const HeaderIcon = typeIcon(activity.type)
  const isRun = activity.type.toLowerCase() === 'run'

  const dateLong = new Date(activity.startDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timeShort = new Date(activity.startDate).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Link
        href="/sport"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-earth-rust transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Retour aux activités
      </Link>

      {/* Header éditorial */}
      <header className="mb-10">
        <div className="flex items-center justify-between mb-6 text-[10px] uppercase tracking-[0.22em] font-mono text-text-muted">
          <span className="inline-flex items-center gap-2 text-earth-rust">
            <span className="inline-block w-6 h-px bg-earth-rust" aria-hidden />
            {typeLabel(activity.type)}
          </span>
          <span>{dateLong} · {timeShort}</span>
        </div>
        <div className="flex items-start gap-4">
          <div
            className="gradient-mesh p-3.5 rounded-2xl border border-earth-rust/30 shadow-soft mt-1 shrink-0"
            style={
              {
                ['--mesh-a' as string]: '168 85 44',
                ['--mesh-b' as string]: '217 164 65',
                ['--mesh-c' as string]: '168 85 44',
              } as React.CSSProperties
            }
          >
            <HeaderIcon className="w-7 h-7 text-earth-rust" strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-text-primary leading-tight">
            {activity.name}
          </h1>
        </div>
      </header>

      {/* Carte */}
      {routePoints.length > 0 && (
        <div className="tech-card p-4 mb-8">
          <div className="relative h-80 rounded-2xl overflow-hidden bg-bg-primary">
            <iframe
              title="Tracé de l'activité"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(...routePoints.map(p => p[1])) - 0.01},${Math.min(...routePoints.map(p => p[0])) - 0.01},${Math.max(...routePoints.map(p => p[1])) + 0.01},${Math.max(...routePoints.map(p => p[0])) + 0.01}&layer=mapnik&marker=${routePoints[0][0]},${routePoints[0][1]}`}
              className="rounded-2xl"
            />
            <div className="absolute bottom-2 right-2">
              <a
                href={`https://www.strava.com/activities/${activity.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-bg-card/90 px-3 py-1.5 rounded-full text-earth-rust hover:bg-bg-card transition-colors"
              >
                Voir sur Strava →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Stats principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Distance" value={`${activity.distance.toFixed(2)} km`} icon={Route} color="rust" />
        <StatCard label="Durée" value={formatDuration(activity.movingTime)} icon={Timer} color="fern" />
        <StatCard
          label={isRun ? 'Allure moyenne' : 'Vitesse moyenne'}
          value={isRun ? `${formatPace(activity.averageSpeed)}/km` : `${activity.averageSpeed.toFixed(1)} km/h`}
          icon={isRun ? Gauge : Zap}
          color="moss"
        />
        <StatCard label="Dénivelé" value={`${Math.round(activity.totalElevationGain)} m`} icon={Mountain} color="terracotta" />
      </div>

      {/* Stats secondaires */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {activity.averageHeartrate && (
          <StatCard label="FC moyenne" value={`${Math.round(activity.averageHeartrate)} bpm`} icon={Heart} color="clay" />
        )}
        {activity.maxHeartrate && (
          <StatCard label="FC max" value={`${Math.round(activity.maxHeartrate)} bpm`} icon={Heart} color="clay" />
        )}
        {activity.calories && (
          <StatCard label="Calories" value={`${activity.calories} kcal`} icon={Flame} color="saffron" />
        )}
        <StatCard label="Vitesse max" value={`${activity.maxSpeed.toFixed(1)} km/h`} icon={TrendingUp} color="sage" />
      </div>

      {/* Splits / laps */}
      {laps.length > 0 && (
        <SectionCard title="Splits par tour" icon={Clock} accent="fern">
          <div className="space-y-2">
            {laps.map((lap, index) => {
              const fastestSpeed = Math.max(...laps.map((l) => l.averageSpeed))
              const isFastest = lap.averageSpeed === fastestSpeed
              return (
                <div
                  key={lap.lapIndex ?? index}
                  className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                    isFastest ? 'bg-earth-moss/10 border-earth-moss/30' : 'bg-bg-primary border-border-subtle'
                  }`}
                >
                  <span className={`w-8 text-center num font-medium ${isFastest ? 'text-earth-moss' : 'text-text-muted'}`}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 bg-bg-card rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isFastest ? 'bg-earth-moss' : 'bg-earth-rust/50'}`}
                        style={{ width: `${(lap.averageSpeed / fastestSpeed) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className={`num font-medium w-20 text-right ${isFastest ? 'text-earth-moss' : 'text-text-primary'}`}>
                    {isRun ? `${formatPace(lap.averageSpeed)}/km` : `${lap.averageSpeed.toFixed(1)} km/h`}
                  </span>
                  {lap.averageHeartrate && (
                    <span className="num text-sm text-earth-clay/70 w-16 text-right">
                      {Math.round(lap.averageHeartrate)} bpm
                    </span>
                  )}
                  {lap.totalElevationGain > 0 && (
                    <span className="num text-sm text-earth-fern/70 w-16 text-right">
                      +{Math.round(lap.totalElevationGain)}m
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      {/* Profil d'allure (course uniquement) */}
      {isRun && streams?.velocity && streams.velocity.length > 0 && (
        <ProfileChart
          title="Profil d'allure"
          icon={Gauge}
          accent="fern"
          colorRgb="123 168 150"
          values={streams.velocity.map((v) => v * 3.6)}
          format={(kmh) => `${formatPace(kmh)}`}
          annotate="max"
          xLabels={['Début', `${activity.distance.toFixed(1)} km`]}
        />
      )}

      {/* Profil d'altitude */}
      {streams?.altitude && streams.altitude.length > 0 && (
        <ProfileChart
          title="Profil d'altitude"
          icon={Mountain}
          accent="moss"
          colorRgb="90 125 74"
          values={streams.altitude}
          format={(m) => `${Math.round(m)} m`}
          annotate="max"
          xLabels={['0 km', `${activity.distance.toFixed(1)} km`]}
        />
      )}

      {/* Profil de fréquence cardiaque */}
      {streams?.heartrate && streams.heartrate.length > 0 && (
        <ProfileChart
          title="Fréquence cardiaque"
          icon={Heart}
          accent="clay"
          colorRgb="176 104 104"
          values={streams.heartrate}
          format={(bpm) => `${Math.round(bpm)} bpm`}
          annotate="max"
          xLabels={['Début', 'Fin']}
        />
      )}
    </div>
  )
}

type ProfileAccent = 'moss' | 'clay' | 'fern'

/**
 * Profil continu (altitude, FC, allure) en aire SVG lissée — même idiome
 * graphique que FitnessChart. Remplace les anciennes barres verticales.
 */
function ProfileChart({
  title,
  icon: Icon,
  accent,
  colorRgb,
  values,
  format,
  annotate,
  xLabels,
}: {
  title: string
  icon: LucideIcon
  accent: ProfileAccent
  colorRgb: string
  values: number[]
  format: (v: number) => string
  annotate: 'max' | 'min'
  xLabels: [string, string]
}) {
  // Sous-échantillonnage pour la lisibilité (~140 points max).
  const step = Math.max(1, Math.floor(values.length / 140))
  const sampled = values.filter((_, i) => i % step === 0)
  if (sampled.length < 2) return null

  const min = Math.min(...sampled)
  const max = Math.max(...sampled)
  const range = max - min || 1
  const color = `rgb(${colorRgb})`

  // max -> haut, min -> bas
  const toY = (v: number) => ((max - v) / range) * 100
  const toX = (i: number) => (i / (sampled.length - 1)) * 100

  const linePoints = sampled.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  const areaPath = `M0,${toY(sampled[0])} ${sampled
    .map((v, i) => `L${toX(i)},${toY(v)}`)
    .join(' ')} L100,100 L0,100 Z`

  // Annotation de l'extrême pertinent (pic d'altitude / FC max / allure la plus rapide).
  const extremeIdx =
    annotate === 'max'
      ? sampled.reduce((b, v, i) => (v > sampled[b] ? i : b), 0)
      : sampled.reduce((b, v, i) => (v < sampled[b] ? i : b), 0)
  const ax = toX(extremeIdx)
  const ay = toY(sampled[extremeIdx])

  return (
    <SectionCard title={title} icon={Icon} accent={accent}>
      <div className="flex gap-3">
        <div className="flex flex-col justify-between h-40 text-xs num text-text-muted py-1 shrink-0">
          <span style={{ color }}>{format(max)}</span>
          <span>{format(min + range / 2)}</span>
          <span>{format(min)}</span>
        </div>
        <div className="flex-1 relative h-40">
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t" style={{ borderColor: 'rgb(var(--dv-grid) / 0.4)' }} />
            ))}
          </div>
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            role="img"
            aria-label={`${title} — de ${format(min)} à ${format(max)}`}
          >
            <defs>
              <linearGradient id={`grad-${accent}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={color} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#grad-${accent})`} stroke="none" />
            <polyline
              points={linePoints}
              fill="none"
              stroke={color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              className="chart-line-draw"
            />
            <circle cx={ax} cy={ay} r={2.5} fill="rgb(var(--bg-card))" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>
      <div className="flex justify-between mt-2 ml-[3.5rem] text-xs text-text-muted num">
        <span>{xLabels[0]}</span>
        <span>{xLabels[1]}</span>
      </div>
    </SectionCard>
  )
}

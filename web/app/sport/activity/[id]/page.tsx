'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Terminal, ArrowLeft, Route, Timer, Mountain, Heart,
  Flame, TrendingUp, Clock, Zap, Activity, MapPin
} from 'lucide-react'
import { StatCard } from '@/components'

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
    let b, shift = 0, result = 0
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
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  }
  return `${minutes}m ${secs}s`
}

function formatPace(speedKmh: number) {
  if (speedKmh <= 0) return '-'
  const paceMinPerKm = 60 / speedKmh
  const minutes = Math.floor(paceMinPerKm)
  const seconds = Math.round((paceMinPerKm - minutes) * 60)
  return `${minutes}'${seconds.toString().padStart(2, '0')}"`
}

export default function ActivityPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActivity() {
      try {
        const response = await fetch(`/api/strava/activity/${params.id}`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        } else {
          setError('Activité non trouvée')
        }
      } catch {
        setError('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchActivity()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-bg-card rounded" />
          <div className="h-64 bg-bg-card rounded-2xl" />
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
          <p className="text-red-400 font-mono mb-4">{error || 'Erreur'}</p>
          <Link href="/sport" className="text-neon-orange hover:underline font-mono">
            &lt; Retour
          </Link>
        </div>
      </div>
    )
  }

  const { activity, streams, laps } = data
  const routePoints = activity.polyline ? decodePolyline(activity.polyline) : streams?.latlng || []

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/sport"
          className="inline-flex items-center gap-2 text-sm font-mono text-text-muted hover:text-neon-orange transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux activités
        </Link>

        <div className="flex items-center gap-4">
          <div className="p-3 bg-bg-card border border-neon-orange/30 rounded-lg">
            <Activity className="w-8 h-8 text-neon-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
              {activity.name}
            </h1>
            <p className="text-xs font-mono text-neon-cyan/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full" />
              {new Date(activity.startDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })} à {new Date(activity.startDate).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Map */}
      {routePoints.length > 0 && (
        <div className="tech-card p-4 mb-8 border-neon-orange/30">
          <div className="relative h-80 rounded-lg overflow-hidden bg-bg-primary">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(...routePoints.map(p => p[1])) - 0.01},${Math.min(...routePoints.map(p => p[0])) - 0.01},${Math.max(...routePoints.map(p => p[1])) + 0.01},${Math.max(...routePoints.map(p => p[0])) + 0.01}&layer=mapnik&marker=${routePoints[0][0]},${routePoints[0][1]}`}
              className="rounded-lg"
            />
            <div className="absolute bottom-2 right-2">
              <a
                href={`https://www.strava.com/activities/${activity.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono bg-bg-card/90 px-2 py-1 rounded text-neon-orange hover:bg-bg-card transition-colors"
              >
                Voir sur Strava →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Distance"
          value={`${activity.distance.toFixed(2)} km`}
          icon={Route}
          color="orange"
        />
        <StatCard
          label="Durée"
          value={formatDuration(activity.movingTime)}
          icon={Timer}
          color="cyan"
        />
        <StatCard
          label="Allure moyenne"
          value={formatPace(activity.averageSpeed)}
          icon={Zap}
          color="green"
        />
        <StatCard
          label="Dénivelé"
          value={`${Math.round(activity.totalElevationGain)} m`}
          icon={Mountain}
          color="magenta"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {activity.averageHeartrate && (
          <StatCard
            label="FC moyenne"
            value={`${Math.round(activity.averageHeartrate)} bpm`}
            icon={Heart}
            color="red"
          />
        )}
        {activity.maxHeartrate && (
          <StatCard
            label="FC max"
            value={`${Math.round(activity.maxHeartrate)} bpm`}
            icon={Heart}
            color="red"
          />
        )}
        {activity.calories && (
          <StatCard
            label="Calories"
            value={`${activity.calories} kcal`}
            icon={Flame}
            color="yellow"
          />
        )}
        <StatCard
          label="Vitesse max"
          value={`${activity.maxSpeed.toFixed(1)} km/h`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Laps / Splits */}
      {laps.length > 0 && (
        <div className="tech-card p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
              <Clock className="w-5 h-5 text-neon-cyan" />
            </div>
            <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
              Splits_Par_Kilomètre
            </h3>
          </div>
          <div className="space-y-2">
            {laps.map((lap, index) => {
              const pace = formatPace(lap.averageSpeed)
              const fastestPace = Math.max(...laps.map(l => l.averageSpeed))
              const isFastest = lap.averageSpeed === fastestPace
              return (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                    isFastest
                      ? 'bg-neon-green/10 border-neon-green/30'
                      : 'bg-bg-primary border-border-subtle'
                  }`}
                >
                  <span className={`w-8 text-center font-mono font-bold ${
                    isFastest ? 'text-neon-green' : 'text-text-muted'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 bg-bg-card rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isFastest ? 'bg-neon-green' : 'bg-neon-orange/50'
                        }`}
                        style={{ width: `${(lap.averageSpeed / fastestPace) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className={`font-mono font-semibold w-20 text-right ${
                    isFastest ? 'text-neon-green' : 'text-text-primary'
                  }`}>
                    {pace}
                  </span>
                  {lap.averageHeartrate && (
                    <span className="font-mono text-sm text-neon-red/70 w-16 text-right">
                      {Math.round(lap.averageHeartrate)} bpm
                    </span>
                  )}
                  {lap.totalElevationGain > 0 && (
                    <span className="font-mono text-sm text-neon-cyan/70 w-16 text-right">
                      +{Math.round(lap.totalElevationGain)}m
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Elevation Profile */}
      {streams?.altitude && streams.altitude.length > 0 && (
        <div className="tech-card p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neon-green/10 border border-neon-green/30 rounded">
              <Mountain className="w-5 h-5 text-neon-green" />
            </div>
            <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
              Profil_Altitude
            </h3>
          </div>
          <div className="flex gap-3">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between h-32 text-xs font-mono text-text-muted py-1">
              <span className="text-neon-green">{Math.round(Math.max(...streams.altitude))}m</span>
              <span>{Math.round((Math.max(...streams.altitude) + Math.min(...streams.altitude)) / 2)}m</span>
              <span>{Math.round(Math.min(...streams.altitude))}m</span>
            </div>
            {/* Chart */}
            <div className="flex-1 h-32 flex items-end gap-px">
              {(() => {
                const altitudes = streams.altitude
                const minAlt = Math.min(...altitudes)
                const maxAlt = Math.max(...altitudes)
                const range = maxAlt - minAlt || 1
                const step = Math.max(1, Math.floor(altitudes.length / 100))
                const sampled = altitudes.filter((_, i) => i % step === 0)

                return sampled.map((alt, i) => {
                  const height = ((alt - minAlt) / range) * 100
                  return (
                    <div
                      key={i}
                      className="group relative flex-1 bg-gradient-to-t from-neon-green/30 to-neon-green/70 rounded-t transition-all duration-150 hover:from-neon-green/50 hover:to-neon-green hover:scale-x-150 hover:z-10 cursor-crosshair"
                      style={{ height: `${Math.max(5, height)}%` }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-bg-card border border-neon-green/50 rounded text-xs font-mono text-neon-green whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                        {Math.round(alt)}m
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
          <div className="flex justify-between mt-2 ml-12 text-xs font-mono text-text-muted">
            <span>0 km</span>
            <span>{activity.distance.toFixed(1)} km</span>
          </div>
        </div>
      )}

      {/* Heart Rate Profile */}
      {streams?.heartrate && streams.heartrate.length > 0 && (
        <div className="tech-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neon-red/10 border border-neon-red/30 rounded">
              <Heart className="w-5 h-5 text-neon-red" />
            </div>
            <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
              Fréquence_Cardiaque
            </h3>
          </div>
          <div className="flex gap-3">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between h-32 text-xs font-mono text-text-muted py-1">
              <span className="text-neon-red">{Math.round(Math.max(...streams.heartrate))}</span>
              <span>{Math.round((Math.max(...streams.heartrate) + Math.min(...streams.heartrate)) / 2)}</span>
              <span>{Math.round(Math.min(...streams.heartrate))}</span>
            </div>
            {/* Chart */}
            <div className="flex-1 h-32 flex items-end gap-px">
              {(() => {
                const hrs = streams.heartrate
                const minHr = Math.min(...hrs)
                const maxHr = Math.max(...hrs)
                const range = maxHr - minHr || 1
                const step = Math.max(1, Math.floor(hrs.length / 100))
                const sampled = hrs.filter((_, i) => i % step === 0)

                return sampled.map((hr, i) => {
                  const height = ((hr - minHr) / range) * 100
                  return (
                    <div
                      key={i}
                      className="group relative flex-1 bg-gradient-to-t from-neon-red/30 to-neon-red/70 rounded-t transition-all duration-150 hover:from-neon-red/50 hover:to-neon-red hover:scale-x-150 hover:z-10 cursor-crosshair"
                      style={{ height: `${Math.max(5, height)}%` }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-bg-card border border-neon-red/50 rounded text-xs font-mono text-neon-red whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                        {Math.round(hr)} bpm
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
          <div className="flex justify-between mt-2 ml-8 text-xs font-mono text-text-muted">
            <span>Début</span>
            <span>Fin</span>
          </div>
        </div>
      )}
    </div>
  )
}

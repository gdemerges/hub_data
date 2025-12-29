'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Terminal, Activity, Timer, Route, Flame, TrendingUp, Calendar, Award, Mountain, Bike, Footprints } from 'lucide-react'
import { StatCard } from '@/components'

interface StravaAthlete {
  id: number
  username: string
  firstname: string
  lastname: string
  profile: string
  city: string
  country: string
}

interface StravaStats {
  totalRides: number
  totalRuns: number
  totalSwims: number
  totalDistance: number // in km
  totalTime: number // in hours
  totalElevation: number // in meters
  thisYearDistance: number
  thisYearTime: number
  thisYearActivities: number
}

interface RecentActivity {
  id: number
  name: string
  type: string
  distance: number // in km
  movingTime: number // in minutes
  totalElevationGain: number
  startDate: string
  averageSpeed: number // in km/h
}

interface StravaData {
  athlete: StravaAthlete
  stats: StravaStats
  recentActivities: RecentActivity[]
  yearlyStats: { year: number; distance: number; activities: number }[]
}

export default function SportPage() {
  const [data, setData] = useState<StravaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/strava')
        if (response.ok) {
          const result = await response.json()
          setData(result)
          setIsConnected(true)
        } else if (response.status === 401) {
          setIsConnected(false)
        } else {
          setError('Erreur lors du chargement des données')
        }
      } catch (err) {
        setError('Impossible de se connecter à Strava')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleConnect = () => {
    window.location.href = '/api/strava/auth'
  }

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ride':
        return <Bike className="w-4 h-4" />
      case 'run':
        return <Footprints className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-bg-card border border-neon-orange/30 rounded-lg">
              <Terminal className="w-8 h-8 text-neon-orange" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
                <span className="text-neon-orange">STRAVA</span>_SYSTEM
              </h1>
              <p className="text-xs font-mono text-neon-cyan/70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
                STATUS: LOADING // FITNESS_TRACKER v1.0
              </p>
            </div>
          </div>
          <div className="font-mono text-sm text-text-secondary border-l-2 border-neon-orange/30 pl-4">
            &gt; Connecting to Strava API...
            <span className="text-neon-orange animate-pulse">_</span>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-bg-card rounded-2xl border border-border-subtle" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-bg-card rounded-2xl border border-border-subtle" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-bg-card border border-neon-orange/30 rounded-lg">
            <Terminal className="w-8 h-8 text-neon-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
              <span className="text-neon-orange">STRAVA</span>_SYSTEM
            </h1>
            <p className="text-xs font-mono text-neon-cyan/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
              STATUS: {isConnected ? 'CONNECTED' : 'DISCONNECTED'} // FITNESS_TRACKER v1.0
            </p>
          </div>
        </div>
        <div className="font-mono text-sm text-text-secondary border-l-2 border-neon-orange/30 pl-4">
          &gt; {isConnected ? 'Loading athlete performance data...' : 'Awaiting Strava authentication...'}
          <span className="text-neon-orange animate-pulse">_</span>
        </div>
      </div>

      {!isConnected ? (
        /* Not connected - Show connect button */
        <div className="tech-card p-8 border-neon-orange/30">
          <div className="text-center max-w-xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neon-orange/10 border border-neon-orange/30 flex items-center justify-center">
              <Activity className="w-10 h-10 text-neon-orange" />
            </div>
            <h2 className="text-xl font-display font-bold text-text-primary mb-4 tracking-wider">
              AUTHENTICATION_REQUIRED
            </h2>
            <p className="text-text-secondary mb-8 font-mono text-sm leading-relaxed">
              Connecte ton compte Strava pour voir tes statistiques sportives,
              tes activités récentes et ton évolution.
            </p>

            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#FC4C02]/10 border border-[#FC4C02]/30 rounded-lg text-[#FC4C02] font-mono hover:bg-[#FC4C02]/20 hover:border-[#FC4C02]/50 transition-all duration-300 group"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.01 13.828h4.169"/>
              </svg>
              <span>CONNECT_STRAVA</span>
              <span className="group-hover:translate-x-1 transition-transform">&gt;</span>
            </button>

            <p className="text-xs text-text-muted mt-6 font-mono">
              Powered by Strava API // OAuth2 Authentication
            </p>
          </div>
        </div>
      ) : data && (
        /* Connected - Show data */
        <>
          {/* Athlete Profile */}
          <div className="tech-card p-6 mb-8 border-neon-orange/30 hover:border-neon-orange/60 transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="relative">
                <Image
                  src={data.athlete.profile}
                  alt={data.athlete.firstname}
                  width={120}
                  height={120}
                  className="rounded-lg ring-2 ring-neon-orange/30"
                />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#FC4C02] rounded-full border-2 border-bg-primary flex items-center justify-center">
                  <Activity className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-display font-bold text-text-primary tracking-wider">
                  {data.athlete.firstname} {data.athlete.lastname}
                </h2>
                <p className="text-sm font-mono text-neon-orange/70 mt-1">@{data.athlete.username}</p>
                {(data.athlete.city || data.athlete.country) && (
                  <p className="text-sm text-text-muted font-mono mt-2">
                    {[data.athlete.city, data.athlete.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Distance (vélo + course)"
              value={`${Math.round(data.stats.totalDistance)} km`}
              icon={Route}
              color="orange"
            />
            <StatCard
              label="Temps total"
              value={`${Math.round(data.stats.totalTime)}h`}
              icon={Timer}
              color="cyan"
            />
            <StatCard
              label="Dénivelé total"
              value={`${Math.round(data.stats.totalElevation)} m`}
              icon={Mountain}
              color="green"
            />
            <StatCard
              label="Activités"
              value={data.stats.totalRides + data.stats.totalRuns}
              icon={Flame}
              color="magenta"
            />
          </div>

          {/* This Year Stats */}
          <div className="tech-card p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
                <Calendar className="w-5 h-5 text-neon-cyan" />
              </div>
              <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                This_Year_Stats
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-mono font-bold text-neon-cyan">
                  {Math.round(data.stats.thisYearDistance)}
                </p>
                <p className="text-xs font-mono text-text-muted mt-1">km parcourus</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-mono font-bold text-neon-magenta">
                  {Math.round(data.stats.thisYearTime)}
                </p>
                <p className="text-xs font-mono text-text-muted mt-1">heures d'activité</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-mono font-bold text-neon-green">
                  {data.stats.thisYearActivities}
                </p>
                <p className="text-xs font-mono text-text-muted mt-1">activités</p>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="tech-card p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-neon-magenta/10 border border-neon-magenta/30 rounded">
                <Activity className="w-5 h-5 text-neon-magenta" />
              </div>
              <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                Recent_Activities
              </h3>
            </div>
            <div className="space-y-3">
              {data.recentActivities.slice(0, 8).map((activity) => (
                <div
                  key={activity.id}
                  className="group flex items-center gap-4 p-4 bg-bg-primary border border-border-subtle rounded-lg hover:border-neon-magenta/50 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-neon-magenta/10 border border-neon-magenta/30 flex items-center justify-center text-neon-magenta">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-text-primary truncate group-hover:text-neon-magenta transition-colors">
                      {activity.name}
                    </h4>
                    <p className="text-xs font-mono text-text-muted">
                      {new Date(activity.startDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <p className="text-neon-cyan">{activity.distance.toFixed(1)} km</p>
                      <p className="text-text-muted">{formatDuration(activity.movingTime)}</p>
                    </div>
                    {activity.totalElevationGain > 0 && (
                      <div className="text-right">
                        <p className="text-neon-green">+{Math.round(activity.totalElevationGain)} m</p>
                        <p className="text-text-muted">{activity.averageSpeed.toFixed(1)} km/h</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Yearly Evolution */}
          {data.yearlyStats.length > 0 && (
            <div className="tech-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-neon-green/10 border border-neon-green/30 rounded">
                  <TrendingUp className="w-5 h-5 text-neon-green" />
                </div>
                <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                  Yearly_Distance
                </h3>
              </div>
              <div className="flex items-end gap-2 h-40">
                {data.yearlyStats.map((year) => {
                  const maxDistance = Math.max(...data.yearlyStats.map(y => y.distance))
                  const height = (year.distance / maxDistance) * 100
                  return (
                    <div key={year.year} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-neon-orange/50 to-neon-orange rounded-t transition-all hover:from-neon-orange/70 hover:to-neon-orange"
                        style={{ height: `${height}%`, minHeight: year.distance > 0 ? '4px' : '0' }}
                        title={`${Math.round(year.distance)} km`}
                      />
                      <span className="text-xs font-mono text-text-muted">
                        {year.year.toString().slice(-2)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="tech-card p-6 border-red-500/30">
          <p className="text-red-400 font-mono text-sm">&gt; ERROR: {error}</p>
        </div>
      )}
    </div>
  )
}

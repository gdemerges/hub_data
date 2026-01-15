'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Terminal, Activity, Timer, Route, Flame, TrendingUp, Calendar, Award, Mountain, Bike, Footprints, AlertTriangle, Target, Zap, CheckCircle, TrendingDown, Disc } from 'lucide-react'
import { StatCard, FitnessChart, RacePredictor, RecoveryAdvisor, HeartRateZones } from '@/components'
import { calculateFitnessMetrics, predictRaceTimes, analyzeRecovery, calculateTimeToTarget, calculateLTHR } from '@/lib/fitness-calculator'

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

const ACTIVITY_FILTERS = [
  { key: 'all', label: 'Tout', icon: Activity },
  { key: 'Run', label: 'Course', icon: Footprints },
  { key: 'Ride', label: 'Vélo', icon: Bike },
  { key: 'RPM', label: 'RPM', icon: Disc },
]

// Helper function to filter activities
function filterActivity(activity: { type: string; name: string }, filter: string): boolean {
  if (filter === 'all') return true
  if (filter === 'RPM') return activity.name.toUpperCase().includes('RPM')
  if (filter === 'Ride') return activity.type === 'Ride' && !activity.name.toUpperCase().includes('RPM')
  return activity.type === filter
}

export default function SportPage() {
  const [data, setData] = useState<StravaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activityFilter, setActivityFilter] = useState<string>('Run')
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

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

          {/* Global Filter */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {ACTIVITY_FILTERS.map((filter) => {
              const Icon = filter.icon
              const isActive = activityFilter === filter.key
              return (
                <button
                  key={filter.key}
                  onClick={() => setActivityFilter(filter.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all duration-300 border ${
                    isActive
                      ? 'bg-neon-orange/20 border-neon-orange/50 text-neon-orange shadow-[0_0_15px_rgba(255,136,0,0.2)]'
                      : 'bg-bg-card border-border-subtle text-text-muted hover:border-neon-orange/30 hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{filter.label}</span>
                </button>
              )
            })}
          </div>

          {/* Stats - calculated from filtered activities */}
          {(() => {
            const filteredActivities = data.recentActivities.filter(
              (a) => filterActivity(a, activityFilter)
            )
            const totalDistance = filteredActivities.reduce((sum, a) => sum + a.distance, 0)
            const totalTime = filteredActivities.reduce((sum, a) => sum + a.movingTime, 0) / 60 // hours
            const totalElevation = filteredActivities.reduce((sum, a) => sum + a.totalElevationGain, 0)
            const totalActivities = filteredActivities.length

            // Get available years from activities
            const availableYears = Array.from(
              new Set(filteredActivities.map((a) => new Date(a.startDate).getFullYear()))
            ).sort((a, b) => b - a) // Most recent first

            const thisYearActivities = filteredActivities.filter(
              (a) => new Date(a.startDate).getFullYear() === selectedYear
            )
            const thisYearDistance = thisYearActivities.reduce((sum, a) => sum + a.distance, 0)
            const thisYearTime = thisYearActivities.reduce((sum, a) => sum + a.movingTime, 0) / 60
            const thisYearCount = thisYearActivities.length

            const filterLabel = activityFilter === 'all' ? 'Total' : activityFilter === 'Run' ? 'Course' : activityFilter === 'RPM' ? 'RPM' : 'Vélo'

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard
                    label={`Distance (${filterLabel})`}
                    value={`${Math.round(totalDistance)} km`}
                    icon={Route}
                    color="orange"
                  />
                  <StatCard
                    label="Temps total"
                    value={`${Math.round(totalTime)}h`}
                    icon={Timer}
                    color="cyan"
                  />
                  <StatCard
                    label="Dénivelé total"
                    value={`${Math.round(totalElevation)} m`}
                    icon={Mountain}
                    color="green"
                  />
                  <StatCard
                    label="Activités"
                    value={totalActivities}
                    icon={Flame}
                    color="magenta"
                  />
                </div>

                {/* This Year Stats */}
                <div className="tech-card p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
                        <Calendar className="w-5 h-5 text-neon-cyan" />
                      </div>
                      <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                        Year_Stats ({filterLabel})
                      </h3>
                    </div>
                    {/* Year selector */}
                    <div className="flex items-center gap-2">
                      {availableYears.map((year) => (
                        <button
                          key={year}
                          onClick={() => setSelectedYear(year)}
                          className={`px-3 py-1 rounded font-mono text-sm transition-all duration-300 border ${
                            selectedYear === year
                              ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.2)]'
                              : 'bg-bg-card border-border-subtle text-text-muted hover:border-neon-cyan/30 hover:text-text-primary'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-mono font-bold text-neon-cyan">
                        {Math.round(thisYearDistance)}
                      </p>
                      <p className="text-xs font-mono text-text-muted mt-1">km parcourus</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-mono font-bold text-neon-magenta">
                        {Math.round(thisYearTime)}
                      </p>
                      <p className="text-xs font-mono text-text-muted mt-1">heures d'activité</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-mono font-bold text-neon-green">
                        {thisYearCount}
                      </p>
                      <p className="text-xs font-mono text-text-muted mt-1">activités</p>
                    </div>
                  </div>
                </div>
              </>
            )
          })()}

          {/* Training Analysis - Only for running */}
          {activityFilter === 'Run' && (() => {
            const runs = data.recentActivities.filter((a) => a.type === 'Run')

            // Helper function to get week number
            const getWeekStart = (date: Date) => {
              const d = new Date(date)
              d.setHours(0, 0, 0, 0)
              d.setDate(d.getDate() - d.getDay() + 1) // Monday
              return d.getTime()
            }

            // Group runs by week
            const weeklyData = new Map<number, { distance: number; runs: number; dates: Date[] }>()
            for (const run of runs) {
              const runDate = new Date(run.startDate)
              const weekStart = getWeekStart(runDate)
              const existing = weeklyData.get(weekStart) || { distance: 0, runs: 0, dates: [] }
              existing.distance += run.distance
              existing.runs++
              existing.dates.push(runDate)
              weeklyData.set(weekStart, existing)
            }

            // Sort weeks and get last 8 weeks
            const sortedWeeks = Array.from(weeklyData.entries())
              .sort((a, b) => b[0] - a[0])
              .slice(0, 8)

            const currentWeek = sortedWeeks[0]
            const lastWeek = sortedWeeks[1]
            const last4Weeks = sortedWeeks.slice(1, 5)

            // Calculate averages
            const avgDistance4Weeks = last4Weeks.length > 0
              ? last4Weeks.reduce((sum, [, data]) => sum + data.distance, 0) / last4Weeks.length
              : 0

            const avgRunsPerWeek = last4Weeks.length > 0
              ? last4Weeks.reduce((sum, [, data]) => sum + data.runs, 0) / last4Weeks.length
              : 0

            // Current week stats
            const currentWeekDistance = currentWeek ? currentWeek[1].distance : 0
            const currentWeekRuns = currentWeek ? currentWeek[1].runs : 0
            const lastWeekDistance = lastWeek ? lastWeek[1].distance : 0

            // Calculate increase percentage
            const increaseFromLastWeek = lastWeekDistance > 0
              ? ((currentWeekDistance - lastWeekDistance) / lastWeekDistance) * 100
              : 0

            const increaseFromAvg = avgDistance4Weeks > 0
              ? ((currentWeekDistance - avgDistance4Weeks) / avgDistance4Weeks) * 100
              : 0

            // Longest run this week vs average
            const longestRunThisWeek = runs
              .filter((r) => currentWeek && getWeekStart(new Date(r.startDate)) === currentWeek[0])
              .reduce((max, r) => Math.max(max, r.distance), 0)

            const avgLongestRun = last4Weeks.length > 0
              ? last4Weeks.reduce((sum, [weekStart]) => {
                  const weekRuns = runs.filter((r) => getWeekStart(new Date(r.startDate)) === weekStart)
                  return sum + Math.max(...weekRuns.map((r) => r.distance), 0)
                }, 0) / last4Weeks.length
              : 0

            // Alerts
            const alerts: { type: 'warning' | 'danger' | 'success'; message: string }[] = []

            if (increaseFromLastWeek > 10) {
              alerts.push({
                type: increaseFromLastWeek > 20 ? 'danger' : 'warning',
                message: `Volume en hausse de ${Math.round(increaseFromLastWeek)}% vs semaine dernière (règle des 10%)`
              })
            }

            if (increaseFromAvg > 15) {
              alerts.push({
                type: increaseFromAvg > 25 ? 'danger' : 'warning',
                message: `Volume ${Math.round(increaseFromAvg)}% au-dessus de ta moyenne des 4 dernières semaines`
              })
            }

            if (longestRunThisWeek > avgLongestRun * 1.2 && avgLongestRun > 0) {
              const increase = ((longestRunThisWeek - avgLongestRun) / avgLongestRun) * 100
              alerts.push({
                type: increase > 30 ? 'danger' : 'warning',
                message: `Sortie longue de ${longestRunThisWeek.toFixed(1)}km (+${Math.round(increase)}% vs moyenne)`
              })
            }

            if (alerts.length === 0 && currentWeekDistance > 0) {
              alerts.push({
                type: 'success',
                message: 'Charge d\'entraînement équilibrée, continue comme ça !'
              })
            }

            // Predictions
            const predictedWeeklyDistance = avgDistance4Weeks * 1.05 // 5% increase recommendation
            const predictedMonthlyDistance = avgDistance4Weeks * 4
            const recommendedLongRun = avgLongestRun * 1.1 // 10% increase max

            // Days since last run
            const lastRun = runs[0]
            const daysSinceLastRun = lastRun
              ? Math.floor((Date.now() - new Date(lastRun.startDate).getTime()) / (1000 * 60 * 60 * 24))
              : null

            return (
              <div className="tech-card p-6 mb-8 border-neon-cyan/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
                    <Target className="w-5 h-5 text-neon-cyan" />
                  </div>
                  <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                    Training_Analysis
                  </h3>
                </div>

                {/* Alerts */}
                {alerts.length > 0 && (
                  <div className="space-y-2 mb-6">
                    {alerts.map((alert, i) => (
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

                {/* Weekly comparison */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-bg-primary p-4 rounded-lg border border-border-subtle">
                    <p className="text-xs font-mono text-text-muted mb-1">Cette semaine</p>
                    <p className="text-2xl font-mono font-bold text-neon-cyan">
                      {currentWeekDistance.toFixed(1)} km
                    </p>
                    <p className="text-xs font-mono text-text-muted">{currentWeekRuns} sortie(s)</p>
                  </div>
                  <div className="bg-bg-primary p-4 rounded-lg border border-border-subtle">
                    <p className="text-xs font-mono text-text-muted mb-1">Semaine dernière</p>
                    <p className="text-2xl font-mono font-bold text-text-primary">
                      {lastWeekDistance.toFixed(1)} km
                    </p>
                    {increaseFromLastWeek !== 0 && (
                      <p className={`text-xs font-mono flex items-center gap-1 ${
                        increaseFromLastWeek > 10 ? 'text-neon-yellow' : 'text-neon-green'
                      }`}>
                        {increaseFromLastWeek > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {increaseFromLastWeek > 0 ? '+' : ''}{Math.round(increaseFromLastWeek)}%
                      </p>
                    )}
                  </div>
                  <div className="bg-bg-primary p-4 rounded-lg border border-border-subtle">
                    <p className="text-xs font-mono text-text-muted mb-1">Moyenne (4 sem.)</p>
                    <p className="text-2xl font-mono font-bold text-text-primary">
                      {avgDistance4Weeks.toFixed(1)} km
                    </p>
                    <p className="text-xs font-mono text-text-muted">{avgRunsPerWeek.toFixed(1)} sortie(s)/sem</p>
                  </div>
                  <div className="bg-bg-primary p-4 rounded-lg border border-border-subtle">
                    <p className="text-xs font-mono text-text-muted mb-1">Dernière sortie</p>
                    <p className="text-2xl font-mono font-bold text-text-primary">
                      {daysSinceLastRun !== null ? (
                        daysSinceLastRun === 0 ? "Aujourd'hui" : `Il y a ${daysSinceLastRun}j`
                      ) : '-'}
                    </p>
                    {lastRun && (
                      <p className="text-xs font-mono text-text-muted">{lastRun.distance.toFixed(1)} km</p>
                    )}
                  </div>
                </div>

                {/* Predictions & Recommendations */}
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
                        {predictedWeeklyDistance.toFixed(0)} km
                      </p>
                      <p className="text-xs font-mono text-text-muted mt-1">
                        +5% progressif recommandé
                      </p>
                    </div>
                    <div className="bg-bg-primary p-4 rounded-lg border border-neon-magenta/20">
                      <p className="text-xs font-mono text-neon-magenta mb-2">Sortie longue max</p>
                      <p className="text-xl font-mono font-bold text-text-primary">
                        {recommendedLongRun.toFixed(1)} km
                      </p>
                      <p className="text-xs font-mono text-text-muted mt-1">
                        +10% vs moyenne ({avgLongestRun.toFixed(1)} km)
                      </p>
                    </div>
                    <div className="bg-bg-primary p-4 rounded-lg border border-neon-cyan/20">
                      <p className="text-xs font-mono text-neon-cyan mb-2">Projection mensuelle</p>
                      <p className="text-xl font-mono font-bold text-text-primary">
                        {predictedMonthlyDistance.toFixed(0)} km
                      </p>
                      <p className="text-xs font-mono text-text-muted mt-1">
                        Sur base du rythme actuel
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

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
              {data.recentActivities
                .filter((activity) => filterActivity(activity, activityFilter))
                .slice(0, 10)
                .map((activity) => (
                <a
                  key={activity.id}
                  href={`/sport/activity/${activity.id}`}
                  className="group flex items-center gap-4 p-4 bg-bg-primary border border-border-subtle rounded-lg hover:border-neon-magenta/50 hover:bg-neon-magenta/5 transition-all duration-300 cursor-pointer"
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
                </a>
              ))}
            </div>
          </div>

          {/* Yearly Evolution */}
          {(() => {
            const filteredActivities = data.recentActivities.filter(
              (a) => filterActivity(a, activityFilter)
            )

            // For RPM, calculate hours; for others, calculate distance
            const isRPM = activityFilter === 'RPM'
            const yearlyMap = new Map<number, number>()
            for (const activity of filteredActivities) {
              const year = new Date(activity.startDate).getFullYear()
              const value = isRPM ? activity.movingTime / 60 : activity.distance // hours or km
              yearlyMap.set(year, (yearlyMap.get(year) || 0) + value)
            }

            const yearlyStats = Array.from(yearlyMap.entries())
              .map(([year, value]) => ({ year, value }))
              .sort((a, b) => a.year - b.year)

            const filterLabel = activityFilter === 'all' ? 'Total' : activityFilter === 'Run' ? 'Course' : activityFilter === 'RPM' ? 'RPM' : 'Vélo'
            const metricLabel = isRPM ? 'Yearly_Hours' : 'Yearly_Distance'
            const unit = isRPM ? 'h' : 'km'

            if (yearlyStats.length === 0) return null

            return (
              <div className="tech-card p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-neon-green/10 border border-neon-green/30 rounded">
                    <TrendingUp className="w-5 h-5 text-neon-green" />
                  </div>
                  <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                    {metricLabel} ({filterLabel})
                  </h3>
                </div>
                <div className="flex items-end justify-center gap-8 h-48">
                  {yearlyStats.map((year) => {
                    const maxValue = Math.max(...yearlyStats.map(y => y.value))
                    const height = maxValue > 0 ? (year.value / maxValue) * 100 : 0
                    return (
                      <div key={year.year} className="flex flex-col items-center gap-2 w-24">
                        <span className="text-sm font-mono font-bold text-neon-orange">
                          {Math.round(year.value)} {unit}
                        </span>
                        <div className="w-full h-32 flex items-end">
                          <div
                            className="w-full bg-gradient-to-t from-neon-orange/50 to-neon-orange rounded-t transition-all hover:from-neon-orange/70 hover:to-neon-orange"
                            style={{ height: `${height}%`, minHeight: year.value > 0 ? '8px' : '0' }}
                          />
                        </div>
                        <span className="text-sm font-mono font-semibold text-text-primary">
                          {year.year}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* AI/ML Features Section */}
          <div className="mb-6 border-t-2 border-neon-cyan/20 pt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
                <Zap className="w-6 h-6 text-neon-cyan" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold tracking-wider text-text-primary">
                  <span className="text-neon-cyan">AI</span>_PERFORMANCE_ANALYSIS
                </h2>
                <p className="text-xs font-mono text-neon-cyan/70">
                  Analyse avancée avec Machine Learning
                </p>
              </div>
            </div>
          </div>

          {/* Recovery Advisor - Only for Run filter */}
          {activityFilter === 'Run' && (() => {
            try {
              const runs = data.recentActivities.filter((a) => a.type === 'Run')
              if (runs.length === 0) return null
              const recoveryAdvice = analyzeRecovery(runs)
              return (
                <div className="mb-8">
                  <RecoveryAdvisor advice={recoveryAdvice} />
                </div>
              )
            } catch (error) {
              console.error('Recovery Advisor error:', error)
              return null
            }
          })()}

          {/* Heart Rate Zones - Only for Run filter */}
          {activityFilter === 'Run' && (() => {
            try {
              const runs = data.recentActivities.filter((a) => a.type === 'Run')
              if (runs.length === 0) return null
              const lthr = calculateLTHR(runs)
              return (
                <div className="mb-8">
                  <HeartRateZones activities={runs} lthr={lthr} />
                </div>
              )
            } catch (error) {
              console.error('Heart Rate Zones error:', error)
              return null
            }
          })()}

          {/* Fitness Metrics (CTL/ATL/TSB) */}
          {(() => {
            try {
              const allActivities = data.recentActivities
              if (!allActivities || allActivities.length === 0) return null
              const fitnessMetrics = calculateFitnessMetrics(allActivities)
              return (
                <div className="mb-8">
                  <FitnessChart data={fitnessMetrics} />
                </div>
              )
            } catch (error) {
              console.error('Fitness Metrics error:', error)
              return null
            }
          })()}

          {/* Race Predictor - Only for Run filter */}
          {activityFilter === 'Run' && (() => {
            try {
              const runs = data.recentActivities.filter((a) => a.type === 'Run')
              if (runs.length === 0) return null
              let predictions = predictRaceTimes(runs)

              // Add timeToTarget for predictions with goals
              predictions = predictions.map(pred => {
                try {
                  const goal = typeof window !== 'undefined'
                    ? JSON.parse(localStorage.getItem('training-goals') || '[]').find((g: any) => g.distance === pred.distance)
                    : null

                  if (goal && pred.predictedTime > goal.targetTime) {
                    return {
                      ...pred,
                      targetTime: goal.targetTime,
                      timeToTarget: calculateTimeToTarget(pred.predictedTime, goal.targetTime, runs)
                    }
                  }
                } catch (e) {
                  console.error('Goal parsing error:', e)
                }
                return pred
              })

              return <RacePredictor predictions={predictions} />
            } catch (error) {
              console.error('Race Predictor error:', error)
              return null
            }
          })()}
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

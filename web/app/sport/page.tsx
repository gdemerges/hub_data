'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PersonSimpleRun } from '@phosphor-icons/react/dist/ssr'
import { useApiData } from '@/lib/use-api-data'
import {
  Activity,
  Timer,
  Route,
  Flame,
  TrendingUp,
  Calendar,
  Mountain,
  Bike,
  Footprints,
  Disc,
  Zap,
} from 'lucide-react'
import {
  StatCard,
  PageHeader,
  SportTrainingAnalysis,
  SportAiPanels,
} from '@/components'
import {
  SportActivity,
  ActivityFilterKey,
  filterActivity,
  filterLabel,
  formatDuration,
  aggregateStats,
  availableYears,
  yearlyStats,
} from '@/lib/sport'

interface StravaAthlete {
  id: number
  username: string
  firstname: string
  lastname: string
  profile: string
  city: string
  country: string
}

interface StravaData {
  athlete: StravaAthlete
  stats: unknown
  recentActivities: SportActivity[]
  yearlyStats: { year: number; distance: number; activities: number }[]
}

const ACTIVITY_FILTERS: { key: ActivityFilterKey; label: string; icon: typeof Activity }[] = [
  { key: 'all', label: 'Tout', icon: Activity },
  { key: 'Run', label: 'Course', icon: Footprints },
  { key: 'Ride', label: 'Vélo', icon: Bike },
  { key: 'RPM', label: 'RPM', icon: Disc },
]

function getActivityIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'ride':
      return <Bike className="w-4 h-4" />
    case 'run':
      return <Footprints className="w-4 h-4" />
    default:
      return <Activity className="w-4 h-4" />
  }
}

export default function SportPage() {
  const [activityFilter, setActivityFilter] = useState<ActivityFilterKey>('Run')
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  const { data, loading, error: fetchError, status } = useApiData<StravaData>(
    '/api/strava',
    { errorMessage: 'Impossible de se connecter à Strava' }
  )
  const isConnected = data !== null
  const error = fetchError ?? (status !== null && status !== 401 && status !== 200 ? 'Erreur lors du chargement des données' : null)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <PageHeader
          title="Sport"
          subtitle="Connexion à Strava…"
          color="rust"
          icon={PersonSimpleRun}
        />
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

  const filtered = data?.recentActivities.filter((a) => filterActivity(a, activityFilter)) ?? []
  const stats = aggregateStats(filtered)
  const years = availableYears(filtered)
  const yearActivities = filtered.filter(
    (a) => new Date(a.startDate).getFullYear() === selectedYear
  )
  const yearStats = aggregateStats(yearActivities)
  const label = filterLabel(activityFilter)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="Sport"
        status={isConnected ? 'Connecté' : 'Déconnecté'}
        subtitle={isConnected ? 'Statistiques Strava' : 'Connexion Strava requise'}
        color="rust"
        icon={PersonSimpleRun}
      />

      {!isConnected ? (
        <ConnectPanel />
      ) : (
        data && (
          <>
            <AthleteCard athlete={data.athlete} />

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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label={`Distance (${label})`} value={`${Math.round(stats.totalDistance)} km`} icon={Route} color="orange" />
              <StatCard label="Temps total" value={`${Math.round(stats.totalTime)}h`} icon={Timer} color="cyan" />
              <StatCard label="Dénivelé total" value={`${Math.round(stats.totalElevation)} m`} icon={Mountain} color="green" />
              <StatCard label="Activités" value={stats.totalActivities} icon={Flame} color="magenta" />
            </div>

            <YearStatsCard
              label={label}
              years={years}
              selectedYear={selectedYear}
              onSelectYear={setSelectedYear}
              distance={yearStats.totalDistance}
              time={yearStats.totalTime}
              count={yearStats.totalActivities}
            />

            {activityFilter === 'Run' && (
              <SportTrainingAnalysis runs={data.recentActivities.filter((a) => a.type === 'Run')} />
            )}

            <RecentActivities
              activities={data.recentActivities.filter((a) => filterActivity(a, activityFilter))}
            />

            <YearlyEvolution
              label={label}
              mode={activityFilter === 'RPM' ? 'hours' : 'distance'}
              stats={yearlyStats(filtered, activityFilter === 'RPM' ? 'hours' : 'distance')}
            />

            <div className="mb-8 border-t-2 border-neon-cyan/20 pt-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
                  <Zap className="w-6 h-6 text-neon-cyan" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold tracking-wider text-text-primary">
                    <span className="text-neon-cyan">AI</span>_PERFORMANCE_ANALYSIS
                  </h2>
                  <p className="text-xs font-mono text-neon-cyan/70">
                    Analyses avancées avec Machine Learning
                  </p>
                </div>
              </div>
            </div>

            <SportAiPanels
              activities={data.recentActivities}
              runOnlyMode={activityFilter === 'Run'}
            />
          </>
        )
      )}

      {error && (
        <div className="tech-card p-6 border-red-500/30">
          <p className="text-earth-clay text-sm">{error}</p>
        </div>
      )}
    </div>
  )

  function RecentActivities({ activities }: { activities: SportActivity[] }) {
    return (
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
          {activities.slice(0, 10).map((activity) => (
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
    )
  }
}

function ConnectPanel() {
  return (
    <div className="tech-card p-8 border-neon-orange/30">
      <div className="text-center max-w-xl mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neon-orange/10 border border-neon-orange/30 flex items-center justify-center">
          <Activity className="w-10 h-10 text-neon-orange" />
        </div>
        <h2 className="text-xl font-display font-bold text-text-primary mb-4 tracking-wider">
          AUTHENTICATION_REQUIRED
        </h2>
        <p className="text-text-secondary mb-8 font-mono text-sm leading-relaxed">
          Connecte ton compte Strava pour voir tes statistiques sportives, tes activités récentes
          et ton évolution.
        </p>
        <button
          onClick={() => {
            window.location.href = '/api/strava/auth'
          }}
          className="inline-flex items-center gap-3 px-8 py-4 bg-[#FC4C02]/10 border border-[#FC4C02]/30 rounded-lg text-[#FC4C02] font-mono hover:bg-[#FC4C02]/20 hover:border-[#FC4C02]/50 transition-all duration-300 group"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.01 13.828h4.169" />
          </svg>
          <span>CONNECT_STRAVA</span>
          <span className="group-hover:translate-x-1 transition-transform">&gt;</span>
        </button>
        <p className="text-xs text-text-muted mt-6 font-mono">
          Powered by Strava API // OAuth2 Authentication
        </p>
      </div>
    </div>
  )
}

function AthleteCard({ athlete }: { athlete: StravaAthlete }) {
  return (
    <div className="tech-card p-6 mb-8 border-neon-orange/30 hover:border-neon-orange/60 transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="relative">
          <Image
            src={athlete.profile}
            alt={athlete.firstname}
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
            {athlete.firstname} {athlete.lastname}
          </h2>
          <p className="text-sm font-mono text-neon-orange/70 mt-1">@{athlete.username}</p>
          {(athlete.city || athlete.country) && (
            <p className="text-sm text-text-muted font-mono mt-2">
              {[athlete.city, athlete.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function YearStatsCard({
  label,
  years,
  selectedYear,
  onSelectYear,
  distance,
  time,
  count,
}: {
  label: string
  years: number[]
  selectedYear: number
  onSelectYear: (y: number) => void
  distance: number
  time: number
  count: number
}) {
  return (
    <div className="tech-card p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
            <Calendar className="w-5 h-5 text-neon-cyan" />
          </div>
          <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Year_Stats ({label})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => onSelectYear(year)}
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
          <p className="text-3xl font-mono font-bold text-neon-cyan">{Math.round(distance)}</p>
          <p className="text-xs font-mono text-text-muted mt-1">km parcourus</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-mono font-bold text-neon-magenta">{Math.round(time)}</p>
          <p className="text-xs font-mono text-text-muted mt-1">heures d&apos;activité</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-mono font-bold text-neon-green">{count}</p>
          <p className="text-xs font-mono text-text-muted mt-1">activités</p>
        </div>
      </div>
    </div>
  )
}

function YearlyEvolution({
  label,
  mode,
  stats,
}: {
  label: string
  mode: 'distance' | 'hours'
  stats: { year: number; value: number }[]
}) {
  if (stats.length === 0) return null
  const unit = mode === 'hours' ? 'h' : 'km'
  const title = mode === 'hours' ? 'Yearly_Hours' : 'Yearly_Distance'
  const maxValue = Math.max(...stats.map((y) => y.value))

  return (
    <div className="tech-card p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-neon-green/10 border border-neon-green/30 rounded">
          <TrendingUp className="w-5 h-5 text-neon-green" />
        </div>
        <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
          {title} ({label})
        </h3>
      </div>
      <div className="flex items-end justify-center gap-8 h-48">
        {stats.map((year) => {
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
}

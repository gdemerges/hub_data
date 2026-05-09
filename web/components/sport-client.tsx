'use client'

import { use, useOptimistic } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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
import { StatCard, SportTrainingAnalysis, SportAiPanels } from '@/components'
import {
  type SportActivity,
  type ActivityFilterKey,
  filterActivity,
  filterLabel,
  formatDuration,
  aggregateStats,
  availableYears,
  yearlyStats,
} from '@/lib/sport'
import type { StravaData, StravaAthlete } from '@/lib/strava'

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

interface Props {
  promise: Promise<StravaData | null>
  filter: ActivityFilterKey
  year: number
}

export function SportClient({ promise, filter, year }: Props) {
  const data = use(promise)
  const [optimisticFilter, setOptimisticFilter] = useOptimistic(filter)
  const [optimisticYear, setOptimisticYear] = useOptimistic(year)

  if (!data) return <ConnectPanel />

  const filtered = data.recentActivities.filter((a) => filterActivity(a, filter))
  const stats = aggregateStats(filtered)
  const years = availableYears(filtered)
  const yearActivities = filtered.filter((a) => new Date(a.startDate).getFullYear() === year)
  const yearStats = aggregateStats(yearActivities)
  const label = filterLabel(filter)

  const buildHref = (key: ActivityFilterKey, y: number) => `/sport?filter=${key}&year=${y}`

  return (
    <>
      <AthleteCard athlete={data.athlete} />

      <div className="flex items-center justify-center gap-2 mb-8">
        {ACTIVITY_FILTERS.map((f) => {
          const Icon = f.icon
          const isActive = optimisticFilter === f.key
          return (
            <Link
              key={f.key}
              href={buildHref(f.key, year)}
              prefetch={false}
              onClick={() => setOptimisticFilter(f.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all duration-300 border ${
                isActive
                  ? 'bg-earth-rust/20 border-earth-rust/50 text-earth-rust shadow-[0_0_15px_rgba(255,136,0,0.2)]'
                  : 'bg-bg-card border-border-subtle text-text-muted hover:border-earth-rust/30 hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{f.label}</span>
            </Link>
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
        selectedYear={optimisticYear}
        buildHref={(y) => buildHref(filter, y)}
        onSelectYear={setOptimisticYear}
        distance={yearStats.totalDistance}
        time={yearStats.totalTime}
        count={yearStats.totalActivities}
      />

      {filter === 'Run' && (
        <SportTrainingAnalysis runs={data.recentActivities.filter((a) => a.type === 'Run')} />
      )}

      <RecentActivities activities={filtered} />

      <YearlyEvolution
        label={label}
        mode={filter === 'RPM' ? 'hours' : 'distance'}
        stats={yearlyStats(filtered, filter === 'RPM' ? 'hours' : 'distance')}
      />

      <div className="mb-8 border-t-2 border-earth-fern/20 pt-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-earth-fern/10 border border-earth-fern/30 rounded">
            <Zap className="w-6 h-6 text-earth-fern" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold tracking-wider text-text-primary">
              <span className="text-earth-fern">AI</span>_PERFORMANCE_ANALYSIS
            </h2>
            <p className="text-xs font-mono text-earth-fern/70">Analyses avancées avec Machine Learning</p>
          </div>
        </div>
      </div>

      <SportAiPanels activities={data.recentActivities} runOnlyMode={filter === 'Run'} />
    </>
  )
}

export function SportSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-32 bg-bg-card rounded-2xl border border-border-subtle" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-bg-card rounded-2xl border border-border-subtle" />
        ))}
      </div>
    </div>
  )
}

function ConnectPanel() {
  return (
    <div className="tech-card p-8 border-earth-rust/30">
      <div className="text-center max-w-xl mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-earth-rust/10 border border-earth-rust/30 flex items-center justify-center">
          <Activity className="w-10 h-10 text-earth-rust" />
        </div>
        <h2 className="text-xl font-display font-bold text-text-primary mb-4 tracking-wider">
          AUTHENTICATION_REQUIRED
        </h2>
        <p className="text-text-secondary mb-8 font-mono text-sm leading-relaxed">
          Connecte ton compte Strava pour voir tes statistiques sportives, tes activités récentes
          et ton évolution.
        </p>
        <a
          href="/api/strava/auth"
          className="inline-flex items-center gap-3 px-8 py-4 bg-[#FC4C02]/10 border border-[#FC4C02]/30 rounded-lg text-[#FC4C02] font-mono hover:bg-[#FC4C02]/20 hover:border-[#FC4C02]/50 transition-all duration-300 group"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.01 13.828h4.169" />
          </svg>
          <span>CONNECT_STRAVA</span>
          <span className="group-hover:translate-x-1 transition-transform">&gt;</span>
        </a>
        <p className="text-xs text-text-muted mt-6 font-mono">
          Powered by Strava API // OAuth2 Authentication
        </p>
      </div>
    </div>
  )
}

function AthleteCard({ athlete }: { athlete: StravaAthlete }) {
  return (
    <div className="tech-card p-6 mb-8 border-earth-rust/30 hover:border-earth-rust/60 transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="relative">
          <Image
            src={athlete.profile}
            alt={athlete.firstname}
            width={120}
            height={120}
            className="rounded-lg ring-2 ring-earth-rust/30"
          />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#FC4C02] rounded-full border-2 border-bg-primary flex items-center justify-center">
            <Activity className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-display font-bold text-text-primary tracking-wider">
            {athlete.firstname} {athlete.lastname}
          </h2>
          <p className="text-sm font-mono text-earth-rust/70 mt-1">@{athlete.username}</p>
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

function RecentActivities({ activities }: { activities: SportActivity[] }) {
  return (
    <div className="tech-card p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-earth-terracotta/10 border border-earth-terracotta/30 rounded">
          <Activity className="w-5 h-5 text-earth-terracotta" />
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
            className="group flex items-center gap-4 p-4 bg-bg-primary border border-border-subtle rounded-lg hover:border-earth-terracotta/50 hover:bg-earth-terracotta/5 transition-all duration-300 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-earth-terracotta/10 border border-earth-terracotta/30 flex items-center justify-center text-earth-terracotta">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-text-primary truncate group-hover:text-earth-terracotta transition-colors">
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
                <p className="text-earth-fern">{activity.distance.toFixed(1)} km</p>
                <p className="text-text-muted">{formatDuration(activity.movingTime)}</p>
              </div>
              {activity.totalElevationGain > 0 && (
                <div className="text-right">
                  <p className="text-earth-moss">+{Math.round(activity.totalElevationGain)} m</p>
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

function YearStatsCard({
  label,
  years,
  selectedYear,
  buildHref,
  onSelectYear,
  distance,
  time,
  count,
}: {
  label: string
  years: number[]
  selectedYear: number
  buildHref: (y: number) => string
  onSelectYear: (y: number) => void
  distance: number
  time: number
  count: number
}) {
  return (
    <div className="tech-card p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-earth-fern/10 border border-earth-fern/30 rounded">
            <Calendar className="w-5 h-5 text-earth-fern" />
          </div>
          <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Year_Stats ({label})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {years.map((y) => (
            <Link
              key={y}
              href={buildHref(y)}
              prefetch={false}
              onClick={() => onSelectYear(y)}
              className={`px-3 py-1 rounded font-mono text-sm transition-all duration-300 border ${
                selectedYear === y
                  ? 'bg-earth-fern/20 border-earth-fern/50 text-earth-fern shadow-[0_0_10px_rgba(0,255,255,0.2)]'
                  : 'bg-bg-card border-border-subtle text-text-muted hover:border-earth-fern/30 hover:text-text-primary'
              }`}
            >
              {y}
            </Link>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="text-center">
          <p className="text-3xl font-mono font-bold text-earth-fern">{Math.round(distance)}</p>
          <p className="text-xs font-mono text-text-muted mt-1">km parcourus</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-mono font-bold text-earth-terracotta">{Math.round(time)}</p>
          <p className="text-xs font-mono text-text-muted mt-1">heures d&apos;activité</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-mono font-bold text-earth-moss">{count}</p>
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
        <div className="p-2 bg-earth-moss/10 border border-earth-moss/30 rounded">
          <TrendingUp className="w-5 h-5 text-earth-moss" />
        </div>
        <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
          {title} ({label})
        </h3>
      </div>
      <div className="flex items-end justify-center gap-8 h-48">
        {stats.map((y) => {
          const height = maxValue > 0 ? (y.value / maxValue) * 100 : 0
          return (
            <div key={y.year} className="flex flex-col items-center gap-2 w-24">
              <span className="text-sm font-mono font-bold text-earth-rust">
                {Math.round(y.value)} {unit}
              </span>
              <div className="w-full h-32 flex items-end">
                <div
                  className="w-full bg-gradient-to-t from-earth-rust/50 to-earth-rust rounded-t transition-all hover:from-earth-rust/70 hover:to-earth-rust"
                  style={{ height: `${height}%`, minHeight: y.value > 0 ? '8px' : '0' }}
                />
              </div>
              <span className="text-sm font-mono font-semibold text-text-primary">{y.year}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

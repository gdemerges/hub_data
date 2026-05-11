'use client'

import { use, useOptimistic, startTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Activity,
  Timer,
  Route,
  Flame,
  TrendingUp,
  Mountain,
  Bike,
  Footprints,
  Disc,
  Zap,
  MapPin,
  ArrowUpRight,
} from 'lucide-react'
import {
  StatCard,
  SportTrainingAnalysis,
  SportAiPanels,
  SectionCard,
  SkeletonStatCard,
  Skeleton,
} from '@/components'
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
      return <Bike className="w-4 h-4" strokeWidth={1.75} />
    case 'run':
      return <Footprints className="w-4 h-4" strokeWidth={1.75} />
    default:
      return <Activity className="w-4 h-4" strokeWidth={1.75} />
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
  const lifetimeStats = aggregateStats(data.recentActivities)
  const years = availableYears(filtered)
  const yearActivities = filtered.filter((a) => new Date(a.startDate).getFullYear() === year)
  const yearStats = aggregateStats(yearActivities)
  const label = filterLabel(filter)

  const buildHref = (key: ActivityFilterKey, y: number) => `/sport?filter=${key}&year=${y}`

  return (
    <>
      <AthleteHero athlete={data.athlete} lifetime={lifetimeStats} />

      <FilterBar
        filters={ACTIVITY_FILTERS}
        active={optimisticFilter}
        onSelect={(k) => startTransition(() => setOptimisticFilter(k))}
        buildHref={(k) => buildHref(k, year)}
      />

      <div className="motion-stagger grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label={`Distance · ${label}`} value={`${Math.round(stats.totalDistance)} km`} icon={Route} color="orange" />
        <StatCard label="Temps total" value={`${Math.round(stats.totalTime)} h`} icon={Timer} color="cyan" />
        <StatCard label="Dénivelé total" value={`${Math.round(stats.totalElevation)} m`} icon={Mountain} color="green" />
        <StatCard label="Activités" value={stats.totalActivities} icon={Flame} color="magenta" />
      </div>

      <YearFocus
        label={label}
        years={years}
        selectedYear={optimisticYear}
        buildHref={(y) => buildHref(filter, y)}
        onSelectYear={(y) => startTransition(() => setOptimisticYear(y))}
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

      <AiSectionDivider />
      <SportAiPanels activities={data.recentActivities} runOnlyMode={filter === 'Run'} />
    </>
  )
}

export function SportSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton accent="rust" className="h-40 rounded-3xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonStatCard key={i} accent="rust" />
        ))}
      </div>
    </div>
  )
}

/* === HERO ATHLETE — éditorial === */
function AthleteHero({
  athlete,
  lifetime,
}: {
  athlete: StravaAthlete
  lifetime: { totalDistance: number; totalTime: number; totalActivities: number }
}) {
  return (
    <section
      className="tech-card-raised gradient-mesh p-8 sm:p-10 mb-10 relative overflow-hidden"
      style={
        {
          ['--mesh-a' as string]: '168 85 44',
          ['--mesh-b' as string]: '217 164 65',
          ['--mesh-c' as string]: '184 107 60',
          ['--accent' as string]: '168 85 44',
        } as React.CSSProperties
      }
    >
      {/* Topographic ornament — discret, en arrière-plan */}
      <svg
        aria-hidden
        className="absolute -right-10 -top-10 w-72 h-72 text-earth-rust/10 pointer-events-none"
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
      >
        {[...Array(8)].map((_, i) => (
          <circle key={i} cx="100" cy="100" r={20 + i * 11} />
        ))}
      </svg>

      <div className="relative flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
        <div className="relative shrink-0">
          <Image
            src={athlete.profile}
            alt={`${athlete.firstname} ${athlete.lastname}`}
            width={112}
            height={112}
            className="rounded-2xl ring-1 ring-earth-rust/30 shadow-soft-md"
          />
          <span
            aria-hidden
            className="absolute -bottom-2 -right-2 w-7 h-7 bg-[#FC4C02] rounded-full border-2 border-bg-card flex items-center justify-center"
            title="Strava connecté"
          >
            <Activity className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-earth-rust font-mono mb-2 flex items-center gap-2">
            <span className="inline-block w-6 h-px bg-earth-rust" />
            Athlète
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-medium tracking-tight text-text-primary leading-[1] mb-3">
            {athlete.firstname}{' '}
            <span className="text-earth-rust italic">{athlete.lastname}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-secondary">
            <span className="font-mono text-earth-rust/80">@{athlete.username}</span>
            {(athlete.city || athlete.country) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.75} />
                {[athlete.city, athlete.country].filter(Boolean).join(', ')}
              </span>
            )}
          </div>

          {/* Lifetime stats inline */}
          <div className="mt-6 grid grid-cols-3 gap-6 max-w-md border-t border-earth-rust/15 pt-5">
            <LifetimeStat value={`${Math.round(lifetime.totalDistance)}`} unit="km" label="Distance" />
            <LifetimeStat value={`${Math.round(lifetime.totalTime)}`} unit="h" label="Temps" />
            <LifetimeStat value={`${lifetime.totalActivities}`} label="Activités" />
          </div>
        </div>
      </div>
    </section>
  )
}

function LifetimeStat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl sm:text-3xl text-text-primary leading-none num">
        {value}
        {unit && <span className="text-base text-text-muted ml-1 font-sans">{unit}</span>}
      </div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-text-muted mt-2">{label}</div>
    </div>
  )
}

/* === FILTER BAR === */
function FilterBar({
  filters,
  active,
  onSelect,
  buildHref,
}: {
  filters: typeof ACTIVITY_FILTERS
  active: ActivityFilterKey
  onSelect: (k: ActivityFilterKey) => void
  buildHref: (k: ActivityFilterKey) => string
}) {
  return (
    <nav
      role="tablist"
      aria-label="Filtre d'activité"
      className="flex flex-wrap items-center justify-center gap-1.5 mb-10"
    >
      {filters.map((f) => {
        const Icon = f.icon
        const isActive = active === f.key
        return (
          <Link
            key={f.key}
            href={buildHref(f.key)}
            prefetch={false}
            scroll={false}
            onClick={() => onSelect(f.key)}
            role="tab"
            aria-selected={isActive}
            className={
              isActive
                ? 'group inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-earth-rust/12 text-earth-rust border border-earth-rust/30 transition-all duration-300'
                : 'group inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-text-secondary border border-transparent hover:border-border-default hover:text-text-primary hover:bg-bg-hover transition-all duration-300'
            }
          >
            <Icon className="w-4 h-4 transition-transform group-hover:scale-110" strokeWidth={1.75} />
            <span>{f.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

/* === YEAR FOCUS — replace YearStatsCard === */
function YearFocus({
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
    <section
      className="tech-card p-6 sm:p-8 mb-10"
      style={{ ['--accent' as string]: '123 168 150' } as React.CSSProperties}
    >
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-earth-fern font-mono mb-2 flex items-center gap-2">
            <span className="inline-block w-6 h-px bg-earth-fern" />
            Focus annuel
          </div>
          <h3 className="font-display text-2xl tracking-tight text-text-primary">
            <span className="text-earth-fern italic">{selectedYear}</span> · {label}
          </h3>
        </div>
        <div className="flex items-center gap-1 -mb-1">
          {years.map((y) => {
            const isActive = selectedYear === y
            return (
              <Link
                key={y}
                href={buildHref(y)}
                prefetch={false}
                scroll={false}
                onClick={() => onSelectYear(y)}
                aria-current={isActive ? 'true' : undefined}
                className={
                  isActive
                    ? 'relative px-3 py-1.5 text-sm font-medium num text-earth-fern'
                    : 'relative px-3 py-1.5 text-sm font-medium num text-text-muted hover:text-text-primary transition-colors'
                }
              >
                {y}
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute left-2 right-2 -bottom-0.5 h-px bg-earth-fern"
                  />
                )}
              </Link>
            )
          })}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6">
        <BigStat value={Math.round(distance)} unit="km" label="parcourus" tone="fern" />
        <BigStat value={Math.round(time)} unit="h" label="d'activité" tone="terracotta" />
        <BigStat value={count} label="activités" tone="moss" />
      </div>
    </section>
  )
}

function BigStat({
  value,
  unit,
  label,
  tone,
}: {
  value: number
  unit?: string
  label: string
  tone: 'fern' | 'terracotta' | 'moss'
}) {
  const toneClass = {
    fern: 'text-earth-fern',
    terracotta: 'text-earth-terracotta',
    moss: 'text-earth-moss',
  }[tone]
  return (
    <div className="text-center">
      <div className={`font-display text-4xl sm:text-5xl font-medium tracking-tight num leading-none ${toneClass}`}>
        {value}
        {unit && <span className="text-xl text-text-muted ml-1 font-sans">{unit}</span>}
      </div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-text-muted mt-3">{label}</div>
    </div>
  )
}

/* === RECENT ACTIVITIES === */
function RecentActivities({ activities }: { activities: SportActivity[] }) {
  if (activities.length === 0) return null
  return (
    <SectionCard title="Activités récentes" icon={Activity} accent="terracotta">
      <ol className="motion-stagger space-y-1">
        {activities.slice(0, 10).map((activity) => (
          <li key={activity.id}>
            <Link
              href={`/sport/activity/${activity.id}`}
              className="group flex items-center gap-4 px-3 py-3 -mx-3 rounded-xl hover:bg-bg-hover/60 transition-colors"
            >
              <span className="w-9 h-9 rounded-xl bg-earth-terracotta/10 border border-earth-terracotta/25 flex items-center justify-center text-earth-terracotta shrink-0">
                {getActivityIcon(activity.type)}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-text-primary truncate group-hover:text-earth-terracotta transition-colors">
                  {activity.name}
                </h4>
                <p className="text-[11px] text-text-muted mt-0.5 num">
                  {new Date(activity.startDate).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="hidden sm:flex items-baseline gap-5 text-xs num">
                <Metric value={`${activity.distance.toFixed(1)} km`} sub={formatDuration(activity.movingTime)} />
                {activity.totalElevationGain > 0 && (
                  <Metric
                    value={`+${Math.round(activity.totalElevationGain)} m`}
                    sub={`${activity.averageSpeed.toFixed(1)} km/h`}
                    tone="moss"
                  />
                )}
              </div>
              <ArrowUpRight
                className="w-4 h-4 text-text-muted opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                strokeWidth={2}
              />
            </Link>
          </li>
        ))}
      </ol>
    </SectionCard>
  )
}

function Metric({ value, sub, tone = 'fern' }: { value: string; sub: string; tone?: 'fern' | 'moss' }) {
  const cls = tone === 'moss' ? 'text-earth-moss' : 'text-earth-fern'
  return (
    <div className="text-right">
      <div className={cls}>{value}</div>
      <div className="text-text-muted">{sub}</div>
    </div>
  )
}

/* === YEARLY EVOLUTION === */
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
  const title = mode === 'hours' ? 'Heures par an' : 'Distance par an'
  const maxValue = Math.max(...stats.map((y) => y.value))

  return (
    <SectionCard title={`${title} · ${label}`} icon={TrendingUp} accent="rust">
      <div className="flex items-end justify-center gap-6 sm:gap-10 h-56">
        {stats.map((y) => {
          const height = maxValue > 0 ? (y.value / maxValue) * 100 : 0
          return (
            <div key={y.year} className="flex flex-col items-center gap-3 w-20 group">
              <span className="font-display text-base text-earth-rust num">
                {Math.round(y.value)}
                <span className="text-xs text-text-muted ml-0.5 font-sans">{unit}</span>
              </span>
              <div className="w-full h-32 flex items-end">
                <div
                  className="w-full bg-gradient-to-t from-earth-rust/40 to-earth-rust rounded-t-lg transition-all duration-500 ease-out group-hover:from-earth-rust/60 group-hover:to-earth-saffron"
                  style={{ height: `${height}%`, minHeight: y.value > 0 ? '6px' : '0' }}
                  aria-label={`${y.year}: ${Math.round(y.value)} ${unit}`}
                />
              </div>
              <span className="text-[11px] uppercase tracking-[0.16em] text-text-muted num">
                '{y.year.toString().slice(-2)}
              </span>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

/* === AI SECTION DIVIDER === */
function AiSectionDivider() {
  return (
    <div className="my-12">
      <div className="flex items-center gap-6 mb-4">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-earth-fern/40" />
        <div className="flex items-center gap-3">
          <span
            className="gradient-mesh w-10 h-10 rounded-2xl border border-earth-fern/30 flex items-center justify-center"
            style={
              {
                ['--mesh-a' as string]: '123 168 150',
                ['--mesh-b' as string]: '163 181 152',
                ['--mesh-c' as string]: '123 168 150',
              } as React.CSSProperties
            }
          >
            <Zap className="w-4 h-4 text-earth-fern" strokeWidth={1.75} />
          </span>
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-earth-fern font-mono">
              Analyse avancée
            </div>
            <h2 className="font-display text-xl tracking-tight text-text-primary">
              Performance &amp; <span className="italic text-earth-fern">prédictions</span>
            </h2>
          </div>
        </div>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-earth-fern/40" />
      </div>
      <p className="text-center text-sm text-text-muted max-w-md mx-auto">
        Modèles statistiques sur tes activités — charge d'entraînement, prédicteur de course, récupération.
      </p>
    </div>
  )
}

/* === CONNECT PANEL — empty state === */
function ConnectPanel() {
  return (
    <div className="tech-card-raised p-10 max-w-2xl mx-auto">
      <div className="text-center">
        <div
          className="gradient-mesh w-20 h-20 mx-auto mb-6 rounded-3xl border border-earth-rust/30 flex items-center justify-center"
          style={
            {
              ['--mesh-a' as string]: '168 85 44',
              ['--mesh-b' as string]: '217 164 65',
              ['--mesh-c' as string]: '168 85 44',
            } as React.CSSProperties
          }
        >
          <Activity className="w-9 h-9 text-earth-rust" strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-2xl text-text-primary mb-3">Connecte ton compte Strava</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-8 max-w-md mx-auto">
          Statistiques d'entraînement, évolution annuelle et analyses avancées de tes courses,
          sorties vélo et sessions RPM.
        </p>
        <a
          href="/api/strava/auth"
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-white font-medium transition-transform hover:scale-[1.02] group"
          style={{ backgroundColor: '#FC4C02' }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.01 13.828h4.169" />
          </svg>
          <span>Connecter Strava</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </a>
        <p className="text-[11px] text-text-muted mt-6 font-mono uppercase tracking-[0.18em]">
          OAuth2 · API Strava
        </p>
      </div>
    </div>
  )
}

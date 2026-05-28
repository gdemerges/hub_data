'use client'

import useSWR from 'swr'
import { Dumbbell, Flame, Timer, TrendingUp, Trophy, Activity, Layers } from 'lucide-react'
import { StatCard, Skeleton, SkeletonStatCard, EmptyState } from '@/components'
import type {
  HevyAggregateStats,
  VolumePoint,
  MonthlyVolumePoint,
  MuscleGroupCount,
  ExercisePR,
  SessionSummary,
} from '@/lib/hevy-stats'

interface HevyResponse {
  hasData: boolean
  reason?: string
  stats?: HevyAggregateStats
  weekly?: VolumePoint[]
  monthly?: MonthlyVolumePoint[]
  muscleGroups?: MuscleGroupCount[]
  prs?: ExercisePR[]
  sessions?: SessionSummary[]
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#b86b3c',
  back: '#5a7d4a',
  shoulders: '#d9a441',
  biceps: '#a8552c',
  triceps: '#7ba896',
  legs: '#3d5170',
  quadriceps: '#3d5170',
  hamstrings: '#4f8c4a',
  glutes: '#b06868',
  calves: '#7ba896',
  abs: '#d9a441',
  core: '#d9a441',
  forearms: '#8ab274',
  cardio: '#a8552c',
  other: '#7ba896',
  autre: '#7ba896',
}

function muscleColor(group: string): string {
  return MUSCLE_COLORS[group.toLowerCase()] ?? '#7ba896'
}

function formatVolume(kg: number): string {
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)} Mkg`
  if (kg >= 1_000) return `${(kg / 1_000).toFixed(1)} t`
  return `${Math.round(kg)} kg`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

interface Props {
  year: number
}

export function MusculationSection({ year }: Props) {
  const { data, isLoading, error } = useSWR<HevyResponse>('/api/hevy')

  if (isLoading) return <MusculationSkeleton />

  if (error || !data) {
    return (
      <EmptyState
        title="Hevy indisponible"
        description="Impossible de charger les données Hevy. Vérifie ta clé API."
      />
    )
  }

  if (!data.hasData) {
    return (
      <div className="tech-card p-8">
        <div className="text-center max-w-xl mx-auto">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-earth-rust/10 border border-earth-rust/30 flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-earth-rust" />
          </div>
          <h2 className="font-display text-xl font-medium text-text-primary mb-3">
            Connecte Hevy
          </h2>
          <p className="text-text-secondary text-sm mb-2">
            {data.reason === 'HEVY_API_KEY missing'
              ? 'Variable d\'environnement HEVY_API_KEY manquante.'
              : 'Aucune séance pour le moment.'}
          </p>
          <p className="text-text-muted text-xs font-mono">
            Génère une clé sur hevy.com/settings → Developer, puis ajoute <code>HEVY_API_KEY=...</code>.
          </p>
        </div>
      </div>
    )
  }

  const { stats, weekly = [], monthly = [], muscleGroups = [], prs = [], sessions = [] } = data
  if (!stats) return null

  const yearMonths = monthly.filter((m) => m.month.startsWith(String(year)))
  const yearVolume = yearMonths.reduce((s, m) => s + m.volumeKg, 0)
  const yearWorkouts = yearMonths.reduce((s, m) => s + m.workouts, 0)
  const yearDuration = yearMonths.reduce((s, m) => s + m.durationMin, 0)

  return (
    <>
      <MusculationHero stats={stats} />

      <div className="motion-stagger grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard
          label={`Volume · ${year}`}
          value={formatVolume(yearVolume)}
          icon={Flame}
          color="rust"
        />
        <StatCard
          label="Séances"
          value={yearWorkouts}
          icon={Activity}
          color="terracotta"
        />
        <StatCard
          label="Temps total"
          value={`${Math.round(yearDuration / 60)} h`}
          icon={Timer}
          color="fern"
        />
        <StatCard
          label="Exercices uniques"
          value={stats.uniqueExercises}
          icon={Layers}
          color="moss"
        />
      </div>

      <WeeklyVolumeChart points={weekly} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <MuscleGroupBreakdown items={muscleGroups} />
        <TopPRs items={prs} />
      </div>

      <RecentSessions items={sessions} />
    </>
  )
}

export function MusculationSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton accent="rust" className="h-40 rounded-3xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonStatCard key={i} accent="rust" />
        ))}
      </div>
      <Skeleton accent="rust" className="h-56 rounded-2xl" />
    </div>
  )
}

function MusculationHero({ stats }: { stats: HevyAggregateStats }) {
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
      <div className="relative flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
        <div className="w-20 h-20 rounded-2xl bg-earth-rust/15 border border-earth-rust/30 flex items-center justify-center shadow-soft-md">
          <Dumbbell className="w-10 h-10 text-earth-rust" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] font-mono text-earth-rust mb-2 inline-flex items-center gap-2">
            <span className="inline-block w-6 h-px bg-earth-rust" />
            Musculation · Hevy
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-text-primary leading-[1.05]">
            {stats.totalWorkouts} séances · {formatVolume(stats.totalVolumeKg)} soulevés
          </h2>
          <p className="text-sm text-text-secondary mt-3">
            {stats.totalSets.toLocaleString('fr-FR')} séries au total ·{' '}
            {Math.round(stats.avgDurationMin)} min en moyenne ·{' '}
            {formatVolume(stats.avgVolumePerWorkoutKg)} par séance
            {stats.firstSession && ` · depuis ${formatDate(stats.firstSession)}`}
          </p>
        </div>
      </div>
    </section>
  )
}

function WeeklyVolumeChart({ points }: { points: VolumePoint[] }) {
  if (!points.length) return null
  const max = Math.max(...points.map((p) => p.volumeKg), 1)
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 mb-10">
      <div className="flex items-center gap-3 mb-4">
        <TrendingUp className="w-5 h-5 text-earth-rust" />
        <h3 className="text-sm font-semibold text-text-secondary">
          Volume hebdomadaire — {points.length} dernières semaines
        </h3>
        <span className="ml-auto text-xs font-mono text-text-muted">
          pic : {formatVolume(max)}
        </span>
      </div>
      <div className="flex items-end gap-1 h-40">
        {points.map((p) => {
          const h = (p.volumeKg / max) * 100
          return (
            <div
              key={p.weekStart}
              className="flex-1 flex flex-col items-center justify-end group"
              title={`${formatDateShort(p.weekStart)} · ${formatVolume(p.volumeKg)} · ${p.workouts} séance${p.workouts > 1 ? 's' : ''}`}
            >
              <div
                className="w-full rounded-t bg-gradient-to-t from-earth-rust to-earth-saffron group-hover:opacity-80 transition-opacity"
                style={{ height: `${h}%`, minHeight: p.volumeKg > 0 ? '3px' : '0' }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] font-mono text-text-muted">
        <span>{formatDateShort(points[0].weekStart)}</span>
        <span>{formatDateShort(points[points.length - 1].weekStart)}</span>
      </div>
    </div>
  )
}

function MuscleGroupBreakdown({ items }: { items: MuscleGroupCount[] }) {
  if (!items.length) return null
  const totalVolume = items.reduce((s, i) => s + i.volumeKg, 0)
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Layers className="w-5 h-5 text-earth-rust" />
        <h3 className="text-sm font-semibold text-text-secondary">Groupes musculaires</h3>
      </div>
      <div className="space-y-2.5">
        {items.map((m) => {
          const pct = totalVolume ? (m.volumeKg / totalVolume) * 100 : 0
          const color = muscleColor(m.group)
          return (
            <div key={m.group}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-sm text-text-primary capitalize">{m.group}</span>
                </div>
                <span className="text-xs font-mono text-text-secondary">
                  {formatVolume(m.volumeKg)} · {m.sets} séries · {m.sessions} séance{m.sessions > 1 ? 's' : ''}
                </span>
              </div>
              <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TopPRs({ items }: { items: ExercisePR[] }) {
  if (!items.length) return null
  const max = Math.max(...items.map((i) => i.totalVolumeKg), 1)
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="w-5 h-5 text-earth-saffron" />
        <h3 className="text-sm font-semibold text-text-secondary">Top exercices · PRs</h3>
      </div>
      <ol className="space-y-2.5">
        {items.map((e, i) => {
          const pct = (e.totalVolumeKg / max) * 100
          return (
            <li key={e.templateId} className="flex items-center gap-3">
              <span className="w-5 text-xs font-mono text-text-muted text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-sm text-text-primary truncate font-medium">{e.title}</span>
                  <span className="text-xs font-mono text-text-secondary shrink-0">
                    PR {e.maxWeightKg} kg × {e.maxWeightReps}
                  </span>
                </div>
                <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-earth-rust to-earth-saffron"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] font-mono text-text-muted">
                  {formatVolume(e.totalVolumeKg)} cumulés · {e.totalSets} séries
                  {e.primaryMuscleGroup && ` · ${e.primaryMuscleGroup}`}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function RecentSessions({ items }: { items: SessionSummary[] }) {
  if (!items.length) return null
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 mb-10">
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-5 h-5 text-earth-rust" />
        <h3 className="text-sm font-semibold text-text-secondary">Dernières séances</h3>
        <span className="ml-auto text-xs font-mono text-text-muted">{items.length}</span>
      </div>
      <ul className="space-y-2">
        {items.map((s) => (
          <li
            key={s.id}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg hover:bg-bg-hover transition-colors border border-transparent hover:border-border-subtle"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary font-medium truncate">{s.title || 'Séance'}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {formatDate(s.startTime)} · {Math.round(s.durationMin)} min · {s.exerciseCount} exercices · {s.setCount} séries
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {s.primaryMuscleGroups.map((g) => (
                <span
                  key={g}
                  className="text-[10px] uppercase tracking-wide font-mono px-2 py-0.5 rounded-full"
                  style={{
                    color: muscleColor(g),
                    background: `${muscleColor(g)}22`,
                    border: `1px solid ${muscleColor(g)}55`,
                  }}
                >
                  {g}
                </span>
              ))}
              <span className="text-sm font-mono font-semibold text-earth-rust">
                {formatVolume(s.volumeKg)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

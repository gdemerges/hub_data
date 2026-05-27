import type { HevyWorkout, HevyTemplate } from './hevy'

export interface MuscleGroupCount {
  group: string
  sessions: number
  sets: number
  volumeKg: number
}

export interface VolumePoint {
  weekStart: string // ISO Monday
  volumeKg: number
  sets: number
  workouts: number
}

export interface MonthlyVolumePoint {
  month: string // YYYY-MM
  volumeKg: number
  workouts: number
  durationMin: number
}

export interface ExercisePR {
  templateId: string
  title: string
  maxWeightKg: number
  maxWeightReps: number
  maxVolumeSet: number // weight * reps best single set
  totalSets: number
  totalReps: number
  totalVolumeKg: number
  lastSeen: string
  primaryMuscleGroup?: string
}

export interface SessionSummary {
  id: string
  title: string
  startTime: string
  durationMin: number
  exerciseCount: number
  setCount: number
  volumeKg: number
  primaryMuscleGroups: string[]
}

export interface HevyAggregateStats {
  totalWorkouts: number
  totalVolumeKg: number
  totalSets: number
  totalDurationMin: number
  thisYearWorkouts: number
  thisYearVolumeKg: number
  avgDurationMin: number
  avgVolumePerWorkoutKg: number
  uniqueExercises: number
  firstSession?: string
  lastSession?: string
}

function setVolume(weight: number | null, reps: number | null): number {
  if (!weight || !reps) return 0
  return weight * reps
}

function durationMin(w: HevyWorkout): number {
  const start = new Date(w.start_time).getTime()
  const end = new Date(w.end_time).getTime()
  if (!isFinite(start) || !isFinite(end) || end <= start) return 0
  return (end - start) / 60_000
}

function workoutVolume(w: HevyWorkout): { volumeKg: number; sets: number } {
  let volumeKg = 0
  let sets = 0
  for (const ex of w.exercises) {
    for (const s of ex.sets) {
      volumeKg += setVolume(s.weight_kg, s.reps)
      sets++
    }
  }
  return { volumeKg, sets }
}

function mondayOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0 = Sunday
  const diff = (day + 6) % 7
  d.setDate(d.getDate() - diff)
  return d
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function computeAggregateStats(workouts: HevyWorkout[]): HevyAggregateStats {
  const currentYear = new Date().getFullYear()
  let totalVolumeKg = 0
  let totalSets = 0
  let totalDurationMin = 0
  let thisYearWorkouts = 0
  let thisYearVolumeKg = 0
  const exerciseIds = new Set<string>()

  const sorted = [...workouts].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  )

  for (const w of workouts) {
    const { volumeKg, sets } = workoutVolume(w)
    totalVolumeKg += volumeKg
    totalSets += sets
    totalDurationMin += durationMin(w)
    if (new Date(w.start_time).getFullYear() === currentYear) {
      thisYearWorkouts++
      thisYearVolumeKg += volumeKg
    }
    for (const ex of w.exercises) exerciseIds.add(ex.exercise_template_id)
  }

  return {
    totalWorkouts: workouts.length,
    totalVolumeKg,
    totalSets,
    totalDurationMin,
    thisYearWorkouts,
    thisYearVolumeKg,
    avgDurationMin: workouts.length ? totalDurationMin / workouts.length : 0,
    avgVolumePerWorkoutKg: workouts.length ? totalVolumeKg / workouts.length : 0,
    uniqueExercises: exerciseIds.size,
    firstSession: sorted[0]?.start_time,
    lastSession: sorted[sorted.length - 1]?.start_time,
  }
}

export function computeWeeklyVolume(workouts: HevyWorkout[], weeks = 26): VolumePoint[] {
  const map = new Map<string, VolumePoint>()
  for (const w of workouts) {
    const start = new Date(w.start_time)
    if (isNaN(start.getTime())) continue
    const monday = isoDate(mondayOf(start))
    const { volumeKg, sets } = workoutVolume(w)
    const existing = map.get(monday) ?? {
      weekStart: monday,
      volumeKg: 0,
      sets: 0,
      workouts: 0,
    }
    existing.volumeKg += volumeKg
    existing.sets += sets
    existing.workouts += 1
    map.set(monday, existing)
  }
  return Array.from(map.values())
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .slice(-weeks)
}

export function computeMonthlyVolume(workouts: HevyWorkout[]): MonthlyVolumePoint[] {
  const map = new Map<string, MonthlyVolumePoint>()
  for (const w of workouts) {
    const d = new Date(w.start_time)
    if (isNaN(d.getTime())) continue
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const { volumeKg } = workoutVolume(w)
    const existing = map.get(month) ?? { month, volumeKg: 0, workouts: 0, durationMin: 0 }
    existing.volumeKg += volumeKg
    existing.workouts += 1
    existing.durationMin += durationMin(w)
    map.set(month, existing)
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month))
}

export function computeMuscleGroupBreakdown(
  workouts: HevyWorkout[],
  templates: HevyTemplate[],
): MuscleGroupCount[] {
  const byId = new Map(templates.map((t) => [t.id, t]))
  const map = new Map<string, MuscleGroupCount>()
  for (const w of workouts) {
    const groupsTouched = new Set<string>()
    for (const ex of w.exercises) {
      const tpl = byId.get(ex.exercise_template_id)
      const group = tpl?.primary_muscle_group ?? 'autre'
      groupsTouched.add(group)
      const existing = map.get(group) ?? { group, sessions: 0, sets: 0, volumeKg: 0 }
      for (const s of ex.sets) {
        existing.sets += 1
        existing.volumeKg += setVolume(s.weight_kg, s.reps)
      }
      map.set(group, existing)
    }
    for (const group of groupsTouched) {
      const e = map.get(group)!
      e.sessions += 1
    }
  }
  return Array.from(map.values()).sort((a, b) => b.volumeKg - a.volumeKg)
}

export function computeExercisePRs(
  workouts: HevyWorkout[],
  templates: HevyTemplate[],
  limit = 12,
): ExercisePR[] {
  const byTpl = new Map(templates.map((t) => [t.id, t]))
  const acc = new Map<string, ExercisePR>()
  for (const w of workouts) {
    for (const ex of w.exercises) {
      const cur = acc.get(ex.exercise_template_id) ?? {
        templateId: ex.exercise_template_id,
        title: ex.title,
        maxWeightKg: 0,
        maxWeightReps: 0,
        maxVolumeSet: 0,
        totalSets: 0,
        totalReps: 0,
        totalVolumeKg: 0,
        lastSeen: w.start_time,
        primaryMuscleGroup: byTpl.get(ex.exercise_template_id)?.primary_muscle_group,
      }
      for (const s of ex.sets) {
        const weight = s.weight_kg ?? 0
        const reps = s.reps ?? 0
        const vol = weight * reps
        if (weight > cur.maxWeightKg) {
          cur.maxWeightKg = weight
          cur.maxWeightReps = reps
        }
        if (vol > cur.maxVolumeSet) cur.maxVolumeSet = vol
        cur.totalSets += 1
        cur.totalReps += reps
        cur.totalVolumeKg += vol
      }
      if (new Date(w.start_time) > new Date(cur.lastSeen)) cur.lastSeen = w.start_time
      acc.set(ex.exercise_template_id, cur)
    }
  }
  return Array.from(acc.values())
    .sort((a, b) => b.totalVolumeKg - a.totalVolumeKg)
    .slice(0, limit)
}

export function computeSessions(
  workouts: HevyWorkout[],
  templates: HevyTemplate[],
  limit = 30,
): SessionSummary[] {
  const byTpl = new Map(templates.map((t) => [t.id, t]))
  return [...workouts]
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    .slice(0, limit)
    .map((w) => {
      const { volumeKg, sets } = workoutVolume(w)
      const groupCount = new Map<string, number>()
      for (const ex of w.exercises) {
        const tpl = byTpl.get(ex.exercise_template_id)
        const g = tpl?.primary_muscle_group ?? 'autre'
        groupCount.set(g, (groupCount.get(g) ?? 0) + ex.sets.length)
      }
      const primaryMuscleGroups = Array.from(groupCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([g]) => g)
      return {
        id: w.id,
        title: w.title,
        startTime: w.start_time,
        durationMin: durationMin(w),
        exerciseCount: w.exercises.length,
        setCount: sets,
        volumeKg,
        primaryMuscleGroups,
      }
    })
}

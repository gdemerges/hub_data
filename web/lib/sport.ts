export interface SportActivity {
  id: number
  name: string
  type: string
  distance: number
  movingTime: number
  totalElevationGain: number
  startDate: string
  averageSpeed: number
  averageHeartrate?: number
}

export const ACTIVITY_FILTER_KEYS = ['all', 'Run', 'Ride', 'RPM'] as const
export type ActivityFilterKey = (typeof ACTIVITY_FILTER_KEYS)[number]

export function filterActivity(
  activity: { type: string; name: string },
  filter: string
): boolean {
  if (filter === 'all') return true
  if (filter === 'RPM') return activity.name.toUpperCase().includes('RPM')
  if (filter === 'Ride') return activity.type === 'Ride' && !activity.name.toUpperCase().includes('RPM')
  return activity.type === filter
}

export function filterLabel(filter: string): string {
  if (filter === 'all') return 'Total'
  if (filter === 'Run') return 'Course'
  if (filter === 'RPM') return 'RPM'
  return 'Vélo'
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

export function getWeekStart(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay() + 1)
  return d.getTime()
}

export interface AggregateStats {
  totalDistance: number
  totalTime: number
  totalElevation: number
  totalActivities: number
}

export function aggregateStats(activities: SportActivity[]): AggregateStats {
  return {
    totalDistance: activities.reduce((s, a) => s + a.distance, 0),
    totalTime: activities.reduce((s, a) => s + a.movingTime, 0) / 60,
    totalElevation: activities.reduce((s, a) => s + a.totalElevationGain, 0),
    totalActivities: activities.length,
  }
}

export function availableYears(activities: SportActivity[]): number[] {
  return Array.from(new Set(activities.map((a) => new Date(a.startDate).getFullYear()))).sort(
    (a, b) => b - a
  )
}

export interface YearlyStat {
  year: number
  value: number
}

export function yearlyStats(activities: SportActivity[], mode: 'distance' | 'hours'): YearlyStat[] {
  const map = new Map<number, number>()
  for (const a of activities) {
    const year = new Date(a.startDate).getFullYear()
    const value = mode === 'hours' ? a.movingTime / 60 : a.distance
    map.set(year, (map.get(year) || 0) + value)
  }
  return Array.from(map.entries())
    .map(([year, value]) => ({ year, value }))
    .sort((a, b) => a.year - b.year)
}

export interface WeeklyData {
  distance: number
  runs: number
}

export interface TrainingAnalysis {
  currentWeekDistance: number
  currentWeekRuns: number
  lastWeekDistance: number
  avgDistance4Weeks: number
  avgRunsPerWeek: number
  avgLongestRun: number
  longestRunThisWeek: number
  increaseFromLastWeek: number
  increaseFromAvg: number
  daysSinceLastRun: number | null
  lastRun: SportActivity | null
  predictedWeeklyDistance: number
  predictedMonthlyDistance: number
  recommendedLongRun: number
  alerts: { type: 'warning' | 'danger' | 'success'; message: string }[]
}

export function computeTrainingAnalysis(runs: SportActivity[]): TrainingAnalysis {
  const weeklyData = new Map<number, WeeklyData>()
  for (const run of runs) {
    const weekStart = getWeekStart(new Date(run.startDate))
    const existing = weeklyData.get(weekStart) || { distance: 0, runs: 0 }
    existing.distance += run.distance
    existing.runs++
    weeklyData.set(weekStart, existing)
  }

  const sortedWeeks = Array.from(weeklyData.entries())
    .sort((a, b) => b[0] - a[0])
    .slice(0, 8)

  const currentWeek = sortedWeeks[0]
  const lastWeek = sortedWeeks[1]
  const last4Weeks = sortedWeeks.slice(1, 5)

  const avgDistance4Weeks =
    last4Weeks.length > 0
      ? last4Weeks.reduce((s, [, d]) => s + d.distance, 0) / last4Weeks.length
      : 0
  const avgRunsPerWeek =
    last4Weeks.length > 0
      ? last4Weeks.reduce((s, [, d]) => s + d.runs, 0) / last4Weeks.length
      : 0

  const currentWeekDistance = currentWeek ? currentWeek[1].distance : 0
  const currentWeekRuns = currentWeek ? currentWeek[1].runs : 0
  const lastWeekDistance = lastWeek ? lastWeek[1].distance : 0

  const increaseFromLastWeek =
    lastWeekDistance > 0 ? ((currentWeekDistance - lastWeekDistance) / lastWeekDistance) * 100 : 0
  const increaseFromAvg =
    avgDistance4Weeks > 0
      ? ((currentWeekDistance - avgDistance4Weeks) / avgDistance4Weeks) * 100
      : 0

  const longestRunThisWeek = runs
    .filter((r) => currentWeek && getWeekStart(new Date(r.startDate)) === currentWeek[0])
    .reduce((max, r) => Math.max(max, r.distance), 0)

  const avgLongestRun =
    last4Weeks.length > 0
      ? last4Weeks.reduce((sum, [weekStart]) => {
          const weekRuns = runs.filter(
            (r) => getWeekStart(new Date(r.startDate)) === weekStart
          )
          return sum + Math.max(...weekRuns.map((r) => r.distance), 0)
        }, 0) / last4Weeks.length
      : 0

  const alerts: TrainingAnalysis['alerts'] = []
  if (increaseFromLastWeek > 10) {
    alerts.push({
      type: increaseFromLastWeek > 20 ? 'danger' : 'warning',
      message: `Volume en hausse de ${Math.round(increaseFromLastWeek)}% vs semaine dernière (règle des 10%)`,
    })
  }
  if (increaseFromAvg > 15) {
    alerts.push({
      type: increaseFromAvg > 25 ? 'danger' : 'warning',
      message: `Volume ${Math.round(increaseFromAvg)}% au-dessus de ta moyenne des 4 dernières semaines`,
    })
  }
  if (longestRunThisWeek > avgLongestRun * 1.2 && avgLongestRun > 0) {
    const increase = ((longestRunThisWeek - avgLongestRun) / avgLongestRun) * 100
    alerts.push({
      type: increase > 30 ? 'danger' : 'warning',
      message: `Sortie longue de ${longestRunThisWeek.toFixed(1)}km (+${Math.round(increase)}% vs moyenne)`,
    })
  }
  if (alerts.length === 0 && currentWeekDistance > 0) {
    alerts.push({
      type: 'success',
      message: "Charge d'entraînement équilibrée, continue comme ça !",
    })
  }

  const lastRun = runs[0] || null
  const daysSinceLastRun = lastRun
    ? Math.floor((Date.now() - new Date(lastRun.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return {
    currentWeekDistance,
    currentWeekRuns,
    lastWeekDistance,
    avgDistance4Weeks,
    avgRunsPerWeek,
    avgLongestRun,
    longestRunThisWeek,
    increaseFromLastWeek,
    increaseFromAvg,
    daysSinceLastRun,
    lastRun,
    predictedWeeklyDistance: avgDistance4Weeks * 1.05,
    predictedMonthlyDistance: avgDistance4Weeks * 4,
    recommendedLongRun: avgLongestRun * 1.1,
    alerts,
  }
}

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
  maxHeartrate?: number
}

export const ACTIVITY_FILTER_KEYS = ['all', 'Run', 'Ride', 'RPM', 'Musculation'] as const
export type ActivityFilterKey = (typeof ACTIVITY_FILTER_KEYS)[number]

export function filterActivity(activity: { type: string; name: string }, filter: string): boolean {
  if (filter === 'all') return true
  if (filter === 'RPM') return activity.name.toUpperCase().includes('RPM')
  if (filter === 'Ride')
    return activity.type === 'Ride' && !activity.name.toUpperCase().includes('RPM')
  return activity.type === filter
}

export function filterLabel(filter: string): string {
  if (filter === 'all') return 'Total'
  if (filter === 'Run') return 'Course'
  if (filter === 'RPM') return 'RPM'
  if (filter === 'Musculation') return 'Musculation'
  return 'Vélo'
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

/**
 * Allure en min/km à partir d'une vitesse en km/h. Renvoie `m'ss"`.
 * Pertinent pour la course (les coureurs raisonnent en min/km, pas en km/h).
 */
export function formatPace(speedKmh: number): string {
  if (!Number.isFinite(speedKmh) || speedKmh <= 0) return '—'
  const paceMinPerKm = 60 / speedKmh
  let minutes = Math.floor(paceMinPerKm)
  let seconds = Math.round((paceMinPerKm - minutes) * 60)
  if (seconds === 60) {
    minutes += 1
    seconds = 0
  }
  return `${minutes}'${seconds.toString().padStart(2, '0')}"`
}

/**
 * Temps de course lisible à partir d'une durée en minutes.
 * Sous l'heure : `m'ss"` (ex. 44'30"). Au-delà : `h'mm` (ex. 3h45).
 */
export function formatRaceTime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—'
  const totalSeconds = Math.round(minutes * 60)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`
  return `${m}'${s.toString().padStart(2, '0')}"`
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
    (a, b) => b - a,
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

/**
 * Total d'une métrique par mois sur les `months` derniers mois (ordre
 * chronologique, le dernier élément = mois courant). Pour les sparklines.
 * Distance en km, temps en heures — arrondis.
 */
export function monthlyTrend(
  activities: SportActivity[],
  metric: 'distance' | 'time',
  months = 12,
  now: Date = new Date(),
): number[] {
  const buckets = new Array<number>(months).fill(0)
  for (const a of activities) {
    const d = new Date(a.startDate)
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
    if (diff < 0 || diff >= months) continue
    const idx = months - 1 - diff
    buckets[idx] += metric === 'time' ? a.movingTime / 60 : a.distance
  }
  return buckets.map((v) => Math.round(v))
}

export interface WeeklyData {
  distance: number
  runs: number
}

export interface WeeklyVolume {
  weekStart: number
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
  weeklyVolumes: WeeklyVolume[]
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
    last4Weeks.length > 0 ? last4Weeks.reduce((s, [, d]) => s + d.runs, 0) / last4Weeks.length : 0

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
          const weekRuns = runs.filter((r) => getWeekStart(new Date(r.startDate)) === weekStart)
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

  // Volume des 8 dernières semaines, ordre chronologique (ancien -> récent),
  // pour visualiser la tendance dans l'analyse d'entraînement (#7).
  const weeklyVolumes: WeeklyVolume[] = sortedWeeks
    .map(([weekStart, d]) => ({ weekStart, distance: d.distance, runs: d.runs }))
    .reverse()

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
    weeklyVolumes,
    alerts,
  }
}

/** Distances officielles pour l'estimation des records (#5). */
export const RACE_DISTANCES: { distance: number; label: string }[] = [
  { distance: 5, label: '5 km' },
  { distance: 10, label: '10 km' },
  { distance: 21.1, label: 'Semi' },
  { distance: 42.2, label: 'Marathon' },
]

export interface RaceEffort {
  distance: number
  label: string
  /** Temps estimé (minutes) ramené à la distance officielle via Riegel. */
  estimatedTime: number
  /** Vrai si l'estimation provient d'une sortie de distance différente. */
  estimated: boolean
  activity: SportActivity
}

export interface PersonalRecords {
  /** Meilleure allure moyenne (min/km) sur une sortie ≥ 1 km. */
  bestAvgPace: { paceMinPerKm: number; activity: SportActivity } | null
  longestRun: SportActivity | null
  biggestElevation: SportActivity | null
  efforts: RaceEffort[]
}

/**
 * Records personnels de course. Comme on ne dispose que des données niveau
 * activité (pas des splits), les efforts par distance officielle sont estimés
 * via la formule de Riegel (`temps × (D/distance)^1.06`) sur les sorties ≥ D,
 * en gardant le meilleur. Marqués `estimated` dès que la distance diffère.
 */
export function computePersonalRecords(runs: SportActivity[]): PersonalRecords {
  const valid = runs.filter((r) => r.distance > 0 && r.movingTime > 0)
  if (valid.length === 0) {
    return { bestAvgPace: null, longestRun: null, biggestElevation: null, efforts: [] }
  }

  let bestAvgPace: PersonalRecords['bestAvgPace'] = null
  let longestRun: SportActivity | null = null
  let biggestElevation: SportActivity | null = null

  for (const r of valid) {
    if (r.distance >= 1) {
      const pace = r.movingTime / r.distance // min/km
      if (!bestAvgPace || pace < bestAvgPace.paceMinPerKm) {
        bestAvgPace = { paceMinPerKm: pace, activity: r }
      }
    }
    if (!longestRun || r.distance > longestRun.distance) longestRun = r
    if (!biggestElevation || r.totalElevationGain > biggestElevation.totalElevationGain) {
      biggestElevation = r
    }
  }

  const efforts: RaceEffort[] = []
  for (const { distance, label } of RACE_DISTANCES) {
    const candidates = valid.filter((r) => r.distance >= distance * 0.95)
    if (candidates.length === 0) continue
    let best: { time: number; activity: SportActivity } | null = null
    for (const r of candidates) {
      const equivalent = r.movingTime * (distance / r.distance) ** 1.06
      if (!best || equivalent < best.time) best = { time: equivalent, activity: r }
    }
    if (best) {
      efforts.push({
        distance,
        label,
        estimatedTime: best.time,
        estimated: Math.abs(best.activity.distance - distance) > distance * 0.03,
        activity: best.activity,
      })
    }
  }

  return { bestAvgPace, longestRun, biggestElevation, efforts }
}

const MONTHS_FR = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
]

export interface PaceProgressionPoint {
  month: string // 'YYYY-MM'
  label: string // mois court FR
  /** Allure équivalente 10 km (min/km), null si aucune sortie ce mois-là. */
  equivPace: number | null
  runs: number
}

/**
 * Progression d'allure sur les `months` derniers mois. Chaque sortie ≥ 2 km est
 * ramenée à une allure équivalente 10 km (Riegel) avant moyenne mensuelle, pour
 * comparer des mois aux distances différentes sans biais. Ordre chronologique.
 */
export function paceProgression(
  runs: SportActivity[],
  months = 12,
  now: Date = new Date(),
): PaceProgressionPoint[] {
  const sum = new Array<number>(months).fill(0)
  const count = new Array<number>(months).fill(0)
  for (const a of runs) {
    if (a.distance < 2 || a.movingTime <= 0) continue
    const d = new Date(a.startDate)
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
    if (diff < 0 || diff >= months) continue
    const idx = months - 1 - diff
    const equivPace = (a.movingTime * (10 / a.distance) ** 1.06) / 10
    sum[idx] += equivPace
    count[idx] += 1
  }
  return Array.from({ length: months }, (_, i) => {
    const monthsBack = months - 1 - i
    const dt = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
    return {
      month: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`,
      label: MONTHS_FR[dt.getMonth()],
      equivPace: count[i] > 0 ? sum[i] / count[i] : null,
      runs: count[i],
    }
  })
}

export interface RunCalendarDay {
  date: string
  count: number // km arrondis du jour
  level: 0 | 1 | 2 | 3 | 4
}

/**
 * Jours de course d'une année au format attendu par ContributionCalendar.
 * La clé de date est construite comme le calendrier la cherchera (minuit local
 * → ISO) pour garantir l'alignement quel que soit le fuseau. Niveau par paliers
 * de distance cumulée du jour.
 */
export function runCalendar(runs: SportActivity[], year: number): RunCalendarDay[] {
  const byDay = new Map<string, number>()
  for (const a of runs) {
    const d = new Date(a.startDate)
    if (d.getFullYear() !== year) continue
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split('T')[0]
    byDay.set(key, (byDay.get(key) || 0) + a.distance)
  }
  return Array.from(byDay.entries()).map(([date, km]) => ({
    date,
    count: Math.round(km),
    level: km >= 15 ? 4 : km >= 10 ? 3 : km >= 5 ? 2 : km > 0 ? 1 : 0,
  }))
}

export interface PaceDistribution {
  /** Volume (km) par zone d'intensité. */
  easy: number
  tempo: number
  hard: number
  /** Allure seuil estimée (min/km) servant d'ancre aux zones. */
  thresholdPace: number
}

/**
 * Répartition du volume (km) par intensité, ancrée sur une allure seuil estimée
 * (25e centile des allures = le quart le plus rapide). Révèle si l'entraînement
 * est polarisé ou « coincé au milieu ».
 *  - intense : plus rapide que le seuil
 *  - tempo   : seuil .. seuil × 1.15
 *  - facile  : plus lent que seuil × 1.15
 */
export function paceDistribution(runs: SportActivity[]): PaceDistribution {
  const valid = runs.filter((r) => r.distance > 0 && r.movingTime > 0)
  if (valid.length === 0) return { easy: 0, tempo: 0, hard: 0, thresholdPace: 0 }

  const paces = valid.map((r) => r.movingTime / r.distance).sort((a, b) => a - b)
  const thresholdPace = paces[Math.floor(paces.length * 0.25)] ?? paces[0]

  let easy = 0
  let tempo = 0
  let hard = 0
  for (const r of valid) {
    const pace = r.movingTime / r.distance
    if (pace < thresholdPace) hard += r.distance
    else if (pace <= thresholdPace * 1.15) tempo += r.distance
    else easy += r.distance
  }
  return { easy, tempo, hard, thresholdPace }
}

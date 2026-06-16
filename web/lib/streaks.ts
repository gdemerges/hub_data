import type { ActivitySource, UnifiedActivity } from './activity'

export interface Streak {
  /** Jours consécutifs actifs se terminant aujourd'hui (ou hier si rien aujourd'hui). */
  current: number
  /** Plus longue série de jours consécutifs sur la fenêtre disponible. */
  longest: number
}

export interface SourceStreak extends Streak {
  source: ActivitySource
  label: string
}

export interface StreaksResult {
  /** Série "jour actif" : au moins une source active dans la journée. */
  combined: Streak
  bySource: SourceStreak[]
}

function prevDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() - 1)
  return dt.toISOString().slice(0, 10)
}

/**
 * Calcule la série courante et la plus longue à partir d'un map clairsemé
 * `{ 'YYYY-MM-DD': count }`. Un jour est "actif" si son compteur est > 0.
 *
 * La série courante part d'aujourd'hui ; si aujourd'hui est vide (la journée
 * n'est pas finie) on démarre la veille pour ne pas casser une série vivante.
 */
export function computeStreak(byDate: Record<string, number>, today: string): Streak {
  const active = (d: string) => (byDate[d] ?? 0) > 0

  // Série courante
  let cursor = active(today) ? today : prevDay(today)
  let current = 0
  while (active(cursor)) {
    current++
    cursor = prevDay(cursor)
  }

  // Série la plus longue : on parcourt les dates actives triées.
  const dates = Object.keys(byDate)
    .filter((d) => byDate[d] > 0)
    .sort()
  let longest = 0
  let run = 0
  let prev: string | null = null
  for (const d of dates) {
    if (prev !== null && prevDay(d) === prev) {
      run++
    } else {
      run = 1
    }
    if (run > longest) longest = run
    prev = d
  }

  return { current, longest }
}

/**
 * Calcule les séries par source + une série combinée "jour actif" à partir
 * de l'activité unifiée déjà chargée pour la heatmap.
 */
export function computeStreaks(activity: UnifiedActivity): StreaksResult {
  const today = activity.endDate

  const bySource: SourceStreak[] = activity.sources.map((s) => ({
    source: s.source,
    label: s.label,
    ...computeStreak(s.byDate, today),
  }))

  const combinedByDate: Record<string, number> = {}
  for (const s of activity.sources) {
    for (const [date, count] of Object.entries(s.byDate)) {
      if (count > 0) combinedByDate[date] = (combinedByDate[date] ?? 0) + count
    }
  }

  return { combined: computeStreak(combinedByDate, today), bySource }
}

import type { Series } from './types'

/** Somme des minutes de visionnage (colonne SerieBox « Minutes ») d'une liste de séries. */
export function totalSeriesMinutes(series: Series[]): number {
  return series.reduce((sum, s) => sum + (s.watchMinutes ?? 0), 0)
}

/** Minutes -> heures arrondies, séparateur de milliers FR (ex. `1 241 h`). */
export function formatWatchHours(minutes: number): string {
  const safe = Number.isFinite(minutes) && minutes > 0 ? minutes : 0
  const hours = Math.round(safe / 60)
  const withSeparator = String(hours).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${withSeparator} h`
}

import type { Accent } from './accents'
import type { Book, Film, Game } from './types'

// Pas de 'series' : SerieBox n'exporte aucune date de fin de visionnage.
export type OnThisDayType = 'film' | 'game' | 'book'

export interface OnThisDayEvent {
  type: OnThisDayType
  title: string
  subtitle?: string
  /** Date normalisée YYYY-MM-DD. */
  date: string
  year: number
  /** Nombre d'années écoulées (0 = cette année, 1 = l'an dernier, …). */
  yearsAgo: number
  accent: Accent
}

interface Ymd {
  year: number
  month: number
  day: number
}

/**
 * Parse une date ISO `YYYY-MM-DD` ou française `DD/MM/YYYY` (les livres
 * utilisent le format français). Retourne null si absente / non reconnue.
 */
export function parseDate(raw?: string | null): Ymd | null {
  if (!raw) return null
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return { year: +iso[1], month: +iso[2], day: +iso[3] }
  const fr = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (fr) return { year: +fr[3], month: +fr[2], day: +fr[1] }
  return null
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export interface OnThisDayInput {
  films: Film[]
  games: Game[]
  books: Book[]
}

/**
 * Retourne tous les événements survenus un même jour calendaire (même mois +
 * même quantième) que `today`, années passées et courante confondues, triés
 * du plus récent au plus ancien. Seules les vraies dates de consommation sont
 * prises en compte — pas les fallbacks d'année de sortie.
 */
export function eventsOnThisDay(input: OnThisDayInput, today: string): OnThisDayEvent[] {
  const ref = parseDate(today)
  if (!ref) return []

  const events: OnThisDayEvent[] = []

  const push = (
    type: OnThisDayType,
    title: string,
    accent: Accent,
    raw: string | undefined,
    subtitle?: string,
  ) => {
    const d = parseDate(raw)
    if (!d || d.month !== ref.month || d.day !== ref.day) return
    if (d.year > ref.year) return // pas de date future
    events.push({
      type,
      title,
      subtitle,
      date: `${d.year}-${pad(d.month)}-${pad(d.day)}`,
      year: d.year,
      yearsAgo: ref.year - d.year,
      accent,
    })
  }

  for (const f of input.films) {
    push('film', f.title, 'terracotta', f.dateWatched, f.rating ? `Note ${f.rating}/10` : undefined)
  }
  for (const g of input.games) {
    const raw = g.dateFinished || g.dateStarted
    const sub = g.dateFinished ? 'Terminé' : g.dateStarted ? 'Commencé' : undefined
    push('game', g.title, 'moss', raw, sub)
  }
  for (const b of input.books) {
    push('book', b.title, 'indigo', b.dateRead, b.author)
  }

  return events.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title))
}

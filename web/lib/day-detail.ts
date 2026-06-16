import type { Accent } from './accents'
import { parseDate } from './on-this-day'
import type { Book, Film, Game } from './types'

// Pas de 'series' : SerieBox n'exporte aucune date de fin de visionnage.
export type DayEventType = 'film' | 'game' | 'book'

export interface DayEvent {
  type: DayEventType
  title: string
  subtitle?: string
  accent: Accent
}

export interface DayDetailInput {
  films: Film[]
  games: Game[]
  books: Book[]
}

/** Normalise une date ISO ou française vers `YYYY-MM-DD`, ou null. */
function toIso(raw?: string | null): string | null {
  const d = parseDate(raw)
  if (!d) return null
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}

/**
 * Tous les événements nommés (films/séries/jeux/livres) survenus à une date
 * exacte. Sert au détail de journée déclenché depuis la heatmap. Les sources
 * uniquement quantitatives (sport/GitHub/Claude) restent gérées côté client
 * via les compteurs déjà chargés.
 */
export function eventsOnDate(input: DayDetailInput, date: string): DayEvent[] {
  const target = toIso(date)
  if (!target) return []

  const events: DayEvent[] = []

  for (const f of input.films) {
    if (toIso(f.dateWatched) === target) {
      events.push({
        type: 'film',
        title: f.title,
        accent: 'terracotta',
        subtitle: f.rating ? `Note ${f.rating}/10` : undefined,
      })
    }
  }
  for (const g of input.games) {
    const finished = toIso(g.dateFinished) === target
    const started = toIso(g.dateStarted) === target
    if (finished || started) {
      events.push({
        type: 'game',
        title: g.title,
        accent: 'moss',
        subtitle: finished ? 'Terminé' : 'Commencé',
      })
    }
  }
  for (const b of input.books) {
    if (toIso(b.dateRead) === target) {
      events.push({ type: 'book', title: b.title, accent: 'indigo', subtitle: b.author })
    }
  }

  return events
}

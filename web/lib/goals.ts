import type { Film, Game, Book } from './types'
import type { Accent } from './accents'

export type GoalKey = 'books' | 'films' | 'series' | 'games' | 'github'

export interface GoalProgress {
  key: GoalKey
  label: string
  accent: Accent
  href: string
  current: number
  target: number
  /** Pourcentage borné à 100 pour la barre de progression. */
  pct: number
  /**
   * Objectif non mesurable faute de date à la source (cas des séries : SerieBox
   * n'exporte pas de date de fin de visionnage). L'UI affiche un badge « non daté »
   * au lieu d'un compteur trompeur à 0.
   */
  undated?: boolean
}

/**
 * Objectifs annuels par défaut. Personnels et facilement ajustables ici —
 * pas de configuration externe pour ce dashboard mono-utilisateur.
 */
export const DEFAULT_TARGETS: Record<GoalKey, number> = {
  books: 24,
  films: 52,
  series: 15,
  games: 12,
  github: 1500,
}

/**
 * Extrait l'année d'une date au format ISO `YYYY-MM-DD` ou français
 * `DD/MM/YYYY` (les livres utilisent le format français). Retourne null si
 * la date est absente ou non reconnue.
 */
export function yearOf(date?: string | null): number | null {
  if (!date) return null
  const iso = date.match(/^(\d{4})-\d{2}-\d{2}/)
  if (iso) return Number(iso[1])
  const fr = date.match(/^\d{2}\/\d{2}\/(\d{4})/)
  if (fr) return Number(fr[1])
  return null
}

function countInYear(dates: Array<string | undefined>, year: number): number {
  return dates.reduce((n, d) => (yearOf(d) === year ? n + 1 : n), 0)
}

export interface GoalsInput {
  films: Film[]
  games: Game[]
  books: Book[]
  /** Contributions GitHub déjà cadrées sur l'année (via getGitHubContributions). */
  githubContributions: number
  year: number
}

function progress(
  key: GoalKey,
  label: string,
  accent: Accent,
  href: string,
  current: number,
  target: number
): GoalProgress {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  return { key, label, accent, href, current, target, pct }
}

export function computeGoals(
  input: GoalsInput,
  targets: Record<GoalKey, number> = DEFAULT_TARGETS
): GoalProgress[] {
  const { films, games, books, githubContributions, year } = input

  return [
    progress(
      'books',
      'Livres lus',
      'indigo',
      '/books',
      countInYear(books.map((b) => b.dateRead), year),
      targets.books
    ),
    progress(
      'films',
      'Films vus',
      'terracotta',
      '/films',
      countInYear(films.map((f) => f.dateWatched), year),
      targets.films
    ),
    // Séries non datables (cf. GoalProgress.undated) : pas de comptage par année.
    {
      ...progress('series', 'Séries terminées', 'saffron', '/series', 0, targets.series),
      undated: true,
    },
    progress(
      'games',
      'Jeux finis',
      'moss',
      '/games',
      countInYear(games.map((g) => g.dateFinished), year),
      targets.games
    ),
    progress('github', 'Contributions', 'fern', '/github', githubContributions, targets.github),
  ]
}

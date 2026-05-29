import type { Film, Series } from '@/lib/types'

export interface HeroBackdrop {
  url: string
  title: string
}

const POOL_SIZE = 12
const MS_PER_DAY = 86_400_000

type Rated = { title: string; avgRating?: number; rating?: number; backdropUrl?: string }
type RatedWithBackdrop = Rated & { backdropUrl: string }

// avgRating en priorité ; rating en secours ; 0 si non noté
function score(item: Rated): number {
  return item.avgRating ?? item.rating ?? 0
}

/**
 * Choisit un backdrop « du jour » de façon déterministe parmi les films + séries
 * les mieux notés. Stable sur une journée UTC (seed = floor(ms / MS_PER_DAY)),
 * tourne chaque jour. Retourne null si aucun titre n'a de backdrop.
 */
export function pickDailyBackdrop(
  films: Film[],
  series: Series[],
  date: Date,
): HeroBackdrop | null {
  const pool: RatedWithBackdrop[] = [...films, ...series]
    .filter((item): item is RatedWithBackdrop => Boolean(item.backdropUrl))
    .sort((a, b) => score(b) - score(a))
    .slice(0, POOL_SIZE)

  if (pool.length === 0) return null

  const seed = Math.floor(date.getTime() / MS_PER_DAY)
  const index = ((seed % pool.length) + pool.length) % pool.length
  const chosen = pool[index]
  return { url: chosen.backdropUrl, title: chosen.title }
}

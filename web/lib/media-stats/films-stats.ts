import { seriesColor } from '@/lib/chart'
import type { Film } from '@/lib/types'

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export interface FilmStatsData {
  totalFilms: number
  totalMinutes: number
  avgRuntime: number
  avgRating: number
  bestRated: Film | undefined
  topRated: Film[]
  genreData: { label: string; value: number; color: string }[]
  yearData: [number, number][]
  yearMax: number
  decadeData: [number, number][]
  decadeMax: number
  ratingData: [number, number][]
  ratingMax: number
}

// IMPORTANT : les tableaux retournés (topRated, genreData, etc.)
// réutilisent les références des objets Film reçus — ne pas les cloner. React Flight
// dédoublonne les références répétées dans le payload RSC ; un clone le ferait doubler.
export function computeFilmStats(films: Film[]): FilmStatsData {
  const totalFilms = films.length
  const totalMinutes = films.reduce((sum, f) => sum + (f.runtime ?? 0), 0)
  const withRuntime = films.filter((f) => (f.runtime ?? 0) > 0)
  const avgRuntime = avg(withRuntime.map((f) => f.runtime as number))
  const rated = films.filter((f) => f.rating && f.rating > 0)
  const avgRating = avg(rated.map((f) => f.rating as number))
  const bestRated = [...films]
    .filter((f) => f.rating && f.rating > 0)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0]

  // Top 10 par note personnelle
  const topRated = [...films]
    .filter((f) => f.rating && f.rating > 0)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.runtime ?? 0) - (a.runtime ?? 0))
    .slice(0, 10)

  // Répartition par genre (nombre de films)
  const genreCounts = new Map<string, number>()
  for (const f of films) {
    for (const g of f.genres ?? []) {
      genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1)
    }
  }
  const genreData = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value], i) => ({ label, value, color: seriesColor(i) }))

  // Films vus par année (date de visionnage)
  const watchedByYear = new Map<number, number>()
  films.forEach((f) => {
    const y = f.dateWatched ? Number(f.dateWatched.slice(0, 4)) : null
    if (!y || Number.isNaN(y)) return
    watchedByYear.set(y, (watchedByYear.get(y) ?? 0) + 1)
  })
  const yearData = [...watchedByYear.entries()].sort((a, b) => a[0] - b[0])
  const yearMax = Math.max(...yearData.map(([, v]) => v), 1)

  // Films par décennie de sortie
  const decadeCounts = new Map<number, number>()
  films.forEach((f) => {
    if (!f.releaseYear) return
    const decade = Math.floor(f.releaseYear / 10) * 10
    decadeCounts.set(decade, (decadeCounts.get(decade) ?? 0) + 1)
  })
  const decadeData = [...decadeCounts.entries()].sort((a, b) => a[0] - b[0])
  const decadeMax = Math.max(...decadeData.map(([, v]) => v), 1)

  // Répartition des notes personnelles
  const ratingCounts = new Map<number, number>()
  rated.forEach((f) => {
    const r = Math.round(f.rating as number)
    ratingCounts.set(r, (ratingCounts.get(r) ?? 0) + 1)
  })
  const ratingData = [...ratingCounts.entries()].sort((a, b) => b[0] - a[0])
  const ratingMax = Math.max(...ratingData.map(([, v]) => v), 1)

  return {
    totalFilms,
    totalMinutes,
    avgRuntime,
    avgRating,
    bestRated,
    topRated,
    genreData,
    yearData,
    yearMax,
    decadeData,
    decadeMax,
    ratingData,
    ratingMax,
  }
}

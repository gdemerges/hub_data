import { seriesColor } from '@/lib/chart'
import { totalSeriesMinutes } from '@/lib/series-time'
import type { Series } from '@/lib/types'

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export interface SeriesStatsData {
  totalSeries: number
  totalMinutes: number
  totalEpisodes: number
  avgRating: number
  mostWatched: Series | undefined
  topWatched: Series[]
  genreData: { label: string; value: number; color: string }[]
  statusData: [string, number][]
  statusTotal: number
  decadeData: [number, number][]
  decadeMax: number
  channelData: { name: string; minutes: number; count: number }[]
  channelMax: number
}

// IMPORTANT : les tableaux retournés (topWatched, genreData, channelData, etc.)
// réutilisent les références des objets Series reçus — ne pas les cloner. React Flight
// dédoublonne les références répétées dans le payload RSC ; un clone le ferait doubler.
export function computeSeriesStats(series: Series[]): SeriesStatsData {
  const totalSeries = series.length
  const totalMinutes = totalSeriesMinutes(series)
  const totalEpisodes = series.reduce((sum, s) => sum + (s.episodesWatched ?? 0), 0)
  const rated = series.filter((s) => s.rating && s.rating > 0)
  const avgRating = avg(rated.map((s) => s.rating as number))
  const mostWatched = [...series].sort((a, b) => (b.watchMinutes ?? 0) - (a.watchMinutes ?? 0))[0]

  // Top 10 par heures de visionnage
  const topWatched = [...series]
    .filter((s) => (s.watchMinutes ?? 0) > 0)
    .sort((a, b) => (b.watchMinutes ?? 0) - (a.watchMinutes ?? 0))
    .slice(0, 10)

  // Répartition par genre (nombre de séries)
  const genreCounts = new Map<string, number>()
  for (const s of series) {
    for (const g of s.genres ?? []) {
      genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1)
    }
  }
  const genreData = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value], i) => ({ label, value, color: seriesColor(i) }))

  // Répartition par statut
  const statusCounts = new Map<string, number>()
  for (const s of series) {
    const key = s.status ?? 'Inconnu'
    statusCounts.set(key, (statusCounts.get(key) ?? 0) + 1)
  }
  const statusData = [...statusCounts.entries()].sort((a, b) => b[1] - a[1])
  const statusTotal = statusData.reduce((sum, [, v]) => sum + v, 0)

  // Heures par décennie de sortie
  const decadeMinutes = new Map<number, number>()
  for (const s of series) {
    if (!s.releaseYear || !s.watchMinutes) continue
    const decade = Math.floor(s.releaseYear / 10) * 10
    decadeMinutes.set(decade, (decadeMinutes.get(decade) ?? 0) + s.watchMinutes)
  }
  const decadeData = [...decadeMinutes.entries()].sort((a, b) => a[0] - b[0])
  const decadeMax = Math.max(...decadeData.map(([, v]) => v), 1)

  // Top chaînes / plateformes : heures + nombre de séries
  const channelStats = new Map<string, { minutes: number; count: number }>()
  for (const s of series) {
    if (!s.channel) continue
    const entry = channelStats.get(s.channel) ?? { minutes: 0, count: 0 }
    entry.minutes += s.watchMinutes ?? 0
    entry.count += 1
    channelStats.set(s.channel, entry)
  }
  const channelData = [...channelStats.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count || b.minutes - a.minutes)
    .slice(0, 8)
  const channelMax = Math.max(...channelData.map((c) => c.count), 1)

  return {
    totalSeries,
    totalMinutes,
    totalEpisodes,
    avgRating,
    mostWatched,
    topWatched,
    genreData,
    statusData,
    statusTotal,
    decadeData,
    decadeMax,
    channelData,
    channelMax,
  }
}

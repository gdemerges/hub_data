import 'server-only'
import { getPlaytimeByYear } from './steam-storage'

export interface PlaytimeEntry {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface PlaytimeData {
  totalHours: number
  totalMinutes: number
  daysPlayed: number
  playtime: PlaytimeEntry[]
}

export async function loadPlaytime(year: number): Promise<PlaytimeData> {
  const entries = getPlaytimeByYear(year)
  const maxMinutes = Math.max(...entries.map((e) => e.totalMinutes), 1)

  const playtime: PlaytimeEntry[] = entries.map((entry) => {
    let level: 0 | 1 | 2 | 3 | 4
    const ratio = entry.totalMinutes / maxMinutes
    if (entry.totalMinutes === 0) level = 0
    else if (ratio <= 0.25) level = 1
    else if (ratio <= 0.5) level = 2
    else if (ratio <= 0.75) level = 3
    else level = 4
    return { date: entry.date, count: entry.totalMinutes, level }
  })

  const totalMinutes = entries.reduce((sum, e) => sum + e.totalMinutes, 0)
  return {
    totalHours: Math.floor(totalMinutes / 60),
    totalMinutes,
    daysPlayed: entries.filter((e) => e.totalMinutes > 0).length,
    playtime,
  }
}

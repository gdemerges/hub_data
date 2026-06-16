import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PLAY_LOG_DIR = resolve(process.cwd(), '../data/play-log')

export interface PlayLogEntry {
  title: string
  support: string
  hoursBefore: number
  hoursAfter: number
  delta: number
  flags?: ('new' | 'negative' | 'large_jump')[]
}

export interface PlayLogDay {
  date: string
  previousSnapshot: string | null
  entries: PlayLogEntry[]
}

export interface PlayLogMonth {
  month: string
  days: PlayLogDay[]
}

export interface MonthlyGamePlaytime {
  title: string
  support: string
  hours: number
  daysPlayed: number
}

function readMonth(month: string): PlayLogMonth | null {
  const file = resolve(PLAY_LOG_DIR, `${month}.json`)
  if (!existsSync(file)) return null
  try {
    return JSON.parse(readFileSync(file, 'utf-8')) as PlayLogMonth
  } catch {
    return null
  }
}

export function listAvailableMonths(): string[] {
  if (!existsSync(PLAY_LOG_DIR)) return []
  return readdirSync(PLAY_LOG_DIR)
    .filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
    .map((f) => f.slice(0, 7))
    .sort()
}

// Aggregate per game for a given YYYY-MM. Only positive deltas count toward "hours played"
// (negatives are SerieBox corrections, not actual playtime).
export function getMonthlyPlaytime(month: string): MonthlyGamePlaytime[] {
  const log = readMonth(month)
  if (!log) return []

  const byKey = new Map<string, MonthlyGamePlaytime>()
  for (const day of log.days) {
    for (const e of day.entries) {
      if (e.delta <= 0) continue
      const key = `${e.title}::${e.support}`
      const existing = byKey.get(key)
      if (existing) {
        existing.hours += e.delta
        existing.daysPlayed += 1
      } else {
        byKey.set(key, {
          title: e.title,
          support: e.support,
          hours: e.delta,
          daysPlayed: 1,
        })
      }
    }
  }

  return Array.from(byKey.values()).sort((a, b) => b.hours - a.hours)
}

export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

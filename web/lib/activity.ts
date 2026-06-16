import 'server-only'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getBooksData, getFilmsData, getGamesData } from './data'
import { loadGitHubContributions } from './github'
import { logger } from './logger'

export type ActivitySource = 'films' | 'games' | 'books' | 'sport' | 'github' | 'claude'

export interface ActivityHeatmapData {
  source: ActivitySource
  label: string
  total: number
  // 365 entries terminating today; sparse Map keyed by YYYY-MM-DD with counts.
  byDate: Record<string, number>
}

export interface UnifiedActivity {
  endDate: string // YYYY-MM-DD (today)
  startDate: string // YYYY-MM-DD (today minus 364 days)
  sources: ActivityHeatmapData[]
}

const SOURCE_LABELS: Record<ActivitySource, string> = {
  films: 'Films vus',
  games: 'Jeux finis',
  books: 'Livres lus',
  sport: 'Sport',
  github: 'GitHub',
  claude: 'Claude Code',
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function dateMinusDays(days: number, ref: Date = new Date()): string {
  const d = new Date(ref)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

// Parse French datetime "DD/MM/YYYY HH:MM" or "DD/MM/YYYY".
function parseFrenchDate(raw?: string): string | null {
  if (!raw) return null
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (!m) return null
  const [, d, mo, y] = m
  return `${y}-${mo}-${d}`
}

function inWindow(date: string, start: string, end: string): boolean {
  return date >= start && date <= end
}

function increment(map: Record<string, number>, date: string): void {
  map[date] = (map[date] ?? 0) + 1
}

interface StravaActivity {
  start_date: string
}

async function loadStravaActivitiesForYear(): Promise<StravaActivity[]> {
  // Bypass loadStrava() since it returns only the recent slice. Read tokens
  // and call /activities directly, paged. Failures degrade silently.
  try {
    const tokenFile = path.join(process.cwd(), 'data', 'strava-tokens.json')
    if (!fs.existsSync(tokenFile)) return []
    const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'))
    const now = Math.floor(Date.now() / 1000)
    if (tokens.expires_at <= now) return []
    const after = Math.floor((Date.now() - 365 * 86400000) / 1000)
    const all: StravaActivity[] = []
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100&page=${page}`,
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
          next: { revalidate: 1800 },
        },
      )
      if (!res.ok) break
      const items = (await res.json()) as StravaActivity[]
      if (!items.length) break
      all.push(...items)
      if (items.length < 100) break
    }
    return all
  } catch (e) {
    logger.error('Activity heatmap: Strava load failed:', e)
    return []
  }
}

interface ClaudeDaily {
  date: string
  messageCount: number
  sessionCount: number
}

function loadClaudeDaily(): ClaudeDaily[] {
  try {
    const file = path.join(os.homedir(), '.claude', 'stats-cache.json')
    if (!fs.existsSync(file)) return []
    const raw = JSON.parse(fs.readFileSync(file, 'utf-8'))
    return (raw.dailyActivity ?? []) as ClaudeDaily[]
  } catch {
    return []
  }
}

export async function loadUnifiedActivity(githubUsername: string): Promise<UnifiedActivity> {
  const endDate = isoToday()
  const startDate = dateMinusDays(364)

  // Films / games / books are statically available, fast.
  const [films, games, books] = await Promise.all([getFilmsData(), getGamesData(), getBooksData()])

  const filmMap: Record<string, number> = {}
  for (const f of films) {
    if (f.dateWatched && inWindow(f.dateWatched, startDate, endDate)) {
      increment(filmMap, f.dateWatched)
    }
  }

  const gameMap: Record<string, number> = {}
  for (const g of games) {
    const d = g.dateFinished
    if (d && inWindow(d, startDate, endDate)) increment(gameMap, d)
  }

  const bookMap: Record<string, number> = {}
  for (const b of books) {
    const d = parseFrenchDate(b.dateRead)
    if (d && inWindow(d, startDate, endDate)) increment(bookMap, d)
  }

  // Sport, GitHub, Claude — best effort, catch errors.
  const [strava, ghThisYear, ghLastYear, claudeDaily] = await Promise.all([
    loadStravaActivitiesForYear(),
    loadGitHubContributions(githubUsername, new Date().getFullYear()),
    loadGitHubContributions(githubUsername, new Date().getFullYear() - 1),
    Promise.resolve(loadClaudeDaily()),
  ])

  const sportMap: Record<string, number> = {}
  for (const a of strava) {
    const d = a.start_date?.slice(0, 10)
    if (d && inWindow(d, startDate, endDate)) increment(sportMap, d)
  }

  const githubMap: Record<string, number> = {}
  for (const c of ghThisYear?.contributions ?? []) {
    if (inWindow(c.date, startDate, endDate)) githubMap[c.date] = c.count
  }
  for (const c of ghLastYear?.contributions ?? []) {
    if (inWindow(c.date, startDate, endDate) && !(c.date in githubMap)) {
      githubMap[c.date] = c.count
    }
  }

  const claudeMap: Record<string, number> = {}
  for (const c of claudeDaily) {
    if (inWindow(c.date, startDate, endDate)) {
      claudeMap[c.date] = c.sessionCount
    }
  }

  const draft: ActivityHeatmapData[] = [
    { source: 'films', label: SOURCE_LABELS.films, byDate: filmMap, total: 0 },
    { source: 'games', label: SOURCE_LABELS.games, byDate: gameMap, total: 0 },
    { source: 'books', label: SOURCE_LABELS.books, byDate: bookMap, total: 0 },
    { source: 'sport', label: SOURCE_LABELS.sport, byDate: sportMap, total: 0 },
    { source: 'github', label: SOURCE_LABELS.github, byDate: githubMap, total: 0 },
    { source: 'claude', label: SOURCE_LABELS.claude, byDate: claudeMap, total: 0 },
  ]
  const sources = draft.map((s) => ({
    ...s,
    total: Object.values(s.byDate).reduce((a, b) => a + b, 0),
  }))

  return { startDate, endDate, sources }
}

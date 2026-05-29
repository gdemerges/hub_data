import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'csv-parse/sync'

const ROOT = resolve(__dirname, '../..')
const SERIEBOX_DIR = resolve(ROOT, 'data/seriebox')
const SNAPSHOT_DIR = resolve(SERIEBOX_DIR, 'snapshots')
const PLAY_LOG_DIR = resolve(ROOT, 'data/play-log')

const SOURCE_CSV = resolve(SERIEBOX_DIR, 'jeux.csv')

// Heuristic thresholds. We never DROP entries — we flag them so the UI can decide.
const SUSPECT_HOURS_JUMP = 24

type Row = {
  Titre: string
  Support: string
  'Heures de jeu': string
}

type GameKey = string // `${Titre}::${Support}`

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function monthKey(date: string): string {
  return date.slice(0, 7)
}

function parseCSV(path: string): Map<GameKey, number> {
  const csv = readFileSync(path, 'utf-8')
  const rows = parse(csv, {
    columns: true,
    delimiter: ';',
    skip_empty_lines: true,
  }) as Row[]
  const map = new Map<GameKey, number>()
  for (const r of rows) {
    const title = r.Titre?.trim()
    if (!title) continue
    const support = r.Support?.trim() || ''
    const hours = parseFloat((r['Heures de jeu'] || '0').replace(',', '.')) || 0
    map.set(`${title}::${support}`, hours)
  }
  return map
}

function findPreviousSnapshot(today: string): string | null {
  if (!existsSync(SNAPSHOT_DIR)) return null
  const files = readdirSync(SNAPSHOT_DIR)
    .filter(f => /^jeux-\d{4}-\d{2}-\d{2}\.csv$/.test(f))
    .map(f => f.slice(5, 15)) // YYYY-MM-DD
    .filter(d => d < today)
    .sort()
  return files.length ? files[files.length - 1] : null
}

type DeltaEntry = {
  title: string
  support: string
  hoursBefore: number
  hoursAfter: number
  delta: number
  flags?: ('new' | 'negative' | 'large_jump')[]
}

type DayLog = {
  date: string
  previousSnapshot: string | null
  entries: DeltaEntry[]
}

function computeDeltas(prev: Map<GameKey, number>, curr: Map<GameKey, number>): DeltaEntry[] {
  const entries: DeltaEntry[] = []
  for (const [key, hoursAfter] of curr) {
    const hoursBefore = prev.get(key) ?? 0
    const delta = hoursAfter - hoursBefore
    if (delta === 0) continue

    const [title, support] = key.split('::')
    const flags: DeltaEntry['flags'] = []
    if (!prev.has(key)) flags.push('new')
    if (delta < 0) flags.push('negative')
    if (Math.abs(delta) > SUSPECT_HOURS_JUMP) flags.push('large_jump')

    entries.push({
      title,
      support,
      hoursBefore,
      hoursAfter,
      delta,
      ...(flags.length ? { flags } : {}),
    })
  }
  return entries.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

function upsertMonthlyLog(today: string, dayLog: DayLog) {
  mkdirSync(PLAY_LOG_DIR, { recursive: true })
  const monthFile = resolve(PLAY_LOG_DIR, `${monthKey(today)}.json`)
  let existing: { month: string; days: DayLog[] } = { month: monthKey(today), days: [] }
  if (existsSync(monthFile)) {
    try {
      existing = JSON.parse(readFileSync(monthFile, 'utf-8'))
    } catch {
      // corrupted — start fresh
      existing = { month: monthKey(today), days: [] }
    }
  }
  existing.days = existing.days.filter(d => d.date !== today)
  existing.days.push(dayLog)
  existing.days.sort((a, b) => a.date.localeCompare(b.date))
  writeFileSync(monthFile, JSON.stringify(existing, null, 2))
  return monthFile
}

function main() {
  if (!existsSync(SOURCE_CSV)) {
    console.log('⏭ track-play-deltas: jeux.csv absent, skip')
    return
  }

  const today = todayISO()
  mkdirSync(SNAPSHOT_DIR, { recursive: true })
  const todaySnapshot = resolve(SNAPSHOT_DIR, `jeux-${today}.csv`)

  const prevDate = findPreviousSnapshot(today)

  // Always refresh today's snapshot from the latest CSV
  copyFileSync(SOURCE_CSV, todaySnapshot)

  if (!prevDate) {
    console.log(`📊 track-play-deltas: first snapshot saved (${today}), no previous to compare`)
    return
  }

  const prevSnapshot = resolve(SNAPSHOT_DIR, `jeux-${prevDate}.csv`)
  const prev = parseCSV(prevSnapshot)
  const curr = parseCSV(SOURCE_CSV)
  const entries = computeDeltas(prev, curr)

  const dayLog: DayLog = {
    date: today,
    previousSnapshot: prevDate,
    entries,
  }
  const monthFile = upsertMonthlyLog(today, dayLog)

  const positive = entries.filter(e => e.delta > 0)
  const totalHours = positive.reduce((s, e) => s + e.delta, 0)
  console.log(
    `📊 track-play-deltas: ${entries.length} changes vs ${prevDate} ` +
    `(+${totalHours.toFixed(1)}h on ${positive.length} games) → ${monthFile}`
  )
  for (const e of positive.slice(0, 5)) {
    const flagStr = e.flags ? ` [${e.flags.join(',')}]` : ''
    console.log(`   +${e.delta.toFixed(1)}h ${e.title} (${e.support})${flagStr}`)
  }
}

if (require.main === module) {
  try {
    main()
  } catch (e) {
    console.error('❌ track-play-deltas failed:', e)
    process.exit(1)
  }
}

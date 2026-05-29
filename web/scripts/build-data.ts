import { parse } from 'csv-parse/sync'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { config } from 'dotenv'
import { downloadFromSeriebox } from './download-seriebox'

// Load environment variables
config({ path: resolve(__dirname, '../.env') })

const DATA_DIR = resolve(__dirname, '../../data/seriebox')
const OUTPUT_DIR = resolve(__dirname, '../data')
const COVERS_CACHE_FILE = resolve(__dirname, '../../data/media-covers-cache.json')

const SKIP_DOWNLOAD = process.argv.includes('--skip-download') || process.env.BUILD_DATA_SKIP_DOWNLOAD === '1'

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true })
}

// ============ COVERS CACHE ============

interface CoversCache {
  games: Record<string, string | null>
  films: Record<string, string | null>
  series: Record<string, string | null>
}

function loadCoversCache(): CoversCache {
  try {
    if (existsSync(COVERS_CACHE_FILE)) {
      return JSON.parse(readFileSync(COVERS_CACHE_FILE, 'utf-8'))
    }
  } catch {}
  return { games: {}, films: {}, series: {} }
}

function saveCoversCache(cache: CoversCache): void {
  try {
    writeFileSync(COVERS_CACHE_FILE, JSON.stringify(cache, null, 2))
  } catch (e) {
    console.error('Failed to save covers cache:', e)
  }
}

const coversCache = loadCoversCache()

// ============ GAME NAME MAPPING ============

// Map problematic game names to their correct English titles for better IGDB search
const GAME_NAME_MAP: Record<string, string> = {
  // Polish/other language titles
  'Wiedźmin 3: Dziki Gon': 'The Witcher 3: Wild Hunt',
  'Wiedźmin 2: Zabójcy Królów': 'The Witcher 2: Assassins of Kings',
  'Wiedźmin': 'The Witcher',
  
  // Japanese titles
  'Fainaru Fantajī Surī': 'Final Fantasy III',
  'Fainaru Fantajī': 'Final Fantasy',
  'Doragon Kuesuto IX: Hoshizora no Mamoribito': 'Dragon Quest IX: Sentinels of the Starry Skies',
  'Dragon Quest IX: Hoshizora no Mamoribito': 'Dragon Quest IX: Sentinels of the Starry Skies',
  
  // Pokémon games
  // Use the IGDB canonical names ("Pokémon X Version") so the exact-match score wins.
  'Pocket Monsters Ruby': 'Pokémon Ruby Version',
  'Pocket Monsters Sapphire': 'Pokémon Sapphire Version',
  'Pocket Monsters Emerald': 'Pokémon Emerald Version',
  'Pocket Monsters FireRed': 'Pokémon FireRed Version',
  'Pocket Monsters LeafGreen': 'Pokémon LeafGreen Version',
  'Pocket Monsters Diamond': 'Pokémon Diamond Version',
  'Pocket Monsters Pearl': 'Pokémon Pearl Version',
  'Pocket Monsters Platinum': 'Pokémon Platinum Version',
  'Pocket Monsters HeartGold': 'Pokémon HeartGold Version',
  'Pocket Monsters SoulSilver': 'Pokémon SoulSilver Version',
  'Pocket Monsters Black': 'Pokémon Black Version',
  'Pocket Monsters White': 'Pokémon White Version',
  'Pocket Monsters X': 'Pokémon X',
  'Pocket Monsters Y': 'Pokémon Y',
  'Pokémon GO': 'Pokémon GO',

  // Add more mappings as needed
}

// ============ UTILITIES ============

function parseNumber(value: string): number | undefined {
  if (!value || value === '') return undefined
  const parsed = parseFloat(value.replace(',', '.'))
  return Number.isNaN(parsed) ? undefined : parsed
}

function parseYear(dateStr: string): number | undefined {
  if (!dateStr) return undefined
  const match = dateStr.match(/\d{4}/)
  return match ? parseInt(match[0], 10) : undefined
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Normalize game title for better search
function normalizeGameTitle(title: string): string {
  // Check if we have a direct mapping
  if (GAME_NAME_MAP[title]) {
    return GAME_NAME_MAP[title]
  }
  
  // Remove problematic characters and normalize
  const normalized = title
    .replace(/[?����]/g, '') // Remove question marks and replacement chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
  
  // Try to extract English title from parentheses if present
  const englishMatch = normalized.match(/\(([^)]+)\)/)
  if (englishMatch) {
    return englishMatch[1].trim()
  }
  
  return normalized
}

// ============ IGDB API ============

let igdbToken: { token: string; expiresAt: number } | null = null

async function getIGDBToken(): Promise<string> {
  if (igdbToken && Date.now() < igdbToken.expiresAt - 60000) {
    return igdbToken.token
  }

  const clientId = process.env.IGDB_CLIENT_ID
  const clientSecret = process.env.IGDB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('IGDB credentials not configured')
  }

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to get IGDB access token')
  }

  const data = await response.json()
  igdbToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return igdbToken.token
}

// IGDB game categories: 0=main, 1=dlc, 2=expansion, 3=bundle, 4=standalone_expansion,
// 5=mod, 6=episode, 7=season, 8=remake, 9=remaster, 10=expanded, 11=port, 13=pack, 14=update.
const GOOD_CATEGORIES = new Set([0, 4, 8, 9, 10, 11])

type IgdbGame = {
  name: string
  cover?: { image_id: string }
  category?: number
  total_rating_count?: number
  first_release_date?: number
}

function normalizeForCompare(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

async function searchIgdb(query: string): Promise<IgdbGame[]> {
  const token = await getIGDBToken()
  const clientId = process.env.IGDB_CLIENT_ID!
  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body: `search "${query.replace(/"/g, '')}"; fields name,cover.image_id,category,total_rating_count,first_release_date; limit 10;`,
  })
  if (!response.ok) return []
  return (await response.json()) as IgdbGame[]
}

// Exact-name lookup: bypasses IGDB's fuzzy search. Used when we know the canonical
// IGDB name (via GAME_NAME_MAP). The 'name' field comparison is case-sensitive in
// the where clause, so we match on a slug-style derived field.
async function lookupByName(name: string): Promise<IgdbGame[]> {
  const token = await getIGDBToken()
  const clientId = process.env.IGDB_CLIENT_ID!
  const escaped = name.replace(/"/g, '')
  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body: `fields name,cover.image_id,category,total_rating_count,first_release_date; where name ~ "${escaped}" | name ~ "${escaped}"*; limit 10;`,
  })
  if (!response.ok) return []
  return (await response.json()) as IgdbGame[]
}

function pickBestCandidate(candidates: IgdbGame[], searchTerm: string): IgdbGame | undefined {
  const withCover = candidates.filter(c => c.cover?.image_id)
  if (!withCover.length) return undefined

  const target = normalizeForCompare(searchTerm)
  const score = (c: IgdbGame): number => {
    const n = normalizeForCompare(c.name)
    let s = 0
    if (n === target) s += 1000 // exact match wins
    else if (n.startsWith(`${target} `)) s += 400
    else if (n.startsWith(target)) s += 200
    else if (n.includes(target)) s += 50
    if (GOOD_CATEGORIES.has(c.category ?? 0)) s += 100
    s += Math.min(50, c.total_rating_count ?? 0) // popularity tiebreaker, capped
    return s
  }

  return [...withCover].sort((a, b) => score(b) - score(a))[0]
}

async function fetchGameCoverFor(
  cacheKey: string,
  primaryName: string,
  fallbackName?: string
): Promise<string | undefined> {
  if (cacheKey in coversCache.games) {
    return coversCache.games[cacheKey] ?? undefined
  }

  try {
    const primary = normalizeGameTitle(primaryName)
    // If the primary name came from an explicit override, treat it as canonical
    // and ask IGDB by name (bypasses fuzzy search picking the wrong title).
    const isOverride = primaryName in GAME_NAME_MAP
    let candidates = isOverride
      ? await lookupByName(primary)
      : await searchIgdb(primary)
    let picked = pickBestCandidate(candidates, primary)

    // If override lookup returned nothing usable, also try a fuzzy search.
    if (!picked && isOverride) {
      candidates = await searchIgdb(primary)
      picked = pickBestCandidate(candidates, primary)
    }

    if (!picked && fallbackName) {
      const alt = normalizeGameTitle(fallbackName)
      if (alt && alt !== primary) {
        candidates = await searchIgdb(alt)
        picked = pickBestCandidate(candidates, alt)
      }
    }

    if (!picked) {
      coversCache.games[cacheKey] = null
      return undefined
    }

    const url = `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${picked.cover!.image_id}.jpg`
    coversCache.games[cacheKey] = url
    return url
  } catch {
    coversCache.games[cacheKey] = null
    return undefined
  }
}

// Backwards-compat shim used elsewhere; not currently called but kept for safety.
async function fetchGameCover(gameName: string): Promise<string | undefined> {
  return fetchGameCoverFor(gameName, gameName)
}
void fetchGameCover

// ============ TMDB API ============

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

async function fetchTMDBPoster(title: string, type: 'movie' | 'tv', year?: number): Promise<string | undefined> {
  const cacheKey = `${title}|${type}|${year ?? ''}`

  // Check cache first
  if (cacheKey in coversCache[type === 'movie' ? 'films' : 'series']) {
    return coversCache[type === 'movie' ? 'films' : 'series'][cacheKey] ?? undefined
  }

  const cacheSection = type === 'movie' ? coversCache.films : coversCache.series

  try {
    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) return undefined

    let url = `${TMDB_BASE_URL}/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=fr-FR`
    if (year) url += `&year=${year}`

    const response = await fetch(url)
    if (!response.ok) {
      cacheSection[cacheKey] = null
      return undefined
    }

    const data = await response.json()
    if (data.results.length === 0 || !data.results[0].poster_path) {
      cacheSection[cacheKey] = null
      return undefined
    }

    const posterUrl = `${TMDB_IMAGE_BASE}${data.results[0].poster_path}`
    cacheSection[cacheKey] = posterUrl
    return posterUrl
  } catch {
    cacheSection[cacheKey] = null
    return undefined
  }
}

// ============ PROCESS GAMES ============

interface RawGame {
  Titre: string
  'Titre VO': string
  'Titre VF': string
  Support: string
  Etat: string
  'Heures de jeu': string
  'Date de début': string
  'Date de fin': string
  'Genre 1': string
  'Genre 2': string
  'Note perso': string
  'Moyenne des votes': string
  'Date sortie EU': string
}

// Parses dates like "2003-04-15", "2003-00-00" (year-only), or "" / "0000-00-00" (none)
function parseGameDate(raw?: string): string | undefined {
  if (!raw) return undefined
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return undefined
  const [, y, mo, d] = m
  if (y === '0000') return undefined
  if (mo === '00' || d === '00') return undefined
  return `${y}-${mo}-${d}`
}

// Parses dates like "21/11/2015 23:22" -> "2015-11-21"
function parseFrenchDate(raw?: string): string | undefined {
  if (!raw) return undefined
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (!m) return undefined
  const [, d, mo, y] = m
  return `${y}-${mo}-${d}`
}

async function processGames() {
  console.log('🎮 Processing games...')
  const csv = readFileSync(resolve(DATA_DIR, 'jeux.csv'), 'utf-8')
  const records = parse(csv, {
    columns: true,
    delimiter: ';',
    skip_empty_lines: true,
  }) as RawGame[]

  // First pass: group games by title
  const gamesByTitle = new Map<string, RawGame[]>()
  
  for (const row of records) {
    const title = row.Titre || row['Titre VO']
    if (!gamesByTitle.has(title)) {
      gamesByTitle.set(title, [])
    }
    gamesByTitle.get(title)!.push(row)
  }

  const games = []
  const uniqueTitles = Array.from(gamesByTitle.keys())
  const total = uniqueTitles.length

  for (let i = 0; i < uniqueTitles.length; i++) {
    const title = uniqueTitles[i]
    const entries = gamesByTitle.get(title)!
    
    process.stdout.write(`\r   [${i + 1}/${total}] ${title.substring(0, 40).padEnd(40)}`)

    // IGDB matches better against the original/VO name than the French/marketing
    // title. The full Titre stays as the cache key (so we cache per-game uniquely).
    // Use first entry as base data for both search and merging
    const baseEntry = entries[0]
    // IGDB matches better against the original/VO name than the French/marketing
    // title. The full Titre stays as the cache key (so we cache per-game uniquely).
    const searchPrimary = baseEntry['Titre VO'] || title
    const searchFallback = baseEntry['Titre VF'] || title
    const coverUrl = await fetchGameCoverFor(title, searchPrimary, searchFallback)
    await sleep(100) // Rate limiting
    
    // If multiple platforms, merge them
    let platforms: Array<{platform: string, status?: string, hoursPlayed?: number}> | undefined
    let totalHours = 0
    
    if (entries.length > 1) {
      // Multiple platforms: create platforms array
      platforms = entries.map(e => ({
        platform: e.Support || 'Unknown',
        status: e.Etat || undefined,
        hoursPlayed: parseNumber(e['Heures de jeu']) || 0,
      }))
      totalHours = platforms.reduce((sum, p) => sum + (p.hoursPlayed || 0), 0)
    } else {
      // Single platform: use traditional structure
      totalHours = parseNumber(baseEntry['Heures de jeu']) || 0
    }

    const displayTitle = baseEntry['Titre VF'] || baseEntry.Titre || baseEntry['Titre VO']

    // Pick the most precise date across all platform entries
    const dateStarted = entries.map(e => parseGameDate(e['Date de début'])).filter(Boolean).sort().pop()
    const dateFinished = entries.map(e => parseGameDate(e['Date de fin'])).filter(Boolean).sort().pop()

    games.push({
      title: displayTitle,
      platform: platforms ? undefined : (baseEntry.Support || undefined),
      platforms,
      status: platforms ? undefined : (baseEntry.Etat || undefined),
      hoursPlayed: totalHours,
      genres: [baseEntry['Genre 1'], baseEntry['Genre 2']].filter(Boolean),
      rating: parseNumber(baseEntry['Note perso']),
      avgRating: parseNumber(baseEntry['Moyenne des votes']),
      releaseYear: parseYear(baseEntry['Date sortie EU']),
      dateStarted,
      dateFinished,
      coverUrl,
    })
  }

  writeFileSync(resolve(OUTPUT_DIR, 'games.json'), JSON.stringify(games, null, 2))
  saveCoversCache(coversCache)
  const withCovers = games.filter(g => g.coverUrl).length
  const withMultiplePlatforms = games.filter(g => g.platforms && g.platforms.length > 1).length
  const cached = Object.keys(coversCache.games).length
  console.log(`\n   ✅ ${games.length} unique games (${withCovers} with covers, ${withMultiplePlatforms} on multiple platforms, ${cached} cached)`)
}

// ============ PROCESS FILMS ============

interface RawFilm {
  Titre: string
  'Titre VO': string
  Année: string
  'Note / 20': string
  'Moyenne / 20': string
  'Durée (min)': string
  'Genre 1': string
  'Genre 2': string
  Statut: string
  'Date de visionnage': string
}

async function processFilms() {
  console.log('🎬 Processing films...')
  const csv = readFileSync(resolve(DATA_DIR, 'films_vus.csv'), 'utf-8')
  const records = parse(csv, {
    columns: true,
    delimiter: ';',
    skip_empty_lines: true,
  }) as RawFilm[]

  const filtered = records.filter((row) => row.Statut === 'VU')
  const films = []
  const total = filtered.length

  for (let i = 0; i < filtered.length; i++) {
    const row = filtered[i]
    const title = row['Titre VO'] || row.Titre
    const year = parseNumber(row.Année)

    process.stdout.write(`\r   [${i + 1}/${total}] ${title.substring(0, 40).padEnd(40)}`)

    const posterUrl = await fetchTMDBPoster(title, 'movie', year)
    await sleep(50) // Rate limiting

    films.push({
      title: row.Titre || row['Titre VO'],
      titleVO: row['Titre VO'] || undefined,
      releaseYear: year,
      rating: parseNumber(row['Note / 20']),
      avgRating: parseNumber(row['Moyenne / 20']),
      runtime: parseNumber(row['Durée (min)']),
      genres: [row['Genre 1'], row['Genre 2']].filter(Boolean),
      dateWatched: parseFrenchDate(row['Date de visionnage']),
      posterUrl,
    })
  }

  writeFileSync(resolve(OUTPUT_DIR, 'films.json'), JSON.stringify(films, null, 2))
  saveCoversCache(coversCache)
  const withPosters = films.filter(f => f.posterUrl).length
  const cached = Object.keys(coversCache.films).length
  console.log(`\n   ✅ ${films.length} films (${withPosters} with posters, ${cached} cached)`)
}

// ============ PROCESS SERIES ============

interface RawSeries {
  Titre: string
  'Titre VF': string
  Statut: string
  'Note / 20': string
  'Moyenne / 20': string
  "Nombre d'épisodes vus": string
  "Nombre d'épisodes total": string
  Année: string
  'Statut diffusion': string
  'Genre 1': string
  'Genre 2': string
}

async function processSeries() {
  console.log('📺 Processing series...')
  const csv = readFileSync(resolve(DATA_DIR, 'shows.csv'), 'utf-8')
  const records = parse(csv, {
    columns: true,
    delimiter: ';',
    skip_empty_lines: true,
  }) as RawSeries[]

  const series = []
  const total = records.length

  for (let i = 0; i < records.length; i++) {
    const row = records[i]
    const title = row.Titre
    const year = parseNumber(row.Année)

    process.stdout.write(`\r   [${i + 1}/${total}] ${title.substring(0, 40).padEnd(40)}`)

    const posterUrl = await fetchTMDBPoster(title, 'tv', year)
    await sleep(50) // Rate limiting

    series.push({
      title,
      titleVF: row['Titre VF'] || undefined,
      status: row.Statut || undefined,
      rating: parseNumber(row['Note / 20']),
      avgRating: parseNumber(row['Moyenne / 20']),
      episodesWatched: parseNumber(row["Nombre d'épisodes vus"]),
      episodes: parseNumber(row["Nombre d'épisodes total"]),
      releaseYear: year,
      airingStatus: row['Statut diffusion'] || undefined,
      genres: [row['Genre 1'], row['Genre 2']].filter(Boolean),
      posterUrl,
    })
  }

  writeFileSync(resolve(OUTPUT_DIR, 'series.json'), JSON.stringify(series, null, 2))
  saveCoversCache(coversCache)
  const withPosters = series.filter(s => s.posterUrl).length
  const cached = Object.keys(coversCache.series).length
  console.log(`\n   ✅ ${series.length} series (${withPosters} with posters, ${cached} cached)`)
}

// ============ MAIN ============

async function main() {
  console.log('🚀 Building data with images...\n')

  const startTime = Date.now()

  try {
    if (!SKIP_DOWNLOAD) {
      const ok = await downloadFromSeriebox()
      if (!ok) console.log('\n⚠ Utilisation des données existantes')
      console.log('')
    } else {
      console.log('⏭ Skip téléchargement SerieBox\n')
    }

    await processGames()
    await processFilms()
    await processSeries()
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n✨ Build complete in ${duration}s`)
  } catch (error) {
    console.error('\n❌ Build failed:', error)
    process.exit(1)
  }
}

main()

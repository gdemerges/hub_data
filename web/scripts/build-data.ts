import { parse } from 'csv-parse/sync'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'
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
  'Pocket Monsters Ruby': 'Pokemon Ruby',
  'Pocket Monsters Sapphire': 'Pokemon Sapphire',
  'Pocket Monsters Emerald': 'Pokemon Emerald',
  'Pocket Monsters FireRed': 'Pokemon FireRed',
  'Pocket Monsters LeafGreen': 'Pokemon LeafGreen',
  'Pocket Monsters Diamond': 'Pokemon Diamond',
  'Pocket Monsters Pearl': 'Pokemon Pearl',
  'Pocket Monsters Platinum': 'Pokemon Platinum',
  'Pocket Monsters HeartGold': 'Pokemon HeartGold',
  'Pocket Monsters SoulSilver': 'Pokemon SoulSilver',
  'Pocket Monsters Black': 'Pokemon Black',
  'Pocket Monsters White': 'Pokemon White',
  'Pocket Monsters X': 'Pokemon X',
  'Pocket Monsters Y': 'Pokemon Y',
  
  // Add more mappings as needed
}

// ============ UTILITIES ============

function parseNumber(value: string): number | undefined {
  if (!value || value === '') return undefined
  const parsed = parseFloat(value.replace(',', '.'))
  return isNaN(parsed) ? undefined : parsed
}

function parseYear(dateStr: string): number | undefined {
  if (!dateStr) return undefined
  const match = dateStr.match(/\d{4}/)
  return match ? parseInt(match[0]) : undefined
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
  let normalized = title
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

async function fetchGameCover(gameName: string): Promise<string | undefined> {
  // Check cache first
  if (gameName in coversCache.games) {
    return coversCache.games[gameName] ?? undefined
  }

  try {
    const token = await getIGDBToken()
    const clientId = process.env.IGDB_CLIENT_ID!

    // Normalize the game name for better search results
    const searchName = normalizeGameTitle(gameName)

    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: `search "${searchName}"; fields cover.image_id; limit 1;`,
    })

    if (!response.ok) {
      coversCache.games[gameName] = null
      return undefined
    }

    const games = await response.json()
    if (games.length === 0 || !games[0].cover?.image_id) {
      coversCache.games[gameName] = null
      return undefined
    }

    const url = `https://images.igdb.com/igdb/image/upload/t_cover_big/${games[0].cover.image_id}.jpg`
    coversCache.games[gameName] = url
    return url
  } catch {
    coversCache.games[gameName] = null
    return undefined
  }
}

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
  Support: string
  Etat: string
  'Heures de jeu': string
  'Genre 1': string
  'Genre 2': string
  'Note perso': string
  'Moyenne des votes': string
  'Date sortie EU': string
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

    // Fetch cover only once per title
    const coverUrl = await fetchGameCover(title)
    await sleep(100) // Rate limiting

    // Use first entry as base data
    const baseEntry = entries[0]
    
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

    games.push({
      title,
      platform: platforms ? undefined : (baseEntry.Support || undefined),
      platforms,
      status: platforms ? undefined : (baseEntry.Etat || undefined),
      hoursPlayed: totalHours,
      genres: [baseEntry['Genre 1'], baseEntry['Genre 2']].filter(Boolean),
      rating: parseNumber(baseEntry['Note perso']),
      avgRating: parseNumber(baseEntry['Moyenne des votes']),
      releaseYear: parseYear(baseEntry['Date sortie EU']),
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

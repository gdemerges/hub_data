/**
 * refresh-covers.ts
 *
 * Reads existing web/data/{games,films,series}.json and fetches missing cover/poster URLs
 * from IGDB and TMDB. Does NOT require CSV files — safe to run in CI.
 *
 * Usage:
 *   npx tsx scripts/refresh-covers.ts
 *
 * Required env vars (same as build-data.ts):
 *   IGDB_CLIENT_ID, IGDB_CLIENT_SECRET  — for game covers
 *   TMDB_API_KEY                        — for film/series posters
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'

config({ path: resolve(__dirname, '../.env') })

const DATA_DIR = resolve(__dirname, '../data')
const COVERS_CACHE_FILE = resolve(__dirname, '../../data/media-covers-cache.json')

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
  writeFileSync(COVERS_CACHE_FILE, JSON.stringify(cache, null, 2))
}

const coversCache = loadCoversCache()

// ============ UTILITIES ============

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============ IGDB API ============

let igdbToken: { token: string; expiresAt: number } | null = null

async function getIGDBToken(): Promise<string> {
  if (igdbToken && Date.now() < igdbToken.expiresAt - 60000) return igdbToken.token

  const clientId = process.env.IGDB_CLIENT_ID
  const clientSecret = process.env.IGDB_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('IGDB credentials not configured')

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }),
  })
  if (!response.ok) throw new Error('Failed to get IGDB token')
  const data = await response.json()
  igdbToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return igdbToken.token
}

async function fetchGameCover(title: string): Promise<string | undefined> {
  if (title in coversCache.games) return coversCache.games[title] ?? undefined

  try {
    const token = await getIGDBToken()
    const clientId = process.env.IGDB_CLIENT_ID!
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: { 'Client-ID': clientId, Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' },
      body: `search "${title}"; fields cover.image_id; limit 1;`,
    })
    if (!response.ok) { coversCache.games[title] = null; return undefined }
    const games = await response.json()
    if (!games[0]?.cover?.image_id) { coversCache.games[title] = null; return undefined }
    const url = `https://images.igdb.com/igdb/image/upload/t_cover_big/${games[0].cover.image_id}.jpg`
    coversCache.games[title] = url
    return url
  } catch {
    coversCache.games[title] = null
    return undefined
  }
}

// ============ TMDB API ============

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

async function fetchTMDBPoster(title: string, type: 'movie' | 'tv', year?: number): Promise<string | undefined> {
  const cacheKey = `${title}|${type}|${year ?? ''}`
  const section = type === 'movie' ? coversCache.films : coversCache.series
  if (cacheKey in section) return section[cacheKey] ?? undefined

  try {
    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) return undefined
    let url = `${TMDB_BASE_URL}/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=fr-FR`
    if (year) url += `&year=${year}`
    const response = await fetch(url)
    if (!response.ok) { section[cacheKey] = null; return undefined }
    const data = await response.json()
    if (!data.results?.[0]?.poster_path) { section[cacheKey] = null; return undefined }
    const posterUrl = `${TMDB_IMAGE_BASE}${data.results[0].poster_path}`
    section[cacheKey] = posterUrl
    return posterUrl
  } catch {
    section[cacheKey] = null
    return undefined
  }
}

// ============ REFRESH LOGIC ============

async function refreshGames(): Promise<number> {
  const file = resolve(DATA_DIR, 'games.json')
  if (!existsSync(file)) { console.log('  games.json not found, skipping'); return 0 }

  interface GameEntry { title: string; coverUrl?: string | null; [key: string]: unknown }
  const games: GameEntry[] = JSON.parse(readFileSync(file, 'utf-8'))
  const missing = games.filter(g => !g.coverUrl)
  console.log(`  🎮 ${missing.length}/${games.length} games missing covers`)

  let fetched = 0
  for (const game of missing) {
    const url = await fetchGameCover(game.title)
    if (url) { game.coverUrl = url; fetched++ }
    await sleep(150)
  }

  writeFileSync(file, JSON.stringify(games, null, 2))
  return fetched
}

async function refreshFilms(): Promise<number> {
  const file = resolve(DATA_DIR, 'films.json')
  if (!existsSync(file)) { console.log('  films.json not found, skipping'); return 0 }

  interface FilmEntry { title: string; titleVO?: string; releaseYear?: number; posterUrl?: string | null; [key: string]: unknown }
  const films: FilmEntry[] = JSON.parse(readFileSync(file, 'utf-8'))
  const missing = films.filter(f => !f.posterUrl)
  console.log(`  🎬 ${missing.length}/${films.length} films missing posters`)

  let fetched = 0
  for (const film of missing) {
    const searchTitle = film.titleVO || film.title
    const url = await fetchTMDBPoster(searchTitle, 'movie', film.releaseYear)
    if (url) { film.posterUrl = url; fetched++ }
    await sleep(100)
  }

  writeFileSync(file, JSON.stringify(films, null, 2))
  return fetched
}

async function refreshSeries(): Promise<number> {
  const file = resolve(DATA_DIR, 'series.json')
  if (!existsSync(file)) { console.log('  series.json not found, skipping'); return 0 }

  interface SeriesEntry { title: string; releaseYear?: number; posterUrl?: string | null; [key: string]: unknown }
  const seriesList: SeriesEntry[] = JSON.parse(readFileSync(file, 'utf-8'))
  const missing = seriesList.filter(s => !s.posterUrl)
  console.log(`  📺 ${missing.length}/${seriesList.length} series missing posters`)

  let fetched = 0
  for (const series of missing) {
    const url = await fetchTMDBPoster(series.title, 'tv', series.releaseYear)
    if (url) { series.posterUrl = url; fetched++ }
    await sleep(100)
  }

  writeFileSync(file, JSON.stringify(seriesList, null, 2))
  return fetched
}

// ============ MAIN ============

async function main() {
  console.log('🖼️  Refreshing missing covers...\n')

  const gamesCount = await refreshGames()
  saveCoversCache(coversCache)
  console.log(`     → ${gamesCount} new game covers\n`)

  const filmsCount = await refreshFilms()
  saveCoversCache(coversCache)
  console.log(`     → ${filmsCount} new film posters\n`)

  const seriesCount = await refreshSeries()
  saveCoversCache(coversCache)
  console.log(`     → ${seriesCount} new series posters\n`)

  const total = gamesCount + filmsCount + seriesCount
  console.log(`✅ Done — ${total} covers added`)
  if (total === 0) process.exit(0) // Signal no changes to CI
}

main().catch(err => { console.error(err); process.exit(1) })

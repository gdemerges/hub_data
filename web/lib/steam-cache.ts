/**
 * Persistent file cache for Steam API data.
 *
 * Steam's API doesn't support delta queries — GetOwnedGames always returns
 * the full game list. The delta aspect here is playtime tracking (handled by
 * steam-storage.ts). What this cache adds is persistence across server
 * restarts, avoiding a full API round-trip on every cold start.
 *
 * TTL: 6 hours (aligned with the existing ISR revalidate setting).
 */

import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'

const CACHE_FILE = path.join(process.cwd(), 'data', 'steam-cache.json')
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

export interface SteamGame {
  appid: number
  name: string
  playtime_forever: number
  playtime_2weeks?: number
  img_icon_url: string
}

export interface SteamPlayer {
  steamid: string
  personaname: string
  avatarfull: string
  profileurl: string
  realname?: string
  loccountrycode?: string
  timecreated?: number
}

export interface SteamCache {
  cachedAt: number
  player: SteamPlayer
  games: SteamGame[]
}

export async function readSteamCache(): Promise<SteamCache | null> {
  if (!fs.existsSync(CACHE_FILE)) return null
  try {
    const content = await fsp.readFile(CACHE_FILE, 'utf-8')
    return JSON.parse(content) as SteamCache
  } catch {
    return null
  }
}

export async function writeSteamCache(cache: SteamCache): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  await fsp.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2))
}

export function isSteamCacheFresh(cache: SteamCache): boolean {
  return Date.now() - cache.cachedAt < CACHE_TTL_MS
}

/**
 * Persistent file cache for Steam API data.
 *
 * Built on top of file-cache.ts for consistency.
 * TTL: 6 hours (aligned with ISR revalidate setting).
 */

import path from 'path'
import { readFileCache, writeFileCache, isCacheFresh } from './file-cache'

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

export interface SteamCacheData {
  player: SteamPlayer
  games: SteamGame[]
}

export async function readSteamCache(): Promise<{ data: SteamCacheData; cachedAt: number } | null> {
  const envelope = await readFileCache<SteamCacheData>(CACHE_FILE)
  if (!envelope) return null
  return { data: envelope.data, cachedAt: envelope.cachedAt }
}

export async function writeSteamCache(data: SteamCacheData): Promise<void> {
  await writeFileCache(CACHE_FILE, data)
}

export function isSteamCacheFresh(cachedAt: number): boolean {
  return isCacheFresh(cachedAt, CACHE_TTL_MS)
}

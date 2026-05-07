import path from 'path'
import { createFileCache } from './cache-store'

const CACHE_TTL_MS = 6 * 60 * 60 * 1000

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

const cache = createFileCache<SteamCacheData>({
  filePath: path.join(process.cwd(), 'data', 'steam-cache.json'),
  ttlMs: CACHE_TTL_MS,
  name: 'steam',
})

export const readSteamCache = cache.read
export const writeSteamCache = cache.write
export const isSteamCacheFresh = cache.isFresh

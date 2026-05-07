import 'server-only'
import { z } from 'zod'
import {
  readSteamCache,
  writeSteamCache,
  isSteamCacheFresh,
  type SteamGame,
  type SteamCacheData,
} from './steam-cache'
import { steamPlayerSchema, steamGameSchema } from './api-schemas'
import { logger } from './logger'

const STEAM_API_BASE = 'https://api.steampowered.com'

export interface SteamGameSummary {
  appid: number
  name: string
  playtimeHours: number
  playtimeMinutes: number
  iconUrl: string
}

export interface SteamResponse {
  user: {
    steamId: string
    username: string
    avatar: string
    profileUrl: string
    realName?: string
    country?: string
    createdAt?: number
  }
  stats: {
    totalGames: number
    totalPlaytimeHours: number
    gamesPlayedRecently: number
  }
  topGames: SteamGameSummary[]
  recentGames: SteamGameSummary[]
  fetchedAt: string
}

function buildResponse(data: SteamCacheData, cachedAt: number): SteamResponse {
  const { player, games } = data
  const totalPlaytimeMinutes = games.reduce((acc, g) => acc + (g.playtime_forever || 0), 0)

  const summary = (g: SteamGame, minutes: number): SteamGameSummary => ({
    appid: g.appid,
    name: g.name,
    playtimeHours: Math.floor(minutes / 60),
    playtimeMinutes: minutes,
    iconUrl: `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`,
  })

  const topGames = games
    .filter((g) => g.playtime_forever > 0)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 10)
    .map((g) => summary(g, g.playtime_forever))

  const recentGames = games
    .filter((g) => (g.playtime_2weeks ?? 0) > 0)
    .sort((a, b) => (b.playtime_2weeks ?? 0) - (a.playtime_2weeks ?? 0))
    .map((g) => summary(g, g.playtime_2weeks ?? 0))

  return {
    user: {
      steamId: player.steamid,
      username: player.personaname,
      avatar: player.avatarfull,
      profileUrl: player.profileurl,
      realName: player.realname,
      country: player.loccountrycode,
      createdAt: player.timecreated,
    },
    stats: {
      totalGames: games.length,
      totalPlaytimeHours: Math.floor(totalPlaytimeMinutes / 60),
      gamesPlayedRecently: recentGames.length,
    },
    topGames,
    recentGames,
    fetchedAt: new Date(cachedAt).toISOString(),
  }
}

export async function loadSteam(): Promise<SteamResponse | null> {
  try {
    const apiKey = process.env.STEAM_API_KEY
    const userId = process.env.STEAM_USER_ID
    if (!apiKey || !userId) return null

    const existing = await readSteamCache()
    if (existing && isSteamCacheFresh(existing.cachedAt)) {
      return buildResponse(existing.data, existing.cachedAt)
    }

    const [summaryResponse, gamesResponse] = await Promise.all([
      fetch(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${userId}`),
      fetch(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${userId}&include_appinfo=1&include_played_free_games=1`),
    ])

    if (!summaryResponse.ok || !gamesResponse.ok) {
      if (existing) {
        logger.warn('Steam API failed, serving stale cache')
        return buildResponse(existing.data, existing.cachedAt)
      }
      return null
    }

    const summaryData = await summaryResponse.json()
    const gamesData = await gamesResponse.json()
    const rawPlayer = summaryData.response?.players?.[0]
    if (!rawPlayer) return null

    const player = steamPlayerSchema.parse(rawPlayer)
    const games: SteamGame[] = z.array(steamGameSchema).parse(gamesData.response?.games || [])

    const cacheData: SteamCacheData = { player, games }
    await writeSteamCache(cacheData)
    return buildResponse(cacheData, Date.now())
  } catch (err) {
    logger.error('loadSteam error:', err)
    return null
  }
}

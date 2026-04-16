import { NextResponse } from 'next/server'
import { readSteamCache, writeSteamCache, isSteamCacheFresh, type SteamGame, type SteamCache } from '@/lib/steam-cache'

export const revalidate = 21600 // Revalidate every 6 hours

const STEAM_API_BASE = 'https://api.steampowered.com'

export async function GET() {
  try {
    const apiKey = process.env.STEAM_API_KEY
    const userId = process.env.STEAM_USER_ID

    if (!apiKey || !userId) {
      return NextResponse.json(
        { error: 'Steam API key or User ID not configured' },
        { status: 500 }
      )
    }

    // --- Check file cache first ---
    const existingCache = await readSteamCache()
    if (existingCache && isSteamCacheFresh(existingCache)) {
      return buildSteamResponse(existingCache)
    }

    // --- Cache stale or missing: fetch from Steam API ---
    const [summaryResponse, gamesResponse] = await Promise.all([
      fetch(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${userId}`),
      fetch(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${userId}&include_appinfo=1&include_played_free_games=1`),
    ])

    if (!summaryResponse.ok || !gamesResponse.ok) {
      // If API fails and we have a stale cache, use it as fallback
      if (existingCache) {
        console.warn('Steam API failed, serving stale cache')
        return buildSteamResponse(existingCache)
      }
      throw new Error('Failed to fetch Steam data')
    }

    const summaryData = await summaryResponse.json()
    const gamesData = await gamesResponse.json()

    const player = summaryData.response?.players?.[0]
    const games: SteamGame[] = gamesData.response?.games || []

    if (!player) {
      throw new Error('Player not found')
    }

    // --- Persist to file cache ---
    const newCache: SteamCache = {
      cachedAt: Date.now(),
      player,
      games,
    }
    await writeSteamCache(newCache)

    return buildSteamResponse(newCache)
  } catch (error) {
    console.error('Steam API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Steam data' },
      { status: 500 }
    )
  }
}

function buildSteamResponse(cache: SteamCache): NextResponse {
  const { player, games } = cache

  const totalGames = games.length
  const totalPlaytimeMinutes = games.reduce((acc, game) => acc + (game.playtime_forever || 0), 0)
  const totalPlaytimeHours = Math.floor(totalPlaytimeMinutes / 60)

  const topGames = games
    .filter((game) => game.playtime_forever > 0)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 10)
    .map((game) => ({
      appid: game.appid,
      name: game.name,
      playtimeHours: Math.floor(game.playtime_forever / 60),
      playtimeMinutes: game.playtime_forever,
      iconUrl: `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`,
    }))

  const recentGames = games
    .filter((game) => (game.playtime_2weeks ?? 0) > 0)
    .sort((a, b) => (b.playtime_2weeks ?? 0) - (a.playtime_2weeks ?? 0))
    .map((game) => ({
      appid: game.appid,
      name: game.name,
      playtimeHours: Math.floor((game.playtime_2weeks ?? 0) / 60),
      playtimeMinutes: game.playtime_2weeks ?? 0,
      iconUrl: `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`,
    }))

  return NextResponse.json({
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
      totalGames,
      totalPlaytimeHours,
      gamesPlayedRecently: recentGames.length,
    },
    topGames,
    recentGames,
    fetchedAt: new Date(cache.cachedAt).toISOString(),
  }, { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600' } })
}

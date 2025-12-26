import { NextResponse } from 'next/server'

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

    // Fetch user summary and owned games in parallel
    const [summaryResponse, gamesResponse] = await Promise.all([
      fetch(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${userId}`),
      fetch(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${userId}&include_appinfo=1&include_played_free_games=1`),
    ])

    if (!summaryResponse.ok || !gamesResponse.ok) {
      throw new Error('Failed to fetch Steam data')
    }

    const summaryData = await summaryResponse.json()
    const gamesData = await gamesResponse.json()

    const player = summaryData.response?.players?.[0]
    const games = gamesData.response?.games || []

    if (!player) {
      throw new Error('Player not found')
    }

    // Calculate stats
    const totalGames = games.length
    const totalPlaytimeMinutes = games.reduce((acc: number, game: any) => acc + (game.playtime_forever || 0), 0)
    const totalPlaytimeHours = Math.floor(totalPlaytimeMinutes / 60)

    // Get top games by playtime
    const topGames = games
      .filter((game: any) => game.playtime_forever > 0)
      .sort((a: any, b: any) => b.playtime_forever - a.playtime_forever)
      .slice(0, 10)
      .map((game: any) => ({
        appid: game.appid,
        name: game.name,
        playtimeHours: Math.floor(game.playtime_forever / 60),
        playtimeMinutes: game.playtime_forever,
        iconUrl: `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`,
      }))

    // Get recently played games
    const recentGames = games
      .filter((game: any) => game.playtime_2weeks > 0)
      .sort((a: any, b: any) => b.playtime_2weeks - a.playtime_2weeks)
      .map((game: any) => ({
        appid: game.appid,
        name: game.name,
        playtimeHours: Math.floor(game.playtime_2weeks / 60),
        playtimeMinutes: game.playtime_2weeks,
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
    })
  } catch (error) {
    console.error('Steam API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Steam data' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { updatePlaytimeFromSnapshot, type GameSnapshot } from '@/lib/steam-storage'

const STEAM_API_BASE = 'https://api.steampowered.com'

export async function POST() {
  try {
    const apiKey = process.env.STEAM_API_KEY
    const userId = process.env.STEAM_USER_ID

    if (!apiKey || !userId) {
      return NextResponse.json(
        { error: 'Steam API key or User ID not configured' },
        { status: 500 }
      )
    }

    // Fetch all owned games with playtime
    const gamesResponse = await fetch(
      `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${userId}&include_appinfo=1&include_played_free_games=1`
    )

    if (!gamesResponse.ok) {
      throw new Error('Failed to fetch games')
    }

    const gamesData = await gamesResponse.json()
    const games = gamesData.response?.games || []

    // Create snapshot with total playtime for each game
    const currentSnapshot: GameSnapshot[] = games
      .filter((game: any) => game.playtime_forever > 0) // Only games with playtime
      .map((game: any) => ({
        appid: game.appid,
        name: game.name,
        playtimeForever: game.playtime_forever,
      }))

    // Update history with new snapshot
    const result = updatePlaytimeFromSnapshot(userId, currentSnapshot)

    return NextResponse.json({
      success: true,
      message: 'Playtime data synced successfully',
      date: new Date().toISOString().split('T')[0],
      gamesInSnapshot: currentSnapshot.length,
      minutesPlayedSinceLastSync: result.minutesPlayedSinceLastSync,
      entriesInHistory: result.history.entries.length,
    })
  } catch (error) {
    console.error('Steam sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync Steam data' },
      { status: 500 }
    )
  }
}

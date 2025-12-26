import { NextRequest, NextResponse } from 'next/server'
import { getPlaytimeByYear } from '@/lib/steam-storage'

export async function GET(request: NextRequest) {
  try {
    const yearParam = request.nextUrl.searchParams.get('year')
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()

    // Get playtime entries for the year
    const entries = getPlaytimeByYear(year)

    // Convert entries to contribution format
    // Calculate max minutes to determine levels
    const maxMinutes = Math.max(...entries.map(e => e.totalMinutes), 1)

    const playtime = entries.map(entry => {
      // Determine level (0-4) based on minutes played
      let level: 0 | 1 | 2 | 3 | 4
      const ratio = entry.totalMinutes / maxMinutes

      if (entry.totalMinutes === 0) {
        level = 0
      } else if (ratio <= 0.25) {
        level = 1
      } else if (ratio <= 0.5) {
        level = 2
      } else if (ratio <= 0.75) {
        level = 3
      } else {
        level = 4
      }

      return {
        date: entry.date,
        count: entry.totalMinutes,
        level,
      }
    })

    // Calculate total hours and days played
    const totalMinutes = entries.reduce((sum, e) => sum + e.totalMinutes, 0)
    const totalHours = Math.floor(totalMinutes / 60)
    const daysPlayed = entries.filter(e => e.totalMinutes > 0).length

    return NextResponse.json({
      totalHours,
      totalMinutes,
      daysPlayed,
      playtime,
    })
  } catch (error) {
    console.error('Steam playtime API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch playtime data' },
      { status: 500 }
    )
  }
}

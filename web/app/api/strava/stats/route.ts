import { NextRequest, NextResponse } from 'next/server'

import { getValidStravaToken } from '@/lib/strava-token'

const STRAVA_API = 'https://www.strava.com/api/v3'

async function fetchStravaData(accessToken: string, year: string | null) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  }

  const currentYear = new Date().getFullYear()

  // Fetch athlete data
  const athleteResponse = await fetch(`${STRAVA_API}/athlete`, { headers })
  if (!athleteResponse.ok) {
    return { error: 'athlete_failed', status: athleteResponse.status }
  }
  const athlete = await athleteResponse.json()

  // Fetch athlete stats
  const statsResponse = await fetch(`${STRAVA_API}/athletes/${athlete.id}/stats`, { headers })
  if (!statsResponse.ok) {
    return { error: 'stats_failed', status: statsResponse.status }
  }
  const statsData = await statsResponse.json()

  let yearRunDistance = 0

  // If year is current year or not specified, use ytd stats
  if (!year || parseInt(year) === currentYear) {
    yearRunDistance = (statsData.ytd_run_totals?.distance || 0) / 1000
  } else {
    // For other years, fetch activities and calculate
    const targetYear = parseInt(year)
    const after = Math.floor(new Date(targetYear, 0, 1).getTime() / 1000)
    const before = Math.floor(new Date(targetYear, 11, 31, 23, 59, 59).getTime() / 1000)

    // Fetch activities for the year (limited to 200)
    const activitiesResponse = await fetch(
      `${STRAVA_API}/athlete/activities?after=${after}&before=${before}&per_page=200`,
      { headers }
    )

    if (activitiesResponse.ok) {
      const activities = await activitiesResponse.json()

      // Sum only Run activities
      interface StravaActivityMin { type: string; distance: number }
      const typedActivities = activities as StravaActivityMin[]
      yearRunDistance = typedActivities
        .filter((activity) => activity.type === 'Run')
        .reduce((sum, activity) => sum + (activity.distance || 0), 0) / 1000
    }
  }

  return {
    success: true,
    data: {
      totalRunDistance: (statsData.all_run_totals?.distance || 0) / 1000,
      yearRunDistance,
      totalRideDistance: (statsData.all_ride_totals?.distance || 0) / 1000,
      yearRideDistance: (statsData.ytd_ride_totals?.distance || 0) / 1000,
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const yearParam = request.nextUrl.searchParams.get('year')
    const currentYear = new Date().getFullYear()
    let year: string | null = null
    if (yearParam !== null) {
      const parsedYear = parseInt(yearParam, 10)
      if (!isNaN(parsedYear) && parsedYear >= 1900 && parsedYear <= currentYear + 1) {
        year = String(parsedYear)
      }
    }

    // First attempt with current token
    let accessToken = await getValidStravaToken()
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let result = await fetchStravaData(accessToken, year)

    // If failed with 401, try refreshing token and retry once
    if (result.error && result.status === 401) {
      accessToken = await getValidStravaToken(true) // Force refresh
      if (accessToken) {
        result = await fetchStravaData(accessToken, year)
      }
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 })
    }

    return NextResponse.json(result.data, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } })
  } catch (error) {
    console.error('Strava stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Strava stats' },
      { status: 500 }
    )
  }
}

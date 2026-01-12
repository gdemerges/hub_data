import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STRAVA_API = 'https://www.strava.com/api/v3'

interface TokenData {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete_id?: number
}

async function getValidToken(): Promise<string | null> {
  const tokenFile = path.join(process.cwd(), 'data', 'strava-tokens.json')

  if (!fs.existsSync(tokenFile)) {
    return null
  }

  const tokenData: TokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'))

  // Check if token is expired (with 5 minute buffer)
  const now = Math.floor(Date.now() / 1000)
  if (tokenData.expires_at < now + 300) {
    // Refresh the token
    const clientId = process.env.STRAVA_CLIENT_ID
    const clientSecret = process.env.STRAVA_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return null
    }

    try {
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokenData.refresh_token,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        return null
      }

      const newTokenData = await response.json()

      // Update stored tokens
      fs.writeFileSync(tokenFile, JSON.stringify({
        access_token: newTokenData.access_token,
        refresh_token: newTokenData.refresh_token,
        expires_at: newTokenData.expires_at,
        athlete_id: tokenData.athlete_id,
      }, null, 2))

      return newTokenData.access_token
    } catch (err) {
      console.error('Failed to refresh Strava token:', err)
      return null
    }
  }

  return tokenData.access_token
}

export async function GET() {
  try {
    const accessToken = await getValidToken()

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    }

    // Fetch athlete data
    const athleteResponse = await fetch(`${STRAVA_API}/athlete`, { headers })
    if (!athleteResponse.ok) {
      if (athleteResponse.status === 401) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }
      throw new Error('Failed to fetch athlete data')
    }
    const athlete = await athleteResponse.json()

    // Fetch athlete stats
    const statsResponse = await fetch(`${STRAVA_API}/athletes/${athlete.id}/stats`, { headers })
    const statsData = statsResponse.ok ? await statsResponse.json() : null

    // Fetch all activities since January 1st 2025 (with pagination)
    const jan2025 = Math.floor(new Date('2025-01-01').getTime() / 1000)
    const activities: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore && page <= 10) { // Max 10 pages (2000 activities)
      const activitiesResponse = await fetch(
        `${STRAVA_API}/athlete/activities?per_page=200&after=${jan2025}&page=${page}`,
        { headers }
      )
      if (activitiesResponse.ok) {
        const pageActivities = await activitiesResponse.json()
        if (pageActivities.length > 0) {
          activities.push(...pageActivities)
          page++
        } else {
          hasMore = false
        }
      } else {
        hasMore = false
      }
    }

    // Process stats
    const stats = {
      totalRides: statsData?.all_ride_totals?.count || 0,
      totalRuns: statsData?.all_run_totals?.count || 0,
      totalSwims: statsData?.all_swim_totals?.count || 0,
      totalDistance: (
        (statsData?.all_ride_totals?.distance || 0) +
        (statsData?.all_run_totals?.distance || 0) +
        (statsData?.all_swim_totals?.distance || 0)
      ) / 1000, // Convert to km
      totalTime: (
        (statsData?.all_ride_totals?.moving_time || 0) +
        (statsData?.all_run_totals?.moving_time || 0) +
        (statsData?.all_swim_totals?.moving_time || 0)
      ) / 3600, // Convert to hours
      totalElevation: (
        (statsData?.all_ride_totals?.elevation_gain || 0) +
        (statsData?.all_run_totals?.elevation_gain || 0)
      ),
      thisYearDistance: (
        (statsData?.ytd_ride_totals?.distance || 0) +
        (statsData?.ytd_run_totals?.distance || 0) +
        (statsData?.ytd_swim_totals?.distance || 0)
      ) / 1000,
      thisYearTime: (
        (statsData?.ytd_ride_totals?.moving_time || 0) +
        (statsData?.ytd_run_totals?.moving_time || 0) +
        (statsData?.ytd_swim_totals?.moving_time || 0)
      ) / 3600,
      thisYearActivities: (
        (statsData?.ytd_ride_totals?.count || 0) +
        (statsData?.ytd_run_totals?.count || 0) +
        (statsData?.ytd_swim_totals?.count || 0)
      ),
    }

    // Process recent activities (sorted by date, most recent first)
    const recentActivities = activities
      .sort((a: any, b: any) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime())
      .map((activity: any) => ({
        id: activity.id,
        name: activity.name,
        type: activity.type,
        distance: activity.distance / 1000, // Convert to km
        movingTime: activity.moving_time / 60, // Convert to minutes
        totalElevationGain: activity.total_elevation_gain,
        startDate: activity.start_date_local,
        averageSpeed: (activity.average_speed || 0) * 3.6, // Convert m/s to km/h
      }))

    // Calculate yearly stats from activities
    const yearlyMap = new Map<number, { distance: number; activities: number }>()
    const currentYear = new Date().getFullYear()

    // Initialize years from 2025 onwards
    for (let year = 2025; year <= currentYear; year++) {
      yearlyMap.set(year, { distance: 0, activities: 0 })
    }

    // Add activity data (only running activities)
    for (const activity of activities) {
      if (activity.type !== 'Run') continue // Only count running
      const year = new Date(activity.start_date_local).getFullYear()
      const existing = yearlyMap.get(year)
      if (existing) {
        existing.distance += activity.distance / 1000
        existing.activities++
      }
    }

    // Use stats data for more accurate yearly totals (running only)
    if (statsData) {
      const currentYearData = yearlyMap.get(currentYear)
      if (currentYearData) {
        currentYearData.distance = (statsData.ytd_run_totals?.distance || 0) / 1000
        currentYearData.activities = statsData.ytd_run_totals?.count || 0
      }
    }

    const yearlyStats = Array.from(yearlyMap.entries())
      .map(([year, data]) => ({
        year,
        distance: data.distance,
        activities: data.activities,
      }))
      .sort((a, b) => a.year - b.year)

    return NextResponse.json({
      athlete: {
        id: athlete.id,
        username: athlete.username || athlete.firstname.toLowerCase(),
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        profile: athlete.profile || athlete.profile_medium,
        city: athlete.city,
        country: athlete.country,
      },
      stats,
      recentActivities,
      yearlyStats,
    })
  } catch (error) {
    console.error('Strava API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Strava data' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STRAVA_API = 'https://www.strava.com/api/v3'

interface TokenData {
  access_token: string
  refresh_token: string
  expires_at: number
}

async function refreshToken(tokenData: TokenData, tokenFile: string): Promise<string | null> {
  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('Strava: Missing client credentials')
    return null
  }

  try {
    const formData = new URLSearchParams()
    formData.append('client_id', clientId)
    formData.append('client_secret', clientSecret)
    formData.append('refresh_token', tokenData.refresh_token)
    formData.append('grant_type', 'refresh_token')

    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      console.error('Strava: Token refresh failed with status', response.status)
      return null
    }

    const newTokenData = await response.json()

    fs.writeFileSync(tokenFile, JSON.stringify({
      access_token: newTokenData.access_token,
      refresh_token: newTokenData.refresh_token,
      expires_at: newTokenData.expires_at,
    }, null, 2))

    console.log('Strava: Token refreshed successfully')
    return newTokenData.access_token
  } catch (err) {
    console.error('Strava: Token refresh error', err)
    return null
  }
}

async function getValidToken(forceRefresh = false): Promise<string | null> {
  const tokenFile = path.join(process.cwd(), 'data', 'strava-tokens.json')

  if (!fs.existsSync(tokenFile)) {
    return null
  }

  const tokenData: TokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'))

  // Check if token is expired or force refresh requested
  const now = Math.floor(Date.now() / 1000)
  if (forceRefresh || tokenData.expires_at < now + 300) {
    return refreshToken(tokenData, tokenFile)
  }

  return tokenData.access_token
}

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
      yearRunDistance = activities
        .filter((activity: any) => activity.type === 'Run')
        .reduce((sum: number, activity: any) => sum + (activity.distance || 0), 0) / 1000
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
    const year = request.nextUrl.searchParams.get('year')

    // First attempt with current token
    let accessToken = await getValidToken()
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let result = await fetchStravaData(accessToken, year)

    // If failed with 401, try refreshing token and retry once
    if (result.error && result.status === 401) {
      console.log('Strava: Token rejected, attempting refresh...')
      accessToken = await getValidToken(true) // Force refresh
      if (accessToken) {
        result = await fetchStravaData(accessToken, year)
      }
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Strava stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Strava stats' },
      { status: 500 }
    )
  }
}

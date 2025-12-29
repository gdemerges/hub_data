import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STRAVA_API = 'https://www.strava.com/api/v3'

interface TokenData {
  access_token: string
  refresh_token: string
  expires_at: number
}

async function getValidToken(): Promise<string | null> {
  const tokenFile = path.join(process.cwd(), 'data', 'strava-tokens.json')

  if (!fs.existsSync(tokenFile)) {
    return null
  }

  const tokenData: TokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'))

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000)
  if (tokenData.expires_at < now + 300) {
    // Refresh the token
    const clientId = process.env.STRAVA_CLIENT_ID
    const clientSecret = process.env.STRAVA_CLIENT_SECRET

    if (!clientId || !clientSecret) return null

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

      if (!response.ok) return null

      const newTokenData = await response.json()

      fs.writeFileSync(tokenFile, JSON.stringify({
        access_token: newTokenData.access_token,
        refresh_token: newTokenData.refresh_token,
        expires_at: newTokenData.expires_at,
      }, null, 2))

      return newTokenData.access_token
    } catch (err) {
      return null
    }
  }

  return tokenData.access_token
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getValidToken()

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    }

    const year = request.nextUrl.searchParams.get('year')
    const currentYear = new Date().getFullYear()

    // Fetch athlete data
    const athleteResponse = await fetch(`${STRAVA_API}/athlete`, { headers })
    if (!athleteResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch athlete' }, { status: 401 })
    }
    const athlete = await athleteResponse.json()

    // Fetch athlete stats
    const statsResponse = await fetch(`${STRAVA_API}/athletes/${athlete.id}/stats`, { headers })
    if (!statsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
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

    // Return simplified stats
    return NextResponse.json({
      totalRunDistance: (statsData.all_run_totals?.distance || 0) / 1000, // km
      yearRunDistance, // km for selected year or current year
      totalRideDistance: (statsData.all_ride_totals?.distance || 0) / 1000, // km
      yearRideDistance: (statsData.ytd_ride_totals?.distance || 0) / 1000, // km
    })
  } catch (error) {
    console.error('Strava stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Strava stats' },
      { status: 500 }
    )
  }
}

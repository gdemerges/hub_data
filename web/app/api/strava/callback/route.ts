import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const errorParam = request.nextUrl.searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(new URL('/sport?error=access_denied', request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/sport?error=no_code', request.url))
  }

  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('Strava callback: missing client credentials')
    return NextResponse.redirect(new URL('/sport?error=config_error', request.url))
  }

  try {
    const formData = new URLSearchParams()
    formData.append('client_id', clientId)
    formData.append('client_secret', clientSecret)
    formData.append('code', code)
    formData.append('grant_type', 'authorization_code')

    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!tokenResponse.ok) {
      console.error('Strava token exchange failed:', tokenResponse.status)
      return NextResponse.redirect(new URL(`/sport?error=token_error&status=${tokenResponse.status}`, request.url))
    }

    const tokenData = await tokenResponse.json()

    // Store tokens in a file
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    const tokenFile = path.join(dataDir, 'strava-tokens.json')
    fs.writeFileSync(tokenFile, JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at,
      athlete_id: tokenData.athlete?.id,
    }, null, 2))

    return NextResponse.redirect(new URL('/sport', request.url))
  } catch (err: any) {
    console.error('Strava callback error:', err.message)
    return NextResponse.redirect(new URL('/sport?error=unknown', request.url))
  }
}

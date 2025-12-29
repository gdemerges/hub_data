import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const errorParam = request.nextUrl.searchParams.get('error')
  const debug = request.nextUrl.searchParams.get('debug') === 'true'

  console.log('=== STRAVA CALLBACK ===')
  console.log('Code:', code?.substring(0, 20) + '...')
  console.log('Error param:', errorParam)

  if (errorParam) {
    if (debug) return NextResponse.json({ error: 'access_denied', errorParam })
    return NextResponse.redirect(new URL('/sport?error=access_denied', request.url))
  }

  if (!code) {
    if (debug) return NextResponse.json({ error: 'no_code' })
    return NextResponse.redirect(new URL('/sport?error=no_code', request.url))
  }

  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET

  console.log('Client ID:', clientId)
  console.log('Has secret:', !!clientSecret)

  if (!clientId || !clientSecret) {
    if (debug) return NextResponse.json({ error: 'config_error', clientId, hasSecret: !!clientSecret })
    return NextResponse.redirect(new URL('/sport?error=config_error', request.url))
  }

  try {
    const formData = new URLSearchParams()
    formData.append('client_id', clientId)
    formData.append('client_secret', clientSecret)
    formData.append('code', code)
    formData.append('grant_type', 'authorization_code')

    console.log('Sending token request to Strava...')

    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const responseText = await tokenResponse.text()
    console.log('Strava response status:', tokenResponse.status)
    console.log('Strava response body:', responseText)

    if (!tokenResponse.ok) {
      if (debug) return NextResponse.json({
        error: 'token_error',
        status: tokenResponse.status,
        response: responseText
      })
      return NextResponse.redirect(new URL(`/sport?error=token_error&status=${tokenResponse.status}`, request.url))
    }

    const tokenData = JSON.parse(responseText)

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

    console.log('=== STRAVA SUCCESS ===')

    if (debug) return NextResponse.json({ success: true, athlete: tokenData.athlete })
    return NextResponse.redirect(new URL('/sport', request.url))
  } catch (err: any) {
    console.error('Strava callback error:', err)
    if (debug) return NextResponse.json({ error: 'exception', message: err.message })
    return NextResponse.redirect(new URL('/sport?error=unknown', request.url))
  }
}

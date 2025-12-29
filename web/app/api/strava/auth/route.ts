import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID
  const redirectUri = process.env.STRAVA_REDIRECT_URI || 'http://localhost:3000/api/strava/callback'

  if (!clientId) {
    return NextResponse.json(
      { error: 'Strava client ID not configured' },
      { status: 500 }
    )
  }

  const scope = 'read,activity:read_all,profile:read_all'

  const authUrl = new URL('https://www.strava.com/oauth/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scope)
  authUrl.searchParams.set('approval_prompt', 'auto')

  return NextResponse.redirect(authUrl.toString())
}

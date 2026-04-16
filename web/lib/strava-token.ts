import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'

const TOKEN_FILE = path.join(process.cwd(), 'data', 'strava-tokens.json')
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'

export interface StravaTokenData {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete_id?: number
}

export async function readStravaTokenFile(): Promise<StravaTokenData | null> {
  if (!fs.existsSync(TOKEN_FILE)) return null
  try {
    const content = await fsp.readFile(TOKEN_FILE, 'utf-8')
    return JSON.parse(content) as StravaTokenData
  } catch {
    return null
  }
}

export async function writeStravaTokenFile(data: StravaTokenData): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  await fsp.writeFile(TOKEN_FILE, JSON.stringify(data, null, 2))
}

async function doRefresh(tokenData: StravaTokenData): Promise<string | null> {
  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET

  if (!clientId || !clientSecret) return null

  try {
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      console.error('Strava token refresh failed:', response.status)
      return null
    }

    const newData = await response.json()
    await writeStravaTokenFile({
      ...tokenData,
      access_token: newData.access_token,
      refresh_token: newData.refresh_token,
      expires_at: newData.expires_at,
    })
    return newData.access_token as string
  } catch (err: unknown) {
    console.error('Strava token refresh error:', err instanceof Error ? err.message : err)
    return null
  }
}

export async function getValidStravaToken(forceRefresh = false): Promise<string | null> {
  const tokenData = await readStravaTokenFile()
  if (!tokenData) return null

  const now = Math.floor(Date.now() / 1000)
  if (forceRefresh || tokenData.expires_at < now + 300) {
    return doRefresh(tokenData)
  }

  return tokenData.access_token
}

/**
 * spotify-auth.ts — One-shot OAuth helper for Spotify.
 *
 * Prereqs in web/.env:
 *   SPOTIFY_CLIENT_ID=...
 *   SPOTIFY_CLIENT_SECRET=...
 *
 * Spotify Developer Dashboard (https://developer.spotify.com/dashboard) → your app
 * → "Edit settings" → add redirect URI: http://127.0.0.1:8888/callback
 *
 * Run: npx tsx scripts/spotify-auth.ts
 *
 * Opens the browser to Spotify's consent screen; once accepted, the script captures
 * the code on a tiny localhost server, exchanges it for an access + refresh token,
 * and prints the refresh token to copy into .env as SPOTIFY_REFRESH_TOKEN.
 */

import { createServer } from 'http'
import { exec } from 'child_process'
import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { config } from 'dotenv'
import crypto from 'crypto'

config({ path: resolve(__dirname, '../.env') })

const REDIRECT_URI = 'http://127.0.0.1:8888/callback'
const SCOPES = ['user-top-read', 'user-read-recently-played'].join(' ')

function openBrowser(url: string): void {
  const cmd =
    process.platform === 'darwin'
      ? `open "${url}"`
      : process.platform === 'win32'
      ? `start "" "${url}"`
      : `xdg-open "${url}"`
  exec(cmd, () => {
    // best-effort; if it fails the user can copy the URL manually
  })
}

async function main() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error(
      'SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in web/.env first.\n' +
        'Get them from https://developer.spotify.com/dashboard'
    )
    process.exit(1)
  }

  const state = crypto.randomBytes(8).toString('hex')

  const authUrl =
    'https://accounts.spotify.com/authorize?' +
    new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      state,
    }).toString()

  const code: string = await new Promise((resolveCode, rejectCode) => {
    const server = createServer((req, res) => {
      if (!req.url) return
      const url = new URL(req.url, REDIRECT_URI)
      if (url.pathname !== '/callback') {
        res.writeHead(404).end()
        return
      }
      const c = url.searchParams.get('code')
      const s = url.searchParams.get('state')
      const err = url.searchParams.get('error')
      if (err) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(`<h1>Spotify auth error: ${err}</h1>`)
        server.close()
        rejectCode(new Error(`Spotify auth error: ${err}`))
        return
      }
      if (s !== state) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end('<h1>State mismatch</h1>')
        server.close()
        rejectCode(new Error('State mismatch'))
        return
      }
      if (!c) {
        res.writeHead(400).end('Missing code')
        return
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(
        '<h1>Spotify connecté ✅</h1><p>Tu peux fermer cet onglet et revenir au terminal.</p>'
      )
      server.close()
      resolveCode(c)
    })
    server.listen(8888, '127.0.0.1', () => {
      console.log('🔐 Ouverture du navigateur pour autoriser Spotify…')
      console.log(`   Si rien ne s'ouvre, va sur :\n   ${authUrl}\n`)
      openBrowser(authUrl)
    })
  })

  console.log('✓ Code reçu, échange contre les tokens…')

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  })

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text()
    console.error(`Token exchange failed (${tokenResponse.status}): ${text}`)
    process.exit(1)
  }

  const data = (await tokenResponse.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
    scope: string
  }

  // Write directly to .env to avoid copy-paste truncation.
  const envPath = resolve(__dirname, '../.env')
  const line = `SPOTIFY_REFRESH_TOKEN=${data.refresh_token}`
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8')
    const lines = content.split('\n')
    let found = false
    const updated = lines.map(l => {
      if (l.startsWith('SPOTIFY_REFRESH_TOKEN=')) {
        found = true
        return line
      }
      return l
    })
    if (!found) updated.push(line)
    writeFileSync(envPath, updated.join('\n'))
    console.log(`\n✅ web/.env mis à jour :`)
    console.log(`   ${line.slice(0, 30)}…${line.slice(-10)}  (longueur ${data.refresh_token.length})`)
  } else {
    writeFileSync(envPath, line + '\n')
    console.log(`\n✅ web/.env créé avec :`)
    console.log(`   ${line.slice(0, 30)}…${line.slice(-10)}`)
  }
  console.log('\nRedémarre le serveur Next.js (make dev).')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

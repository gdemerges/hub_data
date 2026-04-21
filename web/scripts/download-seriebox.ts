import { mkdirSync, existsSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'

config({ path: resolve(__dirname, '../.env') })

const DATA_DIR = resolve(__dirname, '../../data/seriebox')
const MAX_RETRIES = 3
const INITIAL_DELAY = 2000

const LISTS = ['shows', 'films_vus', 'jeux'] as const

const BASE_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Referer: 'https://www.seriebox.com/',
}

function parseSetCookie(headers: Headers): Record<string, string> {
  const jar: Record<string, string> = {}
  const getSetCookie = (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie
  const setCookies: string[] = getSetCookie?.() ?? []
  for (const raw of setCookies) {
    const [pair] = raw.split(';')
    const eq = pair.indexOf('=')
    if (eq > 0) jar[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim()
  }
  return jar
}

function cookieHeader(jar: Record<string, string>): string {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ')
}

async function login(): Promise<Record<string, string>> {
  const username = process.env.SERIEBOX_USERNAME
  const password = process.env.SERIEBOX_PASSWORD
  if (!username || !password) {
    throw new Error('SERIEBOX_USERNAME and SERIEBOX_PASSWORD required in .env')
  }

  const body = new URLSearchParams({
    req_username: username,
    req_password: password,
    redirect_url: '/',
  })

  const res = await fetch('https://www.seriebox.com/forum/login.php?action=in', {
    method: 'POST',
    headers: {
      ...BASE_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    redirect: 'manual',
  })

  const jar = parseSetCookie(res.headers)

  const verify = await fetch('https://www.seriebox.com/profil/', {
    headers: { ...BASE_HEADERS, Cookie: cookieHeader(jar) },
  })
  const text = await verify.text()
  if (verify.status !== 200 || text.includes('Vous devez')) {
    throw new Error('SerieBox authentication failed')
  }

  // Merge any additional cookies set during verification
  Object.assign(jar, parseSetCookie(verify.headers))
  return jar
}

async function fetchWithBackoff(url: string, jar: Record<string, string>, label: string): Promise<string | null> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { ...BASE_HEADERS, Accept: 'text/csv,*/*', Cookie: cookieHeader(jar) },
      })
      if (res.status === 429) {
        const delay = INITIAL_DELAY * 2 ** attempt
        console.log(`   ⏳ Rate limited for ${label}, retrying in ${delay}ms...`)
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      if (res.status !== 200) {
        console.log(`   ❌ ${label} status ${res.status}`)
        return null
      }
      const text = await res.text()
      if (text.includes('Vous devez')) {
        console.log(`   ❌ ${label}: authentication lost`)
        return null
      }
      return text
    } catch (e) {
      const delay = INITIAL_DELAY * 2 ** attempt
      console.log(`   ⚠ ${label} failed: ${(e as Error).message}, retrying in ${delay}ms...`)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  return null
}

export async function downloadFromSeriebox(): Promise<boolean> {
  console.log('📥 Téléchargement depuis SerieBox...')

  let jar: Record<string, string>
  try {
    jar = await login()
    console.log('   ✓ Connecté à SerieBox')
  } catch (e) {
    console.log(`   ❌ ${(e as Error).message}`)
    return false
  }

  mkdirSync(DATA_DIR, { recursive: true })
  let success = true

  for (const list of LISTS) {
    await new Promise(r => setTimeout(r, 1500))
    const url = `https://www.seriebox.com/profil/profil_export_csv.php?list=${list}`
    const csv = await fetchWithBackoff(url, jar, list)
    if (!csv) {
      success = false
      continue
    }
    writeFileSync(resolve(DATA_DIR, `${list}.csv`), csv)
    const lineCount = csv.split('\n').filter(l => l.trim()).length - 1
    console.log(`   ✓ ${list}: ${lineCount} éléments`)
  }

  return success
}

if (require.main === module) {
  downloadFromSeriebox().then(ok => {
    process.exit(ok ? 0 : 1)
  })
}

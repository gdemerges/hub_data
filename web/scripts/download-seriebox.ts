import { mkdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'

config({ path: resolve(__dirname, '../.env') })

const DATA_DIR = resolve(__dirname, '../../data/seriebox')
const MAX_RETRIES = 3
const INITIAL_DELAY = 2000

const LISTS = ['shows', 'films_vus', 'jeux'] as const

const BASE_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Referer: 'https://www.seriebox.com/profil/',
}

function cookieHeader(jar: Record<string, string>): string {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ')
}

// SerieBox login is gated by Google reCAPTCHA, so we cannot script it. The user
// logs in via their browser, copies PHPSESSID into .env, and we reuse it here.
function jarFromEnv(): Record<string, string> {
  const jar: Record<string, string> = {}

  // Full cookie header pasted from DevTools (e.g. "PHPSESSID=abc; foo=bar")
  // — also accepts the bare PHPSESSID value alone.
  const raw = process.env.SERIEBOX_COOKIES?.trim()
  if (raw) {
    if (!raw.includes('=')) {
      jar.PHPSESSID = raw
    } else {
      for (const pair of raw.split(/;\s*/)) {
        const eq = pair.indexOf('=')
        if (eq > 0) jar[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim()
      }
    }
  }

  // Or just the PHPSESSID value alone
  const sid = process.env.SERIEBOX_PHPSESSID
  if (sid) jar.PHPSESSID = sid

  if (!jar.PHPSESSID) {
    throw new Error(
      'SERIEBOX_COOKIES (or SERIEBOX_PHPSESSID) required in .env, must include PHPSESSID. ' +
      'Log in to seriebox.com in your browser, open DevTools → Application → Cookies, copy PHPSESSID.'
    )
  }
  return jar
}

async function fetchWithBackoff(url: string, jar: Record<string, string>, label: string): Promise<string | null> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          ...BASE_HEADERS,
          Accept: 'text/csv,*/*',
          Cookie: cookieHeader(jar),
        },
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
      // SerieBox serves CSV as ISO-8859-1; res.text() defaults to UTF-8 and replaces accents with U+FFFD.
      const buf = Buffer.from(await res.arrayBuffer())
      const ct = res.headers.get('content-type') || ''
      const charsetMatch = ct.match(/charset=([^;]+)/i)
      const charset = (charsetMatch?.[1] || 'latin1').toLowerCase().replace(/^iso-8859-1$/, 'latin1')
      const text = new TextDecoder(charset === 'utf-8' ? 'utf-8' : 'latin1').decode(buf)
      if (text.includes('Vous devez')) {
        console.log(`   ❌ ${label}: PHPSESSID expired — refresh SERIEBOX_COOKIES in .env`)
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
    jar = jarFromEnv()
    console.log('   ✓ Cookie PHPSESSID chargé depuis .env')
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

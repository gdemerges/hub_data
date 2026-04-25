import { z } from 'zod'

const serverEnvSchema = z.object({
  // GitHub
  GITHUB_TOKEN: z.string().optional(),

  // Spotify
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  SPOTIFY_REFRESH_TOKEN: z.string().optional(),

  // Steam
  STEAM_API_KEY: z.string().optional(),
  STEAM_ID: z.string().optional(),

  // Strava
  STRAVA_CLIENT_ID: z.string().optional(),
  STRAVA_CLIENT_SECRET: z.string().optional(),

  // TMDB
  TMDB_API_KEY: z.string().optional(),

  // IGDB
  IGDB_CLIENT_ID: z.string().optional(),
  IGDB_CLIENT_SECRET: z.string().optional(),

  // SerieBox (pipeline)
  SERIEBOX_USERNAME: z.string().optional(),
  SERIEBOX_PASSWORD: z.string().optional(),
})

const clientEnvSchema = z.object({
  NEXT_PUBLIC_GITHUB_USERNAME: z.string().default('gdemerges'),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>

let _serverEnv: ServerEnv | null = null
let _clientEnv: ClientEnv | null = null

export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv
  _serverEnv = serverEnvSchema.parse(process.env)
  return _serverEnv
}

export function getClientEnv(): ClientEnv {
  if (_clientEnv) return _clientEnv
  _clientEnv = clientEnvSchema.parse({
    NEXT_PUBLIC_GITHUB_USERNAME: process.env.NEXT_PUBLIC_GITHUB_USERNAME,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  })
  return _clientEnv
}

/**
 * Check that a set of env vars are present, returning them or null.
 * Useful in API routes to bail early with a clear message.
 */
export function requireEnv<K extends keyof ServerEnv>(
  ...keys: K[]
): Pick<ServerEnv, K> | null {
  const env = getServerEnv()
  for (const key of keys) {
    if (!env[key]) return null
  }
  return env as Pick<ServerEnv, K>
}

/**
 * Groupes de variables qui doivent être tous présents pour qu'une fonctionnalité marche.
 * Utilisé par validateProductionEnv() pour signaler les manquants au boot.
 */
const FEATURE_GROUPS: Record<string, (keyof ServerEnv)[]> = {
  github: ['GITHUB_TOKEN'],
  spotify: ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN'],
  steam: ['STEAM_API_KEY', 'STEAM_ID'],
  strava: ['STRAVA_CLIENT_ID', 'STRAVA_CLIENT_SECRET'],
  tmdb: ['TMDB_API_KEY'],
  igdb: ['IGDB_CLIENT_ID', 'IGDB_CLIENT_SECRET'],
}

let _validated = false

/**
 * Vérifie au boot quelles features sont configurées.
 * - En dev: log les features désactivées pour transparence.
 * - En prod: warn par défaut. Si HUB_STRICT_ENV=1, throw si une feature est partielle
 *   (ex: SPOTIFY_CLIENT_ID présent mais SPOTIFY_REFRESH_TOKEN manquant) — état le plus
 *   dangereux car la feature paraît activée mais crashera à runtime.
 */
export function validateProductionEnv(): void {
  if (_validated) return
  _validated = true

  const env = getServerEnv()
  const disabled: string[] = []
  const partial: { feature: string; missing: string[] }[] = []

  for (const [feature, keys] of Object.entries(FEATURE_GROUPS)) {
    const present = keys.filter((k) => env[k])
    if (present.length === 0) {
      disabled.push(feature)
    } else if (present.length < keys.length) {
      partial.push({ feature, missing: keys.filter((k) => !env[k]) })
    }
  }

  if (disabled.length > 0) {
    console.warn(`[env] Features désactivées (variables absentes): ${disabled.join(', ')}`)
  }

  if (partial.length > 0) {
    const detail = partial.map((p) => `${p.feature} (manque: ${p.missing.join(', ')})`).join('; ')
    const msg = `[env] Configuration partielle: ${detail}`
    if (process.env.NODE_ENV === 'production' && process.env.HUB_STRICT_ENV === '1') {
      throw new Error(msg)
    }
    console.warn(msg)
  }
}

if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  validateProductionEnv()
}

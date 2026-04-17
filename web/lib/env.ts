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

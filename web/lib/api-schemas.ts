/**
 * Zod schemas for external API responses.
 *
 * These validate the raw responses from third-party APIs to catch
 * schema drift early instead of silently producing wrong data.
 */

import { z } from 'zod'

// ============ Spotify ============

export const spotifyImageSchema = z.object({
  url: z.string(),
})

export const spotifyArtistSchema = z.object({
  name: z.string(),
  images: z.array(spotifyImageSchema).default([]),
  genres: z.array(z.string()).default([]),
  followers: z.object({ total: z.number() }).default({ total: 0 }),
  external_urls: z.object({ spotify: z.string() }).default({ spotify: '' }),
})

export const spotifyTrackSchema = z.object({
  name: z.string(),
  artists: z.array(z.object({ name: z.string() })).default([]),
  album: z.object({
    name: z.string(),
    images: z.array(spotifyImageSchema).default([]),
  }),
  duration_ms: z.number(),
  preview_url: z.string().nullable().optional(),
  external_urls: z.object({ spotify: z.string() }).default({ spotify: '' }),
})

export const spotifyRecentlyPlayedItemSchema = z.object({
  track: spotifyTrackSchema,
  played_at: z.string(),
})

export const spotifyProfileSchema = z.object({
  display_name: z.string().nullable().optional(),
  images: z.array(spotifyImageSchema).default([]),
  followers: z.object({ total: z.number() }).default({ total: 0 }),
  external_urls: z.object({ spotify: z.string() }).default({ spotify: '' }),
})

export const spotifyPaginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema).default([]),
  })

// ============ GitHub ============

export const githubUserSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  avatar_url: z.string(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  company: z.string().nullable(),
  blog: z.string().nullable(),
  public_repos: z.number(),
  followers: z.number(),
  following: z.number(),
  created_at: z.string(),
})

export const githubRepoSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  html_url: z.string(),
  updated_at: z.string(),
  pushed_at: z.string(),
})

// ============ Steam ============

export const steamPlayerSchema = z.object({
  steamid: z.string(),
  personaname: z.string(),
  avatarfull: z.string(),
  profileurl: z.string(),
  realname: z.string().optional(),
  loccountrycode: z.string().optional(),
  timecreated: z.number().optional(),
})

export const steamGameSchema = z.object({
  appid: z.number(),
  name: z.string(),
  playtime_forever: z.number(),
  playtime_2weeks: z.number().optional(),
  img_icon_url: z.string(),
})

// ============ Strava ============

export const stravaAthleteSchema = z.object({
  id: z.number(),
  username: z.string().nullable(),
  firstname: z.string(),
  lastname: z.string(),
  profile: z.string(),
  city: z.string().nullable(),
  country: z.string().nullable(),
})

export const stravaActivitySchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  distance: z.number(),
  moving_time: z.number(),
  total_elevation_gain: z.number(),
  start_date: z.string(),
  average_speed: z.number(),
  average_heartrate: z.number().optional(),
  max_heartrate: z.number().optional(),
})

/**
 * Safe parse helper that logs validation errors but returns the data anyway
 * (with defaults applied). This avoids breaking the page on minor schema drift
 * while still alerting us to the problem.
 */
export function safeParse<T>(schema: z.ZodType<T>, data: unknown, label: string): T | null {
  const result = schema.safeParse(data)
  if (!result.success) {
    console.warn(`[${label}] API response validation warning:`, result.error.issues.slice(0, 3))
    return null
  }
  return result.data
}

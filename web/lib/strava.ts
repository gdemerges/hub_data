import 'server-only'
import path from 'node:path'

import { getValidStravaToken } from './strava-token'
import { readFileCache, writeFileCache, isCacheFresh } from './file-cache'
import { logger } from './logger'
import type { SportActivity } from './sport'

const STRAVA_API = 'https://www.strava.com/api/v3'
const ACTIVITIES_CACHE_FILE = path.join(process.cwd(), 'data', 'strava-activities-cache.json')
const CACHE_TTL_MS = 3600_000

interface StravaRawActivity {
  id: number
  name: string
  type: string
  distance: number
  moving_time: number
  total_elevation_gain: number
  start_date_local: string
  average_speed: number
  average_heartrate?: number
  max_heartrate?: number
}

export interface StravaAthlete {
  id: number
  username: string
  firstname: string
  lastname: string
  profile: string
  city: string
  country: string
}

export interface StravaShoe {
  id: string
  name: string
  distanceKm: number
  primary: boolean
  retired: boolean
}

interface StravaRawShoe {
  id: string
  name?: string
  nickname?: string
  distance?: number
  primary?: boolean
  retired?: boolean
}

export interface StravaData {
  athlete: StravaAthlete
  stats: {
    totalRides: number
    totalRuns: number
    totalSwims: number
    totalDistance: number
    totalTime: number
    totalElevation: number
    thisYearDistance: number
    thisYearTime: number
    thisYearActivities: number
  }
  recentActivities: SportActivity[]
  yearlyStats: { year: number; distance: number; activities: number }[]
  shoes: StravaShoe[]
  fetchedAt: string
}

async function fetchActivities(headers: HeadersInit, after: number): Promise<StravaRawActivity[]> {
  const activities: StravaRawActivity[] = []
  let page = 1
  let hasMore = true

  while (hasMore && page <= 10) {
    const response = await fetch(
      `${STRAVA_API}/athlete/activities?per_page=200&after=${after}&page=${page}`,
      { headers }
    )
    if (response.ok) {
      const pageActivities: StravaRawActivity[] = await response.json()
      if (!Array.isArray(pageActivities)) break
      if (pageActivities.length > 0) {
        activities.push(...pageActivities)
        page++
      } else {
        hasMore = false
      }
    } else {
      hasMore = false
    }
  }

  return activities
}

export async function loadStrava({ force = false } = {}): Promise<StravaData | null> {
  try {
    const accessToken = await getValidStravaToken()
    if (!accessToken) return null

    const headers = { Authorization: `Bearer ${accessToken}` }

    const [athleteResponse, cache] = await Promise.all([
      fetch(`${STRAVA_API}/athlete`, { headers }),
      readFileCache<StravaRawActivity[]>(ACTIVITIES_CACHE_FILE),
    ])
    if (!athleteResponse.ok) return null
    const athlete = await athleteResponse.json()

    const statsPromise = fetch(`${STRAVA_API}/athletes/${athlete.id}/stats`, { headers })

    const currentYear = new Date().getFullYear()
    const fullSyncAfter = Math.floor(new Date(`${currentYear - 1}-01-01`).getTime() / 1000)

    const cacheStale = force || !cache || !isCacheFresh(cache.cachedAt, CACHE_TTL_MS)
    let activitiesPromise: Promise<StravaRawActivity[]>

    if (cacheStale) {
      if (cache && cache.data.length > 0 && !force) {
        const latestCachedDate = cache.data
          .map((a) => new Date(a.start_date_local).getTime() / 1000)
          .reduce((max, t) => Math.max(max, t), 0)
        activitiesPromise = fetchActivities(headers, Math.floor(latestCachedDate)).then((newActivities) => {
          const cachedById = new Map(cache.data.map((a) => [a.id, a]))
          for (const a of newActivities) cachedById.set(a.id, a)
          return Array.from(cachedById.values())
        })
      } else {
        activitiesPromise = fetchActivities(headers, fullSyncAfter)
      }
    } else {
      activitiesPromise = Promise.resolve(cache!.data)
    }

    const [statsResponse, activities] = await Promise.all([statsPromise, activitiesPromise])
    const statsData = statsResponse.ok ? await statsResponse.json() : null

    if (cacheStale) {
      await writeFileCache(ACTIVITIES_CACHE_FILE, activities)
    }

    const stats = {
      totalRides: statsData?.all_ride_totals?.count || 0,
      totalRuns: statsData?.all_run_totals?.count || 0,
      totalSwims: statsData?.all_swim_totals?.count || 0,
      totalDistance:
        ((statsData?.all_ride_totals?.distance || 0) +
          (statsData?.all_run_totals?.distance || 0) +
          (statsData?.all_swim_totals?.distance || 0)) /
        1000,
      totalTime:
        ((statsData?.all_ride_totals?.moving_time || 0) +
          (statsData?.all_run_totals?.moving_time || 0) +
          (statsData?.all_swim_totals?.moving_time || 0)) /
        3600,
      totalElevation:
        (statsData?.all_ride_totals?.elevation_gain || 0) +
        (statsData?.all_run_totals?.elevation_gain || 0),
      thisYearDistance:
        ((statsData?.ytd_ride_totals?.distance || 0) +
          (statsData?.ytd_run_totals?.distance || 0) +
          (statsData?.ytd_swim_totals?.distance || 0)) /
        1000,
      thisYearTime:
        ((statsData?.ytd_ride_totals?.moving_time || 0) +
          (statsData?.ytd_run_totals?.moving_time || 0) +
          (statsData?.ytd_swim_totals?.moving_time || 0)) /
        3600,
      thisYearActivities:
        (statsData?.ytd_ride_totals?.count || 0) +
        (statsData?.ytd_run_totals?.count || 0) +
        (statsData?.ytd_swim_totals?.count || 0),
    }

    const recentActivities = activities
      .sort((a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime())
      .map((activity) => ({
        id: activity.id,
        name: activity.name,
        type: activity.type,
        distance: activity.distance / 1000,
        movingTime: activity.moving_time / 60,
        totalElevationGain: activity.total_elevation_gain,
        startDate: activity.start_date_local,
        averageSpeed: (activity.average_speed || 0) * 3.6,
        averageHeartrate: activity.average_heartrate,
        maxHeartrate: activity.max_heartrate,
      }))

    const yearlyMap = new Map<number, { distance: number; activities: number }>()
    for (let year = currentYear - 1; year <= currentYear; year++) {
      yearlyMap.set(year, { distance: 0, activities: 0 })
    }
    for (const activity of activities) {
      if (activity.type !== 'Run') continue
      const year = new Date(activity.start_date_local).getFullYear()
      const existing = yearlyMap.get(year)
      if (existing) {
        existing.distance += activity.distance / 1000
        existing.activities++
      }
    }
    if (statsData) {
      const currentYearData = yearlyMap.get(currentYear)
      if (currentYearData) {
        currentYearData.distance = (statsData.ytd_run_totals?.distance || 0) / 1000
        currentYearData.activities = statsData.ytd_run_totals?.count || 0
      }
    }
    const yearlyStats = Array.from(yearlyMap.entries())
      .map(([year, data]) => ({ year, distance: data.distance, activities: data.activities }))
      .sort((a, b) => a.year - b.year)

    // Chaussures (gear) — renvoyées par /athlete avec le scope profile:read_all.
    const shoes: StravaShoe[] = Array.isArray(athlete.shoes)
      ? (athlete.shoes as StravaRawShoe[]).map((s) => ({
          id: s.id,
          name: s.nickname || s.name || 'Paire',
          distanceKm: (s.distance || 0) / 1000,
          primary: s.primary ?? false,
          retired: s.retired ?? false,
        }))
      : []

    return {
      athlete: {
        id: athlete.id,
        username: athlete.username || athlete.firstname.toLowerCase(),
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        profile: athlete.profile || athlete.profile_medium,
        city: athlete.city,
        country: athlete.country,
      },
      stats,
      recentActivities,
      yearlyStats,
      shoes,
      fetchedAt: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('Strava load error:', error)
    return null
  }
}

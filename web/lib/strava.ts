import 'server-only'
import path from 'path'

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

    const athleteResponse = await fetch(`${STRAVA_API}/athlete`, { headers })
    if (!athleteResponse.ok) return null
    const athlete = await athleteResponse.json()

    const statsResponse = await fetch(`${STRAVA_API}/athletes/${athlete.id}/stats`, { headers })
    const statsData = statsResponse.ok ? await statsResponse.json() : null

    const currentYear = new Date().getFullYear()
    const fullSyncAfter = Math.floor(new Date(`${currentYear - 1}-01-01`).getTime() / 1000)

    const cache = await readFileCache<StravaRawActivity[]>(ACTIVITIES_CACHE_FILE)
    let activities: StravaRawActivity[]

    if (force || !cache || !isCacheFresh(cache.cachedAt, CACHE_TTL_MS)) {
      if (cache && cache.data.length > 0 && !force) {
        const latestCachedDate = cache.data
          .map((a) => new Date(a.start_date_local).getTime() / 1000)
          .reduce((max, t) => Math.max(max, t), 0)
        const newActivities = await fetchActivities(headers, Math.floor(latestCachedDate))
        const cachedById = new Map(cache.data.map((a) => [a.id, a]))
        for (const a of newActivities) cachedById.set(a.id, a)
        activities = Array.from(cachedById.values())
      } else {
        activities = await fetchActivities(headers, fullSyncAfter)
      }
      await writeFileCache(ACTIVITIES_CACHE_FILE, activities)
    } else {
      activities = cache.data
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
      fetchedAt: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('Strava load error:', error)
    return null
  }
}

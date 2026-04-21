import { NextResponse } from 'next/server'

import { getValidStravaToken } from '@/lib/strava-token'
import { logger } from '@/lib/logger'

const STRAVA_API = 'https://www.strava.com/api/v3'

interface StravaLap {
  name: string
  distance: number
  moving_time: number
  elapsed_time: number
  average_speed: number
  average_heartrate?: number
  max_heartrate?: number
  total_elevation_gain: number
  lap_index: number
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 })
    }

    const accessToken = await getValidStravaToken()

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const headers = { Authorization: `Bearer ${accessToken}` }

    // Fetch activity details
    const activityResponse = await fetch(`${STRAVA_API}/activities/${id}`, { headers })
    if (!activityResponse.ok) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }
    const activity = await activityResponse.json()

    // Fetch activity streams (GPS, heart rate, etc.)
    const streamsResponse = await fetch(
      `${STRAVA_API}/activities/${id}/streams?keys=latlng,altitude,heartrate,time,distance,velocity_smooth,cadence&key_by_type=true`,
      { headers }
    )
    const streams = streamsResponse.ok ? await streamsResponse.json() : null

    // Fetch laps/splits
    const lapsResponse = await fetch(`${STRAVA_API}/activities/${id}/laps`, { headers })
    const laps = lapsResponse.ok ? await lapsResponse.json() : []

    return NextResponse.json({
      activity: {
        id: activity.id,
        name: activity.name,
        type: activity.type,
        distance: activity.distance / 1000,
        movingTime: activity.moving_time,
        elapsedTime: activity.elapsed_time,
        totalElevationGain: activity.total_elevation_gain,
        startDate: activity.start_date_local,
        averageSpeed: (activity.average_speed || 0) * 3.6,
        maxSpeed: (activity.max_speed || 0) * 3.6,
        averageHeartrate: activity.average_heartrate,
        maxHeartrate: activity.max_heartrate,
        calories: activity.calories,
        description: activity.description,
        polyline: activity.map?.summary_polyline || activity.map?.polyline,
        startLatlng: activity.start_latlng,
        endLatlng: activity.end_latlng,
        averageCadence: activity.average_cadence,
        sufferScore: activity.suffer_score,
        deviceName: activity.device_name,
      },
      streams: streams ? {
        latlng: streams.latlng?.data,
        altitude: streams.altitude?.data,
        heartrate: streams.heartrate?.data,
        time: streams.time?.data,
        distance: streams.distance?.data,
        velocity: streams.velocity_smooth?.data,
        cadence: streams.cadence?.data,
      } : null,
      laps: (laps as StravaLap[]).map((lap) => ({
        name: lap.name,
        distance: lap.distance / 1000,
        movingTime: lap.moving_time,
        elapsedTime: lap.elapsed_time,
        averageSpeed: (lap.average_speed || 0) * 3.6,
        averageHeartrate: lap.average_heartrate,
        maxHeartrate: lap.max_heartrate,
        totalElevationGain: lap.total_elevation_gain,
        lapIndex: lap.lap_index,
      })),
    })
  } catch (error) {
    logger.error('Strava activity API error:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}

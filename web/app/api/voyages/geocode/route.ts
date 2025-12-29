import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface GeocodeCache {
  [key: string]: {
    city?: string
    country?: string
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<{ city?: string; country?: string }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=fr`,
      {
        headers: {
          'User-Agent': 'HubDataApp/1.0'
        }
      }
    )

    if (!response.ok) return {}

    const data = await response.json()
    const address = data.address || {}

    return {
      city: address.city || address.town || address.village || address.municipality,
      country: address.country
    }
  } catch (err) {
    console.error('Reverse geocoding error:', err)
    return {}
  }
}

function parseGeoLocation(coordStr: string): { lat: number; lng: number } | null {
  const parts = coordStr.split(',')
  if (parts.length !== 2) return null

  const lat = parseFloat(parts[0])
  const lng = parseFloat(parts[1])

  if (isNaN(lat) || isNaN(lng)) return null

  return { lat, lng }
}

export async function POST() {
  try {
    const cacheFile = path.join(process.cwd(), 'data', 'geocode-cache.json')
    const historyFile = path.join(process.cwd(), 'data', 'location-history', 'location-history.json')

    // Load existing cache
    let cache: GeocodeCache = {}
    if (fs.existsSync(cacheFile)) {
      try {
        cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
      } catch (err) {
        console.error('Error reading cache:', err)
      }
    }

    // Load location history
    if (!fs.existsSync(historyFile)) {
      return NextResponse.json({ error: 'No location history found' }, { status: 404 })
    }

    const historyData = JSON.parse(fs.readFileSync(historyFile, 'utf-8'))

    if (!Array.isArray(historyData)) {
      return NextResponse.json({ error: 'Invalid location history format' }, { status: 400 })
    }

    // Count visits per rounded location
    const locationCounts = new Map<string, number>()

    for (const item of historyData) {
      if (item.visit?.topCandidate?.placeLocation) {
        const coords = item.visit.topCandidate.placeLocation.replace('geo:', '')
        const parts = coords.split(',')
        if (parts.length === 2) {
          const lat = parseFloat(parts[0])
          const lng = parseFloat(parts[1])
          const roundedKey = `${lat.toFixed(2)},${lng.toFixed(2)}`
          locationCounts.set(roundedKey, (locationCounts.get(roundedKey) || 0) + 1)
        }
      }
    }

    // Sort by visit count and take top 50 locations that aren't cached
    const uncachedLocations = Array.from(locationCounts.entries())
      .filter(([key]) => !cache[key])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)

    let geocoded = 0

    // Geocode uncached locations with 1 second delay between requests
    for (const [coordKey, count] of uncachedLocations) {
      const coords = parseGeoLocation(coordKey)
      if (!coords) continue

      console.log(`Geocoding ${coordKey} (${count} visits)...`)

      const result = await reverseGeocode(coords.lat, coords.lng)

      if (result.city || result.country) {
        cache[coordKey] = result
        geocoded++
      }

      // Respect Nominatim rate limit (1 req/sec)
      await new Promise(resolve => setTimeout(resolve, 1100))
    }

    // Save updated cache
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2))

    return NextResponse.json({
      success: true,
      geocoded,
      totalCached: Object.keys(cache).length,
      message: `Geocoded ${geocoded} new locations. Total cached: ${Object.keys(cache).length}`
    })
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Failed to geocode locations' },
      { status: 500 }
    )
  }
}

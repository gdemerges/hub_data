import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface PlaceVisit {
  location: {
    name?: string
    address?: string
    latitudeE7?: number
    longitudeE7?: number
  }
  duration: {
    startTimestamp?: string
    endTimestamp?: string
  }
  placeConfidence?: string
}

interface SemanticLocationHistory {
  timelineObjects?: Array<{
    placeVisit?: PlaceVisit
  }>
}

// Old format Google Location History
interface OldLocationHistory {
  startTime: string
  endTime: string
  visit?: {
    topCandidate?: {
      placeID?: string
      placeLocation?: string
      semanticType?: string
    }
  }
}

function extractCityCountry(address: string): { city?: string; country?: string } {
  if (!address) return {}

  const parts = address.split(',').map(p => p.trim())
  if (parts.length >= 2) {
    return {
      city: parts[parts.length - 2],
      country: parts[parts.length - 1],
    }
  }
  return { country: parts[0] }
}

function parseGeoLocation(geoStr: string): { lat: number; lng: number } | null {
  // Parse "geo:47.004646,3.158862" format
  if (!geoStr || !geoStr.startsWith('geo:')) return null

  const coords = geoStr.replace('geo:', '').split(',')
  if (coords.length !== 2) return null

  const lat = parseFloat(coords[0])
  const lng = parseFloat(coords[1])

  if (isNaN(lat) || isNaN(lng)) return null

  return { lat, lng }
}

// Simple reverse geocoding using Nominatim (rate limited to 1 req/sec)
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

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data', 'location-history')

    // Check if directory exists
    if (!fs.existsSync(dataDir)) {
      return NextResponse.json({ error: 'No location history data found' }, { status: 404 })
    }

    // Find all JSON files recursively in the Semantic Location History folder
    const semanticDir = path.join(dataDir, 'Semantic Location History')

    if (!fs.existsSync(semanticDir)) {
      // Try to find any JSON files in the data dir
      const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'))
      if (files.length === 0) {
        return NextResponse.json({ error: 'No location history data found' }, { status: 404 })
      }
    }

    const allVisits: Array<{
      name: string
      address: string
      city?: string
      country?: string
      startTime: string
      duration: number
    }> = []

    // Cache for geocoding results to avoid duplicate API calls
    const geocodeCache = new Map<string, { city?: string; country?: string }>()

    // Read all JSON files
    function readJsonFiles(dir: string) {
      if (!fs.existsSync(dir)) return

      const entries = fs.readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          readJsonFiles(fullPath)
        } else if (entry.name.endsWith('.json')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8')
            const data = JSON.parse(content)

            // Check if it's the new format (timelineObjects)
            if (data.timelineObjects) {
              for (const obj of data.timelineObjects) {
                if (obj.placeVisit?.location?.name) {
                  const visit = obj.placeVisit
                  const { city, country } = extractCityCountry(visit.location.address || '')

                  const startTime = visit.duration?.startTimestamp || ''
                  const endTime = visit.duration?.endTimestamp || ''

                  let duration = 0
                  if (startTime && endTime) {
                    duration = Math.round(
                      (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000
                    )
                  }

                  allVisits.push({
                    name: visit.location.name,
                    address: visit.location.address || '',
                    city,
                    country,
                    startTime,
                    duration,
                  })
                }
              }
            }
            // Check if it's the old format (array of visits)
            else if (Array.isArray(data)) {
              for (const item of data) {
                const oldVisit = item as OldLocationHistory
                if (oldVisit.visit?.topCandidate?.placeLocation) {
                  const coords = parseGeoLocation(oldVisit.visit.topCandidate.placeLocation)

                  if (coords) {
                    // Round coordinates to group nearby locations
                    const roundedKey = `${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`

                    // Get city/country from cache or approximate based on coordinates
                    let city = geocodeCache.get(roundedKey)?.city
                    let country = geocodeCache.get(roundedKey)?.country

                    // Approximate city name based on rounded coordinates if not in cache
                    if (!city) {
                      city = `Location ${roundedKey}`
                      country = 'Unknown'
                      geocodeCache.set(roundedKey, { city, country })
                    }

                    const startTime = oldVisit.startTime
                    const endTime = oldVisit.endTime

                    let duration = 0
                    if (startTime && endTime) {
                      duration = Math.round(
                        (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000
                      )
                    }

                    allVisits.push({
                      name: city || `Location (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})`,
                      address: roundedKey,
                      city,
                      country,
                      startTime,
                      duration,
                    })
                  }
                }
              }
            }
          } catch (err) {
            console.error(`Error parsing ${fullPath}:`, err)
          }
        }
      }
    }

    readJsonFiles(dataDir)

    if (allVisits.length === 0) {
      return NextResponse.json({ error: 'No visits found in data' }, { status: 404 })
    }

    // Try to load geocoding cache from file
    const cacheFile = path.join(process.cwd(), 'data', 'geocode-cache.json')
    let persistentCache: Record<string, { city?: string; country?: string }> = {}

    if (fs.existsSync(cacheFile)) {
      try {
        persistentCache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
      } catch (err) {
        console.error('Error reading geocode cache:', err)
      }
    }

    // Apply persistent cache to visits
    for (const visit of allVisits) {
      if (visit.city?.startsWith('Location ') && persistentCache[visit.address]) {
        visit.city = persistentCache[visit.address].city
        visit.country = persistentCache[visit.address].country
        // Also update the name if it was a location placeholder
        if (visit.name.startsWith('Location ')) {
          visit.name = visit.city || visit.name
        }
      }
    }

    // Calculate statistics
    const placeCount = new Map<string, { visits: number; city?: string }>()
    const cityCount = new Map<string, { visits: number; country?: string }>()
    const countryCount = new Map<string, number>()
    const yearCount = new Map<number, number>()
    const uniqueDays = new Set<string>()

    for (const visit of allVisits) {
      // Count places
      const existing = placeCount.get(visit.name)
      if (existing) {
        existing.visits++
      } else {
        placeCount.set(visit.name, { visits: 1, city: visit.city })
      }

      // Count cities
      if (visit.city) {
        const existingCity = cityCount.get(visit.city)
        if (existingCity) {
          existingCity.visits++
        } else {
          cityCount.set(visit.city, { visits: 1, country: visit.country })
        }
      }

      // Count countries (exclude Unknown)
      if (visit.country && visit.country !== 'Unknown') {
        countryCount.set(visit.country, (countryCount.get(visit.country) || 0) + 1)
      }

      // Count by year
      if (visit.startTime) {
        const year = new Date(visit.startTime).getFullYear()
        yearCount.set(year, (yearCount.get(year) || 0) + 1)

        const day = visit.startTime.split('T')[0]
        uniqueDays.add(day)
      }
    }

    // Sort and format results
    const topPlaces = Array.from(placeCount.entries())
      .map(([name, data]) => ({ name, visits: data.visits, city: data.city }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 50)

    const topCities = Array.from(cityCount.entries())
      .map(([name, data]) => ({ name, visits: data.visits, country: data.country }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 20)

    const topCountries = Array.from(countryCount.entries())
      .map(([name, visits]) => ({ name, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 20)

    const visitsByYear = Array.from(yearCount.entries())
      .map(([year, visits]) => ({ year, visits }))
      .sort((a, b) => a.year - b.year)

    return NextResponse.json({
      totalPlaces: placeCount.size,
      totalCountries: countryCount.size,
      totalCities: cityCount.size,
      totalDays: uniqueDays.size,
      topPlaces,
      topCities,
      topCountries,
      visitsByYear,
    })
  } catch (error) {
    console.error('Voyages API error:', error)
    return NextResponse.json(
      { error: 'Failed to process location history' },
      { status: 500 }
    )
  }
}

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
            const data: SemanticLocationHistory = JSON.parse(content)

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

      // Count countries
      if (visit.country) {
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

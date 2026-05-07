import 'server-only'
import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'
import { nominatimFetch } from './rate-limiter'
import { readFileCache, writeFileCache, isCacheFresh } from './file-cache'
import { logger } from './logger'

export interface TravelStats {
  totalPlaces: number
  totalCountries: number
  totalCities: number
  totalDays: number
  topPlaces: { name: string; visits: number; city?: string }[]
  topCities: { name: string; visits: number; country?: string }[]
  topCountries: { name: string; visits: number }[]
  visitsByYear: { year: number; visits: number }[]
}

interface PlaceVisit {
  location: { name?: string; address?: string; latitudeE7?: number; longitudeE7?: number }
  duration: { startTimestamp?: string; endTimestamp?: string }
  placeConfidence?: string
}

interface SemanticLocationHistory {
  timelineObjects?: Array<{ placeVisit?: PlaceVisit }>
}

interface OldLocationHistory {
  startTime: string
  endTime: string
  visit?: { topCandidate?: { placeID?: string; placeLocation?: string; semanticType?: string } }
}

interface VisitRecord {
  name: string
  address: string
  city?: string
  country?: string
  startTime: string
  duration: number
}

const VOYAGES_CACHE_TTL = 24 * 3600 * 1000
const VOYAGES_CACHE_FILE = path.join(process.cwd(), 'data', 'voyages-cache.json')

function extractCityCountry(address: string): { city?: string; country?: string } {
  if (!address) return {}
  const parts = address.split(',').map((p) => p.trim())
  if (parts.length >= 2) {
    return { city: parts[parts.length - 2], country: parts[parts.length - 1] }
  }
  return { country: parts[0] }
}

function parseGeoLocation(geoStr: string): { lat: number; lng: number } | null {
  if (!geoStr || !geoStr.startsWith('geo:')) return null
  const coords = geoStr.replace('geo:', '').split(',')
  if (coords.length !== 2) return null
  const lat = parseFloat(coords[0])
  const lng = parseFloat(coords[1])
  if (isNaN(lat) || isNaN(lng)) return null
  return { lat, lng }
}

async function readJsonFiles(
  dir: string,
  allVisits: VisitRecord[],
  geocodeCache: Map<string, { city?: string; country?: string }>
): Promise<void> {
  if (!fs.existsSync(dir)) return
  const entries = await fsp.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await readJsonFiles(fullPath, allVisits, geocodeCache)
    } else if (entry.name.endsWith('.json')) {
      try {
        const content = await fsp.readFile(fullPath, 'utf-8')
        const data: SemanticLocationHistory | OldLocationHistory[] = JSON.parse(content)
        if (!Array.isArray(data) && data.timelineObjects) {
          for (const obj of data.timelineObjects) {
            if (obj.placeVisit?.location?.name) {
              const visit = obj.placeVisit
              const { city, country } = extractCityCountry(visit.location.address || '')
              const startTime = visit.duration?.startTimestamp || ''
              const endTime = visit.duration?.endTimestamp || ''
              let duration = 0
              if (startTime && endTime) {
                duration = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
              }
              allVisits.push({
                name: visit.location.name!,
                address: visit.location.address || '',
                city,
                country,
                startTime,
                duration,
              })
            }
          }
        } else if (Array.isArray(data)) {
          for (const item of data) {
            const oldVisit = item as OldLocationHistory
            if (oldVisit.visit?.topCandidate?.placeLocation) {
              const coords = parseGeoLocation(oldVisit.visit.topCandidate.placeLocation)
              if (coords) {
                const roundedKey = `${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`
                let city = geocodeCache.get(roundedKey)?.city
                let country = geocodeCache.get(roundedKey)?.country
                if (!city) {
                  city = `Location ${roundedKey}`
                  country = 'Unknown'
                  geocodeCache.set(roundedKey, { city, country })
                }
                const startTime = oldVisit.startTime
                const endTime = oldVisit.endTime
                let duration = 0
                if (startTime && endTime) {
                  duration = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
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
        logger.error(`Error parsing ${fullPath}:`, err)
      }
    }
  }
}

export async function loadVoyages(): Promise<TravelStats | null> {
  try {
    const dataDir = path.join(process.cwd(), 'data', 'location-history')
    if (!fs.existsSync(dataDir)) return null

    const cached = await readFileCache<TravelStats>(VOYAGES_CACHE_FILE)
    if (cached && isCacheFresh(cached.cachedAt, VOYAGES_CACHE_TTL)) {
      return cached.data
    }

    const allVisits: VisitRecord[] = []
    const geocodeCache = new Map<string, { city?: string; country?: string }>()
    await readJsonFiles(dataDir, allVisits, geocodeCache)
    if (allVisits.length === 0) return null

    const cacheFile = path.join(process.cwd(), 'data', 'geocode-cache.json')
    let persistentCache: Record<string, { city?: string; country?: string }> = {}
    if (fs.existsSync(cacheFile)) {
      try {
        persistentCache = JSON.parse(await fsp.readFile(cacheFile, 'utf-8'))
      } catch (err) {
        logger.error('Error reading geocode cache:', err)
      }
    }
    for (const visit of allVisits) {
      if (visit.city?.startsWith('Location ') && persistentCache[visit.address]) {
        visit.city = persistentCache[visit.address].city
        visit.country = persistentCache[visit.address].country
        if (visit.name.startsWith('Location ')) visit.name = visit.city || visit.name
      }
    }

    const placeCount = new Map<string, { visits: number; city?: string }>()
    const cityCount = new Map<string, { visits: number; country?: string }>()
    const countryCount = new Map<string, number>()
    const yearCount = new Map<number, number>()
    const uniqueDays = new Set<string>()

    for (const visit of allVisits) {
      const existing = placeCount.get(visit.name)
      if (existing) existing.visits++
      else placeCount.set(visit.name, { visits: 1, city: visit.city })
      if (visit.city) {
        const existingCity = cityCount.get(visit.city)
        if (existingCity) existingCity.visits++
        else cityCount.set(visit.city, { visits: 1, country: visit.country })
      }
      if (visit.country && visit.country !== 'Unknown') {
        countryCount.set(visit.country, (countryCount.get(visit.country) || 0) + 1)
      }
      if (visit.startTime) {
        const year = new Date(visit.startTime).getFullYear()
        yearCount.set(year, (yearCount.get(year) || 0) + 1)
        uniqueDays.add(visit.startTime.split('T')[0])
      }
    }

    const result: TravelStats = {
      totalPlaces: placeCount.size,
      totalCountries: countryCount.size,
      totalCities: cityCount.size,
      totalDays: uniqueDays.size,
      topPlaces: Array.from(placeCount.entries())
        .map(([name, d]) => ({ name, visits: d.visits, city: d.city }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 50),
      topCities: Array.from(cityCount.entries())
        .map(([name, d]) => ({ name, visits: d.visits, country: d.country }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 20),
      topCountries: Array.from(countryCount.entries())
        .map(([name, visits]) => ({ name, visits }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 20),
      visitsByYear: Array.from(yearCount.entries())
        .map(([year, visits]) => ({ year, visits }))
        .sort((a, b) => a.year - b.year),
    }

    await writeFileCache(VOYAGES_CACHE_FILE, result)
    return result
  } catch (err) {
    logger.error('loadVoyages error:', err)
    return null
  }
}

// Kept exported for back-compat with the API route
export { nominatimFetch }

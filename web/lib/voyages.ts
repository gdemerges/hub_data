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
  topCountries: { name: string; visits: number; firstVisit?: string; lastVisit?: string }[]
  visitsByYear: { year: number; visits: number }[]
  continents: { continent: string; countries: number; visits: number }[]
  averageStayMinutes: number
  longestStay: {
    name: string
    city?: string
    country?: string
    minutes: number
    startTime: string
  } | null
  mostActiveYear: { year: number; visits: number } | null
  recentCountries: { name: string; lastVisit: string }[]
}

const COUNTRY_TO_CONTINENT: Record<string, string> = {
  // Europe
  'France': 'Europe', 'Suisse': 'Europe', 'Royaume-Uni': 'Europe', 'Italie': 'Europe',
  'Espagne': 'Europe', 'Allemagne': 'Europe', 'Belgique': 'Europe', 'Pays-Bas': 'Europe',
  'Portugal': 'Europe', 'Autriche': 'Europe', 'Grèce': 'Europe', 'Pologne': 'Europe',
  'République tchèque': 'Europe', 'Hongrie': 'Europe', 'Irlande': 'Europe', 'Danemark': 'Europe',
  'Suède': 'Europe', 'Norvège': 'Europe', 'Finlande': 'Europe', 'Islande': 'Europe',
  'Croatie': 'Europe', 'Slovénie': 'Europe', 'Slovaquie': 'Europe', 'Roumanie': 'Europe',
  'Bulgarie': 'Europe', 'Luxembourg': 'Europe', 'Monaco': 'Europe', 'Vatican': 'Europe',
  'Malte': 'Europe', 'Chypre': 'Europe', 'Estonie': 'Europe', 'Lettonie': 'Europe',
  'Lituanie': 'Europe', 'Albanie': 'Europe', 'Serbie': 'Europe', 'Bosnie-Herzégovine': 'Europe',
  'Macédoine du Nord': 'Europe', 'Monténégro': 'Europe', 'Kosovo': 'Europe', 'Ukraine': 'Europe',
  'Moldavie': 'Europe', 'Biélorussie': 'Europe', 'Russie': 'Europe', 'Turquie': 'Europe',
  'Andorre': 'Europe', 'Saint-Marin': 'Europe', 'Liechtenstein': 'Europe',
  // Asie
  'Japon': 'Asie', 'Chine': 'Asie', 'Thaïlande': 'Asie', 'Vietnam': 'Asie',
  'Inde': 'Asie', 'Singapour': 'Asie', 'Corée du Sud': 'Asie', 'Corée du Nord': 'Asie',
  'Indonésie': 'Asie', 'Cambodge': 'Asie', 'Laos': 'Asie', 'Malaisie': 'Asie',
  'Philippines': 'Asie', 'Taïwan': 'Asie', 'Sri Lanka': 'Asie', 'Népal': 'Asie',
  'Bhoutan': 'Asie', 'Birmanie': 'Asie', 'Myanmar': 'Asie', 'Bangladesh': 'Asie',
  'Pakistan': 'Asie', 'Mongolie': 'Asie', 'Kazakhstan': 'Asie', 'Ouzbékistan': 'Asie',
  'Hong Kong': 'Asie', 'Macao': 'Asie',
  // Amérique du Nord
  'États-Unis': 'Amérique du Nord', 'Canada': 'Amérique du Nord', 'Mexique': 'Amérique du Nord',
  'Cuba': 'Amérique du Nord', 'Jamaïque': 'Amérique du Nord', 'Bahamas': 'Amérique du Nord',
  'République dominicaine': 'Amérique du Nord', 'Haïti': 'Amérique du Nord',
  'Costa Rica': 'Amérique du Nord', 'Panama': 'Amérique du Nord', 'Guatemala': 'Amérique du Nord',
  // Amérique du Sud
  'Brésil': 'Amérique du Sud', 'Argentine': 'Amérique du Sud', 'Chili': 'Amérique du Sud',
  'Pérou': 'Amérique du Sud', 'Colombie': 'Amérique du Sud', 'Bolivie': 'Amérique du Sud',
  'Équateur': 'Amérique du Sud', 'Uruguay': 'Amérique du Sud', 'Paraguay': 'Amérique du Sud',
  'Venezuela': 'Amérique du Sud', 'Guyana': 'Amérique du Sud', 'Suriname': 'Amérique du Sud',
  // Afrique
  'Maroc': 'Afrique', 'Tunisie': 'Afrique', 'Algérie': 'Afrique', 'Égypte': 'Afrique',
  'Afrique du Sud': 'Afrique', 'Kenya': 'Afrique', 'Tanzanie': 'Afrique', 'Sénégal': 'Afrique',
  'Côte d\'Ivoire': 'Afrique', 'Ghana': 'Afrique', 'Nigeria': 'Afrique', 'Éthiopie': 'Afrique',
  'Madagascar': 'Afrique', 'Maurice': 'Afrique', 'Île Maurice': 'Afrique', 'Réunion': 'Afrique',
  'Cameroun': 'Afrique', 'Mali': 'Afrique', 'Burkina Faso': 'Afrique', 'Bénin': 'Afrique',
  'Togo': 'Afrique', 'Rwanda': 'Afrique', 'Ouganda': 'Afrique', 'Namibie': 'Afrique',
  'Botswana': 'Afrique', 'Zimbabwe': 'Afrique', 'Mozambique': 'Afrique', 'Angola': 'Afrique',
  // Océanie
  'Australie': 'Océanie', 'Nouvelle-Zélande': 'Océanie', 'Fidji': 'Océanie',
  'Polynésie française': 'Océanie', 'Nouvelle-Calédonie': 'Océanie',
}

function continentOf(country: string): string {
  return COUNTRY_TO_CONTINENT[country] ?? 'Autre'
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
    const countryStats = new Map<string, { visits: number; firstVisit?: string; lastVisit?: string }>()
    const yearCount = new Map<number, number>()
    const uniqueDays = new Set<string>()

    let totalDurationMinutes = 0
    let durationVisitCount = 0
    let longestStay: TravelStats['longestStay'] = null

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
        const cs = countryStats.get(visit.country) ?? { visits: 0 }
        cs.visits += 1
        if (visit.startTime) {
          if (!cs.firstVisit || visit.startTime < cs.firstVisit) cs.firstVisit = visit.startTime
          if (!cs.lastVisit || visit.startTime > cs.lastVisit) cs.lastVisit = visit.startTime
        }
        countryStats.set(visit.country, cs)
      }
      if (visit.startTime) {
        const year = new Date(visit.startTime).getFullYear()
        yearCount.set(year, (yearCount.get(year) || 0) + 1)
        uniqueDays.add(visit.startTime.split('T')[0])
      }
      if (visit.duration && visit.duration > 0) {
        totalDurationMinutes += visit.duration
        durationVisitCount += 1
        if (!longestStay || visit.duration > longestStay.minutes) {
          longestStay = {
            name: visit.name,
            city: visit.city,
            country: visit.country,
            minutes: visit.duration,
            startTime: visit.startTime,
          }
        }
      }
    }

    const continentMap = new Map<string, { countries: Set<string>; visits: number }>()
    for (const [country, cs] of countryStats) {
      const cont = continentOf(country)
      const entry = continentMap.get(cont) ?? { countries: new Set<string>(), visits: 0 }
      entry.countries.add(country)
      entry.visits += cs.visits
      continentMap.set(cont, entry)
    }
    const continents = Array.from(continentMap.entries())
      .map(([continent, e]) => ({ continent, countries: e.countries.size, visits: e.visits }))
      .sort((a, b) => b.visits - a.visits)

    const yearArr = Array.from(yearCount.entries()).map(([year, visits]) => ({ year, visits }))
    const mostActiveYear = yearArr.length
      ? yearArr.reduce((best, cur) => (cur.visits > best.visits ? cur : best))
      : null

    const recentCountries = Array.from(countryStats.entries())
      .filter(([, cs]) => !!cs.lastVisit)
      .map(([name, cs]) => ({ name, lastVisit: cs.lastVisit! }))
      .sort((a, b) => b.lastVisit.localeCompare(a.lastVisit))
      .slice(0, 6)

    const result: TravelStats = {
      totalPlaces: placeCount.size,
      totalCountries: countryStats.size,
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
      topCountries: Array.from(countryStats.entries())
        .map(([name, cs]) => ({ name, visits: cs.visits, firstVisit: cs.firstVisit, lastVisit: cs.lastVisit }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 20),
      visitsByYear: yearArr.sort((a, b) => a.year - b.year),
      continents,
      averageStayMinutes: durationVisitCount ? totalDurationMinutes / durationVisitCount : 0,
      longestStay,
      mostActiveYear,
      recentCountries,
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

import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import path from 'node:path'
import { logger } from './logger'

export interface Partner {
  prenom: string
  ville: string
  genre: string
  nationalite: string
  annee: number
  penetration: string
  anneeNaissance: number
}

export interface AgeDistributionBucket {
  bucket: string
  count: number
}

export interface RencontresStats {
  total: number
  villes: { ville: string; count: number }[]
  nationalites: { nationalite: string; count: number }[]
  parAnnee: { annee: number; count: number }[]
  parAnneeNaissance: { annee: number; count: number }[]
  genres: { genre: string; count: number }[]
  ageAtMeeting: {
    avg: number
    min: number
    max: number
    distribution: AgeDistributionBucket[]
  }
  penetrationRate: number
  longestGapYears: number
  longestGapPeriod: { from: number; to: number } | null
  currentGapYears: number
  cumulative: { annee: number; total: number }[]
  activeYears: number
}

const POSITIVE_PENETRATION = new Set(['oui', 'yes', 'o', 'y', 'true', '1', 'vrai'])

function isPositivePenetration(value: string): boolean {
  return POSITIVE_PENETRATION.has(value.trim().toLowerCase())
}

function bucketizeAge(age: number): string {
  if (age < 18) return '< 18'
  if (age < 21) return '18-20'
  if (age < 25) return '21-24'
  if (age < 30) return '25-29'
  if (age < 35) return '30-34'
  if (age < 40) return '35-39'
  return '40+'
}

const AGE_BUCKET_ORDER = ['< 18', '18-20', '21-24', '25-29', '30-34', '35-39', '40+']

export async function loadRencontres(): Promise<{
  partners: Partner[]
  stats: RencontresStats | null
  hasData: boolean
}> {
  try {
    const dataFile = path.join(process.cwd(), 'data', 'partners.csv')
    if (!fs.existsSync(dataFile)) return { partners: [], stats: null, hasData: false }

    const content = await fsp.readFile(dataFile, 'utf-8')
    const lines = content.trim().split('\n')
    if (lines.length <= 1) return { partners: [], stats: null, hasData: false }

    const partners: Partner[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue
      const columns = line.split(';')
      if (columns.length >= 7) {
        partners.push({
          prenom: columns[0]?.trim() || '',
          ville: columns[1]?.trim() || '',
          genre: columns[2]?.trim() || '',
          nationalite: columns[3]?.trim() || '',
          annee: parseInt(columns[4]?.trim(), 10) || 0,
          penetration: columns[5]?.trim() || '',
          anneeNaissance: parseInt(columns[6]?.trim(), 10) || 0,
        })
      }
    }

    const villeCount = new Map<string, number>()
    const nationaliteCount = new Map<string, number>()
    const anneeCount = new Map<number, number>()
    const anneeNaissanceCount = new Map<number, number>()
    const genreCount = new Map<string, number>()
    const ageBuckets = new Map<string, number>()

    const ages: number[] = []
    let penetrationCount = 0
    let penetrationDenom = 0

    for (const p of partners) {
      if (p.ville) villeCount.set(p.ville, (villeCount.get(p.ville) || 0) + 1)
      if (p.nationalite) nationaliteCount.set(p.nationalite, (nationaliteCount.get(p.nationalite) || 0) + 1)
      if (p.annee) anneeCount.set(p.annee, (anneeCount.get(p.annee) || 0) + 1)
      if (p.anneeNaissance)
        anneeNaissanceCount.set(p.anneeNaissance, (anneeNaissanceCount.get(p.anneeNaissance) || 0) + 1)
      if (p.genre) genreCount.set(p.genre, (genreCount.get(p.genre) || 0) + 1)

      if (p.annee && p.anneeNaissance) {
        const age = p.annee - p.anneeNaissance
        if (age >= 10 && age <= 80) {
          ages.push(age)
          const bucket = bucketizeAge(age)
          ageBuckets.set(bucket, (ageBuckets.get(bucket) || 0) + 1)
        }
      }

      if (p.penetration) {
        penetrationDenom += 1
        if (isPositivePenetration(p.penetration)) penetrationCount += 1
      }
    }

    const parAnneeArr = Array.from(anneeCount.entries())
      .map(([annee, count]) => ({ annee, count }))
      .sort((a, b) => a.annee - b.annee)

    // Cumulative
    let runningTotal = 0
    const cumulative = parAnneeArr.map(({ annee, count }) => {
      runningTotal += count
      return { annee, total: runningTotal }
    })

    // Longest gap between two years that have at least one meeting
    let longestGapYears = 0
    let longestGapPeriod: { from: number; to: number } | null = null
    for (let i = 1; i < parAnneeArr.length; i++) {
      const gap = parAnneeArr[i].annee - parAnneeArr[i - 1].annee
      if (gap > longestGapYears) {
        longestGapYears = gap
        longestGapPeriod = { from: parAnneeArr[i - 1].annee, to: parAnneeArr[i].annee }
      }
    }

    const lastYear = parAnneeArr.length ? parAnneeArr[parAnneeArr.length - 1].annee : 0
    const currentYear = new Date().getFullYear()
    const currentGapYears = lastYear ? Math.max(0, currentYear - lastYear) : 0

    const ageAvg = ages.length ? ages.reduce((s, a) => s + a, 0) / ages.length : 0
    const ageMin = ages.length ? Math.min(...ages) : 0
    const ageMax = ages.length ? Math.max(...ages) : 0
    const ageDistribution = AGE_BUCKET_ORDER.map(bucket => ({
      bucket,
      count: ageBuckets.get(bucket) || 0,
    })).filter(b => b.count > 0)

    const stats: RencontresStats = {
      total: partners.length,
      villes: Array.from(villeCount.entries())
        .map(([ville, count]) => ({ ville, count }))
        .sort((a, b) => b.count - a.count),
      nationalites: Array.from(nationaliteCount.entries())
        .map(([nationalite, count]) => ({ nationalite, count }))
        .sort((a, b) => b.count - a.count),
      parAnnee: parAnneeArr,
      parAnneeNaissance: Array.from(anneeNaissanceCount.entries())
        .map(([annee, count]) => ({ annee, count }))
        .sort((a, b) => a.annee - b.annee),
      genres: Array.from(genreCount.entries())
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count),
      ageAtMeeting: {
        avg: ageAvg,
        min: ageMin,
        max: ageMax,
        distribution: ageDistribution,
      },
      penetrationRate: penetrationDenom ? penetrationCount / penetrationDenom : 0,
      longestGapYears,
      longestGapPeriod,
      currentGapYears,
      cumulative,
      activeYears: parAnneeArr.length,
    }

    return { partners, stats, hasData: true }
  } catch (error) {
    logger.error('Rencontres loader error:', error)
    return { partners: [], stats: null, hasData: false }
  }
}

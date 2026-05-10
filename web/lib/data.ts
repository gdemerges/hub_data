import { Game, Film, Series, Book } from './types'
import gamesData from '@/data/games.json'
import filmsData from '@/data/films.json'
import seriesData from '@/data/series.json'
import { logger } from './logger'

const GITHUB_USERNAME = process.env.NEXT_PUBLIC_GITHUB_USERNAME ?? 'gdemerges'
const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql'

function contributionsQuery(year: number) {
  return {
    query: `
      query($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar { totalContributions }
          }
        }
      }
    `,
    variables: {
      username: GITHUB_USERNAME,
      from: `${year}-01-01T00:00:00Z`,
      to: `${year}-12-31T23:59:59Z`,
    },
  }
}

// Aliases applied at read time so all consumers (stats, charts, lists) see the same
// merged platform names. Macintosh is folded into PC since both run the same titles.
const PLATFORM_ALIASES: Record<string, string> = {
  Macintosh: 'PC',
}

function normalizePlatform(p: string): string {
  return PLATFORM_ALIASES[p] ?? p
}

export async function getGamesData(): Promise<Game[]> {
  return (gamesData as Game[]).map(g => ({
    ...g,
    platform: g.platform ? normalizePlatform(g.platform) : g.platform,
    platforms: g.platforms?.map(p => ({ ...p, platform: normalizePlatform(p.platform) })),
  }))
}

export async function getFilmsData(): Promise<Film[]> {
  return filmsData as Film[]
}

export async function getSeriesData(): Promise<Series[]> {
  return seriesData as Series[]
}

export async function getBooksData(): Promise<Book[]> {
  const { loadBooks } = await import('./books-loader')
  return loadBooks()
}

const GITHUB_FLOOR_YEAR = 2008

function buildAllYearsQuery(startYear: number, endYear: number): string {
  const aliases = []
  for (let y = startYear; y <= endYear; y++) {
    aliases.push(
      `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") { contributionCalendar { totalContributions } }`
    )
  }
  return `
    query($username: String!) {
      user(login: $username) {
        createdAt
        ${aliases.join('\n        ')}
      }
    }
  `
}

export async function getGitHubContributions(year?: number | null): Promise<number> {
  try {
    const token = process.env.GITHUB_TOKEN
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }

    // Specific year — single query
    if (year) {
      const response = await fetch(GITHUB_GRAPHQL_API, {
        method: 'POST',
        headers,
        body: JSON.stringify(contributionsQuery(year)),
        next: { revalidate: 3600 },
      })
      const data = await response.json()
      return data.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions || 0
    }

    // All years — single combined query with aliases (one round trip)
    const currentYear = new Date().getFullYear()
    const response = await fetch(GITHUB_GRAPHQL_API, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: buildAllYearsQuery(GITHUB_FLOOR_YEAR, currentYear),
        variables: { username: GITHUB_USERNAME },
      }),
      next: { revalidate: 3600 },
    })

    const data = await response.json()
    const user = data.data?.user
    if (!user) return 0

    const createdYear = user.createdAt ? new Date(user.createdAt).getFullYear() : GITHUB_FLOOR_YEAR
    let total = 0
    for (let y = Math.max(createdYear, GITHUB_FLOOR_YEAR); y <= currentYear; y++) {
      total += user[`y${y}`]?.contributionCalendar?.totalContributions || 0
    }
    return total
  } catch (error) {
    logger.error('Failed to fetch GitHub contributions:', error)
    return 0
  }
}

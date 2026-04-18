import { Game, Film, Series, Book } from './types'
import gamesData from '@/data/games.json'
import filmsData from '@/data/films.json'
import seriesData from '@/data/series.json'

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

export async function getGamesData(): Promise<Game[]> {
  return gamesData as Game[]
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

export async function getGitHubContributions(year?: number | null): Promise<number> {
  try {
    const token = process.env.GITHUB_TOKEN

    // If no year specified, sum contributions from all years
    if (!year) {
      // Get user creation year to know how far back to go
      const userQuery = {
        query: `
          query($username: String!) {
            user(login: $username) {
              createdAt
            }
          }
        `,
        variables: { username: GITHUB_USERNAME },
      }

      const userResponse = await fetch(GITHUB_GRAPHQL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(userQuery),
        next: { revalidate: 3600 },
      })

      const userData = await userResponse.json()
      const createdAt = userData.data?.user?.createdAt
      const startYear = createdAt ? new Date(createdAt).getFullYear() : 2008
      const currentYear = new Date().getFullYear()

      // Query each year individually in parallel and sum up
      const yearPromises = []
      for (let y = startYear; y <= currentYear; y++) {
        yearPromises.push(
          fetch(GITHUB_GRAPHQL_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
            body: JSON.stringify(contributionsQuery(y)),
            next: { revalidate: 3600 },
          }).then(res => res.json())
        )
      }

      const results = await Promise.all(yearPromises)
      const totalContributions = results.reduce((sum, data) => {
        const yearContributions = data.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions || 0
        return sum + yearContributions
      }, 0)

      return totalContributions
    }

    // Get contributions for specific year
    const response = await fetch(GITHUB_GRAPHQL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: JSON.stringify(contributionsQuery(year)),
      next: { revalidate: 3600 },
    })

    const data = await response.json()
    return data.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions || 0
  } catch (error) {
    console.error('Failed to fetch GitHub contributions:', error)
    return 0
  }
}

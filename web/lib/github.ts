import 'server-only'
import {
  readGitHubCache,
  writeGitHubCache,
  isCacheFresh,
  reposNeedingLanguageRefetch,
  type GitHubRawRepo,
  type GitHubCacheData,
} from './github-cache'
import { logger } from './logger'
import type { GitHubData } from './types'

const GITHUB_API = 'https://api.github.com'
const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql'

export interface ContributionsData {
  totalContributions: number
  contributions: {
    date: string
    count: number
    level: 0 | 1 | 2 | 3 | 4
  }[]
}

export interface YearlyContributionsData {
  yearlyContributions: { year: number; contributions: number }[]
  totalYears: number
  totalContributions: number
}

interface FetchOpts {
  headers: HeadersInit
}

function fetchOpts(): FetchOpts {
  const token = process.env.GITHUB_TOKEN
  return {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  }
}

interface GitHubUser {
  login: string
  name?: string | null
  avatar_url: string
  bio?: string | null
  location?: string | null
  company?: string | null
  blog?: string | null
  public_repos: number
  followers: number
  following: number
  created_at?: string
}

function buildGitHubData(data: GitHubCacheData, cachedAt: number): GitHubData {
  const { repos, languagesByRepo, totalContributions } = data
  const user = data.user as unknown as GitHubUser

  const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0)
  const totalForks = repos.reduce((acc, r) => acc + r.forks_count, 0)

  const languageBytes = new Map<string, number>()
  for (const entry of Object.values(languagesByRepo)) {
    for (const [lang, bytes] of Object.entries(entry.languages)) {
      languageBytes.set(lang, (languageBytes.get(lang) ?? 0) + bytes)
    }
  }
  const totalBytes = Array.from(languageBytes.values()).reduce((sum, b) => sum + b, 0)
  const topLanguages = Array.from(languageBytes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([lang, bytes]) => ({
      language: lang,
      bytes,
      percentage: totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) : '0.0',
    }))

  const topRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6)
    .map((repo) => ({
      name: repo.name,
      description: repo.description ?? '',
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language ?? '',
      url: repo.html_url,
      updatedAt: repo.updated_at,
    }))

  return {
    user: {
      login: user.login,
      name: user.name ?? '',
      avatar: user.avatar_url,
      bio: user.bio ?? '',
      location: user.location ?? '',
      company: user.company ?? '',
      blog: user.blog ?? '',
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
    },
    stats: {
      totalRepos: repos.length,
      totalStars,
      totalForks,
      totalContributions,
      topLanguages,
    },
    topRepos,
    fetchedAt: new Date(cachedAt).toISOString(),
  }
}

export async function loadGitHub(username: string, { force = false } = {}): Promise<GitHubData | null> {
  const existing = await readGitHubCache()
  if (!force && existing && isCacheFresh(existing.cachedAt)) {
    return buildGitHubData(existing.data, existing.cachedAt)
  }

  try {
    const opts = fetchOpts()
    const [userResponse, reposResponse] = await Promise.all([
      fetch(`${GITHUB_API}/users/${username}`, opts),
      fetch(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated`, opts),
    ])

    if (!userResponse.ok) {
      throw new Error('GitHub user not found')
    }

    const user = await userResponse.json()
    const reposRaw = await reposResponse.json()

    if (!Array.isArray(reposRaw)) {
      throw new Error('Unexpected GitHub repos response')
    }
    const repos: GitHubRawRepo[] = reposRaw

    const topReposByStars = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 20)
    const staleRepos = reposNeedingLanguageRefetch(topReposByStars, existing?.data ?? null, username)
    const languagesByRepo = { ...(existing?.data.languagesByRepo ?? {}) }

    await Promise.all(
      staleRepos.map(async (repo) => {
        const key = `${username}/${repo.name}`
        try {
          const langResponse = await fetch(`${GITHUB_API}/repos/${username}/${repo.name}/languages`, opts)
          if (langResponse.ok) {
            const languages: Record<string, number> = await langResponse.json()
            languagesByRepo[key] = { languages, pushedAt: repo.pushed_at }
          }
        } catch (err) {
          logger.error(`Error fetching languages for ${repo.name}:`, err)
        }
      })
    )

    const currentYear = new Date().getFullYear()
    let totalContributions = existing?.data.totalContributions ?? 0
    try {
      const contribResponse = await fetch(GITHUB_GRAPHQL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
        },
        body: JSON.stringify({
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
            username,
            from: `${currentYear}-01-01T00:00:00Z`,
            to: `${currentYear}-12-31T23:59:59Z`,
          },
        }),
      })
      if (contribResponse.ok) {
        const contribData = await contribResponse.json()
        totalContributions =
          contribData.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions ??
          totalContributions
      }
    } catch (err) {
      logger.error('Error fetching contributions:', err)
    }

    const updated: GitHubCacheData = { user, repos, languagesByRepo, totalContributions }
    await writeGitHubCache(updated)
    return buildGitHubData(updated, Date.now())
  } catch (error) {
    logger.error('GitHub load error:', error)
    return existing ? buildGitHubData(existing.data, existing.cachedAt) : null
  }
}

export async function loadGitHubContributions(username: string, year: number): Promise<ContributionsData | null> {
  try {
    const token = process.env.GITHUB_TOKEN
    const fromDate = `${year}-01-01T00:00:00Z`
    const toDate = `${year}-12-31T23:59:59Z`

    const response = await fetch(GITHUB_GRAPHQL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        query: `
          query($username: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $username) {
              contributionsCollection(from: $from, to: $to) {
                contributionCalendar {
                  totalContributions
                  weeks {
                    contributionDays { contributionCount date contributionLevel }
                  }
                }
              }
            }
          }
        `,
        variables: { username, from: fromDate, to: toDate },
      }),
      next: { revalidate: 21600 },
    })

    const data = await response.json()
    const calendar = data.data?.user?.contributionsCollection?.contributionCalendar
    interface Day { date: string; contributionCount: number; contributionLevel: string }
    interface Week { contributionDays: Day[] }
    const contributions = (calendar?.weeks as Week[] | undefined)
      ?.flatMap((w) => w.contributionDays)
      .map((d) => ({
        date: d.date,
        count: d.contributionCount,
        level: ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'].indexOf(
          d.contributionLevel
        ) as 0 | 1 | 2 | 3 | 4,
      })) ?? []

    return {
      totalContributions: calendar?.totalContributions ?? 0,
      contributions,
    }
  } catch (error) {
    logger.error('GitHub contributions error:', error)
    return null
  }
}

export async function loadGitHubYearly(username: string): Promise<YearlyContributionsData | null> {
  try {
    const token = process.env.GITHUB_TOKEN
    const currentYear = new Date().getFullYear()
    const startYear = 2010

    const yearlyPromises: Promise<{ year: number; contributions: number }>[] = []
    for (let year = startYear; year <= currentYear; year++) {
      const fromDate = `${year}-01-01T00:00:00Z`
      const toDate = `${year}-12-31T23:59:59Z`
      yearlyPromises.push(
        fetch(GITHUB_GRAPHQL_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            query: `
              query($username: String!, $from: DateTime!, $to: DateTime!) {
                user(login: $username) {
                  contributionsCollection(from: $from, to: $to) {
                    contributionCalendar { totalContributions }
                  }
                }
              }
            `,
            variables: { username, from: fromDate, to: toDate },
          }),
          next: { revalidate: 21600 },
        })
          .then((res) => res.json())
          .then((data) => ({
            year,
            contributions:
              data.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions ?? 0,
          }))
          .catch(() => ({ year, contributions: 0 }))
      )
    }

    const yearlyData = await Promise.all(yearlyPromises)
    const firstNonZeroIndex = yearlyData.findIndex((d) => d.contributions > 0)
    const filteredData = firstNonZeroIndex >= 0 ? yearlyData.slice(firstNonZeroIndex) : yearlyData

    return {
      yearlyContributions: filteredData,
      totalYears: filteredData.length,
      totalContributions: filteredData.reduce((sum, d) => sum + d.contributions, 0),
    }
  } catch (error) {
    logger.error('GitHub yearly error:', error)
    return null
  }
}

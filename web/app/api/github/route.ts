import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const GITHUB_API = 'https://api.github.com'
const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql'

// Cache TTL: 24h in ms
const LANG_CACHE_TTL = 24 * 60 * 60 * 1000
const LANG_CACHE_FILE = path.join(process.cwd(), '..', 'data', 'github-languages-cache.json')

interface LangCacheEntry {
  languages: Record<string, number>
  fetchedAt: number
}

function loadLangCache(): Record<string, LangCacheEntry> {
  try {
    if (fs.existsSync(LANG_CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(LANG_CACHE_FILE, 'utf-8'))
    }
  } catch {}
  return {}
}

function saveLangCache(cache: Record<string, LangCacheEntry>): void {
  try {
    fs.writeFileSync(LANG_CACHE_FILE, JSON.stringify(cache, null, 2))
  } catch (e) {
    console.error('Failed to save GitHub languages cache:', e)
  }
}

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    const token = process.env.GITHUB_TOKEN
    const fetchOpts = {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(token && { Authorization: `Bearer ${token}` }),
      } as HeadersInit,
      next: { revalidate: 21600 }, // 6h Next.js cache
    }

    // Fetch user data and repos in parallel
    const [userResponse, reposResponse] = await Promise.all([
      fetch(`${GITHUB_API}/users/${username}`, fetchOpts),
      fetch(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated`, fetchOpts),
    ])

    if (!userResponse.ok) {
      throw new Error('GitHub user not found')
    }

    const user = await userResponse.json()
    const repos = await reposResponse.json()

    // Calculate stats
    const totalStars = repos.reduce((acc: number, repo: any) => acc + repo.stargazers_count, 0)
    const totalForks = repos.reduce((acc: number, repo: any) => acc + repo.forks_count, 0)

    // Languages: use file cache, limit to 20 most-starred repos
    const langCache = loadLangCache()
    const now = Date.now()
    const languageBytes = new Map<string, number>()

    const topReposByStars = [...repos]
      .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
      .slice(0, 20)

    const languagePromises = topReposByStars.map(async (repo: any) => {
      const cacheKey = `${username}/${repo.name}`
      const cached = langCache[cacheKey]

      if (cached && now - cached.fetchedAt < LANG_CACHE_TTL) {
        return cached.languages
      }

      try {
        const langResponse = await fetch(
          `${GITHUB_API}/repos/${username}/${repo.name}/languages`,
          fetchOpts
        )
        if (langResponse.ok) {
          const languages = await langResponse.json()
          langCache[cacheKey] = { languages, fetchedAt: now }
          return languages as Record<string, number>
        }
      } catch (error) {
        console.error(`Error fetching languages for ${repo.name}:`, error)
      }
      return null
    })

    const languageResults = await Promise.all(languagePromises)
    saveLangCache(langCache)

    languageResults.forEach(languages => {
      if (languages) {
        Object.entries(languages).forEach(([lang, bytes]) => {
          languageBytes.set(lang, (languageBytes.get(lang) || 0) + (bytes as number))
        })
      }
    })

    const totalBytes = Array.from(languageBytes.values()).reduce((sum, bytes) => sum + bytes, 0)

    const topLanguages = Array.from(languageBytes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([lang, bytes]) => ({
        language: lang,
        bytes,
        percentage: ((bytes / totalBytes) * 100).toFixed(1),
      }))

    // Contributions for current year
    const currentYear = new Date().getFullYear()
    const fromDate = `${currentYear}-01-01T00:00:00Z`
    const toDate = `${currentYear}-12-31T23:59:59Z`

    const contributionsQuery = {
      query: `
        query($username: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $username) {
            contributionsCollection(from: $from, to: $to) {
              contributionCalendar {
                totalContributions
              }
            }
          }
        }
      `,
      variables: { username, from: fromDate, to: toDate },
    }

    let totalContributions = 0
    try {
      const contribResponse = await fetch(GITHUB_GRAPHQL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(contributionsQuery),
        next: { revalidate: 21600 },
      })

      if (contribResponse.ok) {
        const contribData = await contribResponse.json()
        totalContributions =
          contribData.data?.user?.contributionsCollection?.contributionCalendar
            ?.totalContributions || 0
      }
    } catch (error) {
      console.error('Error fetching contributions:', error)
    }

    // Top repos by stars
    const topRepos = repos
      .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6)
      .map((repo: any) => ({
        name: repo.name,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        url: repo.html_url,
        updatedAt: repo.updated_at,
      }))

    return NextResponse.json(
      {
        user: {
          login: user.login,
          name: user.name,
          avatar: user.avatar_url,
          bio: user.bio,
          location: user.location,
          company: user.company,
          blog: user.blog,
          publicRepos: user.public_repos,
          followers: user.followers,
          following: user.following,
          createdAt: user.created_at,
        },
        stats: {
          totalRepos: repos.length,
          totalStars,
          totalForks,
          totalContributions,
          topLanguages,
        },
        topRepos,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600' } }
    )
  } catch (error) {
    console.error('GitHub API error:', error)
    return NextResponse.json({ error: 'Failed to fetch GitHub data' }, { status: 500 })
  }
}

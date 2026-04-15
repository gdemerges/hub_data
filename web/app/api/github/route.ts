import { NextRequest, NextResponse } from 'next/server'

const GITHUB_API = 'https://api.github.com'
const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql'

// In-memory language cache — valid for the lifetime of the server process.
// Next.js ISR (revalidate: 21600) handles full response caching.
const LANG_CACHE_TTL = 6 * 60 * 60 * 1000 // 6h in ms
const langCache = new Map<string, { languages: Record<string, number>; fetchedAt: number }>()

interface GitHubRawRepo {
  name: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  html_url: string
  updated_at: string
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
    const reposRaw = await reposResponse.json()

    if (!Array.isArray(reposRaw)) {
      throw new Error('Unexpected GitHub repos response')
    }
    const repos: GitHubRawRepo[] = reposRaw

    // Calculate stats
    const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0)
    const totalForks = repos.reduce((acc, repo) => acc + repo.forks_count, 0)

    // Languages: use in-memory cache, limit to 20 most-starred repos
    const now = Date.now()
    const languageBytes = new Map<string, number>()

    const topReposByStars = [...repos]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 20)

    const languagePromises = topReposByStars.map(async (repo) => {
      const cacheKey = `${username}/${repo.name}`
      const cached = langCache.get(cacheKey)

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
          langCache.set(cacheKey, { languages, fetchedAt: now })
          return languages as Record<string, number>
        }
      } catch (error) {
        console.error(`Error fetching languages for ${repo.name}:`, error)
      }
      return null
    })

    const languageResults = await Promise.all(languagePromises)

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
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6)
      .map((repo) => ({
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
        fetchedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600' } }
    )
  } catch (error) {
    console.error('GitHub API error:', error)
    return NextResponse.json({ error: 'Failed to fetch GitHub data' }, { status: 500 })
  }
}

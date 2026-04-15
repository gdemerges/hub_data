import { NextRequest, NextResponse } from 'next/server'
import {
  readGitHubCache,
  writeGitHubCache,
  isCacheFresh,
  reposNeedingLanguageRefetch,
  type GitHubRawRepo,
  type GitHubCache,
} from '@/lib/github-cache'

const GITHUB_API = 'https://api.github.com'
const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql'

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    // --- Check file cache first ---
    const existingCache = await readGitHubCache()
    if (existingCache && isCacheFresh(existingCache)) {
      return buildResponse(existingCache)
    }

    // --- Cache stale or missing: fetch fresh data ---
    const token = process.env.GITHUB_TOKEN
    const fetchOpts = {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(token && { Authorization: `Bearer ${token}` }),
      } as HeadersInit,
    }

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

    // --- Delta sync for language data ---
    // Only re-fetch languages for repos pushed to since last cache
    const topReposByStars = [...repos]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 20)

    const staleRepos = reposNeedingLanguageRefetch(topReposByStars, existingCache, username)

    // Preserve existing language entries, then overlay fresh ones
    const languagesByRepo = { ...(existingCache?.languagesByRepo ?? {}) }

    const languagePromises = staleRepos.map(async (repo) => {
      const key = `${username}/${repo.name}`
      try {
        const langResponse = await fetch(
          `${GITHUB_API}/repos/${username}/${repo.name}/languages`,
          fetchOpts
        )
        if (langResponse.ok) {
          const languages: Record<string, number> = await langResponse.json()
          languagesByRepo[key] = { languages, pushedAt: repo.pushed_at }
        }
      } catch (err) {
        console.error(`Error fetching languages for ${repo.name}:`, err)
      }
    })

    await Promise.all(languagePromises)

    // --- Aggregate language bytes across top repos ---
    const languageBytes = new Map<string, number>()
    for (const repo of topReposByStars) {
      const key = `${username}/${repo.name}`
      const entry = languagesByRepo[key]
      if (entry) {
        for (const [lang, bytes] of Object.entries(entry.languages)) {
          languageBytes.set(lang, (languageBytes.get(lang) ?? 0) + bytes)
        }
      }
    }

    const totalBytes = Array.from(languageBytes.values()).reduce((sum, b) => sum + b, 0)
    const topLanguages = Array.from(languageBytes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([lang, bytes]) => ({
        language: lang,
        bytes,
        percentage: ((bytes / totalBytes) * 100).toFixed(1),
      }))

    // --- Contributions for current year ---
    const currentYear = new Date().getFullYear()
    let totalContributions = existingCache?.totalContributions ?? 0

    try {
      const contribResponse = await fetch(GITHUB_GRAPHQL_API, {
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
          contribData.data?.user?.contributionsCollection?.contributionCalendar
            ?.totalContributions ?? totalContributions
      }
    } catch (err) {
      console.error('Error fetching contributions:', err)
    }

    // --- Build and persist updated cache ---
    const updatedCache: GitHubCache = {
      cachedAt: Date.now(),
      user,
      repos,
      languagesByRepo,
      totalContributions,
    }
    await writeGitHubCache(updatedCache)

    return buildResponse(updatedCache)
  } catch (error) {
    console.error('GitHub API error:', error)
    return NextResponse.json({ error: 'Failed to fetch GitHub data' }, { status: 500 })
  }
}

function buildResponse(cache: GitHubCache): NextResponse {
  const { user, repos, languagesByRepo, totalContributions } = cache

  const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0)
  const totalForks = repos.reduce((acc, r) => acc + r.forks_count, 0)

  // Re-aggregate languages from cache
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
      percentage: ((bytes / totalBytes) * 100).toFixed(1),
    }))

  const topRepos = [...repos]
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
      fetchedAt: new Date(cache.cachedAt).toISOString(),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600' } }
  )
}

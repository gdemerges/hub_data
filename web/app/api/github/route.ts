import { NextRequest, NextResponse } from 'next/server'

const GITHUB_API = 'https://api.github.com'
const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql'

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    const token = process.env.GITHUB_TOKEN
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }

    // Fetch user data and repos in parallel
    const [userResponse, reposResponse] = await Promise.all([
      fetch(`${GITHUB_API}/users/${username}`, { headers }),
      fetch(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated`, { headers }),
    ])

    if (!userResponse.ok) {
      throw new Error('GitHub user not found')
    }

    const user = await userResponse.json()
    const repos = await reposResponse.json()

    // Calculate stats
    const totalStars = repos.reduce((acc: number, repo: any) => acc + repo.stargazers_count, 0)
    const totalForks = repos.reduce((acc: number, repo: any) => acc + repo.forks_count, 0)

    // Get languages by bytes (lines of code)
    const languageBytes = new Map<string, number>()

    // Fetch language data for each repo (limited to avoid rate limits)
    const languagePromises = repos.slice(0, 50).map(async (repo: any) => {
      try {
        const langResponse = await fetch(`${GITHUB_API}/repos/${username}/${repo.name}/languages`, { headers })
        if (langResponse.ok) {
          const languages = await langResponse.json()
          return { repo: repo.name, languages }
        }
      } catch (error) {
        console.error(`Error fetching languages for ${repo.name}:`, error)
      }
      return null
    })

    const languageResults = await Promise.all(languagePromises)

    // Aggregate language bytes
    languageResults.forEach(result => {
      if (result?.languages) {
        Object.entries(result.languages).forEach(([lang, bytes]) => {
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
        percentage: ((bytes / totalBytes) * 100).toFixed(1)
      }))

    // Get total contributions (current year for now, can be expanded)
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
      })

      if (contribResponse.ok) {
        const contribData = await contribResponse.json()
        totalContributions = contribData.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions || 0
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

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('GitHub API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GitHub data' },
      { status: 500 }
    )
  }
}

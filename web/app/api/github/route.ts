import { NextRequest, NextResponse } from 'next/server'

const GITHUB_API = 'https://api.github.com'

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
    
    // Get languages
    const languagesMap = new Map<string, number>()
    repos.forEach((repo: any) => {
      if (repo.language) {
        languagesMap.set(repo.language, (languagesMap.get(repo.language) || 0) + 1)
      }
    })
    const topLanguages = Array.from(languagesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang, count]) => ({ language: lang, count }))

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

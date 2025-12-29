import { NextRequest, NextResponse } from 'next/server'

const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql'

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    const token = process.env.GITHUB_TOKEN

    const currentYear = new Date().getFullYear()
    const startYear = 2010 // Start from 2010 or adjust based on user's join date

    // Fetch contributions for each year
    const yearlyPromises = []
    for (let year = startYear; year <= currentYear; year++) {
      const fromDate = `${year}-01-01T00:00:00Z`
      const toDate = `${year}-12-31T23:59:59Z`

      const query = {
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

      const promise = fetch(GITHUB_GRAPHQL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(query),
      })
        .then(res => res.json())
        .then(data => ({
          year,
          contributions: data.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions || 0,
        }))
        .catch(() => ({ year, contributions: 0 }))

      yearlyPromises.push(promise)
    }

    const yearlyData = await Promise.all(yearlyPromises)

    // Filter out years with 0 contributions at the beginning
    const firstNonZeroIndex = yearlyData.findIndex(d => d.contributions > 0)
    const filteredData = firstNonZeroIndex >= 0 ? yearlyData.slice(firstNonZeroIndex) : yearlyData

    return NextResponse.json({
      yearlyContributions: filteredData,
      totalYears: filteredData.length,
      totalContributions: filteredData.reduce((sum, d) => sum + d.contributions, 0),
    })
  } catch (error) {
    console.error('GitHub yearly contributions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch yearly contributions data' },
      { status: 500 }
    )
  }
}

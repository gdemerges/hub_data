import { NextRequest, NextResponse } from 'next/server'

const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql'

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username')
    const yearParam = request.nextUrl.searchParams.get('year')

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    const token = process.env.GITHUB_TOKEN

    // Calculate date range for the year
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()
    const fromDate = `${year}-01-01T00:00:00Z`
    const toDate = `${year}-12-31T23:59:59Z`

    // GraphQL query for contributions
    const graphqlQuery = {
      query: `
        query($username: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $username) {
            contributionsCollection(from: $from, to: $to) {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                    contributionLevel
                  }
                }
              }
            }
          }
        }
      `,
      variables: { username, from: fromDate, to: toDate },
    }

    const contributionsResponse = await fetch(GITHUB_GRAPHQL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(graphqlQuery),
    })

    const contributionsData = await contributionsResponse.json()

    // Process contributions data
    const contributionCalendar = contributionsData.data?.user?.contributionsCollection?.contributionCalendar
    const contributions = contributionCalendar?.weeks
      ?.flatMap((week: any) => week.contributionDays)
      .map((day: any) => ({
        date: day.date,
        count: day.contributionCount,
        level: ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'].indexOf(
          day.contributionLevel
        ) as 0 | 1 | 2 | 3 | 4,
      })) || []

    return NextResponse.json({
      totalContributions: contributionCalendar?.totalContributions || 0,
      contributions,
    })
  } catch (error) {
    console.error('GitHub Contributions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GitHub contributions' },
      { status: 500 }
    )
  }
}

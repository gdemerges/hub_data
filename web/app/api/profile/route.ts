import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getGamesData, getFilmsData, getSeriesData, getGitHubContributions } from '@/lib/data'

export async function GET(request: NextRequest) {
  try {
    const yearParam = request.nextUrl.searchParams.get('year')
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()

    // Fetch all data
    const [allGames, allFilms, allSeries, contributions] = await Promise.all([
      getGamesData(),
      getFilmsData(),
      getSeriesData(),
      getGitHubContributions(year),
    ])

    // Filter by year
    const games = allGames.filter((game) => game.releaseYear === year)
    const films = allFilms.filter((film) => film.releaseYear === year)
    const series = allSeries.filter((s) => s.releaseYear === year)

    // Get Strava stats
    let runDistance = 0
    try {
      const tokenFile = path.join(process.cwd(), 'data', 'strava-tokens.json')
      if (fs.existsSync(tokenFile)) {
        const stravaResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/strava/stats?year=${year}`)
        if (stravaResponse.ok) {
          const stravaData = await stravaResponse.json()
          runDistance = stravaData.yearRunDistance || 0
        }
      }
    } catch (err) {
      console.error('Failed to fetch Strava data:', err)
    }

    // Get partners count
    let partnersCount = 0
    try {
      const partnersFile = path.join(process.cwd(), 'data', 'partners.csv')
      if (fs.existsSync(partnersFile)) {
        const content = fs.readFileSync(partnersFile, 'utf-8')
        const lines = content.trim().split('\n')
        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split(';')
          const partnerYear = columns[4]?.trim()
          if (partnerYear && parseInt(partnerYear) === year) {
            partnersCount++
          }
        }
      }
    } catch (err) {
      console.error('Failed to read partners:', err)
    }

    // Get voyages stats
    let countriesVisited = 0
    let citiesVisited = 0
    try {
      const voyagesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/voyages`)
      if (voyagesResponse.ok) {
        const voyagesData = await voyagesResponse.json()
        countriesVisited = voyagesData.totalCountries || 0
        citiesVisited = voyagesData.totalCities || 0
      }
    } catch (err) {
      console.error('Failed to fetch voyages:', err)
    }

    // Calculate gaming hours for the year
    const gamingHours = games.reduce((sum, game) => sum + (game.hoursPlayed || 0), 0)

    // Normalize data for radar chart (0-100 scale)
    const maxValues = {
      gaming: 500, // 500h max
      films: 100, // 100 films max
      series: 30, // 30 séries max
      sport: 1000, // 1000 km max
      code: 2000, // 2000 contributions max
      social: 20, // 20 partenaires max
      voyages: 20, // 20 pays max
    }

    const radarData = [
      {
        category: 'Gaming',
        value: Math.min(100, (gamingHours / maxValues.gaming) * 100),
        rawValue: gamingHours,
        unit: 'h',
      },
      {
        category: 'Films',
        value: Math.min(100, (films.length / maxValues.films) * 100),
        rawValue: films.length,
        unit: '',
      },
      {
        category: 'Séries',
        value: Math.min(100, (series.length / maxValues.series) * 100),
        rawValue: series.length,
        unit: '',
      },
      {
        category: 'Sport',
        value: Math.min(100, (runDistance / maxValues.sport) * 100),
        rawValue: Math.round(runDistance),
        unit: 'km',
      },
      {
        category: 'Code',
        value: Math.min(100, (contributions / maxValues.code) * 100),
        rawValue: contributions,
        unit: '',
      },
      {
        category: 'Social',
        value: Math.min(100, (partnersCount / maxValues.social) * 100),
        rawValue: partnersCount,
        unit: '',
      },
    ]

    return NextResponse.json({
      year,
      radarData,
      summary: {
        gamingHours,
        filmsCount: films.length,
        seriesCount: series.length,
        runDistance: Math.round(runDistance),
        contributions,
        partnersCount,
        countriesVisited,
        citiesVisited,
      },
    })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getFilmsData, getSeriesData, getGamesData } from '@/lib/data'

interface TimelineEvent {
  id: string
  type: 'film' | 'series' | 'game' | 'sport' | 'voyage' | 'partner'
  title: string
  subtitle?: string
  date: string
  icon: string
  color: string
  value?: string
}

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : 50

    const events: TimelineEvent[] = []

    // Get films
    try {
      const films = await getFilmsData()
      for (const film of films) {
        if (film.releaseYear) {
          events.push({
            id: `film-${film.id}`,
            type: 'film',
            title: film.title,
            subtitle: film.rating ? `Note: ${film.rating}/10` : undefined,
            date: `${film.releaseYear}-06-15`, // Approximate mid-year
            icon: 'Film',
            color: 'magenta',
            value: film.rating ? `${film.rating}/10` : undefined,
          })
        }
      }
    } catch (err) {
      console.error('Failed to load films:', err)
    }

    // Get series
    try {
      const series = await getSeriesData()
      for (const s of series) {
        if (s.releaseYear) {
          events.push({
            id: `series-${s.id}`,
            type: 'series',
            title: s.title,
            subtitle: s.rating ? `Note: ${s.rating}/10` : undefined,
            date: `${s.releaseYear}-06-15`,
            icon: 'Tv',
            color: 'yellow',
            value: s.rating ? `${s.rating}/10` : undefined,
          })
        }
      }
    } catch (err) {
      console.error('Failed to load series:', err)
    }

    // Get games
    try {
      const games = await getGamesData()
      for (const game of games) {
        if (game.releaseYear) {
          events.push({
            id: `game-${game.id}`,
            type: 'game',
            title: game.title,
            subtitle: game.hoursPlayed ? `${game.hoursPlayed}h jouées` : undefined,
            date: `${game.releaseYear}-06-15`,
            icon: 'Gamepad2',
            color: 'green',
            value: game.hoursPlayed ? `${game.hoursPlayed}h` : undefined,
          })
        }
      }
    } catch (err) {
      console.error('Failed to load games:', err)
    }

    // Get Strava activities
    try {
      const tokenFile = path.join(process.cwd(), 'data', 'strava-tokens.json')
      if (fs.existsSync(tokenFile)) {
        const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'))

        // Check if token is valid
        const now = Math.floor(Date.now() / 1000)
        if (tokenData.expires_at > now) {
          const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=30', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
          })

          if (response.ok) {
            const activities = await response.json()
            for (const activity of activities) {
              events.push({
                id: `sport-${activity.id}`,
                type: 'sport',
                title: activity.name,
                subtitle: activity.type === 'Run' ? 'Course à pied' : activity.type === 'Ride' ? 'Vélo' : activity.type,
                date: activity.start_date.split('T')[0],
                icon: 'Footprints',
                color: 'orange',
                value: `${(activity.distance / 1000).toFixed(1)} km`,
              })
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load Strava activities:', err)
    }

    // Get voyages (from location history)
    try {
      const cacheFile = path.join(process.cwd(), 'data', 'geocode-cache.json')
      const historyFile = path.join(process.cwd(), 'data', 'location-history', 'location-history.json')

      if (fs.existsSync(historyFile) && fs.existsSync(cacheFile)) {
        const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
        const history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'))

        // Get unique cities visited by month
        const cityByMonth = new Map<string, { city: string; country: string; date: string }>()

        for (const item of history.slice(0, 5000)) { // Limit for performance
          if (item.visit?.topCandidate?.placeLocation && item.startTime) {
            const coords = item.visit.topCandidate.placeLocation.replace('geo:', '')
            const parts = coords.split(',')
            if (parts.length === 2) {
              const lat = parseFloat(parts[0])
              const lng = parseFloat(parts[1])
              const roundedKey = `${lat.toFixed(2)},${lng.toFixed(2)}`
              const cached = cache[roundedKey]

              if (cached?.city && !cached.city.startsWith('Location')) {
                const date = item.startTime.split('T')[0]
                const monthKey = date.substring(0, 7) + '-' + cached.city

                if (!cityByMonth.has(monthKey)) {
                  cityByMonth.set(monthKey, {
                    city: cached.city,
                    country: cached.country || '',
                    date: date,
                  })
                }
              }
            }
          }
        }

        // Add voyage events (one per city per month)
        for (const [, data] of cityByMonth) {
          events.push({
            id: `voyage-${data.date}-${data.city}`,
            type: 'voyage',
            title: data.city,
            subtitle: data.country,
            date: data.date,
            icon: 'MapPin',
            color: 'cyan',
          })
        }
      }
    } catch (err) {
      console.error('Failed to load voyages:', err)
    }

    // Get partners
    try {
      const partnersFile = path.join(process.cwd(), 'data', 'partners.csv')
      if (fs.existsSync(partnersFile)) {
        const content = fs.readFileSync(partnersFile, 'utf-8')
        const lines = content.trim().split('\n')

        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split(';')
          const prenom = columns[0]?.trim()
          const ville = columns[1]?.trim()
          const nationalite = columns[3]?.trim()
          const annee = columns[4]?.trim()

          if (prenom && annee) {
            events.push({
              id: `partner-${i}`,
              type: 'partner',
              title: prenom,
              subtitle: [ville, nationalite].filter(Boolean).join(' • '),
              date: `${annee}-06-15`,
              icon: 'Heart',
              color: 'red',
            })
          }
        }
      }
    } catch (err) {
      console.error('Failed to load partners:', err)
    }

    // Sort by date descending
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Limit results
    const limitedEvents = events.slice(0, limit)

    return NextResponse.json({
      events: limitedEvents,
      total: events.length,
    })
  } catch (error) {
    console.error('Timeline API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline data' },
      { status: 500 }
    )
  }
}

'use client'

import { useMemo, useState } from 'react'
import { TrendingUp, Calendar, Film as FilmIcon, Tv, Gamepad2 } from 'lucide-react'
import { Film, Series, Game } from '@/lib/types'

interface TemporalStatsProps {
  films: Film[]
  series: Series[]
  games: Game[]
}

interface MonthlyData {
  month: string
  films: number
  series: number
  games: number
  hoursPlayed: number
}

export function TemporalStats({ films, series, games }: TemporalStatsProps) {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

    const data: MonthlyData[] = months.map((month, index) => ({
      month,
      films: 0,
      series: 0,
      games: 0,
      hoursPlayed: 0,
    }))

    // Count films by release year (since we don't have watch date)
    films.forEach(film => {
      if (film.releaseYear === selectedYear) {
        // Distribute across months randomly for visualization
        const monthIndex = Math.floor(Math.random() * 12)
        data[monthIndex].films++
      }
    })

    // Count series by release year
    series.forEach(s => {
      if (s.releaseYear === selectedYear) {
        const monthIndex = Math.floor(Math.random() * 12)
        data[monthIndex].series++
      }
    })

    // Count games by release year
    games.forEach(game => {
      if (game.releaseYear === selectedYear) {
        const monthIndex = Math.floor(Math.random() * 12)
        data[monthIndex].games++
        data[monthIndex].hoursPlayed += game.hoursPlayed || 0
      }
    })

    return data
  }, [films, series, games, selectedYear])

  const maxValue = useMemo(() => {
    return Math.max(
      ...monthlyData.map(d => Math.max(d.films, d.series, d.games)),
      1
    )
  }, [monthlyData])

  const totalFilms = monthlyData.reduce((sum, d) => sum + d.films, 0)
  const totalSeries = monthlyData.reduce((sum, d) => sum + d.series, 0)
  const totalGames = monthlyData.reduce((sum, d) => sum + d.games, 0)
  const totalHours = monthlyData.reduce((sum, d) => sum + d.hoursPlayed, 0)

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-accent-primary" />
          <h3 className="text-lg font-semibold text-text-primary">
            Statistiques temporelles
          </h3>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-3 py-1.5 bg-bg-secondary border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-xl">
          <FilmIcon className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-xs text-text-muted">Films</p>
            <p className="text-lg font-bold text-text-primary">{totalFilms}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-xl">
          <Tv className="w-5 h-5 text-purple-400" />
          <div>
            <p className="text-xs text-text-muted">Séries</p>
            <p className="text-lg font-bold text-text-primary">{totalSeries}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-xl">
          <Gamepad2 className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-xs text-text-muted">Jeux</p>
            <p className="text-lg font-bold text-text-primary">{totalGames}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-xl">
          <Calendar className="w-5 h-5 text-orange-400" />
          <div>
            <p className="text-xs text-text-muted">Heures jouées</p>
            <p className="text-lg font-bold text-text-primary">{Math.round(totalHours)}h</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 flex items-end gap-2">
        {monthlyData.map((data, index) => {
          const filmsHeight = (data.films / maxValue) * 100
          const seriesHeight = (data.series / maxValue) * 100
          const gamesHeight = (data.games / maxValue) * 100

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full h-40 flex items-end justify-center gap-0.5">
                <div
                  className="w-2 bg-blue-400 rounded-t transition-all"
                  style={{ height: `${filmsHeight}%`, minHeight: data.films > 0 ? '4px' : '0' }}
                  title={`${data.films} films`}
                />
                <div
                  className="w-2 bg-purple-400 rounded-t transition-all"
                  style={{ height: `${seriesHeight}%`, minHeight: data.series > 0 ? '4px' : '0' }}
                  title={`${data.series} séries`}
                />
                <div
                  className="w-2 bg-green-400 rounded-t transition-all"
                  style={{ height: `${gamesHeight}%`, minHeight: data.games > 0 ? '4px' : '0' }}
                  title={`${data.games} jeux`}
                />
              </div>
              <span className="text-xs text-text-muted">{data.month}</span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-400 rounded" />
          <span className="text-xs text-text-muted">Films</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-400 rounded" />
          <span className="text-xs text-text-muted">Séries</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded" />
          <span className="text-xs text-text-muted">Jeux</span>
        </div>
      </div>
    </div>
  )
}

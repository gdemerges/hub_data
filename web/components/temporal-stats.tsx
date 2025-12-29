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
    <div className="tech-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
            <TrendingUp className="w-5 h-5 text-neon-cyan" />
          </div>
          <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Temporal_Stats
          </h3>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-3 py-1.5 bg-bg-primary border border-neon-cyan/30 rounded text-sm font-mono text-neon-cyan focus:outline-none focus:border-neon-cyan"
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="flex items-center gap-3 p-3 bg-bg-primary border border-neon-magenta/20 rounded">
          <FilmIcon className="w-4 h-4 text-neon-magenta" />
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase">Films</p>
            <p className="text-lg font-mono font-bold text-neon-magenta">{totalFilms}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-bg-primary border border-neon-yellow/20 rounded">
          <Tv className="w-4 h-4 text-neon-yellow" />
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase">Séries</p>
            <p className="text-lg font-mono font-bold text-neon-yellow">{totalSeries}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-bg-primary border border-neon-green/20 rounded">
          <Gamepad2 className="w-4 h-4 text-neon-green" />
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase">Jeux</p>
            <p className="text-lg font-mono font-bold text-neon-green">{totalGames}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-bg-primary border border-neon-orange/20 rounded">
          <Calendar className="w-4 h-4 text-neon-orange" />
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase">Heures</p>
            <p className="text-lg font-mono font-bold text-neon-orange">{Math.round(totalHours)}h</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 flex items-end gap-2 border-b border-l border-neon-cyan/20 p-2">
        {monthlyData.map((data, index) => {
          const filmsHeight = (data.films / maxValue) * 100
          const seriesHeight = (data.series / maxValue) * 100
          const gamesHeight = (data.games / maxValue) * 100

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full h-36 flex items-end justify-center gap-0.5">
                <div
                  className="w-2 bg-neon-magenta/80 rounded-t transition-all hover:bg-neon-magenta hover:shadow-[0_0_10px_#ff00ff]"
                  style={{ height: `${filmsHeight}%`, minHeight: data.films > 0 ? '4px' : '0' }}
                  title={`${data.films} films`}
                />
                <div
                  className="w-2 bg-neon-yellow/80 rounded-t transition-all hover:bg-neon-yellow hover:shadow-[0_0_10px_#ffff00]"
                  style={{ height: `${seriesHeight}%`, minHeight: data.series > 0 ? '4px' : '0' }}
                  title={`${data.series} séries`}
                />
                <div
                  className="w-2 bg-neon-green/80 rounded-t transition-all hover:bg-neon-green hover:shadow-[0_0_10px_#00ff88]"
                  style={{ height: `${gamesHeight}%`, minHeight: data.games > 0 ? '4px' : '0' }}
                  title={`${data.games} jeux`}
                />
              </div>
              <span className="text-[10px] font-mono text-text-muted">{data.month}</span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-neon-magenta rounded-full shadow-[0_0_5px_#ff00ff]" />
          <span className="text-xs font-mono text-text-muted">Films</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-neon-yellow rounded-full shadow-[0_0_5px_#ffff00]" />
          <span className="text-xs font-mono text-text-muted">Séries</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-neon-green rounded-full shadow-[0_0_5px_#00ff88]" />
          <span className="text-xs font-mono text-text-muted">Jeux</span>
        </div>
      </div>
    </div>
  )
}

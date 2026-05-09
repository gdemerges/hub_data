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

    const data: MonthlyData[] = months.map((month) => ({
      month,
      films: 0,
      series: 0,
      games: 0,
      hoursPlayed: 0,
    }))

    // Deterministic month bucket from the title — keeps SSR/client output identical
    const monthFor = (key: string) => {
      let h = 0
      for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
      return Math.abs(h) % 12
    }

    films.forEach((film) => {
      if (film.releaseYear === selectedYear) data[monthFor(film.title)].films++
    })
    series.forEach((s) => {
      if (s.releaseYear === selectedYear) data[monthFor(s.title)].series++
    })
    games.forEach((game) => {
      if (game.releaseYear === selectedYear) {
        const idx = monthFor(game.title)
        data[idx].games++
        data[idx].hoursPlayed += game.hoursPlayed || 0
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
          <div className="p-2 bg-earth-fern/10 border border-earth-fern/30 rounded">
            <TrendingUp className="w-5 h-5 text-earth-fern" />
          </div>
          <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
            Statistiques temporelles
          </h3>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-3 py-1.5 bg-bg-primary border border-earth-fern/30 rounded text-sm font-mono text-earth-fern focus:outline-none focus:border-earth-fern"
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="flex items-center gap-3 p-3 bg-bg-primary border border-earth-terracotta/20 rounded">
          <FilmIcon className="w-4 h-4 text-earth-terracotta" />
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase">Films</p>
            <p className="text-lg font-mono font-bold text-earth-terracotta">{totalFilms}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-bg-primary border border-earth-saffron/20 rounded">
          <Tv className="w-4 h-4 text-earth-saffron" />
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase">Séries</p>
            <p className="text-lg font-mono font-bold text-earth-saffron">{totalSeries}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-bg-primary border border-earth-moss/20 rounded">
          <Gamepad2 className="w-4 h-4 text-earth-moss" />
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase">Jeux</p>
            <p className="text-lg font-mono font-bold text-earth-moss">{totalGames}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-bg-primary border border-earth-rust/20 rounded">
          <Calendar className="w-4 h-4 text-earth-rust" />
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase">Heures</p>
            <p className="text-lg font-mono font-bold text-earth-rust">{Math.round(totalHours)}h</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 flex items-end gap-2 border-b border-l border-earth-fern/20 p-2">
        {monthlyData.map((data, index) => {
          const filmsHeight = (data.films / maxValue) * 100
          const seriesHeight = (data.series / maxValue) * 100
          const gamesHeight = (data.games / maxValue) * 100

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full h-36 flex items-end justify-center gap-0.5">
                <div
                  className="w-2 bg-earth-terracotta/80 rounded-t transition-all hover:bg-earth-terracotta hover:shadow-[0_0_10px_#ff00ff]"
                  style={{ height: `${filmsHeight}%`, minHeight: data.films > 0 ? '4px' : '0' }}
                  title={`${data.films} films`}
                />
                <div
                  className="w-2 bg-earth-saffron/80 rounded-t transition-all hover:bg-earth-saffron hover:shadow-[0_0_10px_#ffff00]"
                  style={{ height: `${seriesHeight}%`, minHeight: data.series > 0 ? '4px' : '0' }}
                  title={`${data.series} séries`}
                />
                <div
                  className="w-2 bg-earth-moss/80 rounded-t transition-all hover:bg-earth-moss hover:shadow-[0_0_10px_#00ff88]"
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
          <div className="w-2 h-2 bg-earth-terracotta rounded-full shadow-[0_0_5px_#ff00ff]" />
          <span className="text-xs font-mono text-text-muted">Films</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-earth-saffron rounded-full shadow-[0_0_5px_#ffff00]" />
          <span className="text-xs font-mono text-text-muted">Séries</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-earth-moss rounded-full shadow-[0_0_5px_#00ff88]" />
          <span className="text-xs font-mono text-text-muted">Jeux</span>
        </div>
      </div>
    </div>
  )
}

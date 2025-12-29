'use client'

import { useMemo, useState } from 'react'
import { GitCompare, ArrowUp, ArrowDown, Minus, Film as FilmIcon, Tv, Gamepad2, Clock } from 'lucide-react'
import { Film, Series, Game } from '@/lib/types'

interface YearComparisonProps {
  films: Film[]
  series: Series[]
  games: Game[]
}

interface YearStats {
  films: number
  series: number
  games: number
  hoursPlayed: number
  avgRating: number
}

export function YearComparison({ films, series, games }: YearComparisonProps) {
  const currentYear = new Date().getFullYear()
  const [year1, setYear1] = useState(currentYear)
  const [year2, setYear2] = useState(currentYear - 1)

  const getStatsForYear = (year: number): YearStats => {
    const yearFilms = films.filter(f => f.releaseYear === year)
    const yearSeries = series.filter(s => s.releaseYear === year)
    const yearGames = games.filter(g => g.releaseYear === year)

    const totalRatings = [
      ...yearFilms.filter(f => f.rating).map(f => f.rating!),
      ...yearSeries.filter(s => s.rating).map(s => s.rating!),
      ...yearGames.filter(g => g.rating).map(g => g.rating!),
    ]

    return {
      films: yearFilms.length,
      series: yearSeries.length,
      games: yearGames.length,
      hoursPlayed: yearGames.reduce((sum, g) => sum + (g.hoursPlayed || 0), 0),
      avgRating: totalRatings.length > 0
        ? totalRatings.reduce((a, b) => a + b, 0) / totalRatings.length
        : 0,
    }
  }

  const stats1 = useMemo(() => getStatsForYear(year1), [year1, films, series, games])
  const stats2 = useMemo(() => getStatsForYear(year2), [year2, films, series, games])

  const years = Array.from({ length: 15 }, (_, i) => currentYear - i)

  const renderComparison = (
    label: string,
    icon: React.ReactNode,
    value1: number,
    value2: number,
    suffix: string = ''
  ) => {
    const diff = value1 - value2
    const percentDiff = value2 > 0 ? ((diff / value2) * 100).toFixed(0) : (value1 > 0 ? '+100' : '0')

    return (
      <div className="p-4 bg-bg-secondary rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <span className="text-sm font-medium text-text-secondary">{label}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">{Math.round(value1)}{suffix}</p>
            <p className="text-xs text-text-muted">{year1}</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-tertiary">
            {diff > 0 ? (
              <ArrowUp className="w-4 h-4 text-green-400" />
            ) : diff < 0 ? (
              <ArrowDown className="w-4 h-4 text-red-400" />
            ) : (
              <Minus className="w-4 h-4 text-text-muted" />
            )}
            <span className={`text-sm font-medium ${
              diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-text-muted'
            }`}>
              {diff > 0 ? '+' : ''}{percentDiff}%
            </span>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">{Math.round(value2)}{suffix}</p>
            <p className="text-xs text-text-muted">{year2}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GitCompare className="w-5 h-5 text-accent-primary" />
          <h3 className="text-lg font-semibold text-text-primary">
            Comparaison d'années
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year1}
            onChange={(e) => setYear1(Number(e.target.value))}
            className="px-3 py-1.5 bg-bg-secondary border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <span className="text-text-muted">vs</span>
          <select
            value={year2}
            onChange={(e) => setYear2(Number(e.target.value))}
            className="px-3 py-1.5 bg-bg-secondary border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderComparison(
          'Films',
          <FilmIcon className="w-4 h-4 text-blue-400" />,
          stats1.films,
          stats2.films
        )}
        {renderComparison(
          'Séries',
          <Tv className="w-4 h-4 text-purple-400" />,
          stats1.series,
          stats2.series
        )}
        {renderComparison(
          'Jeux',
          <Gamepad2 className="w-4 h-4 text-green-400" />,
          stats1.games,
          stats2.games
        )}
        {renderComparison(
          'Heures jouées',
          <Clock className="w-4 h-4 text-orange-400" />,
          stats1.hoursPlayed,
          stats2.hoursPlayed,
          'h'
        )}
      </div>
    </div>
  )
}

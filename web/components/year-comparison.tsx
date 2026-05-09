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
      <div className="p-4 bg-bg-primary border border-border-subtle rounded">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <span className="text-xs font-mono font-medium text-text-muted uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-xl font-mono font-bold text-earth-fern">{Math.round(value1)}{suffix}</p>
            <p className="text-[10px] font-mono text-text-muted">{year1}</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded border border-border-subtle">
            {diff > 0 ? (
              <ArrowUp className="w-3 h-3 text-earth-moss" />
            ) : diff < 0 ? (
              <ArrowDown className="w-3 h-3 text-earth-clay" />
            ) : (
              <Minus className="w-3 h-3 text-text-muted" />
            )}
            <span className={`text-xs font-mono font-medium ${
              diff > 0 ? 'text-earth-moss' : diff < 0 ? 'text-earth-clay' : 'text-text-muted'
            }`}>
              {diff > 0 ? '+' : ''}{percentDiff}%
            </span>
          </div>
          <div className="text-center">
            <p className="text-xl font-mono font-bold text-earth-terracotta">{Math.round(value2)}{suffix}</p>
            <p className="text-[10px] font-mono text-text-muted">{year2}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="tech-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-earth-terracotta/10 border border-earth-terracotta/30 rounded">
            <GitCompare className="w-5 h-5 text-earth-terracotta" />
          </div>
          <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Year_Compare
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year1}
            onChange={(e) => setYear1(Number(e.target.value))}
            className="px-3 py-1.5 bg-bg-primary border border-earth-fern/30 rounded text-sm font-mono text-earth-fern focus:outline-none focus:border-earth-fern"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <span className="text-earth-terracotta font-mono">VS</span>
          <select
            value={year2}
            onChange={(e) => setYear2(Number(e.target.value))}
            className="px-3 py-1.5 bg-bg-primary border border-earth-terracotta/30 rounded text-sm font-mono text-earth-terracotta focus:outline-none focus:border-earth-terracotta"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {renderComparison(
          'Films',
          <FilmIcon className="w-4 h-4 text-earth-terracotta" />,
          stats1.films,
          stats2.films
        )}
        {renderComparison(
          'Séries',
          <Tv className="w-4 h-4 text-earth-saffron" />,
          stats1.series,
          stats2.series
        )}
        {renderComparison(
          'Jeux',
          <Gamepad2 className="w-4 h-4 text-earth-moss" />,
          stats1.games,
          stats2.games
        )}
        {renderComparison(
          'Heures jouées',
          <Clock className="w-4 h-4 text-earth-rust" />,
          stats1.hoursPlayed,
          stats2.hoursPlayed,
          'h'
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Gamepad2, Film, Tv, Github, Footprints, Heart, Globe, BookOpen } from 'lucide-react'
import { StatCard } from './stat-card'

interface OverviewStatsProps {
  gamesCount: number
  filmsCount: number
  seriesCount: number
  contributions: number
  selectedYear: number | null
}

export function OverviewStats({ gamesCount, filmsCount, seriesCount, contributions, selectedYear }: OverviewStatsProps) {
  const [runDistance, setRunDistance] = useState<number | null>(null)
  const [partnersCount, setPartnersCount] = useState<number | null>(null)
  const [countriesCount, setCountriesCount] = useState<number | null>(null)
  const [booksRead, setBooksRead] = useState<number | null>(null)

  useEffect(() => {
    async function fetchStravaStats() {
      try {
        const url = selectedYear
          ? `/api/strava/stats?year=${selectedYear}`
          : '/api/strava/stats'
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          // Use year-specific data if year is selected, otherwise total
          const distance = selectedYear ? data.yearRunDistance : data.totalRunDistance
          setRunDistance(Math.round(distance))
        }
      } catch (err) {
        // Silently fail if not connected to Strava
      }
    }
    fetchStravaStats()
  }, [selectedYear])

  useEffect(() => {
    async function fetchPartnersCount() {
      try {
        const url = selectedYear
          ? `/api/partners?year=${selectedYear}`
          : '/api/partners'
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          if (data.hasData) {
            setPartnersCount(data.count)
          }
        }
      } catch (err) {
        // Silently fail if no data
      }
    }
    fetchPartnersCount()
  }, [selectedYear])

  useEffect(() => {
    async function fetchCountriesCount() {
      try {
        const response = await fetch('/api/voyages')
        if (response.ok) {
          const data = await response.json()
          if (data.totalCountries) {
            setCountriesCount(data.totalCountries)
          }
        }
      } catch (err) {
        // Silently fail if no data
      }
    }
    fetchCountriesCount()
  }, [])

  useEffect(() => {
    async function fetchBooksRead() {
      try {
        const response = await fetch('/api/books')
        if (response.ok) {
          const data = await response.json()
          if (data.books) {
            const readCount = data.books.filter((book: any) => book.dateRead).length
            setBooksRead(readCount)
          }
        }
      } catch (err) {
        // Silently fail if no data
      }
    }
    fetchBooksRead()
  }, [])

  const stats: Array<{
    label: string
    value: string | number
    icon: typeof Gamepad2
    color: 'green' | 'magenta' | 'yellow' | 'blue' | 'cyan' | 'orange' | 'purple' | 'red'
    href: string
  }> = [
    { label: 'Jeux joués', value: gamesCount, icon: Gamepad2, color: 'green', href: '/games' },
    { label: 'Films vus', value: filmsCount, icon: Film, color: 'magenta', href: '/films' },
    { label: 'Séries suivies', value: seriesCount, icon: Tv, color: 'yellow', href: '/series' },
  ]

  if (booksRead !== null) {
    stats.push({
      label: 'Livres lus',
      value: booksRead,
      icon: BookOpen,
      color: 'blue',
      href: '/books',
    })
  }

  stats.push({ label: 'Contributions', value: contributions, icon: Github, color: 'cyan', href: '/github' })

  if (runDistance !== null) {
    stats.push({
      label: 'Km courus',
      value: `${runDistance} km`,
      icon: Footprints,
      color: 'orange',
      href: '/sport',
    })
  }

  if (countriesCount !== null) {
    stats.push({
      label: 'Pays visités',
      value: countriesCount,
      icon: Globe,
      color: 'purple',
      href: '/voyages',
    })
  }

  if (partnersCount !== null) {
    stats.push({
      label: 'Partenaires',
      value: partnersCount,
      icon: Heart,
      color: 'red',
      href: '/rencontres',
    })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          href={stat.href}
        />
      ))}
    </div>
  )
}

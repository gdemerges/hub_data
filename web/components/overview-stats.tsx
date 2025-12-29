'use client'

import { useEffect, useState } from 'react'
import { Gamepad2, Film, Tv, Github, Footprints, Heart } from 'lucide-react'
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
        const response = await fetch('/api/partners')
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
  }, [])

  const stats = [
    { label: 'Jeux joués', value: gamesCount, icon: Gamepad2, color: 'green' as const },
    { label: 'Films vus', value: filmsCount, icon: Film, color: 'magenta' as const },
    { label: 'Séries suivies', value: seriesCount, icon: Tv, color: 'yellow' as const },
    { label: 'Contributions', value: contributions, icon: Github, color: 'cyan' as const },
  ]

  if (runDistance !== null) {
    stats.push({
      label: 'Km courus',
      value: `${runDistance} km`,
      icon: Footprints,
      color: 'orange' as const,
    })
  }

  if (partnersCount !== null) {
    stats.push({
      label: 'Partenaires',
      value: partnersCount,
      icon: Heart,
      color: 'red' as const,
    })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-12">
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
        />
      ))}
    </div>
  )
}

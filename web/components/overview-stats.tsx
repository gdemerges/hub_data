'use client'

import { Gamepad2, Film, Tv, Github } from 'lucide-react'
import { StatCard } from './stat-card'

interface OverviewStatsProps {
  gamesCount: number
  filmsCount: number
  seriesCount: number
  contributions: number
}

export function OverviewStats({ gamesCount, filmsCount, seriesCount, contributions }: OverviewStatsProps) {
  const stats = [
    { label: 'Jeux joués', value: gamesCount, icon: Gamepad2, color: 'green' as const },
    { label: 'Films vus', value: filmsCount, icon: Film, color: 'magenta' as const },
    { label: 'Séries suivies', value: seriesCount, icon: Tv, color: 'yellow' as const },
    { label: 'Contributions', value: contributions, icon: Github, color: 'cyan' as const },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
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

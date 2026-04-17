'use client'

import useSWR from 'swr'
import { Gamepad2, Film, Tv, Github, Footprints, Heart, Globe, BookOpen } from 'lucide-react'
import { StatCard } from './stat-card'

interface OverviewStatsProps {
  gamesCount: number
  filmsCount: number
  seriesCount: number
  selectedYear: number | null
}

export function OverviewStats({ gamesCount, filmsCount, seriesCount, selectedYear }: OverviewStatsProps) {
  const stravaKey = selectedYear ? `/api/strava/stats?year=${selectedYear}` : '/api/strava/stats'
  const partnersKey = selectedYear ? `/api/partners?year=${selectedYear}` : '/api/partners'
  const githubYear = selectedYear ?? new Date().getFullYear()
  const githubUsername = process.env.NEXT_PUBLIC_GITHUB_USERNAME ?? 'gdemerges'

  const { data: stravaData } = useSWR(stravaKey)
  const { data: partnersData } = useSWR(partnersKey)
  const { data: voyagesData } = useSWR('/api/voyages')
  const { data: booksData } = useSWR('/api/books')
  const { data: githubData } = useSWR(`/api/github/contributions?username=${githubUsername}&year=${githubYear}`)

  const runDistance = stravaData
    ? Math.round(selectedYear ? stravaData.yearRunDistance : stravaData.totalRunDistance)
    : null
  const partnersCount = partnersData?.hasData ? partnersData.count : null
  const countriesCount = voyagesData?.totalCountries ?? null
  const booksRead = booksData?.books
    ? booksData.books.filter((book: any) => book.dateRead).length
    : null
  const contributions = githubData?.totalContributions ?? null

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
    stats.push({ label: 'Livres lus', value: booksRead, icon: BookOpen, color: 'blue', href: '/books' })
  }

  if (contributions !== null) {
    stats.push({ label: 'Contributions', value: contributions, icon: Github, color: 'cyan', href: '/github' })
  }

  if (runDistance !== null) {
    stats.push({ label: 'Km courus', value: `${runDistance} km`, icon: Footprints, color: 'orange', href: '/sport' })
  }

  if (countriesCount !== null) {
    stats.push({ label: 'Pays visités', value: countriesCount, icon: Globe, color: 'purple', href: '/voyages' })
  }

  if (partnersCount !== null) {
    stats.push({ label: 'Partenaires', value: partnersCount, icon: Heart, color: 'red', href: '/rencontres' })
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

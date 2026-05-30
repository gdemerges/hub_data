'use client'

import { BookOpen, Clock, Film, Footprints, Gamepad2, Github, Globe, Heart, Tv } from 'lucide-react'
import useSWR from 'swr'
import type { Accent } from '@/lib/accents'
import { formatWatchHours } from '@/lib/series-time'
import { StatCard } from './stat-card'

interface OverviewStatsProps {
  gamesCount: number
  filmsCount: number
  seriesCount: number
  seriesMinutes: number
  selectedYear: number | null
}

export function OverviewStats({
  gamesCount,
  filmsCount,
  seriesCount,
  seriesMinutes,
  selectedYear,
}: OverviewStatsProps) {
  const stravaKey = selectedYear ? `/api/strava/stats?year=${selectedYear}` : '/api/strava/stats'
  const partnersKey = selectedYear ? `/api/partners?year=${selectedYear}` : '/api/partners'
  const githubYear = selectedYear ?? new Date().getFullYear()
  const githubUsername = process.env.NEXT_PUBLIC_GITHUB_USERNAME ?? 'gdemerges'

  const { data: stravaData } = useSWR(stravaKey)
  const { data: partnersData } = useSWR(partnersKey)
  const { data: voyagesData } = useSWR('/api/voyages')
  const { data: booksData } = useSWR('/api/books')
  const { data: githubData } = useSWR(
    `/api/github/contributions?username=${githubUsername}&year=${githubYear}`,
  )

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
    color: Accent
    href: string
  }> = [
    { label: 'Jeux joués', value: gamesCount, icon: Gamepad2, color: 'moss', href: '/games' },
    { label: 'Films vus', value: filmsCount, icon: Film, color: 'terracotta', href: '/films' },
    { label: 'Séries suivies', value: seriesCount, icon: Tv, color: 'saffron', href: '/series' },
  ]

  if (seriesMinutes > 0) {
    stats.push({
      label: 'Heures séries',
      value: formatWatchHours(seriesMinutes),
      icon: Clock,
      color: 'saffron',
      href: '/series',
    })
  }

  if (booksRead !== null) {
    stats.push({
      label: 'Livres lus',
      value: booksRead,
      icon: BookOpen,
      color: 'indigo',
      href: '/books',
    })
  }

  if (contributions !== null) {
    stats.push({
      label: 'Contributions',
      value: contributions,
      icon: Github,
      color: 'fern',
      href: '/github',
    })
  }

  if (runDistance !== null) {
    stats.push({
      label: 'Km courus',
      value: `${runDistance} km`,
      icon: Footprints,
      color: 'rust',
      href: '/sport',
    })
  }

  if (countriesCount !== null) {
    stats.push({
      label: 'Pays visités',
      value: countriesCount,
      icon: Globe,
      color: 'sage',
      href: '/voyages',
    })
  }

  if (partnersCount !== null) {
    stats.push({
      label: 'Partenaires',
      value: partnersCount,
      icon: Heart,
      color: 'clay',
      href: '/rencontres',
    })
  }

  return (
    <div className="motion-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
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

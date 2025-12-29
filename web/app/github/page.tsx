'use client'

import { useState } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import { StatCard, ContributionCalendar, BarChart } from '@/components'
import { SkeletonProfile, SkeletonStatCard, SkeletonChart } from '@/components/skeleton'
import { FadeIn } from '@/components/page-transition'
import { Github, Star, GitFork, Users, MapPin, Building, ExternalLink, Code, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'

interface GitHubData {
  user: {
    login: string
    name: string
    avatar: string
    bio: string
    location: string
    company: string
    blog: string
    publicRepos: number
    followers: number
    following: number
  }
  stats: {
    totalRepos: number
    totalStars: number
    totalForks: number
    totalContributions: number
    topLanguages: { language: string; count: number; percentage: string }[]
  }
  topRepos: {
    name: string
    description: string
    stars: number
    forks: number
    language: string
    url: string
  }[]
}

interface ContributionsData {
  totalContributions: number
  contributions: {
    date: string
    count: number
    level: 0 | 1 | 2 | 3 | 4
  }[]
}

interface YearlyContributionsData {
  yearlyContributions: {
    year: number
    contributions: number
  }[]
  totalYears: number
  totalContributions: number
}

const GITHUB_USERNAME = 'gdemerges'
const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function GitHubPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Use SWR for data fetching with caching
  const { data, error, isLoading: loading } = useSWR<GitHubData>(
    `/api/github?username=${GITHUB_USERNAME}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  const { data: contributions, isLoading: loadingContributions } = useSWR<ContributionsData>(
    `/api/github/contributions?username=${GITHUB_USERNAME}&year=${selectedYear}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  const { data: yearlyContributions, isLoading: loadingYearly } = useSWR<YearlyContributionsData>(
    `/api/github/yearly-contributions?username=${GITHUB_USERNAME}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 } // 5 minutes cache
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-accent-primary/10 rounded-xl">
            <Github className="w-6 h-6 text-accent-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">GitHub</h1>
            <p className="text-sm text-text-muted">Chargement...</p>
          </div>
        </div>
        <SkeletonProfile />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
          {[...Array(4)].map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <SkeletonChart />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <p className="text-text-muted">{error || 'Erreur de chargement'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-accent-primary/10 rounded-xl">
          <Github className="w-6 h-6 text-accent-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">GitHub</h1>
          <p className="text-sm text-text-muted">Statistiques et activité</p>
        </div>
      </div>

      {/* User profile */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Image
            src={data.user.avatar}
            alt={data.user.name}
            width={120}
            height={120}
            className="rounded-full ring-4 ring-border-subtle"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text-primary">{data.user.name}</h2>
            <p className="text-text-muted">@{data.user.login}</p>
            {data.user.bio && (
              <p className="mt-2 text-sm text-text-secondary">{data.user.bio}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-text-secondary">
              {data.user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{data.user.location}</span>
                </div>
              )}
              {data.user.company && (
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  <span>{data.user.company}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Repositories" value={data.stats.totalRepos} icon={Code} />
        <StatCard label="Contributions totales" value={data.stats.totalContributions} icon={Star} />
        <StatCard label="Forks" value={data.stats.totalForks} icon={GitFork} />
        <StatCard label="Followers" value={data.user.followers} icon={Users} />
      </div>

      {/* Contribution calendar */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-primary">Contributions</h3>
          <div className="flex items-center gap-4">
            {contributions && (
              <span className="text-sm text-text-muted">
                {contributions.totalContributions} contributions en {selectedYear}
              </span>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedYear(selectedYear - 1)}
                disabled={loadingContributions}
                className="p-1 hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Année précédente"
              >
                <ChevronLeft className="w-5 h-5 text-text-secondary" />
              </button>
              <span className="text-sm font-medium text-text-primary min-w-[4rem] text-center">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear(selectedYear + 1)}
                disabled={selectedYear >= new Date().getFullYear() || loadingContributions}
                className="p-1 hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Année suivante"
              >
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
          </div>
        </div>
        {loadingContributions ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-sm text-text-muted">Chargement des contributions...</div>
          </div>
        ) : contributions ? (
          <ContributionCalendar contributions={contributions.contributions} year={selectedYear} />
        ) : (
          <div className="flex items-center justify-center h-40">
            <div className="text-sm text-text-muted">Aucune contribution disponible</div>
          </div>
        )}
      </div>

      {/* Top languages */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Langages les plus utilisés</h3>
        <p className="text-xs text-text-muted mb-4">Basé sur les lignes de code dans vos repositories</p>
        <div className="space-y-3">
          {data.stats.topLanguages.map((lang: any, i: number) => (
            <div key={lang.language} className="flex items-center gap-3">
              <div className="w-8 text-sm text-text-muted">#{i + 1}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-primary">{lang.language}</span>
                  <span className="text-xs font-semibold text-accent-primary">{lang.percentage}%</span>
                </div>
                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full transition-all"
                    style={{ width: `${lang.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yearly contributions evolution */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-accent-primary" />
          <h3 className="text-lg font-semibold text-text-primary">Évolution des contributions par année</h3>
        </div>
        {loadingYearly ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-text-muted">Chargement des statistiques...</div>
          </div>
        ) : yearlyContributions && yearlyContributions.yearlyContributions.length > 0 ? (
          <>
            <p className="text-xs text-text-muted mb-6">
              Total de {yearlyContributions.totalContributions.toLocaleString('fr-FR')} contributions sur {yearlyContributions.totalYears} ans
            </p>
            <BarChart data={yearlyContributions.yearlyContributions} />
          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-text-muted">Aucune donnée disponible</div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import { StatCard, ContributionCalendar, BarChart } from '@/components'
import { SkeletonProfile, SkeletonStatCard, SkeletonChart } from '@/components/skeleton'
import { FadeIn } from '@/components/page-transition'
import { Github, Star, GitFork, Users, MapPin, Building, ExternalLink, Code, ChevronLeft, ChevronRight, TrendingUp, Terminal, Zap, Activity } from 'lucide-react'

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
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-bg-card border border-neon-magenta/30 rounded-lg">
              <Terminal className="w-8 h-8 text-neon-magenta" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
                <span className="text-neon-magenta">GITHUB</span>_SYSTEM
              </h1>
              <p className="text-xs font-mono text-neon-cyan/70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
                STATUS: LOADING // CODE_TRACKER v2.0
              </p>
            </div>
          </div>
          <div className="font-mono text-sm text-text-secondary border-l-2 border-neon-magenta/30 pl-4">
            &gt; Fetching GitHub profile data...
            <span className="text-neon-magenta animate-pulse">_</span>
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
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-bg-card border border-neon-magenta/30 rounded-lg">
            <Terminal className="w-8 h-8 text-neon-magenta" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
              <span className="text-neon-magenta">GITHUB</span>_SYSTEM
            </h1>
            <p className="text-xs font-mono text-neon-cyan/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
              STATUS: ONLINE // CODE_TRACKER v2.0
            </p>
          </div>
        </div>
        <div className="font-mono text-sm text-text-secondary border-l-2 border-neon-magenta/30 pl-4">
          &gt; Loading GitHub developer profile...
          <span className="text-neon-magenta animate-pulse">_</span>
        </div>
      </div>

      {/* User profile */}
      <div className="tech-card p-6 mb-8 border-neon-magenta/30 hover:border-neon-magenta/60 transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative">
            <Image
              src={data.user.avatar}
              alt={data.user.name}
              width={120}
              height={120}
              className="rounded-lg ring-2 ring-neon-magenta/30"
            />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-neon-magenta rounded-full border-2 border-bg-primary flex items-center justify-center">
              <Code className="w-3 h-3 text-bg-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display font-bold text-text-primary tracking-wider">
              {data.user.name}
            </h2>
            <p className="text-sm font-mono text-neon-magenta/70 mt-1">@{data.user.login}</p>
            {data.user.bio && (
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">{data.user.bio}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              {data.user.location && (
                <div className="flex items-center gap-2 text-text-muted font-mono">
                  <MapPin className="w-4 h-4 text-neon-cyan" />
                  <span>{data.user.location}</span>
                </div>
              )}
              {data.user.company && (
                <div className="flex items-center gap-2 text-text-muted font-mono">
                  <Building className="w-4 h-4 text-neon-cyan" />
                  <span>{data.user.company}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Repositories" value={data.stats.totalRepos} icon={Code} color="magenta" />
        <StatCard
          label="Contributions totales"
          value={yearlyContributions?.totalContributions ?? data.stats.totalContributions}
          icon={Star}
          color="cyan"
        />
        <StatCard label="Forks" value={data.stats.totalForks} icon={GitFork} color="yellow" />
        <StatCard label="Followers" value={data.user.followers} icon={Users} color="green" />
      </div>

      {/* Contribution calendar */}
      <div className="tech-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-green/10 border border-neon-green/30 rounded">
              <Activity className="w-5 h-5 text-neon-green" />
            </div>
            <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
              Contribution_Calendar
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {contributions && (
              <span className="text-xs font-mono text-text-muted">
                {contributions.totalContributions} commits // [{selectedYear}]
              </span>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedYear(selectedYear - 1)}
                disabled={loadingContributions}
                className="p-1 hover:bg-neon-green/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Année précédente"
              >
                <ChevronLeft className="w-4 h-4 text-neon-green" />
              </button>
              <span className="text-sm font-mono font-medium text-neon-green min-w-[4rem] text-center">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear(selectedYear + 1)}
                disabled={selectedYear >= new Date().getFullYear() || loadingContributions}
                className="p-1 hover:bg-neon-green/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Année suivante"
              >
                <ChevronRight className="w-4 h-4 text-neon-green" />
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
      <div className="tech-card p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
            <Code className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
              Top_Languages
            </h3>
            <p className="text-xs font-mono text-text-muted mt-0.5">
              Based on code lines
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {data.stats.topLanguages.map((lang: any, i: number) => (
            <div key={lang.language} className="group flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center bg-neon-cyan/10 border border-neon-cyan/30 rounded text-xs font-mono font-bold text-neon-cyan">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-text-primary group-hover:text-neon-cyan transition-colors">
                    {lang.language}
                  </span>
                  <span className="text-xs font-mono font-bold text-neon-cyan">
                    {lang.percentage}%
                  </span>
                </div>
                <div className="h-2 bg-bg-primary rounded-full overflow-hidden border border-border-subtle">
                  <div
                    className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta rounded-full transition-all duration-500"
                    style={{ width: `${lang.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yearly contributions evolution */}
      <div className="tech-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-neon-yellow/10 border border-neon-yellow/30 rounded">
            <TrendingUp className="w-5 h-5 text-neon-yellow" />
          </div>
          <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Yearly_Evolution
          </h3>
        </div>
        {loadingYearly ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-sm font-mono text-text-muted">&gt; LOADING_STATS...</div>
          </div>
        ) : yearlyContributions && yearlyContributions.yearlyContributions.length > 0 ? (
          <>
            {(() => {
              const filteredData = yearlyContributions.yearlyContributions.filter(y => y.year >= 2022)
              const filteredTotal = filteredData.reduce((acc, y) => acc + y.contributions, 0)
              return (
                <>
                  <p className="text-xs font-mono text-text-muted mb-6">
                    {filteredTotal.toLocaleString('fr-FR')} commits // {filteredData.length} years
                  </p>
                  <BarChart data={filteredData} />
                </>
              )
            })()}
          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-sm font-mono text-text-muted">&gt; NO_DATA_AVAILABLE</div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { StatCard, ContributionCalendar } from '@/components'
import { Github, Star, GitFork, Users, MapPin, Building, ExternalLink, Code, ChevronLeft, ChevronRight } from 'lucide-react'

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
    topLanguages: { language: string; count: number }[]
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

const GITHUB_USERNAME = 'gdemerges'

export default function GitHubPage() {
  const [data, setData] = useState<GitHubData | null>(null)
  const [contributions, setContributions] = useState<ContributionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingContributions, setLoadingContributions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Fetch main GitHub data (user, repos, stats) - only once
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch(`/api/github?username=${GITHUB_USERNAME}`)
        if (!response.ok) throw new Error('Failed to fetch')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError('Impossible de charger les données GitHub')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Fetch contributions data separately - when year changes
  useEffect(() => {
    async function fetchContributions() {
      try {
        setLoadingContributions(true)
        const response = await fetch(`/api/github/contributions?username=${GITHUB_USERNAME}&year=${selectedYear}`)
        if (!response.ok) throw new Error('Failed to fetch contributions')
        const result = await response.json()
        setContributions(result)
      } catch (err) {
        console.error('Failed to load contributions:', err)
      } finally {
        setLoadingContributions(false)
      }
    }
    fetchContributions()
  }, [selectedYear])

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
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-bg-card rounded-2xl" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-bg-card rounded-2xl" />
            ))}
          </div>
        </div>
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
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
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
    </div>
  )
}

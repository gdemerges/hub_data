'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { StatCard } from '@/components'
import { Github, Star, GitFork, Users, MapPin, Building, ExternalLink, Code } from 'lucide-react'

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

const GITHUB_USERNAME = 'guillaumededem' // Remplacez par votre nom d'utilisateur

export default function GitHubPage() {
  const [data, setData] = useState<GitHubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
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
        <StatCard label="Stars reçues" value={data.stats.totalStars} icon={Star} />
        <StatCard label="Forks" value={data.stats.totalForks} icon={GitFork} />
        <StatCard label="Followers" value={data.user.followers} icon={Users} />
      </div>

      {/* Contribution graphs */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Contributions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <img
            src={`https://github-readme-stats.vercel.app/api?username=${GITHUB_USERNAME}&show_icons=true&theme=dark&hide_border=true&bg_color=0a0a0b&title_color=6366f1&icon_color=6366f1&text_color=d1d5db`}
            alt="GitHub Stats"
            className="w-full"
          />
          <img
            src={`https://github-readme-streak-stats.herokuapp.com/?user=${GITHUB_USERNAME}&theme=dark&hide_border=true&background=0a0a0b&ring=6366f1&fire=6366f1&currStreakLabel=6366f1`}
            alt="GitHub Streak"
            className="w-full"
          />
          <img
            src={`https://github-readme-activity-graph.vercel.app/graph?username=${GITHUB_USERNAME}&theme=react-dark&hide_border=true&bg_color=0a0a0b&color=d1d5db&line=6366f1&point=6366f1&area=true&area_color=6366f1`}
            alt="Activity Graph"
            className="w-full"
          />
        </div>
      </div>

      {/* Top languages */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Langages favoris</h3>
        <div className="space-y-3">
          {data.stats.topLanguages.map((lang, i) => (
            <div key={lang.language} className="flex items-center gap-3">
              <div className="w-8 text-sm text-text-muted">#{i + 1}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-primary">{lang.language}</span>
                  <span className="text-xs text-text-muted">{lang.count} repos</span>
                </div>
                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full"
                    style={{ width: `${(lang.count / data.stats.topLanguages[0].count) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top repos */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Repositories populaires</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.topRepos.map((repo) => (
            <a
              key={repo.name}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-bg-card border border-border-subtle rounded-xl p-5 hover:border-accent-primary transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
                  {repo.name}
                </h4>
                <ExternalLink className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {repo.description && (
                <p className="text-sm text-text-secondary mb-3 line-clamp-2">{repo.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-text-muted">
                {repo.language && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-accent-primary" />
                    {repo.language}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {repo.stars}
                </span>
                <span className="flex items-center gap-1">
                  <GitFork className="w-3 h-3" />
                  {repo.forks}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

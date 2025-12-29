'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { StatCard, ContributionCalendar } from '@/components'
import { Gamepad2, Clock, Trophy, RefreshCw, ChevronLeft, ChevronRight, Terminal, Zap } from 'lucide-react'

interface SteamData {
  user: {
    steamId: string
    username: string
    avatar: string
    profileUrl: string
    realName: string
    country: string
  }
  stats: {
    totalGames: number
    totalPlaytimeHours: number
    gamesPlayedRecently: number
  }
  topGames: {
    appid: number
    name: string
    playtimeHours: number
    iconUrl: string
  }[]
  recentGames: {
    appid: number
    name: string
    playtimeHours: number
    iconUrl: string
  }[]
}

interface PlaytimeData {
  totalHours: number
  totalMinutes: number
  daysPlayed: number
  playtime: {
    date: string
    count: number
    level: 0 | 1 | 2 | 3 | 4
  }[]
}

export default function SteamPage() {
  const [data, setData] = useState<SteamData | null>(null)
  const [playtime, setPlaytime] = useState<PlaytimeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingPlaytime, setLoadingPlaytime] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Fetch main Steam data (user, games, stats) - only once
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch('/api/steam')
        if (!response.ok) throw new Error('Failed to fetch')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError('Impossible de charger les données Steam')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Fetch playtime data separately - when year changes
  useEffect(() => {
    async function fetchPlaytime() {
      try {
        setLoadingPlaytime(true)
        const response = await fetch(`/api/steam/playtime?year=${selectedYear}`)
        if (!response.ok) throw new Error('Failed to fetch playtime')
        const result = await response.json()
        setPlaytime(result)
      } catch (err) {
        console.error('Failed to load playtime:', err)
      } finally {
        setLoadingPlaytime(false)
      }
    }
    fetchPlaytime()
  }, [selectedYear])

  // Sync current playtime data
  async function handleSync() {
    try {
      setSyncing(true)
      const response = await fetch('/api/steam/sync', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to sync')

      // Refresh playtime data after sync
      const playtimeResponse = await fetch(`/api/steam/playtime?year=${selectedYear}`)
      if (playtimeResponse.ok) {
        const result = await playtimeResponse.json()
        setPlaytime(result)
      }
    } catch (err) {
      console.error('Sync failed:', err)
      alert('Échec de la synchronisation')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-bg-card border border-neon-green/30 rounded-lg">
              <Terminal className="w-8 h-8 text-neon-green" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
                <span className="text-neon-green">STEAM</span>_SYSTEM
              </h1>
              <p className="text-xs font-mono text-neon-cyan/70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
                STATUS: LOADING // GAMING_TRACKER v2.0
              </p>
            </div>
          </div>
          <div className="font-mono text-sm text-text-secondary border-l-2 border-neon-green/30 pl-4">
            &gt; Initializing Steam data connection...
            <span className="text-neon-green animate-pulse">_</span>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-bg-card rounded-2xl border border-border-subtle" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-bg-card rounded-2xl border border-border-subtle" />
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
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-bg-card border border-neon-green/30 rounded-lg">
            <Terminal className="w-8 h-8 text-neon-green" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
              <span className="text-neon-green">STEAM</span>_SYSTEM
            </h1>
            <p className="text-xs font-mono text-neon-cyan/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
              STATUS: ONLINE // GAMING_TRACKER v2.0
            </p>
          </div>
        </div>
        <div className="font-mono text-sm text-text-secondary border-l-2 border-neon-green/30 pl-4">
          &gt; Loading Steam gaming profile...
          <span className="text-neon-green animate-pulse">_</span>
        </div>
      </div>

      {/* User profile */}
      <div className="tech-card p-6 mb-8 border-neon-green/30 hover:border-neon-green/60 transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative">
            <Image
              src={data.user.avatar}
              alt={data.user.username}
              width={120}
              height={120}
              className="rounded-lg ring-2 ring-neon-green/30"
            />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-neon-green rounded-full border-2 border-bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-bg-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display font-bold text-text-primary tracking-wider">
              {data.user.username}
            </h2>
            {data.user.realName && (
              <p className="text-sm font-mono text-text-muted mt-1">{data.user.realName}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-4">
              <a
                href={data.user.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-neon-green/10 border border-neon-green/30 rounded-lg text-neon-green text-sm font-mono hover:bg-neon-green/20 hover:border-neon-green/50 transition-all duration-300 group"
              >
                <span>VIEW_PROFILE</span>
                <span className="group-hover:translate-x-1 transition-transform">&gt;</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Jeux possédés" value={data.stats.totalGames} icon={Gamepad2} color="green" />
        <StatCard label="Heures de jeu" value={data.stats.totalPlaytimeHours} icon={Clock} color="cyan" />
        <StatCard label="Jeux récents" value={data.stats.gamesPlayedRecently} icon={Trophy} color="yellow" />
      </div>

      {/* Playtime calendar */}
      <div className="tech-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
              <Clock className="w-5 h-5 text-neon-cyan" />
            </div>
            <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
              Playtime_Tracker
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {playtime && (
              <span className="text-xs font-mono text-text-muted">
                {playtime.totalHours}h // {playtime.daysPlayed} jours [{selectedYear}]
              </span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-3 py-1.5 bg-neon-green/10 border border-neon-green/30 hover:bg-neon-green/20 hover:border-neon-green/50 text-neon-green rounded text-xs font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              <span>SYNC</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedYear(selectedYear - 1)}
                disabled={loadingPlaytime}
                className="p-1 hover:bg-neon-cyan/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Année précédente"
              >
                <ChevronLeft className="w-4 h-4 text-neon-cyan" />
              </button>
              <span className="text-sm font-mono font-medium text-neon-cyan min-w-[4rem] text-center">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear(selectedYear + 1)}
                disabled={selectedYear >= new Date().getFullYear() || loadingPlaytime}
                className="p-1 hover:bg-neon-cyan/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Année suivante"
              >
                <ChevronRight className="w-4 h-4 text-neon-cyan" />
              </button>
            </div>
          </div>
        </div>
        {loadingPlaytime ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-sm text-text-muted">Chargement du temps de jeu...</div>
          </div>
        ) : playtime && playtime.playtime.length > 0 ? (
          <ContributionCalendar contributions={playtime.playtime} year={selectedYear} />
        ) : (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="text-sm font-mono text-text-muted">
              &gt; NO_DATA_FOUND [{selectedYear}]
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-neon-green/10 border border-neon-green/30 text-neon-green rounded-lg hover:bg-neon-green/20 hover:border-neon-green/50 transition-all font-mono text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              START_TRACKING
            </button>
          </div>
        )}
      </div>

      {/* Top games */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-neon-magenta/10 border border-neon-magenta/30 rounded">
            <Trophy className="w-5 h-5 text-neon-magenta" />
          </div>
          <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Top_Games
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.topGames.slice(0, 6).map((game, index) => (
            <div
              key={game.appid}
              className="group relative bg-bg-card border border-border-subtle rounded-lg p-4 flex items-center gap-4 hover:border-neon-magenta/50 hover:-translate-y-0.5 transition-all duration-300"
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon-magenta/40 rounded-tl-lg transition-all group-hover:border-neon-magenta group-hover:w-4 group-hover:h-4" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neon-cyan/40 rounded-br-lg transition-all group-hover:border-neon-cyan group-hover:w-4 group-hover:h-4" />

              <div className="relative">
                <Image
                  src={game.iconUrl}
                  alt={game.name}
                  width={64}
                  height={64}
                  className="rounded-lg ring-2 ring-border-subtle group-hover:ring-neon-magenta/30 transition-all"
                />
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-neon-magenta rounded text-bg-primary text-xs font-mono font-bold flex items-center justify-center">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-text-primary truncate group-hover:text-neon-magenta transition-colors">
                  {game.name}
                </h4>
                <p className="text-xs font-mono text-text-muted">
                  {game.playtimeHours}h // PLAYTIME
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent games */}
      {data.recentGames.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-neon-yellow/10 border border-neon-yellow/30 rounded">
              <Gamepad2 className="w-5 h-5 text-neon-yellow" />
            </div>
            <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
              Recent_Activity
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recentGames.map((game) => (
              <div
                key={game.appid}
                className="group bg-bg-card border border-border-subtle rounded-lg p-4 flex items-center gap-3 hover:border-neon-yellow/50 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Image
                  src={game.iconUrl}
                  alt={game.name}
                  width={48}
                  height={48}
                  className="rounded-lg ring-2 ring-border-subtle group-hover:ring-neon-yellow/30 transition-all"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-text-primary truncate group-hover:text-neon-yellow transition-colors text-sm">
                    {game.name}
                  </h4>
                  <p className="text-xs font-mono text-text-muted">
                    {game.playtimeHours}h // 2W
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

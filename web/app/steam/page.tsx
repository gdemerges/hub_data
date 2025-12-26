'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { StatCard, ContributionCalendar } from '@/components'
import { Gamepad2, Clock, Trophy, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

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
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-accent-primary/10 rounded-xl">
            <Gamepad2 className="w-6 h-6 text-accent-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Steam</h1>
            <p className="text-sm text-text-muted">Chargement...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-bg-card rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
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
          <Gamepad2 className="w-6 h-6 text-accent-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Steam</h1>
          <p className="text-sm text-text-muted">Statistiques et activité</p>
        </div>
      </div>

      {/* User profile */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Image
            src={data.user.avatar}
            alt={data.user.username}
            width={120}
            height={120}
            className="rounded-full ring-4 ring-border-subtle"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text-primary">{data.user.username}</h2>
            {data.user.realName && (
              <p className="text-text-muted">{data.user.realName}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-text-secondary">
              <a
                href={data.user.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:underline"
              >
                Voir le profil Steam
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Jeux possédés" value={data.stats.totalGames} icon={Gamepad2} />
        <StatCard label="Heures de jeu" value={data.stats.totalPlaytimeHours} icon={Clock} />
        <StatCard label="Jeux récents" value={data.stats.gamesPlayedRecently} icon={Trophy} />
      </div>

      {/* Playtime calendar */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-primary">Temps de jeu</h3>
          <div className="flex items-center gap-4">
            {playtime && (
              <span className="text-sm text-text-muted">
                {playtime.totalHours}h de jeu sur {playtime.daysPlayed} jours en {selectedYear}
              </span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span className="text-sm">Sync</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedYear(selectedYear - 1)}
                disabled={loadingPlaytime}
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
                disabled={selectedYear >= new Date().getFullYear() || loadingPlaytime}
                className="p-1 hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Année suivante"
              >
                <ChevronRight className="w-5 h-5 text-text-secondary" />
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
            <div className="text-sm text-text-muted">
              Aucune donnée de jeu pour {selectedYear}
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Commencer le tracking
            </button>
          </div>
        )}
      </div>

      {/* Top games */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Jeux les plus joués</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.topGames.slice(0, 6).map((game) => (
            <div
              key={game.appid}
              className="bg-bg-card border border-border-subtle rounded-xl p-4 flex items-center gap-4"
            >
              <Image
                src={game.iconUrl}
                alt={game.name}
                width={64}
                height={64}
                className="rounded-lg"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-text-primary">{game.name}</h4>
                <p className="text-sm text-text-muted">{game.playtimeHours}h de jeu</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent games */}
      {data.recentGames.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Joués récemment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recentGames.map((game) => (
              <div
                key={game.appid}
                className="bg-bg-card border border-border-subtle rounded-xl p-4 flex items-center gap-3"
              >
                <Image
                  src={game.iconUrl}
                  alt={game.name}
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-text-primary truncate">{game.name}</h4>
                  <p className="text-xs text-text-muted">{game.playtimeHours}h (2 semaines)</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import { Music, Users, Clock, Disc, Mic2, ListMusic, ExternalLink } from 'lucide-react'
import { StatCard } from '@/components'
import { SkeletonPage, SkeletonProfile, SkeletonStatCard, SkeletonGrid } from '@/components/skeleton'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/page-transition'

interface SpotifyData {
  user: {
    name: string
    avatar: string
    followers: number
    profileUrl: string
  }
  topTracks: {
    name: string
    artist: string
    album: string
    albumCover: string
    duration: number
    spotifyUrl: string
  }[]
  topArtists: {
    name: string
    image: string
    genres: string[]
    followers: number
    spotifyUrl: string
  }[]
  recentlyPlayed: {
    name: string
    artist: string
    album: string
    albumCover: string
    playedAt: string
    spotifyUrl: string
  }[]
  topGenres: { genre: string; count: number }[]
  stats: {
    totalTracks: number
    totalArtists: number
    totalGenres: number
  }
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function SpotifyPage() {
  const { data, error, isLoading } = useSWR<SpotifyData>('/api/spotify', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatPlayedAt = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`
    if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
    return 'Il y a quelques minutes'
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-green-500/10 rounded-xl">
            <Music className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Spotify</h1>
            <p className="text-sm text-text-muted">Chargement...</p>
          </div>
        </div>
        <SkeletonProfile />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
          {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      </div>
    )
  }

  if (error || !data || !data.user) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-green-500/10 rounded-xl">
            <Music className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Spotify</h1>
            <p className="text-sm text-text-muted">Statistiques d'écoute</p>
          </div>
        </div>
        <div className="bg-bg-card border border-border-subtle rounded-2xl p-8 text-center">
          <Music className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">Non connecté</h2>
          <p className="text-sm text-text-muted mb-4">
            Configurez vos credentials Spotify pour voir vos statistiques d'écoute.
          </p>
          <p className="text-xs text-text-muted">
            Ajoutez SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET et SPOTIFY_REFRESH_TOKEN dans votre fichier .env
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-green-500/10 rounded-xl">
            <Music className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Spotify</h1>
            <p className="text-sm text-text-muted">Statistiques d'écoute</p>
          </div>
        </div>
      </FadeIn>

      {/* User profile */}
      <FadeIn delay={0.1}>
        <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {data.user.avatar && (
              <Image
                src={data.user.avatar}
                alt={data.user.name}
                width={120}
                height={120}
                className="rounded-full ring-4 ring-green-500/20"
              />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary">{data.user.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{data.user.followers} followers</span>
                </div>
              </div>
              {data.user.profileUrl && (
                <a
                  href={data.user.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-4 text-sm text-green-500 hover:underline"
                >
                  Voir sur Spotify
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Stats */}
      <FadeIn delay={0.2}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Titres favoris" value={data.stats.totalTracks} icon={Disc} />
          <StatCard label="Artistes favoris" value={data.stats.totalArtists} icon={Mic2} />
          <StatCard label="Genres" value={data.stats.totalGenres} icon={ListMusic} />
          <StatCard label="Écoutes récentes" value={data.recentlyPlayed.length} icon={Clock} />
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Tracks */}
        <FadeIn delay={0.3}>
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Disc className="w-5 h-5 text-green-500" />
              Top titres
            </h3>
            <div className="space-y-3">
              {data.topTracks.slice(0, 5).map((track, index) => (
                <a
                  key={`${track.name}-${index}`}
                  href={track.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-secondary transition-colors"
                >
                  <span className="text-sm text-text-muted w-5">{index + 1}</span>
                  {track.albumCover && (
                    <Image
                      src={track.albumCover}
                      alt={track.album}
                      width={48}
                      height={48}
                      className="rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{track.name}</p>
                    <p className="text-xs text-text-muted truncate">{track.artist}</p>
                  </div>
                  <span className="text-xs text-text-muted">{formatDuration(track.duration)}</span>
                </a>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Top Artists */}
        <FadeIn delay={0.4}>
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Mic2 className="w-5 h-5 text-green-500" />
              Top artistes
            </h3>
            <div className="space-y-3">
              {data.topArtists.slice(0, 5).map((artist, index) => (
                <a
                  key={`${artist.name}-${index}`}
                  href={artist.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-secondary transition-colors"
                >
                  <span className="text-sm text-text-muted w-5">{index + 1}</span>
                  {artist.image && (
                    <Image
                      src={artist.image}
                      alt={artist.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{artist.name}</p>
                    <p className="text-xs text-text-muted truncate">{artist.genres.join(', ')}</p>
                  </div>
                  <span className="text-xs text-text-muted">
                    {artist.followers.toLocaleString()} fans
                  </span>
                </a>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Top Genres */}
      <FadeIn delay={0.5}>
        <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-green-500" />
            Top genres
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.topGenres.map((genre, index) => (
              <span
                key={genre.genre}
                className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full text-sm font-medium"
                style={{ opacity: 1 - index * 0.08 }}
              >
                {genre.genre}
              </span>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Recently Played */}
      <FadeIn delay={0.6}>
        <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-500" />
            Écoutes récentes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.recentlyPlayed.slice(0, 10).map((item, index) => (
              <a
                key={`${item.name}-${item.playedAt}`}
                href={item.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-secondary transition-colors"
              >
                {item.albumCover && (
                  <Image
                    src={item.albumCover}
                    alt={item.album}
                    width={40}
                    height={40}
                    className="rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                  <p className="text-xs text-text-muted truncate">{item.artist}</p>
                </div>
                <span className="text-xs text-text-muted whitespace-nowrap">
                  {formatPlayedAt(item.playedAt)}
                </span>
              </a>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

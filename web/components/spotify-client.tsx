'use client'

import { use, useTransition } from 'react'
import Image from 'next/image'
import { Music, Users, Clock, Disc, Mic2, ListMusic, ExternalLink, RefreshCw } from 'lucide-react'
import { MusicNotes } from '@phosphor-icons/react/dist/ssr'
import { StatCard, PageHeader } from '@/components'
import { SkeletonStatCard, SkeletonProfile, SkeletonChart } from '@/components/skeleton'
import { FadeIn } from '@/components/page-transition'
import { syncSpotifyAction } from '@/lib/spotify-actions'
import type { SpotifyData } from '@/lib/types'

interface Props {
  promise: Promise<SpotifyData | null>
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'à l\'instant'
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

function formatDuration(ms: number) {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatPlayedAt(date: string) {
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`
  if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
  return 'Il y a quelques minutes'
}

function SyncButton({ pending, onSync }: { pending: boolean; onSync: () => void }) {
  return (
    <button
      onClick={onSync}
      disabled={pending}
      aria-label="Rafraîchir les données Spotify"
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-earth-leaf/80 border border-earth-leaf/30 rounded-full hover:bg-earth-leaf/10 hover:text-earth-leaf hover:border-earth-leaf/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCw className={`w-3 h-3 ${pending ? 'animate-spin' : ''}`} />
      SYNC
    </button>
  )
}

export function SpotifyClient({ promise }: Props) {
  const data = use(promise)
  const [pending, startTransition] = useTransition()

  function handleSync() {
    startTransition(async () => {
      const result = await syncSpotifyAction()
      if (!result.ok) alert('Échec de la synchronisation')
    })
  }

  if (!data || !data.user) {
    return (
      <>
        <PageHeader title="Spotify" subtitle="Statistiques d'écoute" color="leaf" icon={MusicNotes} />
        <div className="tech-card p-8">
          <div className="text-center max-w-xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-earth-leaf/10 border border-earth-leaf/30 flex items-center justify-center">
              <Music className="w-10 h-10 text-earth-leaf" />
            </div>
            <h2 className="font-display text-xl font-medium text-text-primary mb-3">
              Non connecté
            </h2>
            <p className="text-sm text-text-secondary mb-2">
              Configurez vos credentials Spotify pour voir vos statistiques d&apos;écoute.
            </p>
            <p className="text-xs text-text-muted font-mono mt-4">
              SPOTIFY_CLIENT_ID · SPOTIFY_CLIENT_SECRET · SPOTIFY_REFRESH_TOKEN
            </p>
          </div>
        </div>
      </>
    )
  }

  const subtitle = data.fetchedAt
    ? `Synchronisé ${timeAgo(data.fetchedAt)}`
    : 'Statistiques d\'écoute'

  return (
    <>
      <PageHeader
        title="Spotify"
        subtitle={subtitle}
        color="leaf"
        icon={MusicNotes}
        actions={<SyncButton pending={pending} onSync={handleSync} />}
      />

      <FadeIn delay={0.05}>
        <div className="tech-card p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {data.user.avatar && (
              <Image
                src={data.user.avatar}
                alt={data.user.name}
                width={120}
                height={120}
                className="rounded-full ring-2 ring-earth-leaf/30"
              />
            )}
            <div className="flex-1">
              <h2 className="font-display text-xl font-medium text-text-primary">{data.user.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{data.user.followers} followers</span>
                </div>
              </div>
              {data.user.profileUrl && (
                <a
                  href={data.user.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-4 text-sm text-earth-leaf hover:underline"
                >
                  Voir sur Spotify
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Titres favoris" value={data.stats.totalTracks} icon={Disc} color="green" />
          <StatCard label="Artistes favoris" value={data.stats.totalArtists} icon={Mic2} color="green" />
          <StatCard label="Genres" value={data.stats.totalGenres} icon={ListMusic} color="green" />
          <StatCard label="Écoutes récentes" value={data.recentlyPlayed.length} icon={Clock} color="green" />
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <FadeIn delay={0.15}>
          <div className="tech-card p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-earth-leaf/10 border border-earth-leaf/30 rounded-lg">
                <Disc className="w-5 h-5 text-earth-leaf" />
              </div>
              <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                Top_Titres
              </h3>
            </div>
            <div className="space-y-2">
              {data.topTracks.slice(0, 5).map((track, index) => (
                <a
                  key={`${track.name}-${index}`}
                  href={track.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-secondary transition-colors"
                >
                  <span className="text-sm font-mono text-text-muted w-5">{index + 1}</span>
                  {track.albumCover && (
                    <Image src={track.albumCover} alt={track.album} width={48} height={48} className="rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{track.name}</p>
                    <p className="text-xs text-text-muted truncate">{track.artist}</p>
                  </div>
                  <span className="text-xs font-mono text-text-muted num">{formatDuration(track.duration)}</span>
                </a>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="tech-card p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-earth-leaf/10 border border-earth-leaf/30 rounded-lg">
                <Mic2 className="w-5 h-5 text-earth-leaf" />
              </div>
              <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                Top_Artistes
              </h3>
            </div>
            <div className="space-y-2">
              {data.topArtists.slice(0, 5).map((artist, index) => (
                <a
                  key={`${artist.name}-${index}`}
                  href={artist.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-secondary transition-colors"
                >
                  <span className="text-sm font-mono text-text-muted w-5">{index + 1}</span>
                  {artist.image && (
                    <Image src={artist.image} alt={artist.name} width={48} height={48} className="rounded-full" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{artist.name}</p>
                    <p className="text-xs text-text-muted truncate">{artist.genres.join(', ')}</p>
                  </div>
                  <span className="text-xs font-mono text-text-muted num">
                    {artist.followers.toLocaleString('fr-FR')}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>

      <FadeIn delay={0.25}>
        <div className="tech-card p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-earth-leaf/10 border border-earth-leaf/30 rounded-lg">
              <ListMusic className="w-5 h-5 text-earth-leaf" />
            </div>
            <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
              Top_Genres
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.topGenres.map((genre, index) => (
              <span
                key={genre.genre}
                className="px-3 py-1.5 bg-earth-leaf/10 text-earth-leaf border border-earth-leaf/20 rounded-full text-sm font-medium"
                style={{ opacity: 1 - index * 0.08 }}
              >
                {genre.genre}
              </span>
            ))}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="tech-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-earth-leaf/10 border border-earth-leaf/30 rounded-lg">
              <Clock className="w-5 h-5 text-earth-leaf" />
            </div>
            <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
              Écoutes_Récentes
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.recentlyPlayed.slice(0, 10).map((item) => (
              <a
                key={`${item.name}-${item.playedAt}`}
                href={item.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-secondary transition-colors"
              >
                {item.albumCover && (
                  <Image src={item.albumCover} alt={item.album} width={40} height={40} className="rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                  <p className="text-xs text-text-muted truncate">{item.artist}</p>
                </div>
                <span className="text-xs font-mono text-text-muted whitespace-nowrap">
                  {formatPlayedAt(item.playedAt)}
                </span>
              </a>
            ))}
          </div>
        </div>
      </FadeIn>
    </>
  )
}

export function SpotifySkeleton() {
  return (
    <>
      <PageHeader title="Spotify" subtitle="Chargement…" color="leaf" icon={MusicNotes} />
      <SkeletonProfile />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
        {[...Array(4)].map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </>
  )
}

'use client'

import { use, useState, useTransition, useMemo } from 'react'
import Image from 'next/image'
import { Music, Users, Clock, Disc, Mic2, ListMusic, ExternalLink, RefreshCw, Activity } from 'lucide-react'
import { MusicNotes } from '@phosphor-icons/react/dist/ssr'
import { StatCard, PageHeader } from '@/components'
import { SkeletonStatCard, SkeletonProfile, SkeletonChart } from '@/components/skeleton'
import { FadeIn } from '@/components/page-transition'
import { syncSpotifyAction } from '@/lib/spotify-actions'
import type { SpotifyData, SpotifyTimeRange } from '@/lib/types'

const RANGE_LABELS: Record<SpotifyTimeRange, string> = {
  short_term: '4 semaines',
  medium_term: '6 mois',
  long_term: 'Tout',
}

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
  const [range, setRange] = useState<SpotifyTimeRange>('medium_term')

  function handleSync() {
    startTransition(async () => {
      const result = await syncSpotifyAction()
      if (!result.ok) alert('Échec de la synchronisation')
    })
  }

  if (!data?.user) {
    return (
      <>
        <PageHeader title="Musique" subtitle="Statistiques d'écoute" color="leaf" icon={MusicNotes} />
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

  const currentTopTracks =
    data.topTracksByRange?.[range] ?? data.topTracks
  const currentTopArtists =
    data.topArtistsByRange?.[range] ?? data.topArtists

  // Recently-played counts, used to display a "X écoutes récentes" hint next to
  // top items. Spotify doesn't expose true play counts; this is computed locally
  // from the last 50 played tracks.
  const recentTrackCount = new Map<string, number>()
  const recentArtistCount = new Map<string, number>()
  for (const item of data.recentlyPlayed) {
    const tk = `${item.name}::${item.artist}`
    recentTrackCount.set(tk, (recentTrackCount.get(tk) ?? 0) + 1)
    for (const a of item.artist.split(',').map(s => s.trim())) {
      if (a) recentArtistCount.set(a, (recentArtistCount.get(a) ?? 0) + 1)
    }
  }

  return (
    <>
      <PageHeader
        title="Musique"
        subtitle={subtitle}
        eyebrow="Écoute"
        dateline={`${data.stats.totalTracks.toLocaleString('fr-FR')} titres · ${data.stats.totalArtists.toLocaleString('fr-FR')} artistes`}
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
          <StatCard label="Titres favoris" value={data.stats.totalTracks} icon={Disc} color="moss" />
          <StatCard label="Artistes favoris" value={data.stats.totalArtists} icon={Mic2} color="moss" />
          <StatCard label="Genres" value={data.stats.totalGenres} icon={ListMusic} color="moss" />
          <StatCard label="Écoutes récentes" value={data.recentlyPlayed.length} icon={Clock} color="moss" />
        </div>
      </FadeIn>

      {data.topTracksByRange && (
        <div className="flex items-center justify-end gap-1 mb-4">
          <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted mr-2">
            Période
          </span>
          {(Object.keys(RANGE_LABELS) as SpotifyTimeRange[]).map(k => (
            <button
              key={k}
              onClick={() => setRange(k)}
              className={`px-3 py-1.5 text-xs font-mono rounded-full border transition-all ${
                range === k
                  ? 'bg-earth-leaf/15 text-earth-leaf border-earth-leaf/40'
                  : 'text-text-muted border-transparent hover:text-text-primary hover:border-border-default'
              }`}
            >
              {RANGE_LABELS[k]}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <FadeIn delay={0.15}>
          <div className="tech-card p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-earth-leaf/10 border border-earth-leaf/30 rounded-lg">
                <Disc className="w-5 h-5 text-earth-leaf" />
              </div>
              <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
                Top titres
              </h3>
            </div>
            <div className="space-y-2">
              {currentTopTracks.slice(0, 5).map((track, index) => {
                const recent = recentTrackCount.get(`${track.name}::${track.artist}`) ?? 0
                return (
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
                    <div className="flex flex-col items-end gap-0.5 min-w-[64px]">
                      {recent > 0 && (
                        <span className="text-xs font-mono text-earth-leaf num">
                          {recent}× récent{recent > 1 ? 'es' : 'e'}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-text-muted num">
                        {formatDuration(track.duration)}
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="tech-card p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-earth-leaf/10 border border-earth-leaf/30 rounded-lg">
                <Mic2 className="w-5 h-5 text-earth-leaf" />
              </div>
              <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
                Top artistes
              </h3>
            </div>
            <div className="space-y-2">
              {currentTopArtists.slice(0, 5).map((artist, index) => {
                const recent = recentArtistCount.get(artist.name) ?? 0
                return (
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
                    <div className="flex flex-col items-end gap-0.5 min-w-[72px]">
                      {recent > 0 && (
                        <span className="text-xs font-mono text-earth-leaf num">
                          {recent}× récent{recent > 1 ? 'es' : 'e'}
                        </span>
                      )}
                      {artist.popularity > 0 && (
                        <span className="text-[10px] font-mono text-earth-fern num">
                          pop. {artist.popularity}
                        </span>
                      )}
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </FadeIn>
      </div>

      {data.topAlbums && data.topAlbums.length > 0 && (
        <FadeIn delay={0.25}>
          <div className="tech-card p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-earth-leaf/10 border border-earth-leaf/30 rounded-lg">
                <Disc className="w-5 h-5 text-earth-leaf" />
              </div>
              <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
                Top albums
              </h3>
              <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted ml-auto">
                Calculé depuis tes top tracks
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {data.topAlbums.map((album) => (
                <div key={`${album.name}-${album.artist}`} className="group">
                  {album.cover ? (
                    <Image
                      src={album.cover}
                      alt={album.name}
                      width={120}
                      height={120}
                      className="w-full aspect-square rounded-lg object-cover border border-border-subtle"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-lg bg-bg-tertiary border border-border-subtle flex items-center justify-center">
                      <Disc className="w-6 h-6 text-text-muted/40" />
                    </div>
                  )}
                  <p className="mt-2 text-xs font-medium text-text-primary truncate group-hover:text-earth-leaf transition-colors">
                    {album.name}
                  </p>
                  <p className="text-[10px] text-text-muted truncate">{album.artist}</p>
                  <p className="text-[10px] font-mono text-earth-leaf mt-0.5">
                    {album.count} titre{album.count > 1 ? 's' : ''} dans tes tops
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      <FadeIn delay={0.28}>
        <ListeningPatterns recentlyPlayed={data.recentlyPlayed} />
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="tech-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-earth-leaf/10 border border-earth-leaf/30 rounded-lg">
              <Clock className="w-5 h-5 text-earth-leaf" />
            </div>
            <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
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

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function ListeningPatterns({
  recentlyPlayed,
}: {
  recentlyPlayed: SpotifyData['recentlyPlayed']
}) {
  const stats = useMemo(() => {
    if (!recentlyPlayed.length) return null
    const heat: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
    let totalMs = 0
    const dayCount = new Map<number, number>()
    const hourCount = new Map<number, number>()
    for (const item of recentlyPlayed) {
      const d = new Date(item.playedAt)
      const day = d.getDay()
      const hour = d.getHours()
      heat[day][hour] += 1
      dayCount.set(day, (dayCount.get(day) ?? 0) + 1)
      hourCount.set(hour, (hourCount.get(hour) ?? 0) + 1)
      totalMs += item.duration ?? 0
    }
    const max = Math.max(...heat.flat(), 1)
    const totalMinutes = Math.round(totalMs / 60000)
    const topDay = [...dayCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    const topHour = [...hourCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    const span =
      recentlyPlayed.length > 1
        ? new Date(recentlyPlayed[0].playedAt).getTime() -
          new Date(recentlyPlayed[recentlyPlayed.length - 1].playedAt).getTime()
        : 0
    return { heat, max, totalMinutes, topDay, topHour, span, count: recentlyPlayed.length }
  }, [recentlyPlayed])

  if (!stats) return null

  const spanLabel = (() => {
    const days = Math.round(stats.span / (1000 * 60 * 60 * 24))
    if (days <= 0) return 'aujourd\'hui'
    if (days < 7) return `${days} derniers jours`
    if (days < 60) return `${Math.round(days / 7)} dernières semaines`
    return `${Math.round(days / 30)} derniers mois`
  })()

  return (
    <div className="tech-card p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-earth-leaf/10 border border-earth-leaf/30 rounded-lg">
          <Activity className="w-5 h-5 text-earth-leaf" />
        </div>
        <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
          Patterns d&apos;écoute
        </h3>
        <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted ml-auto">
          {stats.count} titres · {spanLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Temps cumulé</p>
          <p className="text-2xl font-bold text-text-primary num">
            {stats.totalMinutes >= 60
              ? `${Math.floor(stats.totalMinutes / 60)} h ${stats.totalMinutes % 60} min`
              : `${stats.totalMinutes} min`}
          </p>
        </div>
        <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Jour le plus actif</p>
          <p className="text-2xl font-bold text-text-primary">
            {stats.topDay !== undefined ? DAY_LABELS[stats.topDay] : '—'}
          </p>
        </div>
        <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Heure de pointe</p>
          <p className="text-2xl font-bold text-text-primary num">
            {stats.topHour !== undefined ? `${stats.topHour}h` : '—'}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid gap-1" style={{ gridTemplateColumns: '40px repeat(24, minmax(14px, 1fr))' }}>
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-[9px] font-mono text-text-muted text-center">
                {h % 3 === 0 ? h : ''}
              </div>
            ))}
            {[1, 2, 3, 4, 5, 6, 0].map(day => (
              <div key={day} className="contents">
                <div className="text-[10px] font-mono text-text-muted flex items-center pr-1">
                  {DAY_LABELS[day]}
                </div>
                {Array.from({ length: 24 }, (_, h) => {
                  const v = stats.heat[day][h]
                  const intensity = stats.max ? v / stats.max : 0
                  return (
                    <div
                      key={h}
                      title={`${DAY_LABELS[day]} ${h}h · ${v} titre${v > 1 ? 's' : ''}`}
                      className="aspect-square rounded-sm border border-border-subtle/40"
                      style={{
                        background:
                          v === 0
                            ? 'transparent'
                            : `rgba(79, 140, 74, ${0.15 + intensity * 0.85})`,
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SpotifySkeleton() {
  return (
    <>
      <PageHeader title="Musique" subtitle="Chargement…" color="leaf" icon={MusicNotes} />
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

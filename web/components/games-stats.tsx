'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import type { Game } from '@/lib/types'
import {
  Trophy,
  Star,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Target,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react'

interface GameStatsProps {
  games: Game[]
}

const STATUS_COLORS: Record<string, string> = {
  Fini: '#5a7d4a',
  'En cours': '#d9a441',
  Abandonné: '#b06868',
  'À faire': '#7ba896',
}

function gameHours(g: Game): number {
  return g.hoursPlayed ?? 0
}

const UNPLAYED_STATUSES = new Set(['Wishé', 'Jamais joué'])

function gameStatus(g: Game): string | undefined {
  if (g.status) return g.status
  if (g.platforms && g.platforms.length > 0) {
    if (g.platforms.some(p => p.status === 'Fini')) return 'Fini'
    if (g.platforms.some(p => p.status === 'En cours')) return 'En cours'
    // Prefer a "played" platform over a wished/unplayed one
    const played = g.platforms.find(p => p.status && !UNPLAYED_STATUSES.has(p.status))
    if (played) return played.status
    return g.platforms[0].status
  }
  return undefined
}

function isUnplayed(g: Game): boolean {
  const s = gameStatus(g)
  return !!s && UNPLAYED_STATUSES.has(s)
}

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

// Saga detection: explicit list (regex matched against title). First match wins.
const SAGAS: { name: string; pattern: RegExp }[] = [
  { name: 'Pokémon', pattern: /\bpok[eé]mon\b/i },
  { name: 'Final Fantasy', pattern: /\bfinal fantasy\b/i },
  { name: 'Dragon Quest', pattern: /\bdragon quest\b/i },
  { name: "Assassin's Creed", pattern: /\bassassin'?s creed\b/i },
  { name: 'Age of Empires', pattern: /\bage of empires\b/i },
  { name: 'Animal Crossing', pattern: /\banimal crossing\b/i },
  { name: 'Batman: Arkham', pattern: /\bbatman: arkham\b/i },
  { name: 'Baten Kaitos', pattern: /\bbaten kaitos\b/i },
  { name: 'Bravely Default', pattern: /\bbravely default\b/i },
  { name: 'Civilization', pattern: /\bcivilization\b/i },
  { name: 'FIFA', pattern: /\bfifa\b/i },
  { name: 'Football Manager', pattern: /\bfootball manager\b/i },
  { name: 'Gears of War', pattern: /\bgears( of war)?\b/i },
  { name: 'GTA', pattern: /\bgta\b/i },
  { name: 'Halo', pattern: /\bhalo\b/i },
  { name: 'Harry Potter', pattern: /\bharry potter\b/i },
  { name: 'Inazuma Eleven', pattern: /\binazuma eleven\b/i },
  { name: 'Kingdom Hearts', pattern: /\bkingdom hearts\b/i },
  { name: 'Tales of', pattern: /\btales of\b/i },
  { name: 'Total War', pattern: /\btotal war\b/i },
  { name: 'The Witcher', pattern: /\b(the )?witcher\b/i },
  { name: 'Call of Duty', pattern: /\bcall of duty\b/i },
  { name: 'Crash', pattern: /\bcrash\b/i },
  { name: 'Digimon', pattern: /\bdigimon\b/i },
  { name: 'Dragon Age', pattern: /\bdragon age\b/i },
  { name: 'Fire Emblem', pattern: /\bfire emblem\b/i },
  { name: 'Mario', pattern: /\b(super )?mario\b/i },
  { name: 'Zelda', pattern: /\b(zelda|hyrule)\b/i },
  { name: 'Metal Gear', pattern: /\bmetal gear\b/i },
  { name: 'Resident Evil', pattern: /\bresident evil\b/i },
  { name: 'Star Wars', pattern: /\bstar wars\b/i },
  { name: 'Asterix', pattern: /\bast[eé]rix\b/i },
  { name: 'Donkey Kong', pattern: /\bdonkey kong\b/i },
  { name: 'Red Dead', pattern: /\bred dead\b/i },
  { name: 'Mario Kart', pattern: /\bmario kart\b/i },
  { name: 'Mass Effect', pattern: /\bmass effect\b/i },
  { name: 'Monster Hunter', pattern: /\bmonster hunter\b/i },
  { name: 'Persona', pattern: /\bpersona\b/i },
  { name: 'The Elder Scrolls', pattern: /\b(the )?elder scrolls\b/i },
  { name: 'The Last of Us', pattern: /\bthe last of us\b/i },
  { name: 'Xenoblade', pattern: /\bxenoblade\b/i },
  { name: 'Les Sims', pattern: /\b(les sims|the sims|sims)\b/i },
  { name: 'Life is Strange', pattern: /\blife is strange\b/i },
  { name: 'Monument Valley', pattern: /\bmonument valley\b/i },
  { name: 'Ni no Kuni', pattern: /\bni no kuni\b/i },
  { name: 'Nier', pattern: /\bnier\b/i },
  { name: 'SimCity', pattern: /\bsimcity\b/i },
  { name: 'Super Smash Bros', pattern: /\b(super )?smash bros\b/i },
  { name: 'Theatrhythm', pattern: /\btheatrhythm\b/i },
  { name: 'Tomb Raider', pattern: /\btomb raider\b/i },
  { name: 'Trine', pattern: /\btrine\b/i },
  { name: 'Watch Dogs', pattern: /\bwatch dogs\b/i },
  { name: 'League of Legends', pattern: /\b(league of legends|lol|teamfight tactics|tft|wild rift|legends of runeterra)\b/i },
]

// Order matters: more-specific names ("Mario Kart") must beat shorter ones
// ("Mario") when both could match the same title.
SAGAS.sort((a, b) => b.name.length - a.name.length)

function detectSaga(title: string): string | null {
  for (const s of SAGAS) {
    if (s.pattern.test(title)) return s.name
  }
  return null
}

export function GameStats({ games }: GameStatsProps) {
  const {
    totalGames,
    totalHours,
    finished,
    completionRate,
    avgRating,
    avgVsCrowd,
    topPlayed,
    topRated,
    statusBreakdown,
    hoursByDecade,
    avgRatingByGenre,
    avgRatingByPlatform,
    sagas,
    unplayed,
    statusTotal,
  } = useMemo(() => {
    // Separate played from wishlist / never-played: stats only consider played games.
    const played = games.filter(g => !isUnplayed(g))
    const unplayed = games.filter(isUnplayed)

    const totalGames = played.length
    const totalHours = played.reduce((s, g) => s + gameHours(g), 0)

    const finished = played.filter(g => gameStatus(g) === 'Fini').length
    const completionRate = totalGames ? (finished / totalGames) * 100 : 0

    const ratedGames = played.filter(g => typeof g.rating === 'number')
    const avgRating = avg(ratedGames.map(g => g.rating!))

    // Personal bias: average delta between user rating and crowd average
    const bothRated = played.filter(
      g => typeof g.rating === 'number' && typeof g.avgRating === 'number'
    )
    const avgVsCrowd = avg(bothRated.map(g => g.rating! - g.avgRating!))

    const topPlayed = [...played]
      .filter(g => gameHours(g) > 0)
      .sort((a, b) => gameHours(b) - gameHours(a))
      .slice(0, 10)

    const topRated = [...ratedGames]
      .sort((a, b) => (b.rating! - a.rating!) || gameHours(b) - gameHours(a))
      .slice(0, 10)

    // Per-platform breakdown: one entry per platform (a game on PC+PS5 counts twice).
    // Excludes Wishé / Jamais joué.
    const statusCounts = new Map<string, number>()
    let statusTotal = 0
    for (const g of games) {
      const platformStatuses =
        g.platforms?.map(p => p.status) ?? (g.status ? [g.status] : [])
      for (const s of platformStatuses) {
        if (!s || UNPLAYED_STATUSES.has(s)) continue
        statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1)
        statusTotal += 1
      }
    }
    const statusBreakdown = Array.from(statusCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)

    const decadeMap = new Map<string, number>()
    for (const g of played) {
      if (!g.releaseYear) continue
      const decade = `${Math.floor(g.releaseYear / 10) * 10}s`
      decadeMap.set(decade, (decadeMap.get(decade) ?? 0) + gameHours(g))
    }
    const hoursByDecade = Array.from(decadeMap.entries())
      .map(([decade, hours]) => ({ decade, hours }))
      .filter(d => d.hours > 0)
      .sort((a, b) => a.decade.localeCompare(b.decade))

    const byGenre = new Map<string, number[]>()
    for (const g of ratedGames) {
      for (const genre of g.genres ?? []) {
        if (!byGenre.has(genre)) byGenre.set(genre, [])
        byGenre.get(genre)!.push(g.rating!)
      }
    }
    const avgRatingByGenre = Array.from(byGenre.entries())
      .filter(([, arr]) => arr.length >= 3)
      .map(([genre, arr]) => ({ label: genre, value: avg(arr), count: arr.length }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)

    const byPlatform = new Map<string, number[]>()
    for (const g of ratedGames) {
      const plats = g.platforms?.map(p => p.platform) ?? (g.platform ? [g.platform] : [])
      for (const platform of plats) {
        if (!byPlatform.has(platform)) byPlatform.set(platform, [])
        byPlatform.get(platform)!.push(g.rating!)
      }
    }
    const avgRatingByPlatform = Array.from(byPlatform.entries())
      .filter(([, arr]) => arr.length >= 3)
      .map(([platform, arr]) => ({ label: platform, value: avg(arr), count: arr.length }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)

    const sagaMap = new Map<string, { hours: number; games: Game[] }>()
    for (const g of played) {
      const saga = detectSaga(g.title)
      if (!saga) continue
      const cur = sagaMap.get(saga) ?? { hours: 0, games: [] }
      cur.hours += gameHours(g)
      cur.games.push(g)
      sagaMap.set(saga, cur)
    }
    const sagas = Array.from(sagaMap.entries())
      .filter(([, v]) => v.games.length >= 2)
      .map(([name, v]) => {
        const sortedGames = [...v.games].sort((a, b) => gameHours(b) - gameHours(a))
        // Cover = most-played game with a cover, fall back to any cover in the saga
        const cover =
          sortedGames.find(g => g.coverUrl)?.coverUrl ??
          v.games.find(g => g.coverUrl)?.coverUrl
        return {
          name,
          hours: v.hours,
          count: v.games.length,
          cover,
          games: sortedGames,
        }
      })
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 20)

    return {
      totalGames,
      totalHours,
      finished,
      completionRate,
      avgRating,
      avgVsCrowd,
      topPlayed,
      topRated,
      statusBreakdown,
      hoursByDecade,
      avgRatingByGenre,
      avgRatingByPlatform,
      sagas,
      unplayed,
      statusTotal,
    }
  }, [games])

  return (
    <div className="space-y-6">
      <KpiRow
        totalGames={totalGames}
        totalHours={totalHours}
        finished={finished}
        completionRate={completionRate}
        avgRating={avgRating}
        avgVsCrowd={avgVsCrowd}
        backlogCount={unplayed.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopList
          title="Top 10 plus joués"
          icon={<Clock className="w-5 h-5 text-earth-moss" />}
          items={topPlayed}
          metric={(g) => `${Math.round(gameHours(g))}h`}
          progress={(g) => gameHours(g) / Math.max(...topPlayed.map(gameHours))}
        />
        <TopList
          title="Top 10 mieux notés"
          icon={<Star className="w-5 h-5 text-earth-saffron" />}
          items={topRated}
          metric={(g) => `${g.rating!.toFixed(1)}/20`}
          progress={(g) => (g.rating ?? 0) / 20}
          extra={(g) =>
            typeof g.avgRating === 'number'
              ? deltaLabel(g.rating! - g.avgRating)
              : null
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusBreakdown items={statusBreakdown} total={statusTotal} />
        <HoursByDecade items={hoursByDecade} />
      </div>

      <BacklogList games={unplayed} />

      <SagaList items={sagas} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingBars
          title="Note moyenne par genre"
          icon={<Target className="w-5 h-5 text-earth-fern" />}
          items={avgRatingByGenre}
          unit="/20"
          max={20}
        />
        <RankingBars
          title="Note moyenne par plateforme"
          icon={<Trophy className="w-5 h-5 text-earth-terracotta" />}
          items={avgRatingByPlatform}
          unit="/20"
          max={20}
        />
      </div>
    </div>
  )
}

function deltaLabel(delta: number): React.ReactNode {
  if (Math.abs(delta) < 0.05) {
    return <span className="text-text-muted">≈ moyenne</span>
  }
  const positive = delta > 0
  const Icon = positive ? TrendingUp : TrendingDown
  const color = positive ? 'text-earth-moss' : 'text-earth-clay'
  return (
    <span className={`inline-flex items-center gap-1 ${color}`}>
      <Icon className="w-3 h-3" />
      {positive ? '+' : ''}{delta.toFixed(1)}
    </span>
  )
}

function KpiRow({
  totalGames,
  totalHours,
  finished,
  completionRate,
  avgRating,
  avgVsCrowd,
  backlogCount,
}: {
  totalGames: number
  totalHours: number
  finished: number
  completionRate: number
  avgRating: number
  avgVsCrowd: number
  backlogCount: number
}) {
  const catalogTotal = totalGames + backlogCount
  const items = [
    {
      label: 'Joués',
      value: totalGames.toString(),
      sub: backlogCount
        ? `+ ${backlogCount} dans le backlog (${catalogTotal} total)`
        : 'jeux',
      icon: <Trophy className="w-5 h-5" />,
      color: 'text-earth-moss',
      bg: 'bg-earth-moss/10',
    },
    {
      label: 'Temps total',
      value: `${Math.round(totalHours).toLocaleString('fr-FR')}h`,
      sub: 'toutes plateformes',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-earth-fern',
      bg: 'bg-earth-fern/10',
    },
    {
      label: 'Finis',
      value: finished.toString(),
      sub: `${completionRate.toFixed(0)}% du backlog`,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-earth-leaf',
      bg: 'bg-earth-leaf/10',
    },
    {
      label: 'Note moyenne',
      value: avgRating > 0 ? `${avgRating.toFixed(1)}/20` : '—',
      sub:
        avgVsCrowd > 0.05
          ? `+${avgVsCrowd.toFixed(1)} vs moyenne`
          : avgVsCrowd < -0.05
          ? `${avgVsCrowd.toFixed(1)} vs moyenne`
          : 'aligné sur la moyenne',
      icon: <Star className="w-5 h-5" />,
      color: 'text-earth-saffron',
      bg: 'bg-earth-saffron/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(it => (
        <div
          key={it.label}
          className="bg-bg-card border border-border-subtle rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${it.bg} ${it.color}`}>
              {it.icon}
            </div>
            <p className="text-xs text-text-secondary uppercase tracking-wide">
              {it.label}
            </p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{it.value}</p>
          <p className="text-xs text-text-muted mt-1">{it.sub}</p>
        </div>
      ))}
    </div>
  )
}

function TopList({
  title,
  icon,
  items,
  metric,
  progress,
  extra,
}: {
  title: string
  icon: React.ReactNode
  items: Game[]
  metric: (g: Game) => string
  progress: (g: Game) => number
  extra?: (g: Game) => React.ReactNode
}) {
  if (!items.length) {
    return (
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          {icon}
          <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
        </div>
        <p className="text-sm text-text-muted">Aucune donnée</p>
      </div>
    )
  }

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
      </div>
      <ol className="space-y-3">
        {items.map((g, i) => (
          <li key={`${g.title}-${i}`} className="flex items-center gap-3">
            <span className="w-5 text-xs font-mono text-text-muted text-right">
              {i + 1}
            </span>
            <div className="relative w-9 h-12 flex-shrink-0 rounded-md overflow-hidden bg-bg-tertiary border border-border-subtle">
              {g.coverUrl ? (
                <Image
                  src={g.coverUrl}
                  alt={g.title}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[9px] text-text-muted font-display">
                  {g.title.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate font-medium">
                {g.title}
              </p>
              <div className="mt-1 h-1 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-earth-moss to-earth-fern"
                  style={{ width: `${Math.min(100, progress(g) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex flex-col items-end text-xs gap-0.5">
              <span className="font-mono font-semibold text-text-primary">
                {metric(g)}
              </span>
              {extra ? <span>{extra(g)}</span> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function StatusBreakdown({
  items,
  total,
}: {
  items: { label: string; count: number }[]
  total: number
}) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle2 className="w-5 h-5 text-earth-moss" />
        <h3 className="text-sm font-semibold text-text-secondary">
          Répartition par statut
        </h3>
        <span className="text-xs text-text-muted ml-auto">
          {total} entrées (par plateforme)
        </span>
      </div>
      <div className="space-y-3">
        {items.map(({ label, count }) => {
          const pct = total ? (count / total) * 100 : 0
          const color = STATUS_COLORS[label] ?? '#7ba896'
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="text-sm text-text-primary">{label}</span>
                </div>
                <span className="text-xs font-mono text-text-secondary">
                  {count} · {pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HoursByDecade({
  items,
}: {
  items: { decade: string; hours: number }[]
}) {
  if (!items.length) return null
  const max = Math.max(...items.map(i => i.hours))
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-5 h-5 text-earth-terracotta" />
        <h3 className="text-sm font-semibold text-text-secondary">
          Heures par décennie de sortie
        </h3>
      </div>
      <div className="flex items-end gap-3 h-40">
        {items.map(({ decade, hours }) => {
          const h = max ? (hours / max) * 100 : 0
          return (
            <div
              key={decade}
              className="flex-1 h-full flex flex-col items-center justify-end gap-2"
            >
              <span className="text-xs font-mono text-text-secondary">
                {Math.round(hours)}h
              </span>
              <div
                className="w-full rounded-t bg-gradient-to-t from-earth-terracotta to-earth-saffron"
                style={{ height: `${h}%` }}
              />
              <span className="text-xs font-mono text-text-muted">
                {decade}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BacklogList({ games }: { games: Game[] }) {
  if (!games.length) return null
  // Group by status (Wishé / Jamais joué)
  const groups = new Map<string, Game[]>()
  for (const g of games) {
    const s = gameStatus(g) || 'Inconnu'
    if (!groups.has(s)) groups.set(s, [])
    groups.get(s)!.push(g)
  }
  const ordered = ['Wishé', 'Jamais joué', 'Inconnu']
    .filter(s => groups.has(s))
    .map(s => [s, groups.get(s)!] as const)

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Star className="w-5 h-5 text-earth-saffron" />
        <h3 className="text-sm font-semibold text-text-secondary">
          Backlog &amp; wishlist
        </h3>
        <span className="text-xs text-text-muted ml-auto">
          {games.length} jeux · exclus des stats
        </span>
      </div>
      <div className="space-y-5">
        {ordered.map(([status, gs]) => (
          <div key={status}>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-sm font-semibold text-text-primary">
                {status}
              </span>
              <span className="text-xs text-text-muted">{gs.length}</span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {gs.map((g, idx) => (
                <li key={`${g.title}-${idx}`} className="flex items-center gap-3 py-1">
                  <div className="relative w-7 h-10 flex-shrink-0 rounded-sm overflow-hidden bg-bg-tertiary border border-border-subtle">
                    {g.coverUrl ? (
                      <Image
                        src={g.coverUrl}
                        alt={g.title}
                        fill
                        sizes="28px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-text-muted font-display">
                        {g.title.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{g.title}</p>
                    <p className="text-xs text-text-muted truncate">
                      {(g.platforms?.map(p => p.platform).join(' · ') ?? g.platform) || '—'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SagaItem {
  name: string
  hours: number
  count: number
  cover?: string
  games: Game[]
}

function SagaList({ items }: { items: SagaItem[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  if (!items.length) return null
  const max = Math.max(...items.map(i => i.hours))
  const selectedSaga = items.find(s => s.name === selected) ?? null

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Layers className="w-5 h-5 text-earth-indigo" />
        <h3 className="text-sm font-semibold text-text-secondary">
          Heures par saga
        </h3>
        <span className="text-xs text-text-muted ml-auto">
          {items.length} sagas · min 2 jeux · clique pour déplier
        </span>
      </div>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 sm:grid-flow-col gap-x-6 gap-y-3"
        style={{ gridTemplateRows: `repeat(${Math.ceil(items.length / 2)}, minmax(0, auto))` }}
      >
        {items.map((s, i) => {
          const pct = max ? (s.hours / max) * 100 : 0
          const isSelected = selected === s.name
          return (
            <button
              key={s.name}
              onClick={() => setSelected(isSelected ? null : s.name)}
              className={`flex items-center gap-3 text-left rounded-lg p-2 -m-2 transition-colors ${
                isSelected
                  ? 'bg-earth-indigo/10 border border-earth-indigo/30'
                  : 'border border-transparent hover:bg-bg-hover'
              }`}
            >
              <span className="w-5 text-xs font-mono text-text-muted text-right">
                {i + 1}
              </span>
              <div className="relative w-9 h-12 flex-shrink-0 rounded-md overflow-hidden bg-bg-tertiary border border-border-subtle">
                {s.cover ? (
                  <Image
                    src={s.cover}
                    alt={s.name}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] text-text-muted font-display">
                    {s.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm text-text-primary truncate font-medium">
                    {s.name}
                  </p>
                  <span className="text-xs font-mono text-text-muted shrink-0">
                    {s.count} jeux
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-earth-indigo to-earth-fern"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-semibold text-text-primary shrink-0">
                    {Math.round(s.hours)}h
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform ${
                  isSelected ? 'rotate-180' : ''
                }`}
              />
            </button>
          )
        })}
      </div>

      {selectedSaga && (
        <div className="mt-6 pt-6 border-t border-border-subtle animate-fade-in">
          <div className="flex items-baseline justify-between mb-3">
            <h4 className="text-sm font-semibold text-text-primary">
              {selectedSaga.name}{' '}
              <span className="text-text-muted font-normal">
                · {selectedSaga.count} jeux · {Math.round(selectedSaga.hours)}h
              </span>
            </h4>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {selectedSaga.games.map((g, idx) => (
              <li
                key={`${g.title}-${idx}`}
                className="flex items-center gap-3 py-1.5"
              >
                <div className="relative w-7 h-10 flex-shrink-0 rounded-sm overflow-hidden bg-bg-tertiary border border-border-subtle">
                  {g.coverUrl ? (
                    <Image
                      src={g.coverUrl}
                      alt={g.title}
                      fill
                      sizes="28px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-text-muted font-display">
                      {g.title.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">
                    {g.title}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {(g.platforms?.map(p => p.platform).join(' · ') ?? g.platform) || '—'}
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-text-primary shrink-0">
                  {Math.round(gameHours(g))}h
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function RankingBars({
  title,
  icon,
  items,
  unit,
  max,
}: {
  title: string
  icon: React.ReactNode
  items: { label: string; value: number; count: number }[]
  unit: string
  max: number
}) {
  if (!items.length) {
    return (
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          {icon}
          <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
        </div>
        <p className="text-sm text-text-muted">Pas assez de données notées</p>
      </div>
    )
  }
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
      </div>
      <div className="space-y-2.5">
        {items.map(({ label, value, count }) => {
          const pct = (value / max) * 100
          return (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-text-primary w-32 truncate">
                {label}
              </span>
              <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-earth-fern to-earth-moss rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-mono text-text-secondary w-20 text-right">
                {value.toFixed(1)}{unit}
                <span className="text-text-muted ml-1">({count})</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

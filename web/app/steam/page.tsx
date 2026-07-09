import { SteamLogo } from '@phosphor-icons/react/dist/ssr'
import { Clock, Gamepad2, Trophy, Zap } from 'lucide-react'
import Image from 'next/image'
import { Suspense } from 'react'
import { PageHeader, StatCard } from '@/components'
import { SteamPlaytimeSection, SteamPlaytimeSkeleton } from '@/components/steam-playtime-section'
import { loadSteam } from '@/lib/steam'
import { loadPlaytime } from '@/lib/steam-playtime'

export const revalidate = 21600

export const metadata = { title: 'Steam' }

export default async function SteamPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const { year: yearParam } = await searchParams
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()
  const playtimePromise = loadPlaytime(year)
  const data = await loadSteam()

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <PageHeader
          title="Steam"
          subtitle="Profil et bibliothèque"
          eyebrow="Bibliothèque Steam"
          dateline="Sync requise"
          color="moss"
          icon={SteamLogo}
        />
        <div className="text-center py-12">
          <p className="text-text-muted">Impossible de charger les données Steam</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="Steam"
        subtitle="Profil et bibliothèque"
        eyebrow="Bibliothèque Steam"
        dateline={`${data.stats.totalGames.toLocaleString('fr-FR')} jeux · ${Math.round(data.stats.totalPlaytimeHours).toLocaleString('fr-FR')} h`}
        color="moss"
        icon={SteamLogo}
      />

      <div className="tech-card p-6 mb-8 border-earth-moss/30 hover:border-earth-moss/60 transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative">
            <Image
              src={data.user.avatar}
              alt={data.user.username}
              width={120}
              height={120}
              className="rounded-lg ring-2 ring-earth-moss/30"
            />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-earth-moss rounded-full border-2 border-bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-bg-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-3xl font-medium tracking-tight text-text-primary">
              {data.user.username}
            </h2>
            {data.user.realName && (
              <p className="text-sm text-text-muted mt-1">{data.user.realName}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-5">
              <a
                href={data.user.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-earth-moss/10 border border-earth-moss/30 rounded-full text-earth-moss text-sm font-medium hover:bg-earth-moss/20 hover:border-earth-moss/50 transition-all group"
              >
                <span>Voir le profil</span>
                <span className="group-hover:translate-x-1 transition-transform">&gt;</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Jeux possédés"
          value={data.stats.totalGames}
          icon={Gamepad2}
          color="moss"
        />
        <StatCard
          label="Heures de jeu"
          value={data.stats.totalPlaytimeHours}
          icon={Clock}
          color="fern"
        />
        <StatCard
          label="Jeux récents"
          value={data.stats.gamesPlayedRecently}
          icon={Trophy}
          color="saffron"
        />
      </div>

      <Suspense fallback={<SteamPlaytimeSkeleton />}>
        <SteamPlaytimeSection promise={playtimePromise} year={year} />
      </Suspense>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-earth-terracotta/10 border border-earth-terracotta/30 rounded">
            <Trophy className="w-5 h-5 text-earth-terracotta" />
          </div>
          <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
            Top jeux
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.topGames.slice(0, 6).map((game, index) => (
            <div
              key={game.appid}
              className="group relative bg-bg-card border border-border-subtle rounded-lg p-4 flex items-center gap-4 hover:border-earth-terracotta/50 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-earth-terracotta/40 rounded-tl-lg transition-all group-hover:border-earth-terracotta group-hover:w-4 group-hover:h-4" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-earth-fern/40 rounded-br-lg transition-all group-hover:border-earth-fern group-hover:w-4 group-hover:h-4" />

              <div className="relative">
                <Image
                  src={game.iconUrl}
                  alt={game.name}
                  width={64}
                  height={64}
                  className="rounded-lg ring-2 ring-border-subtle group-hover:ring-earth-terracotta/30 transition-all"
                />
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-earth-terracotta rounded text-bg-primary text-xs font-mono font-bold flex items-center justify-center">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-text-primary truncate group-hover:text-earth-terracotta transition-colors">
                  {game.name}
                </h4>
                <p className="text-xs font-mono text-text-muted">{game.playtimeHours}h joués</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.recentGames.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-earth-saffron/10 border border-earth-saffron/30 rounded">
              <Gamepad2 className="w-5 h-5 text-earth-saffron" />
            </div>
            <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
              Activité récente
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recentGames.map((game) => (
              <div
                key={game.appid}
                className="group bg-bg-card border border-border-subtle rounded-lg p-4 flex items-center gap-3 hover:border-earth-saffron/50 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Image
                  src={game.iconUrl}
                  alt={game.name}
                  width={48}
                  height={48}
                  className="rounded-lg ring-2 ring-border-subtle group-hover:ring-earth-saffron/30 transition-all"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-text-primary truncate group-hover:text-earth-saffron transition-colors text-sm">
                    {game.name}
                  </h4>
                  <p className="text-xs font-mono text-text-muted">
                    {game.playtimeHours}h sur 2 semaines
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

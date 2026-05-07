import { Suspense } from 'react'
import Image from 'next/image'
import { StatCard, PageHeader } from '@/components'
import { SteamPlaytimeSection, SteamPlaytimeSkeleton } from '@/components/steam-playtime-section'
import { Gamepad2, Clock, Trophy, Zap } from 'lucide-react'
import { SteamLogo } from '@phosphor-icons/react/dist/ssr'
import { loadSteam } from '@/lib/steam'
import { loadPlaytime } from '@/lib/steam-playtime'

export const revalidate = 21600

export default async function SteamPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const { year: yearParam } = await searchParams
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()
  const playtimePromise = loadPlaytime(year)
  const data = await loadSteam()

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <PageHeader title="Steam" subtitle="Profil et bibliothèque" color="moss" icon={SteamLogo} />
        <div className="text-center py-12">
          <p className="text-text-muted">Impossible de charger les données Steam</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader title="Steam" subtitle="Profil et bibliothèque" color="moss" icon={SteamLogo} />

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Jeux possédés" value={data.stats.totalGames} icon={Gamepad2} color="green" />
        <StatCard label="Heures de jeu" value={data.stats.totalPlaytimeHours} icon={Clock} color="cyan" />
        <StatCard label="Jeux récents" value={data.stats.gamesPlayedRecently} icon={Trophy} color="yellow" />
      </div>

      <Suspense fallback={<SteamPlaytimeSkeleton />}>
        <SteamPlaytimeSection promise={playtimePromise} year={year} />
      </Suspense>

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

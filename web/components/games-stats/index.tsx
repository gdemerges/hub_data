'use client'

import { Clock, Star, Target, TrendingDown, TrendingUp, Trophy } from 'lucide-react'
import { gameHours, type GameStatsData } from '@/lib/media-stats'
import { BacklogList } from './backlog-list'
import { HoursByDecade } from './hours-by-decade'
import { KpiRow } from './kpi-row'
import { RankingBars } from './ranking-bars'
import { SagaList } from './saga-list'
import { StatusBreakdown } from './status-breakdown'
import { TopList } from './top-list'

interface GameStatsProps {
  stats: GameStatsData
}

export function GameStats({ stats }: GameStatsProps) {
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
  } = stats

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

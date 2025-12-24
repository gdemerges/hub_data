import { getGamesData } from '@/lib/data'
import { GamesClient } from '@/components/games-client'
import { Gamepad2 } from 'lucide-react'

export default async function GamesPage() {
  const games = await getGamesData()
  const platforms = Array.from(new Set(games.map((g) => g.platform).filter((p): p is string => !!p)))

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-accent-primary/10 rounded-xl">
          <Gamepad2 className="w-6 h-6 text-accent-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Jeux</h1>
          <p className="text-sm text-text-muted">{games.length} jeux dans votre collection</p>
        </div>
      </div>

      {/* Client Grid */}
      <GamesClient games={games} platforms={platforms} />
    </div>
  )
}

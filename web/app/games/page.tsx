import { getGamesData } from '@/lib/data'
import { GamesClient } from '@/components/games-client'
import { Gamepad2 } from 'lucide-react'

export default async function GamesPage() {
  const games = await getGamesData()
  
  // Extract all unique platforms, including from multi-platform games
  const platformSet = new Set<string>()
  games.forEach(game => {
    if (game.platforms && game.platforms.length > 0) {
      // Multi-platform game: add all platforms
      game.platforms.forEach(p => platformSet.add(p.platform))
    } else if (game.platform) {
      // Single-platform game: add the platform
      platformSet.add(game.platform)
    }
  })
  const platforms = Array.from(platformSet).sort()

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

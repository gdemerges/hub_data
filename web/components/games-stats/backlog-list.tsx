import Image from 'next/image'
import { Star } from 'lucide-react'
import { gameStatus } from '@/lib/media-stats'
import type { Game } from '@/lib/types'

export function BacklogList({ games }: { games: Game[] }) {
  if (!games.length) return null
  // Grouper par statut (Wishé / Jamais joué)
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

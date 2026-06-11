'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Layers, ChevronDown } from 'lucide-react'
import { gameHours, type SagaStats } from '@/lib/media-stats'
import type { Game } from '@/lib/types'

export function SagaList({ items }: { items: SagaStats[] }) {
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
            {selectedSaga.games.map((g: Game, idx: number) => (
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

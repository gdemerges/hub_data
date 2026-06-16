'use client'

import { AlertTriangle, Footprints } from 'lucide-react'
import { SectionCard } from '@/components'
import type { StravaShoe } from '@/lib/strava'

interface Props {
  shoes: StravaShoe[]
}

/** Seuil indicatif de remplacement d'une paire de chaussures de course. */
const SHOE_REPLACEMENT_KM = 700

export function SportShoes({ shoes }: Props) {
  if (!shoes || shoes.length === 0) return null

  // Paires actives d'abord (primaire puis km décroissants), retirées ensuite.
  const sorted = [...shoes].sort((a, b) => {
    if (a.retired !== b.retired) return a.retired ? 1 : -1
    if (a.primary !== b.primary) return a.primary ? -1 : 1
    return b.distanceKm - a.distanceKm
  })

  return (
    <SectionCard title="Chaussures" icon={Footprints} accent="terracotta">
      <ul className="space-y-3">
        {sorted.map((shoe) => {
          const wear = Math.min(shoe.distanceKm / SHOE_REPLACEMENT_KM, 1) * 100
          const over = shoe.distanceKm >= SHOE_REPLACEMENT_KM
          const warn = shoe.distanceKm >= SHOE_REPLACEMENT_KM * 0.8
          const barColor = over ? 'bg-earth-clay' : warn ? 'bg-earth-saffron' : 'bg-earth-moss'
          return (
            <li key={shoe.id} className={`tech-card-flat p-4 ${shoe.retired ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-text-primary truncate">
                    {shoe.name}
                  </span>
                  {shoe.primary && !shoe.retired && (
                    <span className="text-[9px] uppercase tracking-[0.14em] text-earth-terracotta font-mono shrink-0">
                      principale
                    </span>
                  )}
                  {shoe.retired && (
                    <span className="text-[9px] uppercase tracking-[0.14em] text-text-muted font-mono shrink-0">
                      retirée
                    </span>
                  )}
                </div>
                <span className="num text-sm text-text-primary shrink-0">
                  {Math.round(shoe.distanceKm)} km
                </span>
              </div>
              <div className="h-1.5 bg-bg-card rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} transition-all`}
                  style={{ width: `${wear}%` }}
                />
              </div>
              {over && !shoe.retired && (
                <p className="flex items-center gap-1.5 text-[11px] text-earth-clay mt-2">
                  <AlertTriangle className="w-3 h-3" strokeWidth={2} />
                  Au-delà de {SHOE_REPLACEMENT_KM} km — pense à les remplacer
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}

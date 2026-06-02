'use client'

import { Medal, Gauge, Route, Mountain } from 'lucide-react'
import { SectionCard } from '@/components'
import {
  computePersonalRecords,
  formatPace,
  formatRaceTime,
  type SportActivity,
} from '@/lib/sport'

interface Props {
  runs: SportActivity[]
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })

export function SportRecords({ runs }: Props) {
  const records = computePersonalRecords(runs)

  const hasRecords =
    records.efforts.length > 0 ||
    records.bestAvgPace !== null ||
    records.longestRun !== null ||
    records.biggestElevation !== null
  if (!hasRecords) return null

  return (
    <SectionCard title="Records personnels" icon={Medal} accent="saffron">
      {records.efforts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {records.efforts.map((e) => (
            <div key={e.distance} className="tech-card-flat p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">{e.label}</p>
                {e.estimated && (
                  <span
                    className="text-[9px] uppercase tracking-[0.14em] text-earth-saffron/80 font-mono"
                    title="Temps estimé via la formule de Riegel (pas de course exactement à cette distance)"
                  >
                    est.
                  </span>
                )}
              </div>
              <p className="font-display text-2xl tracking-tight num leading-none text-earth-saffron">
                {formatRaceTime(e.estimatedTime)}
              </p>
              <p className="text-[11px] text-text-muted mt-2 num">{shortDate(e.activity.startDate)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {records.bestAvgPace && (
          <RecordTile
            icon={Gauge}
            label="Meilleure allure moy."
            value={`${formatPace(60 / records.bestAvgPace.paceMinPerKm)}/km`}
            sub={`${records.bestAvgPace.activity.distance.toFixed(1)} km · ${shortDate(records.bestAvgPace.activity.startDate)}`}
            tone="fern"
          />
        )}
        {records.longestRun && (
          <RecordTile
            icon={Route}
            label="Plus longue sortie"
            value={`${records.longestRun.distance.toFixed(1)} km`}
            sub={shortDate(records.longestRun.startDate)}
            tone="terracotta"
          />
        )}
        {records.biggestElevation && records.biggestElevation.totalElevationGain > 0 && (
          <RecordTile
            icon={Mountain}
            label="Plus gros dénivelé"
            value={`+${Math.round(records.biggestElevation.totalElevationGain)} m`}
            sub={`${records.biggestElevation.distance.toFixed(1)} km · ${shortDate(records.biggestElevation.startDate)}`}
            tone="moss"
          />
        )}
      </div>
    </SectionCard>
  )
}

function RecordTile({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Gauge
  label: string
  value: string
  sub: string
  tone: 'fern' | 'moss' | 'terracotta'
}) {
  const toneClass = {
    fern: 'text-earth-fern',
    moss: 'text-earth-moss',
    terracotta: 'text-earth-terracotta',
  }[tone]
  return (
    <div className="tech-card-flat p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-3.5 h-3.5 ${toneClass}`} strokeWidth={1.75} />
        <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">{label}</p>
      </div>
      <p className={`font-display text-2xl tracking-tight num leading-none ${toneClass}`}>{value}</p>
      <p className="text-[11px] text-text-muted mt-2 num">{sub}</p>
    </div>
  )
}

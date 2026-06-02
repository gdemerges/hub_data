'use client'

import { ChartPie } from 'lucide-react'
import { PieChart, SectionCard } from '@/components'
import { paceDistribution, formatPace, type SportActivity } from '@/lib/sport'

interface Props {
  runs: SportActivity[]
}

export function SportTrainingDistribution({ runs }: Props) {
  const d = paceDistribution(runs)
  const total = d.easy + d.tempo + d.hard
  if (total === 0) return null

  const data = [
    { label: 'Facile', value: Math.round(d.easy), color: 'rgb(var(--dv-1))' },
    { label: 'Tempo', value: Math.round(d.tempo), color: 'rgb(var(--dv-3))' },
    { label: 'Intense', value: Math.round(d.hard), color: 'rgb(var(--dv-7))' },
  ]

  return (
    <SectionCard title="Répartition de l'entraînement" icon={ChartPie} accent="fern">
      <div className="max-w-sm mx-auto">
        <PieChart data={data} size={200} unit=" km" />
      </div>
      <p className="text-[11px] text-text-muted mt-4 text-center">
        Zones ancrées sur ton allure seuil estimée ({formatPace(60 / d.thresholdPace)}/km). Un bon
        volume en <span className="text-earth-moss">facile</span> et un peu d'
        <span className="text-earth-rust">intense</span> valent mieux que tout « au milieu ».
      </p>
    </SectionCard>
  )
}

'use client'

import { CalendarDays } from 'lucide-react'
import { ContributionCalendar, SectionCard } from '@/components'
import { runCalendar, type SportActivity } from '@/lib/sport'

interface Props {
  runs: SportActivity[]
  year: number
}

export function SportRunCalendar({ runs, year }: Props) {
  const days = runCalendar(runs, year)
  if (days.length === 0) return null

  return (
    <SectionCard title={`Régularité · ${year}`} icon={CalendarDays} accent="moss">
      <ContributionCalendar
        contributions={days}
        year={year}
        formatTooltip={(km, date) =>
          km > 0
            ? `${km} km le ${new Date(date).toLocaleDateString('fr-FR')}`
            : `Repos le ${new Date(date).toLocaleDateString('fr-FR')}`
        }
      />
    </SectionCard>
  )
}

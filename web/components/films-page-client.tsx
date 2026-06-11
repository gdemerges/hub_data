'use client'

import { ChartBar, FilmStrip } from '@phosphor-icons/react'
import { Suspense, useState } from 'react'
import { FilmsClient } from '@/components/films-client'
import { FilmsStats } from '@/components/films-stats'
import type { FilmStatsData } from '@/lib/media-stats'
import type { Film } from '@/lib/types'

interface FilmsPageClientProps {
  films: Film[]
  filmStats: FilmStatsData
}

type Tab = 'catalogue' | 'stats'

export function FilmsPageClient({ films, filmStats }: FilmsPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('catalogue')

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border-subtle">
        <TabButton
          active={activeTab === 'catalogue'}
          onClick={() => setActiveTab('catalogue')}
          icon={<FilmStrip className="w-4 h-4" weight="duotone" />}
          label="Catalogue"
        />
        <TabButton
          active={activeTab === 'stats'}
          onClick={() => setActiveTab('stats')}
          icon={<ChartBar className="w-4 h-4" weight="duotone" />}
          label="Statistiques"
        />
      </div>

      {activeTab === 'catalogue' && (
        <Suspense>
          <FilmsClient films={films} />
        </Suspense>
      )}

      {activeTab === 'stats' && <FilmsStats stats={filmStats} />}
    </>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
        active
          ? 'text-earth-terracotta border-earth-terracotta'
          : 'text-text-secondary border-transparent hover:text-text-primary'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

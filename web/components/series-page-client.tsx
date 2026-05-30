'use client'

import { ChartBar, Television } from '@phosphor-icons/react'
import { Suspense, useState } from 'react'
import { SeriesClient } from '@/components/series-client'
import { SeriesStats } from '@/components/series-stats'
import type { Series } from '@/lib/types'

interface SeriesPageClientProps {
  series: Series[]
}

type Tab = 'catalogue' | 'stats'

export function SeriesPageClient({ series }: SeriesPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('catalogue')

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border-subtle">
        <TabButton
          active={activeTab === 'catalogue'}
          onClick={() => setActiveTab('catalogue')}
          icon={<Television className="w-4 h-4" weight="duotone" />}
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
          <SeriesClient series={series} />
        </Suspense>
      )}

      {activeTab === 'stats' && <SeriesStats series={series} />}
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
          ? 'text-earth-saffron border-earth-saffron'
          : 'text-text-secondary border-transparent hover:text-text-primary'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

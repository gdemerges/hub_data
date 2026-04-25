import { Suspense } from 'react'
import { Television } from '@phosphor-icons/react/dist/ssr'
import { getSeriesData } from '@/lib/data'
import { SeriesClient } from '@/components/series-client'
import { PageHeader } from '@/components'

export const revalidate = 3600

export default async function SeriesPage() {
  const series = await getSeriesData()

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="Séries"
        subtitle={`${series.length} séries suivies`}
        color="saffron"
        icon={Television}
      />
      <Suspense>
        <SeriesClient series={series} />
      </Suspense>
    </div>
  )
}

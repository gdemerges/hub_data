import { getSeriesData } from '@/lib/data'
import { SeriesClient } from '@/components/series-client'
import { PageHeader } from '@/components'

export default async function SeriesPage() {
  const series = await getSeriesData()

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="SERIES"
        systemName="SYSTEM"
        statusDetail="TV_TRACKER v1.0"
        loadingMessage={`Loading ${series.length} series from collection...`}
        color="neon-yellow"
      />
      <SeriesClient series={series} />
    </div>
  )
}

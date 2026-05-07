import { Suspense } from 'react'
import { PersonSimpleRun } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components'
import { SportClient, SportSkeleton, isActivityFilter } from '@/components/sport-client'
import { loadStrava } from '@/lib/strava'

export const revalidate = 3600

export default async function SportPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; year?: string }>
}) {
  const { filter: filterParam, year: yearParam } = await searchParams
  const filter = isActivityFilter(filterParam) ? filterParam : 'Run'
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()

  const promise = loadStrava()

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="Sport"
        subtitle="Statistiques Strava"
        color="rust"
        icon={PersonSimpleRun}
      />
      <Suspense fallback={<SportSkeleton />}>
        <SportClient promise={promise} filter={filter} year={year} />
      </Suspense>
    </div>
  )
}

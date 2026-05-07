'use client'

import dynamic from 'next/dynamic'

const WorldMap = dynamic(() => import('@/components/world-map').then((m) => m.WorldMap), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-bg-card rounded-2xl border border-border-subtle animate-pulse" />
  ),
})

export function WorldMapClient({ visitedCountries }: { visitedCountries: string[] }) {
  return <WorldMap visitedCountries={visitedCountries} />
}

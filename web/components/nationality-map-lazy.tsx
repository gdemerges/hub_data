'use client'

import dynamic from 'next/dynamic'

export const NationalityMapLazy = dynamic(
  () => import('./nationality-map').then((m) => m.NationalityMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] bg-bg-card rounded-2xl border border-border-subtle animate-pulse" />
    ),
  }
)

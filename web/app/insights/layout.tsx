import type { ReactNode } from 'react'

// Les pages Insights sont des Client Components et ne peuvent pas exporter
// `metadata` ; ce layout de segment porte le titre pour toute la section.
export const metadata = { title: 'Insights' }

export default function InsightsLayout({ children }: { children: ReactNode }) {
  return children
}

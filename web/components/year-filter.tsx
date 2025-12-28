'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar } from 'lucide-react'

export function YearFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentYear = searchParams.get('year') || 'global'

  // Generate list of years from 2000 to current year
  const years = ['global']
  const now = new Date().getFullYear()
  for (let year = now; year >= 2000; year--) {
    years.push(year.toString())
  }

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (year === 'global') {
      params.delete('year')
    } else {
      params.set('year', year)
    }
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-text-secondary">
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">Année :</span>
      </div>
      <select
        value={currentYear}
        onChange={(e) => handleYearChange(e.target.value)}
        className="bg-bg-card border border-border-subtle rounded-lg px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary transition-all"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year === 'global' ? 'Global' : year}
          </option>
        ))}
      </select>
    </div>
  )
}

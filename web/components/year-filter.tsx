'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export function YearFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentYear = searchParams.get('year') || 'global'

  const now = new Date().getFullYear()
  const years = ['global']
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
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-earth-fern">
        <Calendar className="w-4 h-4" />
        <span className="text-[11px] font-medium uppercase tracking-[0.18em]">Année</span>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {years.slice(0, 8).map((year) => {
          const isActive = currentYear === year
          return (
            <button
              key={year}
              onClick={() => handleYearChange(year)}
              className={cn(
                'px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] rounded-lg border transition-all duration-300 whitespace-nowrap',
                isActive
                  ? 'bg-earth-fern/15 border-earth-fern/50 text-earth-fern shadow-[0_0_10px_rgba(0,255,255,0.15)]'
                  : 'border-border-subtle text-text-secondary hover:text-earth-fern hover:border-earth-fern/30 hover:bg-earth-fern/5'
              )}
            >
              {year === 'global' ? 'Global' : year}
            </button>
          )
        })}
        {/* Dropdown for older years */}
        <select
          value={years.slice(8).includes(currentYear) ? currentYear : ''}
          onChange={(e) => {
            if (e.target.value) handleYearChange(e.target.value)
          }}
          className={cn(
            'px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] rounded-lg border transition-all duration-300 bg-transparent appearance-none cursor-pointer',
            years.slice(8).includes(currentYear)
              ? 'bg-earth-fern/15 border-earth-fern/50 text-earth-fern'
              : 'border-border-subtle text-text-secondary hover:text-earth-fern hover:border-earth-fern/30'
          )}
        >
          <option value="" className="bg-bg-primary text-text-secondary">
            {years.slice(8).includes(currentYear) ? currentYear : '...'}
          </option>
          {years.slice(8).map((year) => (
            <option key={year} value={year} className="bg-bg-primary text-text-secondary">
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

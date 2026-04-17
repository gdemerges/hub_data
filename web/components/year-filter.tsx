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
      <div className="flex items-center gap-2 text-neon-cyan">
        <Calendar className="w-4 h-4" />
        <span className="text-xs font-mono uppercase tracking-wider">Année</span>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {years.slice(0, 8).map((year) => {
          const isActive = currentYear === year
          return (
            <button
              key={year}
              onClick={() => handleYearChange(year)}
              className={cn(
                'px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-lg border transition-all duration-300 whitespace-nowrap',
                isActive
                  ? 'bg-neon-cyan/15 border-neon-cyan/50 text-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.15)]'
                  : 'border-border-subtle text-text-secondary hover:text-neon-cyan hover:border-neon-cyan/30 hover:bg-neon-cyan/5'
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
            'px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-lg border transition-all duration-300 bg-transparent appearance-none cursor-pointer',
            years.slice(8).includes(currentYear)
              ? 'bg-neon-cyan/15 border-neon-cyan/50 text-neon-cyan'
              : 'border-border-subtle text-text-secondary hover:text-neon-cyan hover:border-neon-cyan/30'
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

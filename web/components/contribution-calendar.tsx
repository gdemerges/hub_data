'use client'

import { useMemo } from 'react'

interface ContributionDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

interface ContributionCalendarProps {
  contributions: ContributionDay[]
  year?: number
  formatTooltip?: (count: number, date: string) => string
}

export function ContributionCalendar({
  contributions,
  year,
  formatTooltip = (count, date) => `${count} contributions le ${new Date(date).toLocaleDateString('fr-FR')}`
}: ContributionCalendarProps) {
  const { weeks, months } = useMemo(() => {
    // Use provided year or current year
    const targetYear = year || new Date().getFullYear()

    // Start from January 1st of the target year
    const startOfYear = new Date(targetYear, 0, 1)

    // Start from the first Sunday before or on January 1st
    const startDate = new Date(startOfYear)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    // End at December 31st of the target year
    const endOfYear = new Date(targetYear, 11, 31)

    // Create a map of contributions by date
    const contributionMap = new Map(
      contributions.map(c => [c.date, c])
    )

    // Build weeks array (each week has 7 days)
    const weeks: ContributionDay[][] = []
    let currentWeek: ContributionDay[] = []
    let currentDate = new Date(startDate)

    // Track months for labels - only at the start of each month
    const monthsArray: { name: string; weekIndex: number }[] = []
    let lastMonth = -1

    while (currentDate <= endOfYear) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const contribution = contributionMap.get(dateStr)

      currentWeek.push({
        date: dateStr,
        count: contribution?.count || 0,
        level: contribution?.level || 0,
      })

      // Track month changes - only when we start a new week and it's a new month
      if (currentWeek.length === 1) {
        const currentMonth = currentDate.getMonth()
        if (currentMonth !== lastMonth) {
          const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'short' })
          monthsArray.push({
            name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            weekIndex: weeks.length,
          })
          lastMonth = currentMonth
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)

      // If we completed a week (7 days), start a new one
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    // Add remaining days if any
    if (currentWeek.length > 0) {
      // Pad the last week with empty days
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: '',
          count: 0,
          level: 0,
        })
      }
      weeks.push(currentWeek)
    }

    return {
      weeks,
      months: monthsArray,
    }
  }, [contributions, year])

  const getColor = (level: number) => {
    const colors = {
      0: 'bg-bg-tertiary',
      1: 'bg-green-900/30',
      2: 'bg-green-700/50',
      3: 'bg-green-600/70',
      4: 'bg-green-500',
    }
    return colors[level as keyof typeof colors] || colors[0]
  }

  const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  // Calculate responsive cell size based on number of weeks
  const cellSize = `calc((100% - ${weeks.length - 1} * 0.25rem) / ${weeks.length})`
  const cellHeight = '0.75rem' // 12px

  return (
    <div className="w-full">
      <div className="w-full">
        {/* Month labels */}
        <div className="relative mb-2 ml-12 h-4">
          <div className="flex justify-between">
            {months.map((month, i) => (
              <div
                key={i}
                className="text-xs text-text-muted font-mono"
                style={{
                  position: 'absolute',
                  left: `${(month.weekIndex / weeks.length) * 100}%`,
                }}
              >
                {month.name}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 text-xs text-text-muted pt-1 w-10 shrink-0">
            {dayLabels.map((day, i) => (
              <div
                key={day}
                className="flex items-center font-mono"
                style={{
                  height: cellHeight,
                  opacity: i % 2 === 0 ? 0 : 1
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Contribution grid */}
          <div className="flex gap-1 flex-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1 flex-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`rounded-sm ${
                      day.date ? getColor(day.level) : 'bg-transparent'
                    } transition-colors hover:ring-2 hover:ring-neon-green cursor-pointer`}
                    style={{
                      width: '100%',
                      height: cellHeight,
                      minHeight: cellHeight,
                    }}
                    title={day.date ? formatTooltip(day.count, day.date) : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-text-muted justify-end font-mono">
          <span>Moins</span>
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm ${getColor(level)}`}
            />
          ))}
          <span>Plus</span>
        </div>
      </div>
    </div>
  )
}

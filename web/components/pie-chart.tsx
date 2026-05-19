'use client'

import { themedColor } from '@/lib/chart'
import { EmptyState } from './empty-state'

interface PieChartData {
  label: string
  value: number
  color: string
}

interface PieChartProps {
  data: PieChartData[]
  size?: number
  onSliceClick?: (label: string) => void
  selectedLabel?: string
  unit?: string
}

export function PieChart({ data, size = 200, onSliceClick, selectedLabel, unit = 'h' }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <EmptyState />
      </div>
    )
  }

  let currentAngle = -90 // départ en haut

  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100
    const angle = (item.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const radius = size / 2 - 10
    const centerX = size / 2
    const centerY = size / 2

    const x1 = centerX + radius * Math.cos(startRad)
    const y1 = centerY + radius * Math.sin(startRad)
    const x2 = centerX + radius * Math.cos(endRad)
    const y2 = centerY + radius * Math.sin(endRad)

    const largeArc = angle > 180 ? 1 : 0

    const path = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ')

    return { ...item, fill: themedColor(item.color, index), path, percentage }
  })

  return (
    <div className="flex flex-col gap-4">
      <svg width={size} height={size} className="mx-auto" role="img" aria-label="Graphique circulaire">
        {slices.map((slice, index) => {
          const isSelected = selectedLabel === slice.label
          const isOtherSelected = selectedLabel && selectedLabel !== slice.label
          return (
            <g
              key={index}
              role="listitem"
              aria-label={`${slice.label}: ${slice.value}${unit} (${slice.percentage.toFixed(1)}%)`}
            >
              <path
                d={slice.path}
                fill={slice.fill}
                stroke="rgb(var(--bg-card))"
                strokeWidth="1.5"
                strokeLinejoin="round"
                className={`chart-pop cursor-pointer transition-opacity duration-300 ${
                  isOtherSelected ? 'opacity-30' : isSelected ? 'opacity-100' : 'opacity-90 hover:opacity-100'
                }`}
                style={{ ['--i' as string]: index }}
                onClick={() => onSliceClick?.(slice.label)}
              />
            </g>
          )
        })}
      </svg>

      <div className="space-y-2">
        {slices.map((slice, index) => {
          const percentage = slice.percentage.toFixed(1)
          const isSelected = selectedLabel === slice.label
          const isOtherSelected = selectedLabel && selectedLabel !== slice.label
          return (
            <div
              key={index}
              className={`flex items-center justify-between text-sm cursor-pointer p-2 rounded-lg transition-all ${
                isSelected
                  ? 'bg-accent-primary/10 border border-accent-primary/30'
                  : isOtherSelected
                  ? 'opacity-40'
                  : 'hover:bg-bg-tertiary'
              }`}
              onClick={() => onSliceClick?.(slice.label)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: slice.fill }}
                />
                <span
                  className={`truncate ${
                    isSelected ? 'text-text-primary font-semibold' : 'text-text-secondary'
                  }`}
                >
                  {slice.label}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-text-primary font-semibold num">
                  {slice.value}
                  {unit}
                </span>
                <span className="text-text-muted text-xs num">({percentage}%)</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

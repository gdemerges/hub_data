'use client'

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
        <p className="text-sm text-text-muted">Aucune donnée</p>
      </div>
    )
  }

  let currentAngle = -90 // Start from top

  const slices = data.map((item) => {
    const percentage = (item.value / total) * 100
    const angle = (item.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    // Calculate path for the pie slice
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

    return {
      ...item,
      path,
      percentage,
    }
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Pie chart */}
      <svg width={size} height={size} className="mx-auto">
        {slices.map((slice, index) => {
          const isSelected = selectedLabel === slice.label
          const isOtherSelected = selectedLabel && selectedLabel !== slice.label
          return (
            <g key={index}>
              <path
                d={slice.path}
                fill={slice.color}
                className={`transition-all cursor-pointer ${
                  isOtherSelected ? 'opacity-30' : isSelected ? 'opacity-100' : 'opacity-90 hover:opacity-100'
                }`}
                onClick={() => onSliceClick?.(slice.label)}
              />
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="space-y-2">
        {data.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1)
          const isSelected = selectedLabel === item.label
          const isOtherSelected = selectedLabel && selectedLabel !== item.label
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
              onClick={() => onSliceClick?.(item.label)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className={`${isSelected ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-primary font-semibold">{item.value}{unit}</span>
                <span className="text-text-muted text-xs">({percentage}%)</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'

interface BarChartProps {
  data: { year: number; contributions: number }[]
  height?: number
}

export function BarChart({ data, height = 300 }: BarChartProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        Aucune donnée disponible
      </div>
    )
  }

  const maxContributions = Math.max(...data.map(d => d.contributions))
  const padding = 40
  const chartWidth = Math.max(600, data.length * 50)
  const barWidth = Math.max(30, (chartWidth - padding * 2) / data.length - 10)

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={chartWidth}
        height={height + padding * 2}
        className="mx-auto"
      >
        {/* Y-axis grid lines and labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = padding + (height - height * fraction)
          const value = Math.round(maxContributions * fraction)
          return (
            <g key={fraction}>
              <line
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.1"
                className="text-border-subtle"
              />
              <text
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="currentColor"
                className="text-text-muted"
              >
                {value}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const x = padding + index * (barWidth + 10)
          const barHeight = (item.contributions / maxContributions) * height
          const y = padding + (height - barHeight)
          const isHovered = hoveredBar === index

          return (
            <g
              key={item.year}
              onMouseEnter={() => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
              className="cursor-pointer transition-opacity"
            >
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="url(#gradient)"
                opacity={isHovered ? 1 : 0.8}
                rx="4"
                className="transition-all"
              />

              {/* Year label */}
              <text
                x={x + barWidth / 2}
                y={height + padding + 20}
                textAnchor="middle"
                fontSize="12"
                fill="currentColor"
                className={isHovered ? 'text-text-primary font-semibold' : 'text-text-muted'}
              >
                {item.year}
              </text>

              {/* Value on hover */}
              {isHovered && (
                <>
                  <rect
                    x={x + barWidth / 2 - 30}
                    y={y - 30}
                    width="60"
                    height="24"
                    fill="currentColor"
                    className="text-bg-card"
                    rx="4"
                    opacity="0.95"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 13}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="bold"
                    fill="currentColor"
                    className="text-accent-primary"
                  >
                    {item.contributions}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

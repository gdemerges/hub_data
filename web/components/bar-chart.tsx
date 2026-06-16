'use client'

import { useId, useState } from 'react'
import { ChartTooltip } from './chart-tooltip'
import { EmptyState } from './empty-state'

interface BarChartProps {
  data: { year: number; contributions: number }[]
  height?: number
}

export function BarChart({ data, height = 300 }: BarChartProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const gradientId = useId()

  if (!data || data.length === 0) {
    return <EmptyState description="Aucune contribution à afficher pour cette période." />
  }

  const maxContributions = Math.max(...data.map((d) => d.contributions), 1)
  const padding = 40
  const chartWidth = Math.max(600, data.length * 50)
  const barWidth = Math.max(30, (chartWidth - padding * 2) / data.length - 10)
  const baseline = padding + height

  const hovered = hoveredBar !== null ? data[hoveredBar] : null
  const hoveredX = hoveredBar !== null ? padding + hoveredBar * (barWidth + 10) + barWidth / 2 : 0
  const hoveredY =
    hovered !== null ? padding + (height - (hovered.contributions / maxContributions) * height) : 0

  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <div className="relative mx-auto" style={{ width: chartWidth }}>
        <svg
          width={chartWidth}
          height={height + padding * 2}
          role="img"
          aria-label="Graphique en barres des contributions par année"
        >
          {/* Lignes de grille + libellés Y */}
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
                  stroke="rgb(var(--dv-grid))"
                  strokeWidth="1"
                  opacity="0.5"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="rgb(var(--dv-axis))"
                  className="num"
                >
                  {value}
                </text>
              </g>
            )
          })}

          {/* Axe de base */}
          <line
            x1={padding}
            y1={baseline}
            x2={chartWidth - padding}
            y2={baseline}
            stroke="rgb(var(--dv-axis))"
            strokeWidth="1.5"
            opacity="0.6"
          />

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
                className="cursor-pointer"
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={`url(#${gradientId})`}
                  opacity={hoveredBar === null || isHovered ? 1 : 0.45}
                  rx="5"
                  className="chart-bar-enter transition-opacity duration-300"
                  style={{ ['--i' as string]: index }}
                />
                <text
                  x={x + barWidth / 2}
                  y={baseline + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill={isHovered ? 'rgb(var(--text-primary))' : 'rgb(var(--dv-axis))'}
                  fontWeight={isHovered ? 600 : 400}
                  className="num transition-colors"
                >
                  {item.year}
                </text>
              </g>
            )
          })}

          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.75" />
              <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>

        <ChartTooltip x={hoveredX} y={hoveredY} show={hovered !== null}>
          {hovered && (
            <>
              <span className="text-text-muted">{hovered.year}</span>{' '}
              <span className="text-accent-primary font-semibold">{hovered.contributions}</span>
            </>
          )}
        </ChartTooltip>
      </div>
    </div>
  )
}

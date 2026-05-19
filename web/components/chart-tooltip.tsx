'use client'

interface ChartTooltipProps {
  /** Position en px relative au conteneur `relative` parent. */
  x: number
  y: number
  show: boolean
  children: React.ReactNode
}

/** Tooltip flottant partagé par les charts custom (bar/pie/...). */
export function ChartTooltip({ x, y, show, children }: ChartTooltipProps) {
  if (!show) return null
  return (
    <div className="chart-tooltip" style={{ left: x, top: y }} role="status">
      {children}
    </div>
  )
}

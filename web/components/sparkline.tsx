'use client'

import { useId } from 'react'

interface SparklineProps {
  /** Série de valeurs (ordre chronologique). */
  data: number[]
  /** Triplet RGB de l'accent, ex. "90 125 74". */
  accent: string
  /** Hauteur en px (la largeur s'étire à 100%). */
  height?: number
  className?: string
}

/**
 * Mini-courbe de tendance — pas d'axes, pas de labels. Donne le contexte
 * temporel d'un chiffre (StatCard) sans page dédiée. Le tracé s'anime via
 * `chart-line-draw` ; remplissage dégradé léger sous la ligne.
 */
export function Sparkline({ data, accent, height = 32, className }: SparklineProps) {
  const gradientId = useId()

  if (data.length < 2) return null

  const W = 100
  const H = height
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const dx = W / (data.length - 1)

  // Marge verticale pour ne pas coller la ligne aux bords.
  const pad = 3
  const y = (v: number) => H - pad - ((v - min) / span) * (H - pad * 2)

  const points = data.map((v, i) => `${(i * dx).toFixed(2)},${y(v).toFixed(2)}`)
  const line = points.join(' ')
  const area = `0,${H} ${line} ${W},${H}`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label={`Tendance : de ${data[0]} à ${data[data.length - 1]}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgb(${accent} / 0.22)`} />
          <stop offset="100%" stopColor={`rgb(${accent} / 0)`} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradientId})`} />
      <polyline
        points={line}
        fill="none"
        stroke={`rgb(${accent})`}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        className="chart-line-draw"
      />
    </svg>
  )
}

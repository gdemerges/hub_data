'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, User } from 'lucide-react'

interface RadarDataPoint {
  category: string
  value: number
  rawValue: number
  unit: string
}

interface ProfileData {
  year: number
  radarData: RadarDataPoint[]
  summary: {
    gamingHours: number
    filmsCount: number
    seriesCount: number
    runDistance: number
    contributions: number
    partnersCount: number
  }
}

function SvgRadarChart({ data }: { data: RadarDataPoint[] }) {
  const [hovered, setHovered] = useState<RadarDataPoint | null>(null)
  const size = 280
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.36
  const n = data.length
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0]

  const angleOf = (i: number) => (i * 2 * Math.PI) / n - Math.PI / 2
  const pointAt = (i: number, r: number) => ({
    x: cx + r * Math.cos(angleOf(i)),
    y: cy + r * Math.sin(angleOf(i)),
  })

  const toPoints = (pts: { x: number; y: number }[]) =>
    pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')

  const gridPolygons = levels.map(level =>
    toPoints(data.map((_, i) => pointAt(i, maxR * level)))
  )
  const dataPoints = data.map((d, i) => pointAt(i, maxR * (d.value / 100)))
  const dataPolygon = toPoints(dataPoints)

  return (
    <div className="relative flex justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        aria-label="Radar chart du profil"
      >
        {/* Concentric grid polygons */}
        {gridPolygons.map((pts, li) => (
          <polygon
            key={li}
            points={pts}
            fill="none"
            stroke="#2d2d3d"
            strokeWidth="1"
            strokeDasharray={li === 4 ? undefined : '3 3'}
          />
        ))}

        {/* Axis lines */}
        {data.map((_, i) => {
          const outer = pointAt(i, maxR)
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={outer.x} y2={outer.y}
              stroke="#2d2d3d"
              strokeWidth="1"
            />
          )
        })}

        {/* Filled data polygon */}
        <polygon
          points={dataPolygon}
          fill="#00ffff"
          fillOpacity="0.25"
          stroke="#00ffff"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Interactive data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={5}
            fill="#00ffff"
            stroke="#00000080"
            strokeWidth="1"
            className="cursor-pointer"
            onMouseEnter={() => setHovered(data[i])}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* Axis labels */}
        {data.map((d, i) => {
          const pt = pointAt(i, maxR + 22)
          return (
            <text
              key={i}
              x={pt.x} y={pt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              fill="#9898a8"
            >
              {d.category}
            </text>
          )
        })}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div className="absolute top-0 right-0 bg-bg-card border border-neon-cyan/30 rounded-lg px-3 py-2 shadow-lg pointer-events-none">
          <p className="text-sm font-mono text-neon-cyan">{hovered.category}</p>
          <p className="text-xs text-text-secondary">{hovered.rawValue}{hovered.unit}</p>
        </div>
      )}
    </div>
  )
}

export function ProfileRadar() {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const response = await fetch(`/api/profile?year=${selectedYear}`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (err) {
        console.error('Failed to load profile data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedYear])

  if (loading) {
    return (
      <div className="tech-card p-6 h-96 flex items-center justify-center">
        <div className="text-sm text-text-muted font-mono animate-pulse">
          Chargement du profil...
        </div>
      </div>
    )
  }

  return (
    <div className="tech-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
            <User className="w-5 h-5 text-neon-cyan" />
          </div>
          <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Profile_Radar
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="p-1 hover:bg-neon-cyan/10 rounded transition-colors"
            aria-label="Année précédente"
          >
            <ChevronLeft className="w-4 h-4 text-neon-cyan" />
          </button>
          <span className="text-sm font-mono font-medium text-neon-cyan min-w-[4rem] text-center">
            {selectedYear}
          </span>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            disabled={selectedYear >= new Date().getFullYear()}
            className="p-1 hover:bg-neon-cyan/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Année suivante"
          >
            <ChevronRight className="w-4 h-4 text-neon-cyan" />
          </button>
        </div>
      </div>

      {data && (
        <>
          <div className="h-72 flex items-center justify-center">
            <SvgRadarChart data={data.radarData} />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border-subtle">
            <div className="text-center">
              <p className="text-lg font-mono font-bold text-neon-green">
                {data.summary.gamingHours}h
              </p>
              <p className="text-xs text-text-muted font-mono">Gaming</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-mono font-bold text-neon-magenta">
                {data.summary.filmsCount}
              </p>
              <p className="text-xs text-text-muted font-mono">Films</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-mono font-bold text-neon-orange">
                {data.summary.runDistance} km
              </p>
              <p className="text-xs text-text-muted font-mono">Course</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

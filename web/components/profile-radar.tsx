'use client'

import { useState, useEffect } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-bg-card border border-neon-cyan/30 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-mono text-neon-cyan">{data.category}</p>
          <p className="text-xs text-text-secondary">
            {data.rawValue}{data.unit}
          </p>
        </div>
      )
    }
    return null
  }

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

        {/* Year selector */}
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
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.radarData}>
                <PolarGrid
                  stroke="#2d2d3d"
                  strokeDasharray="3 3"
                />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{
                    fill: '#9898a8',
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Profil"
                  dataKey="value"
                  stroke="#00ffff"
                  fill="#00ffff"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary stats */}
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

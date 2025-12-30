'use client'

import { useState, useEffect } from 'react'
import { Terminal, Heart, MapPin, Globe, Calendar, TrendingUp, Users } from 'lucide-react'
import { StatCard, BarChart, PieChart } from '@/components'

interface RencontresStats {
  total: number
  villes: { ville: string; count: number }[]
  nationalites: { nationalite: string; count: number }[]
  parAnnee: { annee: number; count: number }[]
  parAnneeNaissance: { annee: number; count: number }[]
}

export default function RencontresPage() {
  const [stats, setStats] = useState<RencontresStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/rencontres')
        if (response.ok) {
          const data = await response.json()
          if (data.hasData) {
            setStats(data.stats)
            setHasData(true)
          } else {
            setHasData(false)
          }
        } else {
          setHasData(false)
        }
      } catch (err) {
        setHasData(false)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-bg-card border border-neon-red/30 rounded-lg">
              <Terminal className="w-8 h-8 text-neon-red" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
                <span className="text-neon-red">RENCONTRES</span>_SYSTEM
              </h1>
              <p className="text-xs font-mono text-neon-cyan/70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
                STATUS: LOADING // SOCIAL_TRACKER v1.0
              </p>
            </div>
          </div>
          <div className="font-mono text-sm text-text-secondary border-l-2 border-neon-red/30 pl-4">
            &gt; Initializing social data...
            <span className="text-neon-red animate-pulse">_</span>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-bg-card rounded-2xl border border-border-subtle" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-bg-card rounded-2xl border border-border-subtle" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!hasData || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-bg-card border border-neon-red/30 rounded-lg">
              <Terminal className="w-8 h-8 text-neon-red" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
                <span className="text-neon-red">RENCONTRES</span>_SYSTEM
              </h1>
              <p className="text-xs font-mono text-neon-cyan/70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
                STATUS: NO_DATA // SOCIAL_TRACKER v1.0
              </p>
            </div>
          </div>
        </div>
        <div className="tech-card p-8 border-neon-red/30">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neon-red/10 border border-neon-red/30 flex items-center justify-center">
              <Heart className="w-10 h-10 text-neon-red" />
            </div>
            <h2 className="text-xl font-display font-bold text-text-primary mb-4 tracking-wider">
              NO_DATA_FOUND
            </h2>
            <p className="text-text-secondary font-mono text-sm">
              Le fichier partners.csv est introuvable ou vide.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const villeColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#84cc16']
  const villeChartData = stats.villes.slice(0, 8).map((item, index) => ({
    label: item.ville,
    value: item.count,
    color: villeColors[index % villeColors.length],
  }))

  const nationaliteColors = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#06b6d4', '#f97316']
  const nationaliteChartData = stats.nationalites.slice(0, 8).map((item, index) => ({
    label: item.nationalite,
    value: item.count,
    color: nationaliteColors[index % nationaliteColors.length],
  }))

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-bg-card border border-neon-red/30 rounded-lg">
            <Terminal className="w-8 h-8 text-neon-red" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
              <span className="text-neon-red">RENCONTRES</span>_SYSTEM
            </h1>
            <p className="text-xs font-mono text-neon-cyan/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
              STATUS: ONLINE // SOCIAL_TRACKER v1.0
            </p>
          </div>
        </div>
        <div className="font-mono text-sm text-text-secondary border-l-2 border-neon-red/30 pl-4">
          &gt; Analyzing {stats.total} encounters...
          <span className="text-neon-red animate-pulse">_</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={stats.total} icon={Heart} color="red" />
        <StatCard label="Villes" value={stats.villes.length} icon={MapPin} color="cyan" />
        <StatCard label="Nationalités" value={stats.nationalites.length} icon={Globe} color="magenta" />
        <StatCard label="Années" value={stats.parAnnee.length} icon={Calendar} color="green" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Villes */}
        <div className="tech-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
              <MapPin className="w-5 h-5 text-neon-cyan" />
            </div>
            <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
              Villes
            </h3>
          </div>
          <div className="flex flex-col items-center">
            <PieChart data={villeChartData} size={300} />
          </div>
        </div>

        {/* Nationalités */}
        <div className="tech-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neon-magenta/10 border border-neon-magenta/30 rounded">
              <Globe className="w-5 h-5 text-neon-magenta" />
            </div>
            <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
              Nationalités
            </h3>
          </div>
          <div className="flex flex-col items-center">
            <PieChart data={nationaliteChartData} size={300} />
          </div>
        </div>
      </div>

      {/* Timeline Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Par Année */}
        <div className="tech-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neon-green/10 border border-neon-green/30 rounded">
              <TrendingUp className="w-5 h-5 text-neon-green" />
            </div>
            <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
              Par_Année
            </h3>
          </div>
          <div className="flex items-end justify-between gap-2 h-48">
            {stats.parAnnee.map((item) => {
              const maxCount = Math.max(...stats.parAnnee.map(y => y.count))
              const height = (item.count / maxCount) * 100
              return (
                <div key={item.annee} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                  <div className="relative w-full" style={{ height: `${height}%`, minHeight: item.count > 0 ? '20px' : '0' }}>
                    {item.count > 0 && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-xs font-mono font-bold text-neon-green mb-1">
                        {item.count}
                      </span>
                    )}
                    <div
                      className="w-full h-full bg-gradient-to-t from-neon-green/50 to-neon-green rounded-t transition-all hover:from-neon-green/70 hover:to-neon-green cursor-pointer"
                      title={`${item.annee}: ${item.count} rencontres`}
                    />
                  </div>
                  <span className="text-xs font-mono text-text-muted shrink-0">
                    {item.annee.toString().slice(-2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Par Année de Naissance */}
        <div className="tech-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neon-yellow/10 border border-neon-yellow/30 rounded">
              <Calendar className="w-5 h-5 text-neon-yellow" />
            </div>
            <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
              Par_Année_Naissance
            </h3>
          </div>
          <div className="flex items-end justify-between gap-1 h-48 overflow-x-auto">
            {stats.parAnneeNaissance.map((item) => {
              const maxCount = Math.max(...stats.parAnneeNaissance.map(y => y.count))
              const height = (item.count / maxCount) * 100
              return (
                <div key={item.annee} className="flex-1 flex flex-col items-center justify-end h-full gap-2 min-w-[20px]">
                  <div className="relative w-full" style={{ height: `${height}%`, minHeight: item.count > 0 ? '20px' : '0' }}>
                    {item.count > 0 && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[10px] font-mono font-bold text-neon-yellow mb-1">
                        {item.count}
                      </span>
                    )}
                    <div
                      className="w-full h-full bg-gradient-to-t from-neon-yellow/50 to-neon-yellow rounded-t transition-all hover:from-neon-yellow/70 hover:to-neon-yellow cursor-pointer"
                      title={`${item.annee}: ${item.count} personnes`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-text-muted shrink-0">
                    {item.annee}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

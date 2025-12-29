'use client'

import { useState, useEffect } from 'react'
import { Terminal, MapPin, Globe, Calendar, Upload, Plane, Building2, TrendingUp } from 'lucide-react'
import { StatCard, WorldMap } from '@/components'

interface PlaceVisit {
  name: string
  address: string
  latitude: number
  longitude: number
  startTime: string
  endTime: string
  duration: number // in minutes
  category?: string
}

interface TravelStats {
  totalPlaces: number
  totalCountries: number
  totalCities: number
  totalDays: number
  topPlaces: { name: string; visits: number; city?: string }[]
  topCities: { name: string; visits: number; country?: string }[]
  topCountries: { name: string; visits: number }[]
  visitsByYear: { year: number; visits: number }[]
}

export default function VoyagesPage() {
  const [stats, setStats] = useState<TravelStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/voyages')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
          setHasData(true)
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
            <div className="p-3 bg-bg-card border border-neon-orange/30 rounded-lg">
              <Terminal className="w-8 h-8 text-neon-orange" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
                <span className="text-neon-orange">TRAVEL</span>_SYSTEM
              </h1>
              <p className="text-xs font-mono text-neon-cyan/70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
                STATUS: LOADING // LOCATION_TRACKER v1.0
              </p>
            </div>
          </div>
          <div className="font-mono text-sm text-text-secondary border-l-2 border-neon-orange/30 pl-4">
            &gt; Initializing travel data...
            <span className="text-neon-orange animate-pulse">_</span>
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-bg-card border border-neon-orange/30 rounded-lg">
            <Terminal className="w-8 h-8 text-neon-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
              <span className="text-neon-orange">TRAVEL</span>_SYSTEM
            </h1>
            <p className="text-xs font-mono text-neon-cyan/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
              STATUS: ONLINE // LOCATION_TRACKER v1.0
            </p>
          </div>
        </div>
        <div className="font-mono text-sm text-text-secondary border-l-2 border-neon-orange/30 pl-4">
          &gt; Loading travel history from Google Takeout...
          <span className="text-neon-orange animate-pulse">_</span>
        </div>
      </div>

      {!hasData ? (
        /* No data - Show upload instructions */
        <div className="tech-card p-8 border-neon-orange/30">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neon-orange/10 border border-neon-orange/30 flex items-center justify-center">
              <Upload className="w-10 h-10 text-neon-orange" />
            </div>
            <h2 className="text-xl font-display font-bold text-text-primary mb-4 tracking-wider">
              IMPORT_REQUIRED
            </h2>
            <p className="text-text-secondary mb-8 font-mono text-sm leading-relaxed">
              Pour afficher tes voyages, exporte ton historique de localisation depuis Google Takeout
              et place les fichiers dans le dossier <code className="text-neon-orange bg-neon-orange/10 px-2 py-0.5 rounded">data/location-history/</code>
            </p>

            <div className="text-left space-y-4 mb-8">
              <h3 className="text-sm font-mono font-semibold text-neon-cyan uppercase tracking-wider">
                Instructions :
              </h3>
              <ol className="space-y-3 text-sm text-text-secondary font-mono">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 flex-shrink-0 rounded bg-neon-orange/20 text-neon-orange flex items-center justify-center text-xs font-bold">1</span>
                  <span>Va sur <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">takeout.google.com</a></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 flex-shrink-0 rounded bg-neon-orange/20 text-neon-orange flex items-center justify-center text-xs font-bold">2</span>
                  <span>Sélectionne uniquement "Historique des positions"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 flex-shrink-0 rounded bg-neon-orange/20 text-neon-orange flex items-center justify-center text-xs font-bold">3</span>
                  <span>Choisis le format JSON</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 flex-shrink-0 rounded bg-neon-orange/20 text-neon-orange flex items-center justify-center text-xs font-bold">4</span>
                  <span>Télécharge et extrait l'archive</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 flex-shrink-0 rounded bg-neon-orange/20 text-neon-orange flex items-center justify-center text-xs font-bold">5</span>
                  <span>Place le dossier "Semantic Location History" dans <code className="text-neon-orange">data/location-history/</code></span>
                </li>
              </ol>
            </div>

            <a
              href="https://takeout.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neon-orange/10 border border-neon-orange/30 rounded-lg text-neon-orange font-mono hover:bg-neon-orange/20 hover:border-neon-orange/50 transition-all duration-300 group"
            >
              <Globe className="w-5 h-5" />
              <span>OPEN_GOOGLE_TAKEOUT</span>
              <span className="group-hover:translate-x-1 transition-transform">&gt;</span>
            </a>
          </div>
        </div>
      ) : stats && (
        /* Data loaded - Show stats */
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Lieux visités" value={stats.totalPlaces} icon={MapPin} color="orange" />
            <StatCard label="Pays" value={stats.totalCountries} icon={Globe} color="cyan" />
            <StatCard label="Villes" value={stats.totalCities} icon={Building2} color="magenta" />
            <StatCard label="Jours de voyage" value={stats.totalDays} icon={Calendar} color="green" />
          </div>

          {/* World Map */}
          <div className="tech-card p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-neon-orange/10 border border-neon-orange/30 rounded">
                <Globe className="w-5 h-5 text-neon-orange" />
              </div>
              <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                World_Map
              </h3>
            </div>
            <div className="h-96">
              <WorldMap visitedCountries={stats.topCountries.map(c => c.name)} />
            </div>
          </div>

          {/* Top Places */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Cities */}
            <div className="tech-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-neon-magenta/10 border border-neon-magenta/30 rounded">
                  <Building2 className="w-5 h-5 text-neon-magenta" />
                </div>
                <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                  Top_Cities
                </h3>
              </div>
              <div className="space-y-3">
                {stats.topCities.slice(0, 8).map((city, i) => (
                  <div key={city.name} className="group flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center bg-neon-magenta/10 border border-neon-magenta/30 rounded text-xs font-mono font-bold text-neon-magenta">
                      {i + 1}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-text-primary group-hover:text-neon-magenta transition-colors">
                          {city.name}
                        </span>
                        {city.country && (
                          <span className="text-xs text-text-muted ml-2 font-mono">
                            {city.country}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-neon-magenta">
                        {city.visits} visits
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Countries */}
            <div className="tech-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
                  <Globe className="w-5 h-5 text-neon-cyan" />
                </div>
                <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                  Top_Countries
                </h3>
              </div>
              <div className="space-y-3">
                {stats.topCountries.slice(0, 8).map((country, i) => (
                  <div key={country.name} className="group flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center bg-neon-cyan/10 border border-neon-cyan/30 rounded text-xs font-mono font-bold text-neon-cyan">
                      {i + 1}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary group-hover:text-neon-cyan transition-colors">
                        {country.name}
                      </span>
                      <span className="text-xs font-mono text-neon-cyan">
                        {country.visits} visits
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Places */}
          <div className="tech-card p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-neon-orange/10 border border-neon-orange/30 rounded">
                <MapPin className="w-5 h-5 text-neon-orange" />
              </div>
              <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                Most_Visited_Places
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.topPlaces.slice(0, 9).map((place, i) => (
                <div
                  key={place.name}
                  className="group relative bg-bg-primary border border-border-subtle rounded-lg p-4 hover:border-neon-orange/50 transition-all duration-300"
                >
                  <div className="absolute top-2 right-2 w-6 h-6 bg-neon-orange/20 rounded text-neon-orange text-xs font-mono font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <h4 className="font-medium text-text-primary group-hover:text-neon-orange transition-colors pr-8 truncate">
                    {place.name}
                  </h4>
                  {place.city && (
                    <p className="text-xs text-text-muted font-mono mt-1">
                      {place.city}
                    </p>
                  )}
                  <p className="text-xs font-mono text-neon-orange mt-2">
                    {place.visits} visits
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Yearly Evolution */}
          {stats.visitsByYear.length > 0 && (
            <div className="tech-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-neon-green/10 border border-neon-green/30 rounded">
                  <TrendingUp className="w-5 h-5 text-neon-green" />
                </div>
                <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
                  Yearly_Activity
                </h3>
              </div>
              <div className="flex items-end justify-between gap-2">
                {stats.visitsByYear.map((year) => {
                  const maxVisits = Math.max(...stats.visitsByYear.map(y => y.visits))
                  const height = (year.visits / maxVisits) * 100
                  return (
                    <div key={year.year} className="flex-1 flex flex-col items-center justify-end h-48 gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-neon-green/50 to-neon-green rounded-t transition-all hover:from-neon-green/70 hover:to-neon-green"
                        style={{ height: `${height}%`, minHeight: year.visits > 0 ? '4px' : '0' }}
                        title={`${year.visits} visites`}
                      />
                      <span className="text-xs font-mono text-text-muted shrink-0">
                        {year.year.toString().slice(-2)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

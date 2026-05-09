import { MapPin, Globe, Calendar, Upload, Building2, TrendingUp } from 'lucide-react'
import { Compass } from '@phosphor-icons/react/dist/ssr'
import { StatCard, PageHeader, SectionCard, RankRow } from '@/components'
import { WorldMapClient } from '@/components/world-map-client'
import { loadVoyages } from '@/lib/voyages'

export const revalidate = 86400

export default async function VoyagesPage() {
  const stats = await loadVoyages()

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="Voyages"
        subtitle="Historique des lieux visités"
        eyebrow={stats ? `${stats.totalCountries} pays · ${stats.totalCities} villes` : 'Section'}
        dateline="Tous les voyages"
        color="sage"
        icon={Compass}
      />

      {!stats ? (
        <div className="tech-card-raised p-10 border-earth-sage/30 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="gradient-mesh w-20 h-20 mx-auto mb-6 rounded-3xl border border-earth-sage/30 flex items-center justify-center"
                 style={{ ['--mesh-a' as string]: '163 181 152', ['--mesh-b' as string]: '90 125 74', ['--mesh-c' as string]: '163 181 152' } as React.CSSProperties}>
              <Upload className="w-9 h-9 text-earth-sage" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-2xl text-text-primary mb-3">
              Import requis
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed mb-8">
              Pour afficher tes voyages, exporte ton historique de localisation depuis Google Takeout
              et dépose les fichiers dans <code className="text-earth-sage bg-earth-sage/10 px-1.5 py-0.5 rounded font-mono text-xs">data/location-history/</code>.
            </p>

            <ol className="text-left space-y-2 mb-8 max-w-md mx-auto">
              {[
                <>Aller sur <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" className="text-earth-sage hover:underline">takeout.google.com</a></>,
                'Sélectionner uniquement "Historique des positions"',
                'Choisir le format JSON',
                'Télécharger et extraire l\'archive',
                <>Placer le dossier <em>Semantic Location History</em> dans <code className="text-earth-sage text-xs">data/location-history/</code></>,
              ].map((txt, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                  <span className="font-display text-earth-sage shrink-0 num w-6">{String(i + 1).padStart(2, '0')}</span>
                  <span>{txt}</span>
                </li>
              ))}
            </ol>

            <a
              href="https://takeout.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group"
            >
              <Globe className="w-4 h-4" />
              <span>Ouvrir Google Takeout</span>
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="motion-stagger grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Lieux visités" value={stats.totalPlaces} icon={MapPin} color="purple" />
            <StatCard label="Pays" value={stats.totalCountries} icon={Globe} color="cyan" />
            <StatCard label="Villes" value={stats.totalCities} icon={Building2} color="magenta" />
            <StatCard label="Jours de voyage" value={stats.totalDays} icon={Calendar} color="green" />
          </div>

          <SectionCard title="Carte du monde" icon={Globe} accent="sage" raised>
            <div className="h-96">
              <WorldMapClient visitedCountries={stats.topCountries.map((c) => c.name)} />
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <SectionCard title="Top villes" icon={Building2} accent="terracotta">
              <ol className="space-y-1">
                {stats.topCities.slice(0, 8).map((city, i) => (
                  <RankRow
                    key={city.name}
                    rank={i + 1}
                    accent="terracotta"
                    primary={city.name}
                    secondary={city.country}
                    metric={`${city.visits} visites`}
                  />
                ))}
              </ol>
            </SectionCard>

            <SectionCard title="Top pays" icon={Globe} accent="fern">
              <ol className="space-y-1">
                {stats.topCountries.slice(0, 8).map((country, i) => (
                  <RankRow
                    key={country.name}
                    rank={i + 1}
                    accent="fern"
                    primary={country.name}
                    metric={`${country.visits} visites`}
                  />
                ))}
              </ol>
            </SectionCard>
          </div>

          <SectionCard title="Lieux les plus fréquentés" icon={MapPin} accent="sage">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.topPlaces.slice(0, 9).map((place, i) => (
                <div
                  key={place.name}
                  className="tech-card-flat group relative p-4 hover:border-earth-sage/50"
                >
                  <div className="absolute top-3 right-3 font-display text-2xl text-earth-sage/40 leading-none num">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h4 className="font-display text-base text-text-primary pr-10 truncate">
                    {place.name}
                  </h4>
                  {place.city && (
                    <p className="text-xs text-text-muted mt-1">{place.city}</p>
                  )}
                  <p className="text-[10px] uppercase tracking-[0.18em] text-earth-sage mt-3 num">
                    {place.visits} visites
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          {stats.visitsByYear.length > 0 && (
            <SectionCard title="Activité annuelle" icon={TrendingUp} accent="moss">
              <div className="flex items-end justify-between gap-2">
                {stats.visitsByYear.map((year) => {
                  const maxVisits = Math.max(...stats.visitsByYear.map((y) => y.visits))
                  const height = (year.visits / maxVisits) * 100
                  return (
                    <div key={year.year} className="flex-1 flex flex-col items-center justify-end h-48 gap-2 group">
                      <div
                        className="w-full bg-gradient-to-t from-earth-moss/40 to-earth-moss rounded-t transition-all duration-300 group-hover:from-earth-moss/60 group-hover:to-earth-mossSoft"
                        style={{ height: `${height}%`, minHeight: year.visits > 0 ? '4px' : '0' }}
                        title={`${year.visits} visites`}
                      />
                      <span className="text-[11px] text-text-muted shrink-0 num">
                        '{year.year.toString().slice(-2)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          )}
        </>
      )}
    </div>
  )
}

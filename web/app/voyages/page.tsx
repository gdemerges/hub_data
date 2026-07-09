import { Compass } from '@phosphor-icons/react/dist/ssr'
import {
  Award,
  Building2,
  Calendar,
  Clock,
  Globe,
  MapPin,
  Sparkles,
  TrendingUp,
  Upload,
} from 'lucide-react'
import { PageHeader, RankRow, SectionCard } from '@/components'
import { WorldMapClient } from '@/components/world-map-client'
import type { TravelStats } from '@/lib/voyages'
import { loadVoyages } from '@/lib/voyages'

export const revalidate = 86400

function formatDays(days: number): string {
  return `${days.toLocaleString('fr-FR')}`
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`
  const hours = minutes / 60
  if (hours < 24) return `${hours.toFixed(1)} h`
  const days = hours / 24
  return `${days.toFixed(1)} j`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })
  } catch {
    return iso.slice(0, 10)
  }
}

export const metadata = { title: 'Voyages' }

export default async function VoyagesPage() {
  const stats = await loadVoyages()

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="Voyages"
        subtitle="Historique des lieux visités"
        eyebrow={stats ? `${stats.totalCountries} pays · ${stats.totalCities} villes` : 'Section'}
        dateline={
          stats?.visitsByYear?.length
            ? `${stats.visitsByYear[0].year} → ${stats.visitsByYear[stats.visitsByYear.length - 1].year}`
            : 'Tous les voyages'
        }
        color="sage"
        icon={Compass}
      />

      {!stats ? (
        <EmptyState />
      ) : (
        <>
          <KpiStrip stats={stats} />

          <SectionCard title="Carte du monde" icon={Globe} accent="sage" raised>
            <div className="h-96">
              <WorldMapClient visitedCountries={stats.topCountries.map((c) => c.name)} />
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <SectionCard title="Continents" icon={Globe} accent="fern">
              <ContinentBars data={stats.continents} />
            </SectionCard>

            <SectionCard title="Pays récents" icon={Sparkles} accent="saffron">
              <ul className="space-y-2">
                {stats.recentCountries.map((c) => (
                  <li key={c.name} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-text-primary truncate">{c.name}</span>
                    <span className="font-mono text-[11px] text-text-tertiary uppercase tracking-wider whitespace-nowrap">
                      {formatDate(c.lastVisit)}
                    </span>
                  </li>
                ))}
                {stats.recentCountries.length === 0 && (
                  <li className="text-sm text-text-tertiary">Aucune date renseignée</li>
                )}
              </ul>
            </SectionCard>

            <SectionCard title="Plus long séjour" icon={Award} accent="terracotta">
              {stats.longestStay ? (
                <div className="space-y-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary mb-1">
                      Lieu
                    </div>
                    <div
                      className="font-display text-lg text-text-primary truncate"
                      title={stats.longestStay.name}
                    >
                      {stats.longestStay.name}
                    </div>
                    {(stats.longestStay.city || stats.longestStay.country) && (
                      <div className="text-xs text-text-secondary mt-0.5">
                        {[stats.longestStay.city, stats.longestStay.country]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between border-t border-border-subtle pt-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                      Durée
                    </span>
                    <span className="font-display text-xl text-earth-terracotta tabular-nums">
                      {formatDuration(stats.longestStay.minutes)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                      Quand
                    </span>
                    <span className="font-mono text-xs text-text-secondary">
                      {formatDate(stats.longestStay.startTime)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-text-tertiary">Pas de durée renseignée</div>
              )}
            </SectionCard>
          </div>

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
                    secondary={
                      country.firstVisit ? `depuis ${formatDate(country.firstVisit)}` : undefined
                    }
                    metric={`${country.visits} visites`}
                  />
                ))}
              </ol>
            </SectionCard>
          </div>

          {stats.visitsByYear.length > 0 && (
            <SectionCard title="Activité annuelle" icon={TrendingUp} accent="moss">
              <div className="flex items-end justify-between gap-2">
                {stats.visitsByYear.map((year) => {
                  const maxVisits = Math.max(...stats.visitsByYear.map((y) => y.visits))
                  const height = (year.visits / maxVisits) * 100
                  return (
                    <div
                      key={year.year}
                      className="flex-1 flex flex-col items-center justify-end h-48 gap-2 group"
                    >
                      <span className="font-mono text-[10px] text-earth-moss tabular-nums">
                        {year.visits > maxVisits * 0.15 ? year.visits : ''}
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-earth-moss/40 to-earth-moss rounded-t transition-all duration-300 group-hover:from-earth-moss/60 group-hover:to-earth-mossSoft"
                        style={{ height: `${height}%`, minHeight: year.visits > 0 ? '4px' : '0' }}
                        title={`${year.year} · ${year.visits} visites`}
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

function KpiStrip({ stats }: { stats: TravelStats }) {
  const items: { label: string; value: string; hint?: string; icon: React.ReactNode }[] = [
    {
      label: 'Pays',
      value: stats.totalCountries.toLocaleString('fr-FR'),
      hint: stats.topCountries[0] ? `top : ${stats.topCountries[0].name}` : undefined,
      icon: <Globe className="w-3.5 h-3.5" />,
    },
    {
      label: 'Villes',
      value: stats.totalCities.toLocaleString('fr-FR'),
      hint: stats.topCities[0] ? `top : ${stats.topCities[0].name}` : undefined,
      icon: <Building2 className="w-3.5 h-3.5" />,
    },
    {
      label: 'Lieux',
      value: stats.totalPlaces.toLocaleString('fr-FR'),
      hint: 'uniques visités',
      icon: <MapPin className="w-3.5 h-3.5" />,
    },
    {
      label: 'Jours actifs',
      value: formatDays(stats.totalDays),
      hint: 'au moins une visite',
      icon: <Calendar className="w-3.5 h-3.5" />,
    },
    {
      label: 'Année la plus active',
      value: stats.mostActiveYear ? `${stats.mostActiveYear.year}` : '—',
      hint: stats.mostActiveYear ? `${stats.mostActiveYear.visits} visites` : undefined,
      icon: <TrendingUp className="w-3.5 h-3.5" />,
    },
    {
      label: 'Séjour moyen',
      value: stats.averageStayMinutes ? formatDuration(stats.averageStayMinutes) : '—',
      hint: 'par lieu',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      {items.map((it) => (
        <div key={it.label} className="tech-card-flat p-4">
          <div className="flex items-center gap-2 text-earth-sage mb-2">
            {it.icon}
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
              {it.label}
            </span>
          </div>
          <div className="font-display text-2xl font-medium tracking-tight text-text-primary tabular-nums">
            {it.value}
          </div>
          {it.hint && (
            <div
              className="font-mono text-[10px] text-text-tertiary mt-1.5 truncate"
              title={it.hint}
            >
              {it.hint}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ContinentBars({ data }: { data: TravelStats['continents'] }) {
  if (data.length === 0) {
    return <div className="text-sm text-text-tertiary py-4 text-center">Aucune donnée</div>
  }
  const max = Math.max(...data.map((d) => d.visits), 1)
  const colors: Record<string, string> = {
    Europe: '#5a7d4a',
    Asie: '#b86b3c',
    'Amérique du Nord': '#3d5170',
    'Amérique du Sud': '#a8552c',
    Afrique: '#d9a441',
    Océanie: '#7ba896',
    Autre: '#a3b598',
  }
  return (
    <ul className="space-y-3">
      {data.map((d) => {
        const pct = (d.visits / max) * 100
        const color = colors[d.continent] ?? colors.Autre
        return (
          <li key={d.continent}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-sm text-text-primary">{d.continent}</span>
              <span className="font-mono text-[11px] text-text-tertiary tabular-nums whitespace-nowrap">
                {d.countries} pays · {d.visits}
              </span>
            </div>
            <div className="h-1.5 bg-earth-fern/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function EmptyState() {
  return (
    <div className="tech-card-raised p-10 border-earth-sage/30 max-w-2xl mx-auto">
      <div className="text-center">
        <div
          className="gradient-mesh w-20 h-20 mx-auto mb-6 rounded-3xl border border-earth-sage/30 flex items-center justify-center"
          style={
            {
              ['--mesh-a' as string]: '163 181 152',
              ['--mesh-b' as string]: '90 125 74',
              ['--mesh-c' as string]: '163 181 152',
            } as React.CSSProperties
          }
        >
          <Upload className="w-9 h-9 text-earth-sage" strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-2xl text-text-primary mb-3">Import requis</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-8">
          Pour afficher tes voyages, exporte ton historique de localisation depuis Google Takeout et
          dépose les fichiers dans{' '}
          <code className="text-earth-sage bg-earth-sage/10 px-1.5 py-0.5 rounded font-mono text-xs">
            data/location-history/
          </code>
          .
        </p>
        <ol className="text-left space-y-2 mb-8 max-w-md mx-auto">
          {[
            <>
              Aller sur{' '}
              <a
                href="https://takeout.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-earth-sage hover:underline"
              >
                takeout.google.com
              </a>
            </>,
            'Sélectionner uniquement "Historique des positions"',
            'Choisir le format JSON',
            "Télécharger et extraire l'archive",
            <>
              Placer le dossier <em>Semantic Location History</em> dans{' '}
              <code className="text-earth-sage text-xs">data/location-history/</code>
            </>,
          ].map((txt, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
              <span className="font-display text-earth-sage shrink-0 num w-6">
                {String(i + 1).padStart(2, '0')}
              </span>
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
  )
}

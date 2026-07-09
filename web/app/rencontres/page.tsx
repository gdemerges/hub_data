import { HeartHalf } from '@phosphor-icons/react/dist/ssr'
import { Cake, Globe, Heart, Hourglass, MapPin, TrendingUp, Users } from 'lucide-react'
import { PageHeader, PieChart } from '@/components'
import { NationalityMapLazy as NationalityMap } from '@/components/nationality-map-lazy'
import { seriesColor } from '@/lib/chart'
import { loadRencontres } from '@/lib/rencontres-loader'

export const revalidate = 3600

export const metadata = { title: 'Rencontres' }

export default async function RencontresPage() {
  const { stats, hasData } = await loadRencontres()

  if (!hasData || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <PageHeader
          title="Rencontres"
          subtitle="Aucune donnée disponible"
          color="clay"
          icon={HeartHalf}
        />
        <div className="tech-card p-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-earth-clay/10 border border-earth-clay/30 flex items-center justify-center">
              <Heart className="w-10 h-10 text-earth-clay" />
            </div>
            <h2 className="font-display text-xl font-medium text-text-primary mb-4">
              Pas de données
            </h2>
            <p className="text-text-secondary text-sm">
              Le fichier <code className="font-mono text-xs">partners.csv</code> est introuvable ou
              vide.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const villeChartData = stats.villes.slice(0, 8).map((item, index) => ({
    label: item.ville,
    value: item.count,
    color: seriesColor(index),
  }))

  const nationaliteChartData = stats.nationalites.slice(0, 8).map((item, index) => ({
    label: item.nationalite,
    value: item.count,
    color: seriesColor(index + 3),
  }))

  const yearSpan = stats.parAnnee.length
    ? `${stats.parAnnee[0].annee}–${stats.parAnnee[stats.parAnnee.length - 1].annee}`
    : '—'

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="Rencontres"
        subtitle="Carnet personnel · villes, nationalités, époques et rythmes"
        eyebrow="Carnet"
        dateline={`${stats.total.toLocaleString('fr-FR')} rencontres · ${yearSpan}`}
        color="clay"
        icon={HeartHalf}
      />

      {/* KPI row — éditorial, six tuiles compactes */}
      <KpiStrip stats={stats} />

      {/* Cumulative chart full width */}
      <div className="tech-card p-6 mb-8">
        <SectionTitle
          icon={<TrendingUp className="w-5 h-5 text-earth-moss" />}
          color="moss"
          title="Trajectoire cumulée"
          subtitle="Total cumulé année après année"
        />
        <CumulativeChart data={stats.cumulative} />
      </div>

      {/* Map */}
      <div className="tech-card p-6 mb-8">
        <SectionTitle
          icon={<Globe className="w-5 h-5 text-earth-clay" />}
          color="clay"
          title="Carte des nationalités"
        />
        <div className="h-[400px]">
          <NationalityMap data={stats.nationalites} />
        </div>
      </div>

      {/* Villes + Nationalités */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="tech-card p-6">
          <SectionTitle
            icon={<MapPin className="w-5 h-5 text-earth-fern" />}
            color="fern"
            title="Villes"
            subtitle={`${stats.villes.length} villes au total`}
          />
          <div className="flex flex-col items-center">
            <PieChart data={villeChartData} size={280} unit="" />
          </div>
        </div>

        <div className="tech-card p-6">
          <SectionTitle
            icon={<Globe className="w-5 h-5 text-earth-terracotta" />}
            color="terracotta"
            title="Nationalités"
            subtitle={`${stats.nationalites.length} nationalités au total`}
          />
          <div className="flex flex-col items-center">
            <PieChart data={nationaliteChartData} size={280} unit="" />
          </div>
        </div>
      </div>

      {/* Par année + Âge à la rencontre */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="tech-card p-6">
          <SectionTitle
            icon={<Hourglass className="w-5 h-5 text-earth-saffron" />}
            color="saffron"
            title="Rencontres par année"
          />
          <YearBars data={stats.parAnnee} />
        </div>

        <div className="tech-card p-6">
          <SectionTitle
            icon={<Cake className="w-5 h-5 text-earth-indigo" />}
            color="indigo"
            title="Âge à la rencontre"
            subtitle={`Moyenne ${stats.ageAtMeeting.avg.toFixed(1)} ans · ${stats.ageAtMeeting.min}–${stats.ageAtMeeting.max} ans`}
          />
          <AgeBars data={stats.ageAtMeeting.distribution} />
        </div>
      </div>

      {/* Genre */}
      {stats.genres.length > 0 && (
        <div className="tech-card p-6">
          <SectionTitle
            icon={<Users className="w-5 h-5 text-earth-rust" />}
            color="rust"
            title="Répartition par genre"
          />
          <GenreBars data={stats.genres} total={stats.total} />
        </div>
      )}
    </div>
  )
}

// ----- composants internes -----

const ICON_BG: Record<string, string> = {
  moss: 'bg-earth-moss/10 border-earth-moss/30',
  clay: 'bg-earth-clay/10 border-earth-clay/30',
  fern: 'bg-earth-fern/10 border-earth-fern/30',
  terracotta: 'bg-earth-terracotta/10 border-earth-terracotta/30',
  saffron: 'bg-earth-saffron/10 border-earth-saffron/30',
  indigo: 'bg-earth-indigo/10 border-earth-indigo/30',
  rust: 'bg-earth-rust/10 border-earth-rust/30',
}

function SectionTitle({
  icon,
  color,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  color: string
  title: string
  subtitle?: string
}) {
  const bg = ICON_BG[color] ?? ICON_BG.moss
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`p-2 border rounded ${bg}`}>{icon}</div>
      <div>
        <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
          {title}
        </h3>
        {subtitle && <p className="text-xs font-mono text-text-tertiary mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function KpiStrip({
  stats,
}: {
  stats: NonNullable<Awaited<ReturnType<typeof loadRencontres>>['stats']>
}) {
  const items: { label: string; value: string; hint?: string }[] = [
    {
      label: 'Total',
      value: stats.total.toLocaleString('fr-FR'),
      hint: `${stats.activeYears} année${stats.activeYears > 1 ? 's' : ''} actives`,
    },
    {
      label: 'Taux de pénétration',
      value: `${Math.round(stats.penetrationRate * 100)}%`,
      hint: 'sur les rencontres renseignées',
    },
    {
      label: 'Âge moyen',
      value: `${stats.ageAtMeeting.avg.toFixed(1)} ans`,
      hint: `de ${stats.ageAtMeeting.min} à ${stats.ageAtMeeting.max}`,
    },
    {
      label: 'Villes',
      value: stats.villes.length.toLocaleString('fr-FR'),
      hint: stats.villes[0] ? `top : ${stats.villes[0].ville}` : undefined,
    },
    {
      label: 'Plus longue pause',
      value: `${stats.longestGapYears} an${stats.longestGapYears > 1 ? 's' : ''}`,
      hint: stats.longestGapPeriod
        ? `${stats.longestGapPeriod.from} → ${stats.longestGapPeriod.to}`
        : undefined,
    },
    {
      label: 'Depuis la dernière',
      value: `${stats.currentGapYears} an${stats.currentGapYears > 1 ? 's' : ''}`,
      hint: 'au compteur',
    },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      {items.map((it) => (
        <div key={it.label} className="tech-card-flat p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary mb-2">
            {it.label}
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

function CumulativeChart({ data }: { data: { annee: number; total: number }[] }) {
  if (data.length === 0) return null
  const width = 800
  const height = 220
  const padX = 36
  const padY = 24

  const minYear = data[0].annee
  const maxYear = data[data.length - 1].annee
  const maxTotal = data[data.length - 1].total
  const yearRange = Math.max(maxYear - minYear, 1)

  const xFor = (y: number) => padX + ((y - minYear) / yearRange) * (width - padX * 2)
  const yFor = (v: number) => height - padY - (v / Math.max(maxTotal, 1)) * (height - padY * 2)

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(d.annee).toFixed(1)} ${yFor(d.total).toFixed(1)}`)
    .join(' ')

  const areaPath = `${linePath} L ${xFor(maxYear).toFixed(1)} ${height - padY} L ${xFor(minYear).toFixed(1)} ${height - padY} Z`

  // Y axis ticks: 0, 25%, 50%, 75%, 100%
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    pct: t,
    value: Math.round(maxTotal * t),
    y: yFor(maxTotal * t),
  }))

  // X axis: 4 evenly spaced years
  const xTickCount = Math.min(6, data.length)
  const xTicks = Array.from({ length: xTickCount }, (_, i) => {
    const idx = Math.round((i / Math.max(xTickCount - 1, 1)) * (data.length - 1))
    return data[idx].annee
  })

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cumul-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5a7d4a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#5a7d4a" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((t) => (
          <g key={t.pct}>
            <line
              x1={padX}
              x2={width - padX}
              y1={t.y}
              y2={t.y}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeDasharray="2 4"
            />
            <text
              x={padX - 6}
              y={t.y + 4}
              textAnchor="end"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
              fill="currentColor"
              fillOpacity="0.45"
            >
              {t.value}
            </text>
          </g>
        ))}
        <path d={areaPath} fill="url(#cumul-fill)" />
        <path d={linePath} fill="none" stroke="#5a7d4a" strokeWidth="1.75" strokeLinejoin="round" />
        {data.map((d) => (
          <circle key={d.annee} cx={xFor(d.annee)} cy={yFor(d.total)} r="2.5" fill="#5a7d4a">
            <title>{`${d.annee} · ${d.total} cumulées`}</title>
          </circle>
        ))}
        {xTicks.map((y) => (
          <text
            key={y}
            x={xFor(y)}
            y={height - 6}
            textAnchor="middle"
            fontSize="10"
            fontFamily="ui-monospace, monospace"
            fill="currentColor"
            fillOpacity="0.5"
          >
            {y}
          </text>
        ))}
      </svg>
    </div>
  )
}

function YearBars({ data }: { data: { annee: number; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-1.5 h-48">
      {data.map((d) => {
        const h = (d.count / max) * 100
        return (
          <div
            key={d.annee}
            className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 min-w-0"
          >
            <span className="font-mono text-[10px] text-earth-saffron tabular-nums">
              {d.count > 0 ? d.count : ''}
            </span>
            <div
              className="w-full bg-gradient-to-t from-earth-saffron/40 to-earth-saffron rounded-t"
              style={{ height: `${h}%`, minHeight: d.count > 0 ? '2px' : '0' }}
              title={`${d.annee} · ${d.count}`}
            />
            <span className="font-mono text-[10px] text-text-tertiary tabular-nums">
              {d.annee.toString().slice(-2)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function AgeBars({ data }: { data: { bucket: string; count: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-text-tertiary py-8 text-center">Pas assez de données d'âge</div>
    )
  }
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-3 h-48">
      {data.map((d) => {
        const h = (d.count / max) * 100
        return (
          <div
            key={d.bucket}
            className="flex-1 h-full flex flex-col items-center justify-end gap-1.5"
          >
            <span className="font-mono text-[10px] text-earth-indigo tabular-nums">{d.count}</span>
            <div
              className="w-full bg-gradient-to-t from-earth-indigo/40 to-earth-indigo rounded-t"
              style={{ height: `${h}%`, minHeight: '2px' }}
              title={`${d.bucket} ans · ${d.count}`}
            />
            <span className="font-mono text-[10px] text-text-tertiary whitespace-nowrap">
              {d.bucket}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function GenreBars({ data, total }: { data: { genre: string; count: number }[]; total: number }) {
  const colors: Record<string, string> = {
    F: '#b86b3c',
    H: '#3d5170',
    NB: '#d9a441',
  }
  return (
    <div className="space-y-3">
      {data.map((g) => {
        const pct = (g.count / total) * 100
        const color = colors[g.genre.toUpperCase()] || '#a8552c'
        return (
          <div key={g.genre} className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-wider text-text-secondary w-8">
              {g.genre}
            </span>
            <div className="flex-1 h-2 bg-earth-rust/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <span className="font-mono text-xs text-text-secondary tabular-nums whitespace-nowrap">
              {g.count} · {pct.toFixed(1)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

import { Heart, MapPin, Globe, Calendar, TrendingUp } from 'lucide-react'
import { HeartHalf } from '@phosphor-icons/react/dist/ssr'
import { StatCard, PieChart, PageHeader } from '@/components'
import { NationalityMapLazy as NationalityMap } from '@/components/nationality-map-lazy'
import { loadRencontres } from '@/lib/rencontres-loader'

export const revalidate = 3600

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
              Le fichier <code className="font-mono text-xs">partners.csv</code> est introuvable ou vide.
            </p>
          </div>
        </div>
      </div>
    )
  }

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

  const maxParAnnee = Math.max(...stats.parAnnee.map((y) => y.count))
  const maxParNaissance = Math.max(...stats.parAnneeNaissance.map((y) => y.count))

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="Rencontres"
        subtitle={`${stats.total} liens · ${stats.villes.length} villes · ${stats.nationalites.length} nationalités`}
        color="clay"
        icon={HeartHalf}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={stats.total} icon={Heart} color="red" />
        <StatCard label="Villes" value={stats.villes.length} icon={MapPin} color="cyan" />
        <StatCard label="Nationalités" value={stats.nationalites.length} icon={Globe} color="magenta" />
        <StatCard label="Années" value={stats.parAnnee.length} icon={Calendar} color="green" />
      </div>

      <div className="tech-card p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-neon-red/10 border border-neon-red/30 rounded">
            <Globe className="w-5 h-5 text-neon-red" />
          </div>
          <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Carte_des_Nationalités
          </h3>
        </div>
        <div className="h-[400px]">
          <NationalityMap data={stats.nationalites} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
            <PieChart data={villeChartData} size={300} unit="" />
          </div>
        </div>

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
            <PieChart data={nationaliteChartData} size={300} unit="" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              const height = (item.count / maxParAnnee) * 100
              return (
                <div key={item.annee} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                  <div
                    className="relative w-full"
                    style={{ height: `${height}%`, minHeight: item.count > 0 ? '20px' : '0' }}
                  >
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
              const height = (item.count / maxParNaissance) * 100
              return (
                <div key={item.annee} className="flex-1 flex flex-col items-center justify-end h-full gap-2 min-w-[20px]">
                  <div
                    className="relative w-full"
                    style={{ height: `${height}%`, minHeight: item.count > 0 ? '20px' : '0' }}
                  >
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

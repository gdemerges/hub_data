import { Suspense } from 'react'
import Image from 'next/image'
import { StatCard, PageHeader } from '@/components'
import { Star, GitFork, Users, MapPin, Building, Code } from 'lucide-react'
import { GithubLogo } from '@phosphor-icons/react/dist/ssr'
import { loadGitHub, loadGitHubContributions, loadGitHubYearly } from '@/lib/github'
import {
  GitHubContributionsSection,
  GitHubContributionsSkeleton,
} from '@/components/github-contributions-section'
import { GitHubYearlySection, GitHubYearlySkeleton } from '@/components/github-yearly-section'
import { GitHubSyncButton } from '@/components/github-sync-button'

export const revalidate = 21600

const GITHUB_USERNAME = process.env.NEXT_PUBLIC_GITHUB_USERNAME ?? 'gdemerges'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'à l\'instant'
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

export default async function GitHubPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const { year: yearParam } = await searchParams
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()

  const contributionsPromise = loadGitHubContributions(GITHUB_USERNAME, year)
  const yearlyPromise = loadGitHubYearly(GITHUB_USERNAME)
  const data = await loadGitHub(GITHUB_USERNAME)

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <PageHeader title="GitHub" subtitle="Erreur de chargement" color="indigo" icon={GithubLogo} />
        <div className="text-center py-12">
          <p className="text-text-muted">Impossible de charger les données GitHub</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="GitHub"
        subtitle={data.fetchedAt ? `Synchronisé ${timeAgo(data.fetchedAt)}` : 'Profil développeur'}
        eyebrow="Code"
        dateline={`${data.stats.totalRepos.toLocaleString('fr-FR')} repos · ${data.stats.totalContributions.toLocaleString('fr-FR')} contributions`}
        color="indigo"
        icon={GithubLogo}
        actions={<GitHubSyncButton username={GITHUB_USERNAME} />}
      />

      <div className="tech-card p-6 mb-8 border-earth-terracotta/30 hover:border-earth-terracotta/60 transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative">
            <Image
              src={data.user.avatar}
              alt={data.user.name}
              width={120}
              height={120}
              className="rounded-lg ring-2 ring-earth-terracotta/30"
            />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-earth-terracotta rounded-full border-2 border-bg-primary flex items-center justify-center">
              <Code className="w-3 h-3 text-bg-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-3xl font-medium tracking-tight text-text-primary">
              {data.user.name}
            </h2>
            <p className="text-sm font-mono text-earth-terracotta/70 mt-1">@{data.user.login}</p>
            {data.user.bio && (
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">{data.user.bio}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              {data.user.location && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <MapPin className="w-4 h-4 text-earth-fern" strokeWidth={1.75} />
                  <span>{data.user.location}</span>
                </div>
              )}
              {data.user.company && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Building className="w-4 h-4 text-earth-fern" strokeWidth={1.75} />
                  <span>{data.user.company}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Repositories" value={data.stats.totalRepos} icon={Code} color="magenta" />
        <StatCard
          label="Contributions totales"
          value={data.stats.totalContributions}
          icon={Star}
          color="cyan"
        />
        <StatCard label="Forks" value={data.stats.totalForks} icon={GitFork} color="yellow" />
        <StatCard label="Followers" value={data.user.followers} icon={Users} color="green" />
      </div>

      <Suspense fallback={<GitHubContributionsSkeleton />}>
        <GitHubContributionsSection promise={contributionsPromise} year={year} />
      </Suspense>

      <div className="tech-card p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-earth-fern/10 border border-earth-fern/30 rounded">
            <Code className="w-5 h-5 text-earth-fern" />
          </div>
          <div>
            <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
              Top langages
            </h3>
            <p className="text-xs font-mono text-text-muted mt-0.5">Based on code lines</p>
          </div>
        </div>
        <div className="space-y-3">
          {data.stats.topLanguages.map((lang, i) => (
            <div key={lang.language} className="group flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center bg-earth-fern/10 border border-earth-fern/30 rounded text-xs font-mono font-bold text-earth-fern">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-text-primary group-hover:text-earth-fern transition-colors">
                    {lang.language}
                  </span>
                  <span className="text-xs font-mono font-bold text-earth-fern">{lang.percentage}%</span>
                </div>
                <div className="h-2 bg-bg-primary rounded-full overflow-hidden border border-border-subtle">
                  <div
                    className="h-full bg-gradient-to-r from-earth-fern to-earth-terracotta rounded-full transition-all duration-500"
                    style={{ width: `${lang.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Suspense fallback={<GitHubYearlySkeleton />}>
        <GitHubYearlySection promise={yearlyPromise} />
      </Suspense>
    </div>
  )
}

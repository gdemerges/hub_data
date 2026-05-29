import path from 'node:path'
import { createFileCache } from './cache-store'

const CACHE_TTL_MS = 6 * 60 * 60 * 1000

export interface GitHubRawRepo {
  name: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  html_url: string
  updated_at: string
  pushed_at: string
}

interface RepoLanguageEntry {
  languages: Record<string, number>
  pushedAt: string
}

export interface GitHubCacheData {
  user: Record<string, unknown>
  repos: GitHubRawRepo[]
  languagesByRepo: Record<string, RepoLanguageEntry>
  totalContributions: number
}

const cache = createFileCache<GitHubCacheData>({
  filePath: path.join(process.cwd(), 'data', 'github-cache.json'),
  ttlMs: CACHE_TTL_MS,
  name: 'github',
  pretty: true,
})

export const readGitHubCache = cache.read
export const writeGitHubCache = cache.write
export const isCacheFresh = cache.isFresh

export function reposNeedingLanguageRefetch(
  freshRepos: GitHubRawRepo[],
  existingData: GitHubCacheData | null,
  username: string
): GitHubRawRepo[] {
  if (!existingData) return freshRepos
  return freshRepos.filter((repo) => {
    const key = `${username}/${repo.name}`
    const cached = existingData.languagesByRepo[key]
    return !cached || cached.pushedAt !== repo.pushed_at
  })
}

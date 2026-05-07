import path from 'path'
import { FileCacheStore } from './cache-store'

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

const store = new FileCacheStore<GitHubCacheData>({
  filePath: path.join(process.cwd(), 'data', 'github-cache.json'),
  ttlMs: CACHE_TTL_MS,
  name: 'github',
  pretty: true,
})

export async function readGitHubCache() {
  return store.read()
}

export async function writeGitHubCache(data: GitHubCacheData): Promise<void> {
  await store.write(data)
}

export function isCacheFresh(cachedAt: number): boolean {
  return store.isFresh(cachedAt)
}

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

/**
 * Persistent file cache for GitHub API data.
 *
 * Strategy:
 * - Full response (user + repos + aggregated languages) is cached to disk.
 * - On request, if the cache is fresh (< CACHE_TTL_MS), return it directly.
 * - If the cache is stale, fetch fresh repos from GitHub. For each repo, compare
 *   `pushed_at` against the cached value: only re-fetch the language breakdown
 *   for repos that have been updated since the last sync (delta sync).
 * - Individual repo language data is stored keyed by "username/repo" so it
 *   survives across full cache refreshes.
 */

import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'
import { logger } from './logger'

const CACHE_FILE = path.join(process.cwd(), 'data', 'github-cache.json')
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

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
  pushedAt: string // pushed_at at time of fetch — used for delta detection
}

export interface GitHubCache {
  cachedAt: number
  user: Record<string, unknown>
  repos: GitHubRawRepo[]
  languagesByRepo: Record<string, RepoLanguageEntry> // key: "owner/repo"
  totalContributions: number
}

export async function readGitHubCache(): Promise<GitHubCache | null> {
  if (!fs.existsSync(CACHE_FILE)) {
    logger.metric('cache.miss', { cache: 'github', reason: 'absent' })
    return null
  }
  try {
    const content = await fsp.readFile(CACHE_FILE, 'utf-8')
    const cache = JSON.parse(content) as GitHubCache
    logger.metric('cache.hit', { cache: 'github' })
    return cache
  } catch {
    logger.metric('cache.miss', { cache: 'github', reason: 'corrupt' })
    return null
  }
}

export async function writeGitHubCache(cache: GitHubCache): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  await fsp.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2))
}

export function isCacheFresh(cache: GitHubCache): boolean {
  return Date.now() - cache.cachedAt < CACHE_TTL_MS
}

/**
 * Given a fresh list of repos from the API and an existing cache, return only
 * the repos whose language data needs to be re-fetched (either new or pushed
 * since last fetch).
 */
export function reposNeedingLanguageRefetch(
  freshRepos: GitHubRawRepo[],
  existingCache: GitHubCache | null,
  username: string
): GitHubRawRepo[] {
  if (!existingCache) return freshRepos

  return freshRepos.filter((repo) => {
    const key = `${username}/${repo.name}`
    const cached = existingCache.languagesByRepo[key]
    // Re-fetch if: never cached, or repo was pushed to after last fetch
    return !cached || cached.pushedAt !== repo.pushed_at
  })
}

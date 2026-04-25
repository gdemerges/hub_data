import { describe, it, expect } from 'vitest'
import { reposNeedingLanguageRefetch, isCacheFresh, type GitHubCache, type GitHubRawRepo } from './github-cache'

const repo = (over: Partial<GitHubRawRepo> = {}): GitHubRawRepo => ({
  name: 'r1',
  description: null,
  language: 'TypeScript',
  stargazers_count: 0,
  forks_count: 0,
  html_url: '',
  updated_at: '',
  pushed_at: '2026-01-01T00:00:00Z',
  ...over,
})

const cache = (over: Partial<GitHubCache> = {}): GitHubCache => ({
  cachedAt: Date.now(),
  user: {},
  repos: [],
  languagesByRepo: {},
  totalContributions: 0,
  ...over,
})

describe('reposNeedingLanguageRefetch', () => {
  it('returns all repos when there is no existing cache', () => {
    const fresh = [repo({ name: 'a' }), repo({ name: 'b' })]
    expect(reposNeedingLanguageRefetch(fresh, null, 'me')).toHaveLength(2)
  })

  it('skips repos whose pushed_at matches the cached value', () => {
    const fresh = [repo({ name: 'a', pushed_at: '2026-01-01T00:00:00Z' })]
    const c = cache({
      languagesByRepo: {
        'me/a': { languages: { TypeScript: 100 }, pushedAt: '2026-01-01T00:00:00Z' },
      },
    })
    expect(reposNeedingLanguageRefetch(fresh, c, 'me')).toHaveLength(0)
  })

  it('refetches a repo whose pushed_at changed', () => {
    const fresh = [repo({ name: 'a', pushed_at: '2026-02-01T00:00:00Z' })]
    const c = cache({
      languagesByRepo: {
        'me/a': { languages: {}, pushedAt: '2026-01-01T00:00:00Z' },
      },
    })
    expect(reposNeedingLanguageRefetch(fresh, c, 'me')).toHaveLength(1)
  })

  it('refetches new repos absent from the cache', () => {
    const fresh = [repo({ name: 'new' })]
    const c = cache() // empty languagesByRepo
    const need = reposNeedingLanguageRefetch(fresh, c, 'me')
    expect(need).toHaveLength(1)
    expect(need[0].name).toBe('new')
  })
})

describe('isCacheFresh (github)', () => {
  it('true when within 6h', () => {
    expect(isCacheFresh(cache({ cachedAt: Date.now() - 60_000 }))).toBe(true)
  })
  it('false past 6h', () => {
    expect(isCacheFresh(cache({ cachedAt: Date.now() - 7 * 60 * 60 * 1000 }))).toBe(false)
  })
})

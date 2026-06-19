# Spotify Genre Breakdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Top genres" section to the Spotify page with horizontal bar visualization, synced with the existing period selector (short/medium/long term).

**Architecture:** The genre data already exists per artist in the Spotify API response (via `me/top/artists`). We extract a pure helper function `aggregateGenres` from `spotify.ts`, compute `topGenresByRange` for all 3 time ranges, add the field to `SpotifyData`, and render a `GenreBreakdown` component inside `SpotifyClient` that reads from the existing `range` state.

**Tech Stack:** TypeScript, Next.js 15 App Router, Vitest (tests), Tailwind CSS (solarpunk palette), React (client component)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `web/lib/spotify.ts` | Modify | Extract `aggregateGenres` helper; compute `topGenresByRange` for all 3 ranges |
| `web/lib/types.ts` | Modify | Add `topGenresByRange` field to `SpotifyData` |
| `web/lib/spotify-genres.test.ts` | Create | Unit tests for `aggregateGenres` |
| `web/components/spotify-client.tsx` | Modify | Add `GenreBreakdown` component; insert after top albums, synced with `range` |

---

### Task 1: Extract and test `aggregateGenres` helper

**Files:**
- Modify: `web/lib/spotify.ts` (extract helper, export it)
- Create: `web/lib/spotify-genres.test.ts`

- [ ] **Step 1: Write the failing test**

Create `web/lib/spotify-genres.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { aggregateGenres } from './spotify'

describe('aggregateGenres', () => {
  it('counts genres across artists', () => {
    const artists = [
      { genres: ['french pop', 'indie'] },
      { genres: ['french pop', 'chanson'] },
      { genres: ['indie'] },
    ]
    const result = aggregateGenres(artists, 3)
    expect(result).toEqual([
      { genre: 'french pop', count: 2 },
      { genre: 'indie', count: 2 },
      { genre: 'chanson', count: 1 },
    ])
  })

  it('limits to the requested count', () => {
    const artists = [
      { genres: ['a', 'b', 'c', 'd', 'e'] },
    ]
    const result = aggregateGenres(artists, 2)
    expect(result).toHaveLength(2)
  })

  it('returns empty array for artists with no genres', () => {
    const artists = [{ genres: [] }, { genres: [] }]
    expect(aggregateGenres(artists, 10)).toEqual([])
  })

  it('sorts by count descending', () => {
    const artists = [
      { genres: ['rare'] },
      { genres: ['common', 'common2'] },
      { genres: ['common'] },
    ]
    const result = aggregateGenres(artists, 10)
    expect(result[0].genre).toBe('common')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run lib/spotify-genres.test.ts
```

Expected: FAIL — `aggregateGenres` is not exported from `./spotify`

- [ ] **Step 3: Extract `aggregateGenres` from `spotify.ts`**

In `web/lib/spotify.ts`, find the inline genre aggregation block (around line 205):

```typescript
const genreCount: Record<string, number> = {}
;(topArtists.items as SpotifyArtist[]).forEach((artist) => {
  artist.genres?.forEach((genre) => {
    genreCount[genre] = (genreCount[genre] || 0) + 1
  })
})

const topGenres = Object.entries(genreCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 8)
  .map(([genre, count]) => ({ genre, count }))
```

Replace it with a call to the new exported helper, and add the helper above `mapTracks`:

```typescript
export function aggregateGenres(
  artists: { genres?: string[] }[],
  limit: number,
): { genre: string; count: number }[] {
  const count: Record<string, number> = {}
  for (const artist of artists) {
    for (const genre of artist.genres ?? []) {
      count[genre] = (count[genre] ?? 0) + 1
    }
  }
  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre, c]) => ({ genre, count: c }))
}
```

Then replace the inline block with:

```typescript
const topGenres = aggregateGenres(topArtists.items as SpotifyArtist[], 10)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd web && npx vitest run lib/spotify-genres.test.ts
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add web/lib/spotify.ts web/lib/spotify-genres.test.ts
git commit -m "refactor(spotify): extract aggregateGenres helper with tests"
```

---

### Task 2: Add `topGenresByRange` to data layer and types

**Files:**
- Modify: `web/lib/spotify.ts` (compute genres per range)
- Modify: `web/lib/types.ts` (add field to `SpotifyData`)

- [ ] **Step 1: Add `topGenresByRange` to `SpotifyData` in `types.ts`**

In `web/lib/types.ts`, find the `SpotifyData` interface (around line 205). Add the new field after `topGenres`:

```typescript
  topGenres: { genre: string; count: number }[]
  topGenresByRange?: Record<SpotifyTimeRange, { genre: string; count: number }[]>
```

- [ ] **Step 2: Compute `topGenresByRange` in `spotify.ts`**

In `web/lib/spotify.ts`, after the `topGenres` line, add:

```typescript
const topGenresByRange = {
  short_term: aggregateGenres(artistsShort.items as SpotifyArtist[], 10),
  medium_term: aggregateGenres(artistsMed.items as SpotifyArtist[], 10),
  long_term: aggregateGenres(artistsLong.items as SpotifyArtist[], 10),
}
```

- [ ] **Step 3: Include `topGenresByRange` in the `data` object**

In the same file, find the `const data: SpotifyData = {` block. After `topGenres,` add:

```typescript
      topGenresByRange,
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add web/lib/spotify.ts web/lib/types.ts
git commit -m "feat(spotify): compute topGenresByRange for all time ranges"
```

---

### Task 3: Add `GenreBreakdown` component to `SpotifyClient`

**Files:**
- Modify: `web/components/spotify-client.tsx`

- [ ] **Step 1: Add the `GenreBreakdown` sub-component**

In `web/components/spotify-client.tsx`, add this function **before** `export function SpotifyClient`:

```typescript
function GenreBreakdown({ genres }: { genres: { genre: string; count: number }[] }) {
  if (!genres || genres.length === 0) return null
  const max = genres[0].count

  return (
    <div className="tech-card p-6 mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-earth-leaf/10 border border-earth-leaf/30 rounded-lg">
          <ListMusic className="w-5 h-5 text-earth-leaf" />
        </div>
        <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
          Top genres
        </h3>
      </div>
      <div className="space-y-3">
        {genres.map(({ genre, count }, i) => {
          const pct = Math.round((count / max) * 100)
          return (
            <div key={genre} className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-text-muted w-4 text-right">{i + 1}</span>
              <span className="text-sm text-text-secondary w-44 truncate capitalize">{genre}</span>
              <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-earth-leaf/70 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-mono text-earth-leaf num w-6 text-right">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Insert `GenreBreakdown` into the render tree, after `topAlbums`**

In `web/components/spotify-client.tsx`, find the closing `</FadeIn>` that wraps the top albums block (the one ending with `{data.topAlbums && ...}`). After that closing tag, add:

```tsx
      {data.topGenresByRange && (
        <FadeIn delay={0.27}>
          <GenreBreakdown genres={data.topGenresByRange[range] ?? data.topGenres} />
        </FadeIn>
      )}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add web/components/spotify-client.tsx
git commit -m "feat(spotify): add GenreBreakdown section synced with period selector"
```

---

### Task 4: Full verification

- [ ] **Step 1: Run all tests**

```bash
cd web && npm test
```

Expected: all tests pass (including new `spotify-genres.test.ts`)

- [ ] **Step 2: Type-check**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Verify the cache is invalidated on next sync**

The Spotify cache TTL is 1 hour (`SPOTIFY_CACHE_TTL = 3600_000`). `topGenresByRange` will be absent from the existing cached JSON until the cache refreshes. The component handles this gracefully: it renders nothing when `data.topGenresByRange` is undefined (the outer `&&` guard in Step 2 of Task 3).

No action needed — just confirm the guard is in place.

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -p
git commit -m "chore(spotify): cleanup after genre breakdown"
```

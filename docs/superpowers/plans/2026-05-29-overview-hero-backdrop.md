# Bandeau Aperçu — Backdrop du jour — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le fond vert du bandeau de l'aperçu par un backdrop de film/série « du jour », choisi de façon déterministe parmi les titres les mieux notés, avec voile chaud et texte sombre conservé.

**Architecture:** Un nouveau champ `backdropUrl` est peuplé par le pipeline `build-data.ts` depuis TMDB. Un helper pur `lib/hero-backdrop.ts` sélectionne un backdrop stable par jour parmi le top des titres notés. La page serveur passe ce choix à `OverviewHero`, qui affiche l'image + un voile chaud quand un backdrop existe, et retombe sur le gradient vert sinon.

**Tech Stack:** Next.js 16 (App Router, RSC), TypeScript, Tailwind v4, vitest, next/image. Pipeline data en Node/TS (`tsx`).

---

## File Structure

- `web/lib/types.ts` — ajout `backdropUrl?: string` sur `Film` et `Series`.
- `web/lib/hero-backdrop.ts` — **nouveau** : sélection déterministe du backdrop du jour (pur, testable).
- `web/lib/hero-backdrop.test.ts` — **nouveau** : tests vitest du helper.
- `web/scripts/build-data.ts` — récupère `backdrop_path` TMDB, cache migré vers objet `{poster, backdrop}`, écrit `backdropUrl` dans films/séries.
- `web/app/page.tsx` — calcule le backdrop du jour et le passe à `OverviewHero`.
- `web/components/overview-hero.tsx` — branche « image » (voile chaud + crédit) + fallback vert inchangé.

---

## Task 1: Ajouter `backdropUrl` aux types Film & Series

**Files:**
- Modify: `web/lib/types.ts` (interfaces `Film` et `Series`)

- [ ] **Step 1: Ajouter le champ aux deux interfaces**

Dans `web/lib/types.ts`, ajouter `backdropUrl?: string` juste après `posterUrl?: string` dans `Film` **et** dans `Series` :

```ts
  posterUrl?: string
  backdropUrl?: string
```

(Les deux interfaces ont déjà une ligne `posterUrl?: string` — l'ajout se fait sous chacune.)

- [ ] **Step 2: Vérifier la compilation**

Run: `cd web && npx tsc --noEmit`
Expected: PASS (aucune erreur). Le champ étant optionnel, le code existant reste valide.

- [ ] **Step 3: Commit**

```bash
git add web/lib/types.ts
git commit -m "feat(types): add optional backdropUrl to Film and Series"
```

---

## Task 2: Helper `pickDailyBackdrop` (TDD)

**Files:**
- Create: `web/lib/hero-backdrop.ts`
- Test: `web/lib/hero-backdrop.test.ts`

- [ ] **Step 1: Écrire les tests d'abord**

Créer `web/lib/hero-backdrop.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import type { Film, Series } from '@/lib/types'
import { pickDailyBackdrop } from '@/lib/hero-backdrop'

const film = (title: string, avgRating: number, backdropUrl?: string): Film => ({
  title,
  avgRating,
  backdropUrl,
})
const serie = (title: string, avgRating: number, backdropUrl?: string): Series => ({
  title,
  avgRating,
  backdropUrl,
})

const DAY = 86_400_000

describe('pickDailyBackdrop', () => {
  it('retourne null quand aucun titre n’a de backdrop', () => {
    const films = [film('A', 18), film('B', 19)]
    expect(pickDailyBackdrop(films, [], new Date('2026-05-29T12:00:00Z'))).toBeNull()
  })

  it('ignore les titres sans backdropUrl', () => {
    const films = [film('Sans', 20), film('Avec', 10, 'https://img/avec.jpg')]
    const result = pickDailyBackdrop(films, [], new Date('2026-05-29T12:00:00Z'))
    expect(result).toEqual({ url: 'https://img/avec.jpg', title: 'Avec' })
  })

  it('mélange films et séries dans le pool', () => {
    const films = [film('Film', 12, 'https://img/film.jpg')]
    const series = [serie('Serie', 19, 'https://img/serie.jpg')]
    // 2 entrées triées par note : Serie(19) puis Film(12).
    // On vérifie juste que les deux peuvent sortir selon le jour.
    const d0 = new Date(0) // seed 0 -> index 0 -> Serie (mieux notée)
    const d1 = new Date(DAY) // seed 1 -> index 1 -> Film
    expect(pickDailyBackdrop(films, series, d0)?.title).toBe('Serie')
    expect(pickDailyBackdrop(films, series, d1)?.title).toBe('Film')
  })

  it('est déterministe : même date -> même backdrop', () => {
    const films = [
      film('A', 18, 'https://img/a.jpg'),
      film('B', 17, 'https://img/b.jpg'),
      film('C', 16, 'https://img/c.jpg'),
    ]
    const date = new Date('2026-05-29T12:00:00Z')
    const first = pickDailyBackdrop(films, [], date)
    const again = pickDailyBackdrop(films, [], new Date('2026-05-29T23:59:00Z'))
    expect(first).toEqual(again)
  })

  it('tourne d’un jour à l’autre (pool > 1)', () => {
    const films = [
      film('A', 18, 'https://img/a.jpg'),
      film('B', 17, 'https://img/b.jpg'),
    ]
    const day = new Date('2026-05-29T12:00:00Z')
    const next = new Date(day.getTime() + DAY)
    expect(pickDailyBackdrop(films, [], day)).not.toEqual(pickDailyBackdrop(films, [], next))
  })

  it('ne garde que le top 12 par note', () => {
    // 13 films notés 1..13, tous avec backdrop. Le moins bien noté (note 1) ne doit
    // jamais sortir car hors top 12.
    const films = Array.from({ length: 13 }, (_, i) =>
      film(`F${i + 1}`, i + 1, `https://img/${i + 1}.jpg`)
    )
    const worst = 'F1' // note 1
    const titles = new Set<string>()
    for (let d = 0; d < 365; d++) {
      const r = pickDailyBackdrop(films, [], new Date(d * DAY))
      if (r) titles.add(r.title)
    }
    expect(titles.has(worst)).toBe(false)
    expect(titles.size).toBe(12)
  })
})
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `cd web && npx vitest run lib/hero-backdrop.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/hero-backdrop"` (le module n'existe pas encore).

- [ ] **Step 3: Implémenter le helper**

Créer `web/lib/hero-backdrop.ts` :

```ts
import type { Film, Series } from '@/lib/types'

export interface HeroBackdrop {
  url: string
  title: string
}

const POOL_SIZE = 12
const MS_PER_DAY = 86_400_000

type Rated = { title: string; avgRating?: number; rating?: number; backdropUrl?: string }

function score(item: Rated): number {
  return item.avgRating ?? item.rating ?? 0
}

/**
 * Choisit un backdrop « du jour » de façon déterministe parmi les films + séries
 * les mieux notés. Stable sur une journée (seed = jours depuis epoch), tourne
 * chaque jour. Retourne null si aucun titre n'a de backdrop.
 */
export function pickDailyBackdrop(
  films: Film[],
  series: Series[],
  date: Date
): HeroBackdrop | null {
  const pool: Rated[] = [...films, ...series]
    .filter((item): item is Rated => Boolean(item.backdropUrl))
    .sort((a, b) => score(b) - score(a))
    .slice(0, POOL_SIZE)

  if (pool.length === 0) return null

  const seed = Math.floor(date.getTime() / MS_PER_DAY)
  const index = ((seed % pool.length) + pool.length) % pool.length
  const chosen = pool[index]
  // biome-ignore lint/style/noNonNullAssertion: filtre garantit backdropUrl défini
  return { url: chosen.backdropUrl!, title: chosen.title }
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `cd web && npx vitest run lib/hero-backdrop.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/hero-backdrop.ts web/lib/hero-backdrop.test.ts
git commit -m "feat(overview): add pickDailyBackdrop selector with tests"
```

---

## Task 3: Récupérer le backdrop TMDB dans `build-data.ts`

Ce script fait des I/O réseau (TMDB) ; il n'est pas testé unitairement. Validation par `tsc`. Le cache `covers` passe d'une valeur `string` (poster) à un objet `{poster, backdrop}`, avec lecture rétro-compatible des anciennes entrées string.

**Files:**
- Modify: `web/scripts/build-data.ts`

- [ ] **Step 1: Étendre l'interface du cache (rétro-compatible)**

Remplacer l'interface `CoversCache` (lignes ~23-27) par :

```ts
interface CoverEntry {
  poster: string | null
  backdrop: string | null
}

interface CoversCache {
  games: Record<string, string | null>
  films: Record<string, CoverEntry | string | null>
  series: Record<string, CoverEntry | string | null>
}
```

(`games` reste inchangé. `films`/`series` acceptent l'ancien format `string` pour pouvoir lire un cache existant.)

- [ ] **Step 2: Ajouter la base d'image backdrop**

Sous la ligne `const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'` (~L296), ajouter :

```ts
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280'
```

- [ ] **Step 3: Remplacer `fetchTMDBPoster` par `fetchTMDBImages`**

Remplacer toute la fonction `fetchTMDBPoster` (lignes ~298-334) par :

```ts
interface TMDBImages {
  posterUrl?: string
  backdropUrl?: string
}

async function fetchTMDBImages(
  title: string,
  type: 'movie' | 'tv',
  year?: number
): Promise<TMDBImages> {
  const cacheKey = `${title}|${type}|${year ?? ''}`
  const cacheSection = type === 'movie' ? coversCache.films : coversCache.series
  const cached = cacheSection[cacheKey]

  // Entrée complète (objet) -> hit. Null explicite -> connu introuvable.
  if (cached && typeof cached === 'object') {
    return { posterUrl: cached.poster ?? undefined, backdropUrl: cached.backdrop ?? undefined }
  }
  if (cached === null) {
    return {}
  }
  // cached === undefined (nouveau) ou string (ancien format poster-only) :
  // on (re)fetch pour obtenir le backdrop, en gardant l'ancien poster en secours.
  const legacyPoster = typeof cached === 'string' ? cached : undefined

  try {
    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) return { posterUrl: legacyPoster }

    let url = `${TMDB_BASE_URL}/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=fr-FR`
    if (year) url += `&year=${year}`

    const response = await fetch(url)
    if (!response.ok) {
      if (legacyPoster) return { posterUrl: legacyPoster }
      cacheSection[cacheKey] = null
      return {}
    }

    const data = await response.json()
    const result = data.results?.[0]
    if (!result) {
      if (legacyPoster) return { posterUrl: legacyPoster }
      cacheSection[cacheKey] = null
      return {}
    }

    const posterUrl = result.poster_path
      ? `${TMDB_IMAGE_BASE}${result.poster_path}`
      : legacyPoster
    const backdropUrl = result.backdrop_path
      ? `${TMDB_BACKDROP_BASE}${result.backdrop_path}`
      : undefined

    cacheSection[cacheKey] = { poster: posterUrl ?? null, backdrop: backdropUrl ?? null }
    return { posterUrl, backdropUrl }
  } catch {
    if (legacyPoster) return { posterUrl: legacyPoster }
    cacheSection[cacheKey] = null
    return {}
  }
}
```

- [ ] **Step 4: Mettre à jour le site d'appel films (~L497-510)**

Remplacer :

```ts
    const posterUrl = await fetchTMDBPoster(title, 'movie', year)
    await sleep(50) // Rate limiting

    films.push({
```

par :

```ts
    const { posterUrl, backdropUrl } = await fetchTMDBImages(title, 'movie', year)
    await sleep(50) // Rate limiting

    films.push({
```

et ajouter `backdropUrl,` juste après la ligne `posterUrl,` dans l'objet poussé :

```ts
      posterUrl,
      backdropUrl,
    })
```

- [ ] **Step 5: Mettre à jour le site d'appel séries (~L555-569)**

Remplacer :

```ts
    const posterUrl = await fetchTMDBPoster(title, 'tv', year)
    await sleep(50) // Rate limiting

    series.push({
```

par :

```ts
    const { posterUrl, backdropUrl } = await fetchTMDBImages(title, 'tv', year)
    await sleep(50) // Rate limiting

    series.push({
```

et ajouter `backdropUrl,` juste après la ligne `posterUrl,` dans l'objet poussé :

```ts
      posterUrl,
      backdropUrl,
    })
```

- [ ] **Step 6: Vérifier la compilation**

Run: `cd web && npx tsc --noEmit`
Expected: PASS. Vérifier qu'aucune référence résiduelle à `fetchTMDBPoster` ne subsiste :
Run: `cd web && grep -n "fetchTMDBPoster" scripts/build-data.ts`
Expected: aucune sortie.

- [ ] **Step 7: Commit**

```bash
git add web/scripts/build-data.ts
git commit -m "feat(build-data): fetch TMDB backdrops alongside posters"
```

---

## Task 4: Câbler le backdrop du jour dans la page d'aperçu

**Files:**
- Modify: `web/app/page.tsx`

- [ ] **Step 1: Importer le helper**

Dans `web/app/page.tsx`, ajouter sous les imports `@/lib/*` existants :

```ts
import { pickDailyBackdrop } from '@/lib/hero-backdrop'
```

- [ ] **Step 2: Calculer le backdrop du jour**

Après le calcul de `streaks`/`goals` (avant le `return`), ajouter :

```ts
  const heroBackdrop = pickDailyBackdrop(allFilms, allSeries, new Date())
```

- [ ] **Step 3: Passer la prop à `OverviewHero`**

Remplacer `<OverviewHero>` par :

```tsx
      <OverviewHero backdrop={heroBackdrop ?? undefined}>
```

(La balise de fermeture `</OverviewHero>` reste inchangée.)

- [ ] **Step 4: Vérifier la compilation**

Run: `cd web && npx tsc --noEmit`
Expected: PASS. `OverviewHero` n'accepte pas encore la prop `backdrop` → cette étape **peut** échouer ici ; dans ce cas, c'est attendu et corrigé en Task 5. Si tu exécutes les tâches dans l'ordre, fais Task 5 avant de relancer `tsc`.

- [ ] **Step 5: Commit**

```bash
git add web/app/page.tsx
git commit -m "feat(overview): wire daily backdrop into OverviewHero"
```

---

## Task 5: Affichage image + voile chaud dans `OverviewHero`

**Files:**
- Modify: `web/components/overview-hero.tsx`

- [ ] **Step 1: Réécrire le composant avec la branche image**

Remplacer **tout** le contenu de `web/components/overview-hero.tsx` par :

```tsx
import Image from 'next/image'
import type { HeroBackdrop } from '@/lib/hero-backdrop'

/**
 * Bandeau atmosphérique de l'aperçu.
 * - Avec `backdrop` : image TMDB en fond + voile chaud (basé sur --bg-primary,
 *   donc adaptatif clair/sombre) pour garder le texte éditorial sombre lisible,
 *   plus un crédit discret du titre.
 * - Sans `backdrop` : gradient-mesh solarpunk + orbes flottants (fallback).
 * Le contenu (PageHeader…) passe en children, au-dessus du décor (z-[2]).
 */
export function OverviewHero({
  children,
  backdrop,
}: {
  children: React.ReactNode
  backdrop?: HeroBackdrop
}) {
  if (backdrop) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-border-subtle shadow-soft mb-12 px-6 sm:px-10 py-10 sm:py-12">
        <Image
          src={backdrop.url}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover saturate-[0.9] scale-105"
        />
        {/* Voile chaud : dense côté titre (bas-gauche), fondant vers l'image. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgb(var(--bg-primary) / 0.94) 0%, rgb(var(--bg-primary) / 0.78) 38%, rgb(var(--bg-primary) / 0.4) 70%, rgb(var(--bg-primary) / 0.25) 100%)',
          }}
        />
        <div className="relative z-[2]">{children}</div>
        <span className="absolute bottom-3 right-5 z-[2] font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          {backdrop.title}
        </span>
      </section>
    )
  }

  return (
    <section
      className="gradient-mesh relative overflow-hidden rounded-3xl border border-border-subtle shadow-soft mb-12 px-6 sm:px-10 py-10 sm:py-12"
      style={
        {
          '--mesh-a': '163 181 152',
          '--mesh-b': '79 140 74',
          '--mesh-c': '123 168 150',
        } as React.CSSProperties
      }
    >
      {/* Orbes flottants — derrière le contenu, n'interceptent rien */}
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, rgb(var(--accent) / 0.5), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full blur-3xl opacity-30"
        style={{
          background: 'radial-gradient(circle, rgb(var(--accent-warm) / 0.45), transparent 70%)',
          animationDelay: '1.5s',
        }}
      />
      <div className="relative z-[2]">{children}</div>
    </section>
  )
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `cd web && npx tsc --noEmit`
Expected: PASS (la prop `backdrop` est maintenant déclarée, accordée avec Task 4).

- [ ] **Step 3: Commit**

```bash
git add web/components/overview-hero.tsx
git commit -m "feat(overview): render backdrop image with warm scrim in hero"
```

---

## Task 6: Validation finale & génération des données

**Files:** aucun (vérification + pipeline data)

- [ ] **Step 1: Suite de tests complète**

Run: `cd web && npm test`
Expected: PASS, y compris les 6 tests `hero-backdrop`.

- [ ] **Step 2: Typecheck global**

Run: `cd web && npx tsc --noEmit`
Expected: PASS, aucune erreur.

- [ ] **Step 3: Lint Biome (fichiers touchés)**

Run: `cd web && npx biome check lib/hero-backdrop.ts components/overview-hero.tsx app/page.tsx scripts/build-data.ts`
Expected: PASS (ou auto-fix via `npx biome check --write …` si formatage seul).

- [ ] **Step 4: Peupler les backdrops**

> ⚠️ Ne PAS lancer `next build` pendant un `next dev` actif (casse le `.next` partagé). Cette étape n'est qu'un build de données Python/TS, sans risque pour le dev.

Run: `make update-quick`
Expected: régénère `web/data/films.json` et `web/data/series.json` avec le champ `backdropUrl`. Le premier passage re-sollicite TMDB pour les entrées de l'ancien cache (afin d'obtenir les backdrops) — c'est normal, c'est rate-limité.

Vérification rapide :
Run: `cd web && grep -c "backdropUrl" data/films.json data/series.json`
Expected: un nombre > 0 pour chaque fichier (selon disponibilité TMDB).

- [ ] **Step 5: Vérif visuelle**

Lancer `make dev`, ouvrir l'aperçu : le bandeau doit afficher un backdrop avec voile chaud, titre « Aperçu » lisible, crédit du film en bas-droite. Tester aussi le mode sombre. Si `backdropUrl` est vide partout, le fallback vert s'affiche (pas de régression).

---

## Notes d'exécution

- **Données gitignorées** : `web/data/*.json` n'est pas committé (cf. CLAUDE.md). L'étape 4 de Task 6 ne produit aucun changement git à committer.
- **Cache covers** : après la première régénération, le fichier de cache passe au format objet `{poster, backdrop}`. Si le cache est aussi gitignoré/local, rien à committer non plus.
- **Pas de modification du `PageHeader`** : sa lisibilité repose entièrement sur le voile.

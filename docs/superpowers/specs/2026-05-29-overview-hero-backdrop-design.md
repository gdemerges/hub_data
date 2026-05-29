# Bandeau Aperçu — backdrop du jour

**Date :** 2026-05-29
**Statut :** approuvé, prêt pour plan d'implémentation

## Problème

Le bandeau de la page d'aperçu (`OverviewHero`) affiche un fond vert (gradient-mesh
solarpunk + orbes floues). On veut le remplacer par une image de couverture (backdrop
de film/série) derrière le titre « Aperçu », pour un rendu plus chaleureux et personnel.

## Décisions

| Sujet | Choix |
|-------|-------|
| Source | Backdrops TMDB (nouveau champ `backdropUrl`) |
| Pool | Films + séries les mieux notés |
| Cadence | « Backdrop du jour » — choix déterministe côté serveur, stable sur la journée |
| Traitement | Voile chaud dégradé, texte éditorial sombre conservé (option A) |
| Fallback | Gradient vert actuel si aucun backdrop disponible |

## Architecture

Quatre unités, du plus bas au plus haut niveau :

### 1. Données — `web/lib/types.ts` + `web/scripts/build-data.ts`

- `types.ts` : ajouter `backdropUrl?: string` aux interfaces `Film` et `Series`.
- `build-data.ts` :
  - Nouvelle base d'image : `TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280'`.
  - `fetchTMDBPoster` → `fetchTMDBImages(title, type, year)` renvoyant
    `{ posterUrl?: string; backdropUrl?: string }`. Le résultat TMDB
    (`data.results[0]`) contient déjà `poster_path` **et** `backdrop_path`.
  - Le cache `coversCache[films|series]` passe d'une valeur `string | null` à
    `{ poster: string | null; backdrop: string | null }`.
  - **Lecture rétro-compatible** : si une entrée de cache existante est une `string`
    (ancien format), la traiter comme `poster` et refetch pour obtenir le `backdrop`
    (on ne casse pas le cache existant, on le complète au fil de l'eau).
  - Les deux sites d'appel (films ~L497, séries ~L555) récupèrent `backdropUrl` et
    l'ajoutent à l'objet écrit dans le JSON.
- **Effet** : après `make update` / `make update-quick`, les JSON portent
  `backdropUrl`. Tant que ce n'est pas régénéré, le champ est absent → fallback vert.
  Aucune régression visuelle dans l'intervalle.

### 2. Sélection — nouveau `web/lib/hero-backdrop.ts` (pur, sans I/O)

```ts
export interface HeroBackdrop { url: string; title: string }
export function pickDailyBackdrop(
  films: Film[], series: Series[], date: Date
): HeroBackdrop | null
```

- Pool = films + séries ayant un `backdropUrl` non vide, triés par note
  (`avgRating ?? rating ?? 0`) décroissante, puis tronqués au **top 12**.
- Pool vide → `null`.
- Choix déterministe : `seed = Math.floor(date.getTime() / 86_400_000)` (jours depuis
  epoch UTC), `index = seed % pool.length`. Même date → même backdrop ; jour suivant →
  backdrop suivant (quand le pool a plus d'un élément). Survit au cache 1h de la page.

### 3. Câblage — `web/app/page.tsx`

- `allFilms` et `allSeries` sont déjà chargés.
- Ajouter `const heroBackdrop = pickDailyBackdrop(allFilms, allSeries, new Date())`.
- Passer `backdrop={heroBackdrop ?? undefined}` à `<OverviewHero>`.

### 4. Présentation — `web/components/overview-hero.tsx`

- Nouvelle prop optionnelle `backdrop?: HeroBackdrop`.
- **Avec `backdrop`** :
  - `<Image src={backdrop.url} alt="" fill priority className="object-cover" />`
    (host `image.tmdb.org` déjà whitelisté dans `next.config.js`).
  - Adoucissement léger de l'image (ex. `saturate-[0.9]`, léger `scale`) pour rester
    dans l'esprit doux du thème.
  - **Voile chaud** : `linear-gradient` basé sur `rgb(var(--background) / α)` —
    opacité forte (~0.92) côté coin titre (bas-gauche) fondant vers ~0.35 en
    haut-droite, + un voile plat global léger (~0.15). Basé sur `--background` donc
    s'adapte automatiquement clair (parchemin) / sombre (crépuscule).
  - Crédit du film discret en bas-droite : `backdrop.title` en mono `text-text-muted`.
  - Le mesh vert et les orbes ne sont pas rendus quand une image est présente.
- **Sans `backdrop`** : rendu actuel strictement inchangé (gradient-mesh + orbes) =
  fallback.
- Le `PageHeader` (enfant) n'est **pas modifié** : le texte reste `text-text-primary`,
  la lisibilité est assurée par le voile. Isolation préservée.

## Tests & validation

- **Unitaire** `web/lib/hero-backdrop.test.ts` (vitest) :
  - tri par note + troncature top 12 ;
  - déterminisme : même date → même pick ; date +1 jour → pick différent (pool > 1) ;
  - pool vide → `null` ;
  - titres sans `backdropUrl` ignorés ;
  - mélange films + séries dans le pool.
- **Validation** : `tsc --noEmit` + `vitest` uniquement. Pas de `next build` pendant un
  `next dev` actif (casse le `.next` partagé).
- **Vérif visuelle** : après `make update-quick` (peuple les backdrops). Avant
  régénération, le fallback vert s'affiche — pas de régression.

## Hors-scope (YAGNI)

- Pas de carrousel animé / défilement.
- Pas de champ « favori » curé manuellement.
- Pas de réglage utilisateur.
- Pas de modification des couleurs du `PageHeader`.

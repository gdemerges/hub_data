# Temps de visionnage des séries

**Date** : 2026-05-30
**Statut** : validé

## Objectif

Afficher le temps réel passé devant chaque série (et le cumul global), à partir
d'une donnée **déjà présente** dans le CSV SerieBox.

## Source de données

Le CSV `data/seriebox/shows.csv` contient déjà tout le nécessaire — aucun appel
TMDB requis :

| Colonne | Exemple | Sens |
|---|---|---|
| `Durée moyenne` | `45` | durée moyenne d'un épisode (min) |
| `Temps de visionnage` | `8 heures 15 min` | temps total, format humain |
| **`Minutes`** | **`495`** | **temps total en minutes, déjà calculé par SerieBox** |

`Minutes` est calculé sur les **épisodes vus** (ex. « 13 Reasons Why » : 1 épisode
vu → 52 min, pas les 49 épisodes). C'est exactement « temps passé devant la
série ». On lit cette colonne, point.

## Périmètre

### Inclus (3 emplacements)
1. **Détail série** (modale) : ligne méta horloge `9 h` à côté du compteur d'épisodes.
2. **Carte série** : temps de visionnage compact sur la carte.
3. **En-tête page séries** : cumul global, ex. `1 240 h devant les séries`.
4. **Overview** : carte stat « Heures séries » (cumul).

### Exclu — chantier séparé
- **Year in review / insights** : nécessite `dateCompleted` par série, qui
  **n'existe pas** aujourd'hui (le CSV n'a pas de date de fin de visionnage ;
  `Année de fin` = fin de diffusion, pas date de visionnage). `processSeries` ne
  génère pas `dateCompleted` → le filtre annuel des séries est déjà vide partout
  (year-in-review, goals, on-this-day, correlations). Reconstruire un
  `dateCompleted` fiable fait l'objet d'un **brainstorm dédié** ; il débloquera
  alors les heures séries dans la rétro.

## Conception

### Données
- `processSeries` (`scripts/build-data.ts`) : ajouter `Minutes` à `RawSeries`,
  parser via `parseNumber` → champ `watchMinutes` dans `series.json`.
- `Series` (`lib/types.ts`) : `watchMinutes?: number`.

### Logique (testable, pur)
Nouveau `lib/series-time.ts` :
- `totalSeriesMinutes(series: Series[]): number` — somme des `watchMinutes`.
- `formatWatchHours(minutes: number): string` — minutes → heures arrondies,
  séparateur de milliers FR (ex. `1 240 h`). Renvoie `0 h` si 0/absent.

Tests dans `lib/series-time.test.ts` (vitest), suivant le style de
`lib/goals.test.ts`.

### Affichage
- `components/series-client.tsx` :
  - `SeriesDetail` : ligne `<Clock/> {formatWatchHours(watchMinutes)}` si présent.
  - Carte : exposer le temps via `MediaCard` (badge/sous-titre compact).
- `app/series/page.tsx` : `dateline` ou `status` du `PageHeader` enrichi du cumul
  `formatWatchHours(totalSeriesMinutes(series))`.
- Overview : `app/page.tsx` calcule le cumul, le passe à `OverviewStats`
  (`seriesHours`), nouvelle `StatCard` « Heures séries » (icône horloge, accent
  `saffron`, href `/series`).

## Non-régression
- Une série sans `Minutes` (champ vide) → `watchMinutes` absent → badge masqué,
  exclue du cumul (compte comme 0). Pas d'estimation, pas de `~`.
- Régénéré au prochain `make update-quick` (relit le CSV déjà téléchargé, pas de
  re-download SerieBox, pas de surcoût TMDB).

## Suite
Brainstorm dédié : reconstruction d'un `dateCompleted` par série (snapshots
SerieBox quotidiens, détection de passage à « Terminée »…) → débloque les heures
séries dans le Year in review et répare `goals`/`on-this-day`/`correlations`.

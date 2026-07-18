
# Plan : Remplacement de Reflex Grid par Brix Factory

## Vue d'ensemble
Remplacer intégralement le mode **Reflex Grid** par un mode idle/incremental nommé **Brix Factory**, où le joueur produit passivement des Brix, améliore son usine et grimpe dans un classement dédié. Tout tient sur une seule page (scrollable), avec sauvegarde locale + leaderboard Supabase.

## 1. Base de données (Supabase)

Créer une nouvelle table dédiée (ne pas polluer les tables de scores existantes) :

```
brix_factory_scores
- id, device_id (unique), username
- total_brix_produced (bigint)
- reactor_level, storage_level, amplifier_level
- decorations (csv), created_at, updated_at
```

- GRANT SELECT anon (leaderboard public en lecture), INSERT/UPDATE via edge function `service_role` uniquement.
- RLS activée, pas d'écriture directe.
- Nouvelle edge function `submit-brix-factory` avec rate limiting (réutiliser le pattern `submit-reflex-grid`) et validation Zod.

L'ancienne table `reflex_grid_scores` reste en place mais n'est plus alimentée (pas de suppression pour éviter tout risque).

## 2. Suppression de Reflex Grid côté UI

- Retirer le composant `ReflexGrid` du routing dans `src/pages/Index.tsx`.
- Retirer `onOpenReflexGrid` de `ModeSelection` et remplacer la tuile par **Brix Factory** qui ouvre la nouvelle vue.
- Nettoyer l'entrée `PONG_CIRCULAIRE` dans `constants/modes.ts` → devient `BRIX_FACTORY` (nom "Brix Factory", desc idle).
- `reflexGridApi.ts` conservé mais non appelé (ou supprimé après vérification qu'aucun autre écran ne l'importe).

## 3. Nouveau composant `BrixFactory.tsx`

Une seule page mobile-first, scroll vertical, cohérente avec le thème sombre/néon existant. Sections empilées :

```text
┌─────────────────────────────┐
│ ← Menu    Brix Factory      │
│ 💠 1 240 Brix               │
│ ⚡ 12 / min                  │
├─────────────────────────────┤
│    [ Réacteur pulsant ]     │
│   Stockage 340 / 2000       │
│   [ ▓▓▓▓▓░░░░░ ]            │
│   [   RÉCOLTER   ]          │
├─────────────────────────────┤
│ Améliorations               │
│  • Réacteur   Lv3 → +48/min │
│  • Stockage   Lv2 → 2000    │
│  • Amplificateur ×1.2       │
├─────────────────────────────┤
│ Bonus quotidien             │
│  [ Récupérer +500 Brix ]    │
├─────────────────────────────┤
│ Classement Brix Factory     │
│  1. Alex   45 200           │
│  2. …                       │
└─────────────────────────────┘
```

### État & sauvegarde locale (localStorage clé `brix_factory_state_v1`)

```ts
{
  brix: number,              // solde dépensable
  stored: number,            // en attente de récolte
  totalProduced: number,     // score classement
  reactorLevel: number,      // base 1
  storageLevel: number,
  amplifierLevel: number,
  lastTick: number,          // Date.now() dernière prod
  lastDailyClaim: number,    // ts
  dailyStreak: number
}
```

### Formules

- Production/sec = `baseRate(reactorLevel) * amplifier(amplifierLevel)`
  - `baseRate = 0.2 * reactorLevel` (Brix/sec) → Lv1 = 12/min, Lv2 = 24/min, Lv3 = 36/min…
  - `amplifier = 1 + 0.2 * (amplifierLevel - 1)` (Lv1 ×1.0, Lv2 ×1.2, Lv3 ×1.4…)
- Capacité stockage = `500 * 2^(storageLevel - 1)` (500 / 1000 / 2000 / 4000…)
- Coût réacteur = `100 * level²`
- Coût stockage = `250 * level²`
- Coût amplificateur = `1000 * level²`
- Bonus quotidien : palier fixe (250, 500, 1000, 1500, 2500, 4000, 7500 puis plafond 7500), streak reset si > 48h.

### Boucle temps réel

- Un `useEffect` avec `setInterval(1000)` incrémente `stored` selon prod, plafonné par capacité.
- Au montage : calculer delta `Date.now() - lastTick`, ajouter la prod hors-ligne (plafonnée par capa restante), afficher un petit toast "Ton usine a produit X Brix pendant ton absence."
- Sauvegarde à chaque changement d'état (throttle 1s).

### Récolte

- Bouton "Récolter" : `brix += stored`, `totalProduced += stored`, `stored = 0`, feedback (scale + particules CSS légères), déclenche debounce upload leaderboard.

### Leaderboard

- Nouveau util `src/utils/brixFactoryApi.ts` :
  - `fetchTop(limit=100)` → SELECT direct sur `brix_factory_scores`.
  - `submitBrixScore(totalProduced)` → invoke edge function `submit-brix-factory`.
- Submission automatique après récolte (throttle 30s) + bouton "Actualiser" manuel.
- Affichage rang du joueur (recherche par `device_id`).

### États UI

- Stockage plein → badge rouge "Stockage plein, récolte pour relancer".
- Bouton achat désactivé + coût grisé si `brix < cost`.
- Bonus indisponible → countdown hh:mm:ss.
- Leaderboard loading / erreur → skeleton / message simple.

## 4. Localisation

Ajouter les clés FR/EN/ES dans `useLanguage.tsx` : titre, descriptions modes, boutons (Récolter, Acheter, Bonus quotidien…), messages hors-ligne.

## 5. Non inclus (explicitement mis de côté)
- Pas de connexion avec les autres modes (Cube Dodge → Brix) pour cette version.
- Pas de pubs / IAP / skins spécifiques.
- Pas de tutoriel long, juste des libellés clairs.

## 6. Détails techniques

**Fichiers créés**
- `supabase/functions/submit-brix-factory/index.ts`
- `src/components/BrixFactory.tsx`
- `src/utils/brixFactoryApi.ts`
- `src/utils/brixFactoryState.ts` (persist + formules)

**Fichiers modifiés**
- `src/constants/modes.ts` : renommer `PONG_CIRCULAIRE` → `BRIX_FACTORY` (garder même clé technique `pong_circulaire` en interne pour éviter migration ? **Non** : nouvelle clé `brix_factory` pour cohérence leaderboard. Ancienne clé retirée partout.)
- `src/components/ModeSelection.tsx` : tuile Brix Factory, icône usine (`Factory` de lucide-react), route vers vue dédiée.
- `src/pages/Index.tsx` : remplacer route/vue `reflexGrid` par `brixFactory`.
- `src/hooks/useLanguage.tsx` : nouvelles clés.

**Migration BDD** : une seule migration créant `brix_factory_scores` + policies + grants + trigger `updated_at`.

**Edge function** : réutilise le pattern `submit-reflex-grid` (Deno.serve, esm.sh, Zod, rate limit in-memory, upsert `service_role`).

## 7. Validation

- Build TS + Vite OK.
- Vérif visuelle preview : ouverture mode, récolte, achat, offline gain simulé (modifier `lastTick` dans devtools).
- Leaderboard : `supabase--read_query` sur nouvelle table après submission de test.

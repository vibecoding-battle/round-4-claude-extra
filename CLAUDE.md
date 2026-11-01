# CLAUDE.md

Remake de fan de Clash Royale, jouable dans le navigateur. Interface en français. JavaScript en modules ES natifs : aucun framework, aucune dépendance, aucune étape de build.

## Commandes

```bash
npm start   # http://localhost:5173 (variable PORT pour changer de port)
npm test    # tests de simulation sous Node (node --test tests/sim.test.js)
```

Dans l'app Claude, la configuration d'aperçu s'appelle `clash-royale-fan` (`.claude/launch.json`, ignoré par git).

## Architecture

| Chemin | Rôle |
|---|---|
| `src/sim/cards.js` | Données : `UNITS` (profils), `CARDS` (cartes), `TOWERS`, `DEFAULT_DECK` |
| `src/sim/sim.js` | Règles et boucle de combat. Aucun accès au DOM |
| `src/sim/ai.js` | IA à 4 niveaux (`LEVELS`). Joue via `sim.play`, comme un humain |
| `src/data/campaign.js` | 8 arènes (`CHAPTERS`), cartes de départ, decks de combat amical, paliers de trophées |
| `src/render/art.js` | Personnages, bâtiments et tours dessinés en chemins SVG |
| `src/render/sprites.js` | Met les figures en cache par calques (jambes, corps, bras) |
| `src/render/renderer.js` | Canvas 2D : arène en cache (`paintPage`), unités, projectiles, effets |
| `src/ui/battle.js` | Boucle à pas fixe, saisie, HUD. Expose `window.__battle` pour les tests dans le navigateur |
| `src/ui/store.js` | Profil dans `localStorage` (clé `clash-royale-fan.v1`) |
| `src/main.js` | Écrans : accueil, cartes, règles, résultat |
| `src/audio/audio.js` | Effets et musique synthétisés en Web Audio. Aucun fichier son |
| `css/style.css` | Interface. Les variables sont dans `:root` |

Flux d'un combat : `Battle.stepOnce` fait jouer l'IA, avance `Sim.step` à 30 Hz, puis transmet `sim.events` à `Renderer.onEvent` (effets et sons) et à `Battle.onSimEvent` (HUD).

## Règles à respecter

- **`src/sim/` reste sans DOM et déterministe :** il tourne aussi sous Node. Tout aléa passe par `this.rng`, avec graine.
- **La simulation parle au rendu par événements :** `this.emit(...)`. Le rendu lit l'état de la simulation, il ne le modifie pas.
- **Repère :** arène de 18 × 32 cases. Le camp 0 (joueur) est en bas et le camp 1 en haut. Rivière entre `y = 15` et `y = 17`, ponts à `x = 3.5` et `x = 14.5`.
- **Textes du jeu en français ; commentaires de code en français aussi.** Le README est en anglais.

## Assets et cartes

- `assets/cards/<id>.png` : illustrations de cartes (302 × 363), issues de [RoyaleAPI/cr-api-assets](https://github.com/RoyaleAPI/cr-api-assets). Le nom du fichier est exactement l'`id` de la carte. Elles sont affichées avec `<img>`, dans le DOM.
- **Personnages sur le terrain et arène :** dessinés en code, il n'y a aucun sprite extrait du jeu. Chaque `unit` doit avoir son entrée dans `FIGURES` (`art.js`), sinon `figure()` lève une erreur au rendu. Les tests Node ne le détectent pas.
- `docs/cartes.md` : fiche de chaque carte. Elle a été générée depuis `cards.js` par un script non conservé dans le dépôt : à mettre à jour à la main quand une carte change.
- **Statistiques :** bases de [RoyaleAPI/cr-api-data](https://github.com/RoyaleAPI/cr-api-data) (`docs/json/cards_stats.json`), ramenées au niveau 9 par la fonction `lv` selon la rareté. Quelques valeurs sont estimées : elles sont listées en tête de `docs/cartes.md`.

### Ajouter une carte

1. Ajouter l'image `assets/cards/<id>.png`.
2. Ajouter le profil dans `UNITS` si besoin, et la carte dans `CARDS` (`cards.js`).
3. Dessiner la figure dans `FIGURES` (`art.js`) pour toute nouvelle unité.
4. La rendre obtenable : `STARTER_CARDS` ou `unlocks` d'une arène (`campaign.js`).
5. Pour une nouvelle mécanique : la coder dans `sim.js`, l'apprendre à l'IA (`ai.js`), ajouter un test, et ajouter son effet dans `Renderer.onEvent` si elle émet un nouvel événement.
6. Mettre à jour `docs/cartes.md`.

## Workflow

- Commits : Conventional Commits avec gitmoji, en anglais, au nom de Martin uniquement.
- **Martin décide des push :** commits au fur et à mesure, jamais de push sans son accord.
- Après un changement visible, vérifier dans le navigateur. `window.__battle.sim.spawn(team, unit, x, y, 0)` permet de faire apparaître une unité pour la contrôler.

## Points d'attention

- **Droits :** les illustrations appartiennent à Supercell et le projet n'est pas affilié. Garder la mention de la Fan Content Policy (`README.md`, `assets/README.md`).
- **Équilibrage :** les valeurs n'ont pas été ajustées sur de vraies parties.
- **Hook de design :** il signale `.btn-rubric`, `.btn-quiet` et `.slot-empty` dans `style.css`. Ce sont des faux positifs : ombre interne des boutons bombés et pointillés d'un emplacement vide.
- `DESIGN.md` décrit le style visuel, `PRODUCT.md` le produit.

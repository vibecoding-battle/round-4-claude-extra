# DESIGN : Guerre des Marges

Décrit le monde tel qu'il est construit. La source de vérité reste le code : variables CSS dans `css/style.css`, pigments et figures dans `src/render/art.js`.

## Le monde
Un codex enluminé dont les drôleries de marge se font la guerre. L'interface est le livre, l'arène est une miniature peinte. Pas de parchemin crème : le fond est un vélin teint pourpre écrit à l'or, comme les codex de luxe.

## Pigments
| Rôle | Valeur |
|---|---|
| Vélin (surfaces) | `#4c1248`, profond `#2c0a2c`, levé `#63195d` |
| Encre d'or (titres, cadres) | `#e8b923`, clair `#ffe27a`, sombre `#9a6a10` |
| Vermillon (action principale, rubriques, camp adverse) | `#d6341e` |
| Lapis (camp du joueur, signets, encre) | `#2347c4` |
| Malachite (prairie, bâtiments) | `#1f7a55` |
| Encre ferro-gallique (tous les traits) | `#1b1410` |
| Texte courant | `#f7e6b4`, secondaire `#d9b98a` |

Le lapis et le vermillon portent l'identité des camps partout : tabards, liseré au sol, barres de vie, bannières.

## Typographie
- Titres et rubriques : Grenze Gotisch (500 à 900), une gothique lisible.
- Texte et interface : Grenze, sa cousine romaine.
- Chargées depuis Google Fonts ; repli sur Georgia hors ligne.

## Composants
- **Bouton** : aplat, trait d'encre de 2 px, filet d'or intérieur. Vermillon pour l'action principale, pourpre pour le reste.
- **Signets** : rubans en haut du livre, la navigation principale.
- **Carte** : miniature sur fond damassé, cadre selon la rareté (ocre commune, argent rare, or épique), goutte d'encre pour le coût.
- **Phylactère** : réplique de l'adversaire, banderole qui se déroule.
- **Folios** : liste des adversaires, numérotée en chiffres romains car l'ordre porte un sens.

## Figures et mouvement
- Toutes les figures sont des chemins SVG tracés à la main (`art.js`) : trait d'encre épais, aplats, un seul accent d'or.
- Elles s'animent comme des découpages : calques jambes, corps et bras qui pivotent, sautillement à la marche, bascule à l'attaque.
- Une mort laisse une tache d'encre qui s'estompe. Une pose apparaît avec un léger rebond.
- `prefers-reduced-motion` coupe les secousses et les transitions.

## Agencement
- Bureau : l'arène en colonne centrale, portrait et répliques à gauche, chronique à droite.
- Mobile : l'arène et la main seules, plein écran, à la verticale. À l'horizontale sur téléphone, une invite demande de tourner l'appareil.

# DESIGN : Clash Royale (projet de fan)

Reproduit au plus près l'allure du jeu, d'après les captures de référence. La source de vérité reste le code : variables CSS dans `css/style.css`, couleurs et figures dans `src/render/art.js`.

## Couleurs
| Rôle | Valeur |
|---|---|
| Fond | `#0d1b4c`, profond `#081233` |
| Panneaux | `#2a58b5` vers `#173a84` |
| Bouton principal | dégradé `#ffdf5e` vers `#e79a12` |
| Bouton secondaire | dégradé `#5fb2ff` vers `#2263c6` |
| Élixir | `#d93ee0` |
| Camp du joueur / adverse | `#2f7fe8` / `#e8403a` |
| Plateau de la main | bois `#8f5f30` vers `#6b4220` |
| Pelouse, chemins, rivière | `#8ccd52`, `#d8b57c`, `#2ea6e6` |

## Typographie
- Titres, boutons et chiffres : Lilita One, blanc à contour sombre.
- Texte courant : Nunito.

## Combat
- Colonne au format téléphone, centrée sur ordinateur. Nom du dresseur en haut à gauche, temps en haut à droite, couronnes au bord droit à hauteur de la rivière.
- Plateau de bois : carte suivante, quatre cartes avec leur coût, barre d'élixir violette.
- Une carte en main teinte en rouge la zone interdite et encadre les tours ennemies de crochets roses.

## Images
- Cartes : illustrations du jeu (`assets/cards/`).
- Terrain et personnages : dessinés en code, grosse tête et contour sombre, avec des calques jambes, corps et bras animés.

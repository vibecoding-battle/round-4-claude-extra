# Guerre des Marges

Duel de cartes en temps réel dans les marges d'un manuscrit enluminé. Deux camps, trois tours chacun, une jauge d'encre, un deck de huit cartes : abats le donjon d'en face avant la fin du temps.

Tout est original : noms, personnages (lapins chevaliers, escargots de siège, gargouilles…), dessins tracés en code et sons synthétisés. Aucun fichier image ou audio, aucun asset de Supercell.

## Installer et lancer

Il faut seulement [Node.js](https://nodejs.org) 18 ou plus récent. Aucune dépendance à installer.

```bash
npm start
```

Puis ouvre <http://localhost:5173>. Si le port est pris, choisis-en un autre avec la variable `PORT` (`PORT=8080 npm start` sous macOS ou Linux, `$env:PORT=8080; npm start` sous PowerShell).

Pour lancer les tests de la simulation :

```bash
npm test
```

Les polices viennent de Google Fonts. Hors ligne, le jeu reste jouable avec une police de repli.

## Comment jouer

- **Poser une carte** : glisse-la sur ta moitié de la page, ou touche-la puis touche la page. Au clavier : `1` à `4`, puis clic. `Échap` met en pause.
- **Encre** : remonte seule, une goutte toutes les 2,8 s, jusqu'à 10. Double dans la dernière minute.
- **Gagner** : une tour vaut une couronne, le donjon trois et termine la partie. À égalité après 3 minutes, une minute de mort subite, puis la tour la plus abîmée perd.

L'écran *Règles* du jeu détaille le reste.

## Ce qui est implémenté

- **Combat complet** : arène avec rivière et deux ponts, 2 tours et 1 donjon par camp, roi endormi qui se réveille, poche de pose après la chute d'une tour, encre double puis triple, prolongation et départage.
- **27 cartes** : 17 troupes, 3 bâtiments, 7 sorts. Unités au sol et volantes, chercheurs de bâtiments, charge, soin, kamikaze, invocation à la mort, générateurs, dégâts de zone, ralentissement, accélération, étourdissement, copie de la dernière carte.
- **Adversaire** : IA à quatre niveaux qui joue avec les mêmes règles et la même API que le joueur (défense, sorts, poussées à plusieurs cartes, punition quand tu n'as plus d'encre). Seul le dernier adversaire a un bonus, annoncé : son encre remonte 15 % plus vite.
- **Campagne** de 8 adversaires avec deck, personnalité et répliques propres, qui débloque des cartes. Escarmouche libre à tout niveau.
- **Grimoire** : composition du deck, fiche et statistiques de chaque carte.
- **Progression** enregistrée dans le navigateur : sceaux, rangs, victoires.
- **Son** : effets et musique modale générés en direct, coupables à tout moment.
- **Bureau et mobile** : souris, tactile et clavier. Premier combat guidé.

## Choix techniques

- **JavaScript sans framework ni étape de build**, modules ES natifs : rien à installer, le code livré est le code exécuté.
- **Simulation déterministe séparée du rendu** (`src/sim/`) : pas fixe de 30 Hz, générateur pseudo-aléatoire à graine, aucun accès au DOM. Elle tourne à l'identique sous Node, ce qui permet de tester de vraies parties et de mesurer l'équilibrage sans navigateur.
- **Canvas 2D** pour l'arène : figures en chemins SVG mises en cache par calques, interpolées à l'affichage. Environ 2 ms de dessin par image avec près de 90 entités (mesure unique, Chrome sans fenêtre sur un PC de bureau).
- **DOM** pour les menus et le HUD, plus accessibles et plus nets que du texte sur canvas.
- **Web Audio** pour tout le son.

```
server.js          serveur statique sans dépendance
src/sim/           règles, cartes, IA (sans DOM)
src/render/        figures, mise en cache, rendu de la bataille
src/audio/         effets et musique synthétisés
src/ui/            boucle de combat, saisie, HUD, profil
src/data/          campagne et rangs
src/main.js        écrans
tests/             19 tests, dont des parties complètes IA contre IA
```

## Vérifications

- `npm test` : 19 tests passent (règles de pose, déplacements, sorts, prolongation, reproductibilité, parties complètes sur des decks variés, et le niveau expert qui bat le novice).
- Parcouru dans Chrome de bout en bout : souris, clavier, tactile émulé, pause, partie jusqu'au résultat (l'IA jouant à ma place, en accéléré), déblocages, en 1280×720, 1440×900 et 390×844, sans erreur console.
- Non vérifié : Safari et Firefox, un vrai téléphone, une partie entière jouée par un humain, et l'écoute du son (les effets s'exécutent sans erreur, mais personne ne les a entendus).

## Limites connues

- L'équilibrage a été mesuré sur des parties IA contre IA, pas contre des humains. Entre IA de même niveau, la plupart des parties vont en prolongation avec peu de couronnes, surtout avec le deck de départ, qui n'a pas de carte de siège.
- Maître et Grand Maître sont de force proche quand ils s'affrontent directement.
- Pas de multijoueur en réseau.

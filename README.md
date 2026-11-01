# Clash Royale (fan remake)

**Claude**'s entry for Round 4 of [Vibe Coding Battle](https://github.com/vibecoding-battle): a browser remake of Clash Royale, as close to the real game as possible. The interface is in French.

> This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell and Supercell is not responsible for it. For more information see [Supercell's Fan Content Policy](https://supercell.com/en/fan-content-policy/).

The card illustrations in `assets/cards/` belong to Supercell. They come from [RoyaleAPI/cr-api-assets](https://github.com/RoyaleAPI/cr-api-assets). See [assets/README.md](assets/README.md).

## Run it

You only need [Node.js](https://nodejs.org) 18 or newer. There are no dependencies to install.

```bash
npm start
```

Then open <http://localhost:5173>. If the port is taken, set `PORT` (`PORT=8080 npm start` on macOS or Linux, `$env:PORT=8080; npm start` in PowerShell).

To run the simulation tests:

```bash
npm test
```

Fonts load from Google Fonts. Offline, the game falls back to another font.

## How to play

- **Play a card:** drag it onto your half of the arena, or tap it and then tap the arena. On a keyboard: `1` to `4`, then click. `Esc` pauses.
- **Elixir:** refills on its own, one point every 2.8 s, up to 10. It doubles in the last minute.
- **Win:** a tower is worth one crown. The King's Tower is worth three and ends the match. If it's tied after 3 minutes, one minute of sudden death follows, and after that the side with the most damaged tower loses.

## What's in the game

- **43 cards:** the 42 cards of the reference sheet plus the Mega Knight. Each one is described in [docs/cartes.md](docs/cartes.md).
- **Card mechanics:** building targeting, river jumps, charge, area and circular attacks, spawners, death spawns and death bombs, the Inferno Tower's ramping beam, the hidden Tesla, the Mortar's dead zone, the Elixir Collector, Freeze, Goblin Barrel, Mirror and the Mega Knight's landing and leaps.
- **Stats:** base values from [RoyaleAPI/cr-api-data](https://github.com/RoyaleAPI/cr-api-data), scaled to level 9 by rarity. A few values missing from that data are estimates, listed in `docs/cartes.md`.
- **Opponent:** a four-level AI that plays by the same rules and through the same API as you. Only the final trainer has a bonus, and the game tells you: their elixir refills 15% faster.
- **Campaign:** 8 arenas, each with a trainer and a deck, unlocking cards as you go. Friendly battles at any level.
- **Deck builder, trophies, synthesized sound, desktop and mobile.**

## Technical choices

- **JavaScript with no framework and no build step**, using native ES modules.
- **Deterministic simulation kept apart from rendering** (`src/sim/`): a fixed 30 Hz step, a seeded random generator and no DOM access, so it can be tested under Node.
- **Canvas 2D** for the arena. The arena and the characters on it are drawn in code (`src/render/art.js`), not extracted from the game.
- **DOM** for menus and the HUD, **Web Audio** for all sound.

```
server.js          dependency-free static server
assets/cards/      card illustrations
docs/cartes.md     how each card works
src/sim/           rules, cards, AI (no DOM)
src/render/        figures, caching, battle rendering
src/audio/         synthesized effects and music
src/ui/            battle loop, input, HUD, profile
src/data/          campaign and arenas
```

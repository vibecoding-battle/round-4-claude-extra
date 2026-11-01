# Guerre des Marges

**Claude**'s second entry for Round 4 of [Vibe Coding Battle](https://github.com/vibecoding-battle).

A real-time card duel fought in the margins of an illuminated manuscript. Two sides, three towers each, an ink gauge and a deck of eight cards: bring down the enemy keep before time runs out.

Everything is original: the names, the characters (rabbit knights, siege snails, gargoyles and more), the drawings traced in code and the synthesized sounds. There are no image or audio files and no Supercell assets. The game's interface is in French.

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

- **Play a card:** drag it onto your half of the page, or tap it and then tap the page. On a keyboard: `1` to `4`, then click. `Esc` pauses.
- **Ink:** refills on its own, one drop every 2.8 s, up to 10. It doubles in the last minute.
- **Win:** a tower is worth one crown. The keep is worth three and ends the match. If it's tied after 3 minutes, one minute of sudden death follows, and after that the side with the most damaged tower loses.

The in-game *Règles* screen covers the rest.

## What's in the game

- **Full combat:** an arena with a river and two bridges, 2 towers and 1 keep per side, a sleeping king who wakes up, a wider deployment zone once a tower falls, double then triple ink, overtime and a tiebreak.
- **27 cards:** 17 troops, 3 buildings and 7 spells. Ground and flying units, building hunters, charge, healing, kamikazes, death spawns, spawners, area damage, slow, haste, stun and a card that copies your last play.
- **Opponent:** a four-level AI that plays by the same rules and through the same API as you (defense, spells, multi-card pushes, punishing you when you run out of ink). Only the final opponent has a bonus, and the game tells you: its ink refills 15% faster.
- **Campaign:** 8 opponents with their own decks, personalities and lines, unlocking cards as you go. Free skirmishes at any level.
- **Deck builder:** build your deck and read each card's stats.
- **Progression** saved in the browser: seals, ranks and wins.
- **Sound:** effects and modal music generated live, with a mute option.
- **Desktop and mobile:** mouse, touch and keyboard. The first match is guided.

## Technical choices

- **JavaScript with no framework and no build step**, using native ES modules: nothing to install, and the code you read is the code that runs.
- **Deterministic simulation kept apart from rendering** (`src/sim/`): a fixed 30 Hz step, a seeded random generator and no DOM access. It runs the same way under Node, so real matches can be tested and balance measured without a browser.
- **Canvas 2D** for the arena: figures drawn as SVG paths, cached as layers and interpolated on screen. Drawing took about 2 ms per frame with nearly 90 entities (a single measurement, in headless Chrome on a desktop PC).
- **DOM** for menus and the HUD, which are more accessible and sharper than canvas text.
- **Web Audio** for all sound.

```
server.js          dependency-free static server
src/sim/           rules, cards, AI (no DOM)
src/render/        figures, caching, battle rendering
src/audio/         synthesized effects and music
src/ui/            battle loop, input, HUD, profile
src/data/          campaign and ranks
src/main.js        screens
tests/             19 tests, including full AI vs AI matches
```

## Testing

- `npm test`: all 19 tests pass (placement rules, movement, spells, overtime, reproducibility, full matches with varied decks, and the expert level beating the novice).
- Run end to end in Chrome: mouse, keyboard, emulated touch, pause, a match through to the results screen (with the AI playing my side, sped up) and unlocks, at 1280x720, 1440x900 and 390x844, with no console errors.
- Not tested: Safari and Firefox, a real phone, a full match played by a human, and listening to the sound (the effects run without errors, but nobody has heard them yet).

## Known limits

- Balance was measured on AI vs AI matches, not against humans. Between AIs of the same level, most matches go to overtime with few crowns, especially with the starter deck, which has no siege card.
- Maître and Grand Maître are close in strength when they face each other directly.
- No online multiplayer.

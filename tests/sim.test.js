import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AI } from '../src/sim/ai.js';
import { CARDS, CARD_BY_ID, DEFAULT_DECK, UNITS } from '../src/sim/cards.js';
import { H, INK_MAX, MATCH_TIME, OVERTIME, RIVER_BOTTOM, RIVER_TOP, Sim, TICK, W } from '../src/sim/sim.js';

const newSim = (seed = 3, decks = [DEFAULT_DECK, DEFAULT_DECK]) => new Sim({ decks, seed });

function run(sim, seconds, each) {
  const n = Math.round(seconds / TICK);
  for (let i = 0; i < n && !sim.over; i++) {
    if (each) each(i);
    sim.step();
    sim.events.length = 0;
  }
}

// Force une carte en main pour tester un comportement précis, sans dépendre du mélange.
function giveCard(sim, team, id, ink = INK_MAX) {
  const p = sim.players[team];
  p.hand[0] = CARD_BY_ID[id];
  p.ink = ink;
}

function units(sim, team) {
  return sim.entities.filter((e) => e.kind === 'unit' && e.team === team && e.alive);
}

test('chaque carte référence un profil valide et chaque deck par défaut existe', () => {
  for (const c of CARDS) {
    if (c.type !== 'spell') assert.ok(UNITS[c.unit], `${c.id} sans profil`);
    else assert.ok(c.spell || c.copy, `${c.id} sans effet`);
  }
  for (const id of DEFAULT_DECK) assert.ok(CARD_BY_ID[id]);
});

test("l'encre monte jusqu'au maximum et double dans la dernière minute", () => {
  const sim = newSim();
  const start = sim.players[0].ink;
  run(sim, 2.8);
  assert.ok(Math.abs(sim.players[0].ink - start - 1) < 0.05);
  run(sim, 60);
  assert.equal(sim.players[0].ink, INK_MAX);
  sim.time = MATCH_TIME - 30;
  sim.players[0].ink = 0;
  run(sim, 2.8);
  assert.ok(Math.abs(sim.players[0].ink - 2) < 0.05);
});

test('une pose hors de sa moitié ou sans encre est refusée, et la main tourne', () => {
  const sim = newSim();
  giveCard(sim, 0, 'lapin', 10);
  assert.equal(sim.play(0, 0, 9, 10), false, 'moitié adverse');
  assert.equal(sim.play(0, 0, 3.5, 25.5), false, 'sur une tour');
  sim.players[0].ink = 1;
  assert.equal(sim.play(0, 0, 9, 20), false, 'pas assez d’encre');
  sim.players[0].ink = 10;
  const next = sim.players[0].queue[0];
  assert.equal(sim.play(0, 0, 9, 20), true);
  assert.equal(sim.players[0].hand[0], next);
  assert.equal(sim.players[0].queue.at(-1).id, 'lapin');
  assert.equal(sim.players[0].ink, 7);
});

test('la poche de pose s’ouvre après la chute de la tour adverse', () => {
  const sim = newSim();
  const card = CARD_BY_ID.lapin;
  assert.equal(sim.canPlace(0, card, 3, 12), false);
  sim.hurt(sim.towers[1][0], 99999, 0);
  assert.equal(sim.canPlace(0, card, 3, 12), true);
  assert.equal(sim.canPlace(0, card, 14, 12), false, 'seulement sur le côté tombé');
  assert.equal(sim.players[0].crowns, 1);
  assert.equal(sim.towers[1][2].active, true, 'la chute réveille le roi');
});

test('une troupe traverse par le pont, ne nage pas, et atteint la tour', () => {
  const sim = newSim();
  giveCard(sim, 0, 'lapin');
  sim.play(0, 0, 9, 20);
  const rabbit = units(sim, 0)[0];
  let crossedOutsideBridge = false;
  run(sim, 40, () => {
    if (rabbit.alive && rabbit.y > RIVER_TOP && rabbit.y < RIVER_BOTTOM) {
      if (Math.abs(rabbit.x - 3.5) > 1.6 && Math.abs(rabbit.x - 14.5) > 1.6) crossedOutsideBridge = true;
    }
  });
  assert.equal(crossedOutsideBridge, false);
  assert.ok(sim.towers[1][0].hp < sim.towers[1][0].maxHp || sim.towers[1][1].hp < sim.towers[1][1].maxHp, 'une tour a été touchée');
});

test('le grylle saute la rivière hors des ponts', () => {
  const sim = newSim();
  giveCard(sim, 0, 'grylle');
  sim.play(0, 0, 9, 18);
  const g = units(sim, 0)[0];
  let sawRiver = false;
  run(sim, 8, () => {
    if (g.alive && g.y > RIVER_TOP && g.y < RIVER_BOTTOM && Math.abs(g.x - 3.5) > 2 && Math.abs(g.x - 14.5) > 2) sawRiver = true;
  });
  assert.ok(sawRiver);
});

test('une unité au sol contourne une tour alliée placée sur sa route', () => {
  const sim = newSim();
  giveCard(sim, 0, 'lapin');
  // Juste derrière la tour gauche : il doit la contourner pour rejoindre le pont.
  sim.play(0, 0, 3.5, 28);
  const r = units(sim, 0)[0];
  run(sim, 14);
  assert.ok(r.y < 24, `coincé en y=${r.y.toFixed(2)}`);
});

test('les lames ne touchent pas les volants, les archers si', () => {
  const sim = newSim();
  const owl = sim.spawn(1, 'chouette', 9, 22, 0);
  const rabbit = sim.spawn(0, 'lapin', 9, 22.5, 0);
  const monk = sim.spawn(0, 'moine', 9, 26, 0);
  assert.equal(sim.canTarget(rabbit, owl), false);
  assert.equal(sim.canTarget(monk, owl), true);
});

test('les chercheurs de bâtiments ignorent les troupes', () => {
  const sim = newSim();
  const snail = sim.spawn(0, 'escargot', 3.5, 14, 0);
  sim.spawn(1, 'lapin', 3.5, 13, 0);
  run(sim, 2);
  const t = sim.byId.get(snail.target);
  assert.equal(t.kind, 'tower');
});

test('le feu blesse, repousse, et frappe la tour à taux réduit', () => {
  const sim = newSim();
  const mouse = sim.spawn(1, 'souris', 3.5, 8.5, 5); // immobile le temps du déploiement
  const tower = sim.towers[1][0];
  giveCard(sim, 0, 'feu');
  sim.play(0, 0, 3.5, 8);
  run(sim, 3);
  assert.equal(mouse.alive, false);
  assert.ok(Math.abs(tower.maxHp - tower.hp - 340 * 0.35) < 40, 'tour touchée à 35 %');
});

test('le copiste rejoue la dernière carte pour une goutte de plus', () => {
  const sim = newSim();
  const p = sim.players[0];
  giveCard(sim, 0, 'copiste');
  assert.equal(sim.costOf(0, p.hand[0]), Infinity, 'rien à copier au départ');
  assert.equal(sim.play(0, 0, 9, 20), false);
  p.hand[1] = CARD_BY_ID.lapin;
  p.ink = 10;
  sim.play(0, 1, 9, 20);
  assert.equal(sim.costOf(0, p.hand[0]), 4);
  sim.play(0, 0, 5, 20);
  assert.equal(units(sim, 0).filter((u) => u.unit === 'lapin').length, 2);
  assert.equal(p.ink, 3);
});

test('la mort de la gargouille libère ses gargouillons', () => {
  const sim = newSim();
  const g = sim.spawn(1, 'gargouille', 9, 10, 0);
  sim.hurt(g, 99999, 0);
  run(sim, 0.1);
  assert.equal(units(sim, 1).filter((u) => u.unit === 'gargouillon').length, 3);
});

test('la tour du roi tombée donne trois couronnes et termine la partie', () => {
  const sim = newSim();
  sim.hurt(sim.towers[1][2], 99999, 0);
  assert.equal(sim.over.winner, 0);
  assert.equal(sim.players[0].crowns, 3);
});

test('égalité au temps réglementaire : prolongation, puis mort subite', () => {
  const sim = newSim();
  sim.time = MATCH_TIME - TICK / 2;
  sim.step();
  assert.equal(sim.overtime, true);
  assert.equal(sim.over, null);
  sim.hurt(sim.towers[1][0], 99999, 0);
  sim.step();
  assert.equal(sim.over.winner, 0);
  assert.equal(sim.over.reason, 'sudden');
});

test('fin de prolongation sans couronne : la tour la plus abîmée perd', () => {
  const sim = newSim();
  sim.overtime = true;
  sim.time = MATCH_TIME + OVERTIME - TICK / 2;
  sim.towers[0][0].hp -= 100;
  sim.step();
  assert.equal(sim.over.winner, 1);
  assert.equal(sim.over.reason, 'tiebreak');
});

test('la simulation est reproductible à graine égale', () => {
  const play = () => {
    const sim = newSim(42);
    const a = new AI(0, 'fort', 1);
    const b = new AI(1, 'fort', 2);
    run(sim, 90, () => {
      a.update(sim);
      b.update(sim);
    });
    return sim.entities.map((e) => `${e.id}:${e.x.toFixed(4)},${e.y.toFixed(4)},${e.hp.toFixed(2)}`).join('|');
  };
  assert.equal(play(), play());
});

test('IA contre IA : toutes les parties se terminent sans état invalide, sur tous les decks', () => {
  const ids = CARDS.map((c) => c.id);
  const levels = ['novice', 'moyen', 'fort', 'expert'];
  const results = { 0: 0, 1: 0, '-1': 0 };
  let played = 0;
  for (let g = 0; g < 16; g++) {
    const deck = (offset) => Array.from({ length: 8 }, (_, i) => ids[(g * 3 + offset + i * 3) % ids.length]);
    const decks = [[...new Set(deck(0))], [...new Set(deck(5))]];
    while (decks[0].length < 8) decks[0].push(ids.find((id) => !decks[0].includes(id)));
    while (decks[1].length < 8) decks[1].push(ids.find((id) => !decks[1].includes(id)));
    const sim = new Sim({ decks, seed: g + 1 });
    const a = new AI(0, levels[g % 4], g * 2 + 1);
    const b = new AI(1, levels[(g + 1) % 4], g * 2 + 2);
    const before = sim.players[0].stats;
    run(sim, MATCH_TIME + OVERTIME + 1, () => {
      a.update(sim);
      b.update(sim);
    });
    assert.ok(sim.over, `partie ${g} non terminée`);
    for (const e of sim.entities) {
      assert.ok(Number.isFinite(e.x) && Number.isFinite(e.y), `position invalide (${e.unit || e.type})`);
      assert.ok(e.x >= 0 && e.x <= W && e.y >= 0 && e.y <= H, 'hors arène');
    }
    assert.ok(before.cardsPlayed + sim.players[1].stats.cardsPlayed > 4, `partie ${g} sans activité`);
    results[sim.over.winner]++;
    played++;
  }
  assert.equal(played, 16);
  assert.ok(results[0] + results[1] > 0, 'au moins une victoire nette');
});

test('un joueur inactif finit par perdre contre chaque niveau', () => {
  for (const level of ['novice', 'moyen', 'expert']) {
    const sim = newSim(11);
    const ai = new AI(1, level, 5);
    run(sim, MATCH_TIME + OVERTIME + 1, () => ai.update(sim));
    assert.equal(sim.over?.winner, 1, `${level} n'a pas gagné contre un joueur absent`);
  }
});

test('le niveau expert bat nettement le niveau novice', () => {
  let expert = 0;
  const games = 30; // une partie serrée peut basculer : il faut un échantillon suffisant
  for (let g = 0; g < games; g++) {
    const sim = newSim(100 + g);
    const a = new AI(0, 'novice', g + 1);
    const b = new AI(1, 'expert', g + 50);
    run(sim, MATCH_TIME + OVERTIME + 1, () => {
      a.update(sim);
      b.update(sim);
    });
    if (sim.over?.winner === 1) expert++;
  }
  assert.ok(expert >= 18, `expert ne gagne que ${expert}/${games}`);
});

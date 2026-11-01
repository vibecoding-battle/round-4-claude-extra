// Adversaire : observe l'état de la simulation et joue via la même API qu'un humain (`sim.play`).
// Seul le dernier folio bénéficie d'un bonus d'encre, annoncé au joueur.
//
// Les niveaux diffèrent par ce qu'un joueur apprend avec le temps :
// - novice : réagit tard, se trompe de carte, pose une carte à la fois dès qu'il a de quoi ;
// - apprenti : défend correctement, soutient parfois ses attaques ;
// - maître : accumule l'encre pour pousser à plusieurs cartes, utilise ses sorts à bon escient ;
// - grand maître : idem sans erreur, profite des moments où l'adversaire n'a plus d'encre.
import { unitValue, UNITS } from './cards.js';
import { H, mulberry, RIVER_BOTTOM, RIVER_TOP, TICK, W } from './sim.js';

export const LEVELS = {
  novice: { think: 1.5, reaction: 2.6, reserve: 5, mistake: 0.32, ignore: 1.3, overkill: 3, spellGain: 2.2, pushes: false, punish: false, label: 'Novice' },
  moyen: { think: 0.9, reaction: 1.3, reserve: 6, mistake: 0.12, ignore: 1.1, overkill: 2, spellGain: 1.2, pushes: true, punish: false, label: 'Apprenti' },
  fort: { think: 0.5, reaction: 0.7, reserve: 7, mistake: 0.03, ignore: 0.9, overkill: 1.5, spellGain: 0.9, pushes: true, punish: false, label: 'Maître' },
  expert: { think: 0.3, reaction: 0.3, reserve: 8, mistake: 0, ignore: 0.8, overkill: 1, spellGain: 0.75, pushes: true, punish: true, label: 'Grand Maître' },
};

function hitsAir(card) {
  if (card.type === 'spell') return card.spell && (card.spell.kind !== 'zone' || card.spell.effect === 'slow');
  return UNITS[card.unit].targets === 'any';
}

function isSiege(card) {
  return card.type === 'troop' && UNITS[card.unit].targets === 'buildings';
}

function dps(card) {
  if (card.type === 'spell') return 0;
  const u = UNITS[card.unit];
  return u.hit ? (u.dmg / u.hit) * (card.count || 1) : 0;
}

function bulk(card) {
  if (card.type !== 'troop') return 0;
  return UNITS[card.unit].hp * (card.count || 1);
}

export class AI {
  constructor(team, level = 'moyen', seed = 7) {
    this.team = team;
    this.cfg = LEVELS[level] || LEVELS.moyen;
    this.rng = mulberry(seed);
    this.timer = 1.5;
    this.alarm = 0;
    this.lane = this.rng() < 0.5 ? 0 : 1;
    this.supportUntil = 0;
  }

  // Profondeur = distance à sa propre ligne de fond. 0 derrière le donjon, 14 au bord de la rivière.
  toWorldY(depth) {
    return this.team === 1 ? depth : H - depth;
  }

  depthOf(y) {
    return this.team === 1 ? y : H - y;
  }

  update(sim) {
    if (sim.over) return;
    this.timer -= TICK;
    if (this.timer > 0) return;
    this.timer = this.cfg.think * (0.8 + this.rng() * 0.4);
    this.think(sim);
  }

  analyze(sim) {
    const lanes = [0, 1].map((i) => ({ index: i, value: 0, air: 0, count: 0, tank: 0, hunters: 0, swarm: 0, front: 40 }));
    const allies = [0, 0];
    for (const e of sim.entities) {
      if (!e.alive || e.kind !== 'unit') continue;
      const lane = e.x < W / 2 ? 0 : 1;
      if (e.team === this.team) {
        allies[lane] += unitValue(e.unit) * (e.hp / e.maxHp);
        continue;
      }
      const depth = this.depthOf(e.y);
      if (depth > RIVER_BOTTOM + 2) continue; // trop loin pour inquiéter
      const l = lanes[lane];
      l.value += unitValue(e.unit) * (e.hp / e.maxHp);
      l.count++;
      if (e.air) l.air++;
      if (e.maxHp >= 1400) l.tank++;
      if (e.maxHp < 200) l.swarm++;
      if (e.targets === 'buildings') l.hunters++;
      if (depth < l.front) l.front = depth;
    }
    return { lanes, allies };
  }

  think(sim) {
    const me = sim.players[this.team];
    const { lanes, allies } = this.analyze(sim);
    const threat = lanes[0].value >= lanes[1].value ? lanes[0] : lanes[1];
    // Une tour encaisse seule une menace légère : on n'y gaspille pas d'encre.
    const serious = threat.value >= this.cfg.ignore || threat.hunters > 0 || (threat.front < 9 && threat.value > 0.3);

    if (serious) {
      this.alarm += this.cfg.think;
      if (this.alarm >= this.cfg.reaction && this.defend(sim, me, threat)) return;
    } else {
      this.alarm = 0;
    }

    if (this.trySpell(sim, me)) return;
    if (serious && threat.value > allies[threat.index] + 1.5) return;

    if (this.cfg.pushes && sim.time < this.supportUntil && this.support(sim, me)) return;

    if (me.ink >= this.reserve(sim)) this.attack(sim, me);
  }

  reserve(sim) {
    const { cfg } = this;
    let r = cfg.reserve;
    if (sim.inkMultiplier() > 1) r -= 2; // L'encre coule : on peut enchaîner.
    if (cfg.punish && sim.players[1 - this.team].ink <= 2.5) r = Math.min(r, 5);
    return r;
  }

  playable(sim, me) {
    const out = [];
    me.hand.forEach((card, slot) => {
      const real = sim.resolveCard(this.team, card);
      if (!real) return;
      const cost = sim.costOf(this.team, card);
      if (cost > me.ink) return;
      out.push({ slot, card: real, cost });
    });
    return out;
  }

  // --- Défense ---

  defend(sim, me, threat) {
    const options = this.playable(sim, me);
    if (!options.length) return false;
    let best = null;
    let bestScore = 0.25;
    for (const o of options) {
      const score = this.scoreDefense(o, threat);
      if (score > bestScore) {
        bestScore = score;
        best = o;
      }
    }
    if (!best) return false;
    if (this.rng() < this.cfg.mistake) best = options[Math.floor(this.rng() * options.length)];
    const spot = this.placeDefense(sim, best, threat);
    if (spot && sim.play(this.team, best.slot, spot[0], spot[1])) {
      this.alarm = 0;
      return true;
    }
    return false;
  }

  scoreDefense(o, threat) {
    const { card, cost } = o;
    if (card.type === 'spell') {
      if (card.spell.effect === 'rage' || card.spell.effect === 'summon') return 0;
      if (threat.swarm >= 3) return 1.3 - cost * 0.05;
      if (card.spell.effect === 'slow' && threat.value > 4) return 0.5;
      return 0;
    }
    const u = UNITS[card.unit];
    if (u.targets === 'buildings' && !u.building) return 0.05;
    if (u.kamikaze && threat.count < 2 && threat.tank) return 0.3;
    if (threat.air === threat.count && !hitsAir(card)) return 0;
    // Valeur neutralisée rapportée au prix : au-delà de la menace, l'encre est perdue.
    const useful = Math.min(threat.value * this.cfg.overkill + 0.5, card.count * unitValue(card.unit));
    let score = useful / (cost + 1);
    if (threat.air > 0 && hitsAir(card)) score += 0.3;
    if (threat.tank && dps(card) > 150) score += 0.5;
    if (threat.hunters && card.type === 'building') score += 0.7;
    if (threat.swarm >= 3 && u.splash) score += 0.8;
    if (threat.swarm >= 3 && card.count <= 1 && !u.splash) score -= 0.25;
    if (u.heal) score -= 0.3;
    return score + this.rng() * 0.1;
  }

  placeDefense(sim, o, threat) {
    const lane = threat.index;
    if (o.card.type === 'spell') {
      const target = this.bestCluster(sim, o.card);
      return target ? [target.x, target.y] : null;
    }
    const u = UNITS[o.card.unit];
    const front = threat.front >= 40 ? 13 : threat.front;
    let x;
    let depth;
    if (o.card.type === 'building') {
      // Au centre : détourne les chercheurs de bâtiments et reste à portée des deux tours.
      x = lane === 0 ? 7 : 11;
      depth = 9;
    } else if (u.range > 2) {
      depth = Math.max(2, Math.min(9, front - 6));
      x = lane === 0 ? 5.5 : 12.5;
    } else {
      depth = Math.max(5, Math.min(13.5, front - 2.5));
      x = lane === 0 ? 5.5 : 12.5;
    }
    return this.findSpot(sim, o.card, x, depth);
  }

  findSpot(sim, card, x, depth) {
    const tries = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 1], [-2, 1], [2, -1], [-2, -1], [3, 0], [-3, 0], [0, 2], [0, -2]];
    for (const [dx, dd] of tries) {
      const px = Math.min(W - 1, Math.max(1, x + dx));
      const py = this.toWorldY(Math.min(14.2, Math.max(1, depth + dd)));
      if (sim.canPlace(this.team, card, px, py)) return [px, py];
    }
    return null;
  }

  // --- Sorts ---

  bestCluster(sim, card) {
    const { radius } = card.spell;
    let best = null;
    let bestValue = 0;
    for (const e of sim.entities) {
      if (!e.alive || e.team === this.team || e.kind !== 'unit' || e.deployT > 0.2) continue;
      let value = 0;
      for (const o of sim.entities) {
        if (!o.alive || o.team === this.team || o.kind !== 'unit') continue;
        if (Math.abs(o.x - e.x) > radius || Math.abs(o.y - e.y) > radius) continue;
        if (Math.sqrt((o.x - e.x) ** 2 + (o.y - e.y) ** 2) > radius) continue;
        value += this.spellValueOn(card, o);
      }
      if (value > bestValue) {
        bestValue = value;
        best = e;
      }
    }
    return best ? { x: best.x, y: best.y, value: bestValue } : null;
  }

  spellValueOn(card, e) {
    const s = card.spell;
    const total = s.kind === 'volley' ? s.dmg * s.volleys : s.kind === 'zone' ? (s.dps || 0) * (s.duration || 0) : s.dmg || 0;
    if (!total) return 0;
    const dealt = Math.min(total, e.hp);
    const killBonus = total >= e.hp ? 1.5 : 1;
    return (dealt / 450) * killBonus;
  }

  trySpell(sim, me) {
    for (const o of this.playable(sim, me)) {
      const { card, cost } = o;
      if (card.type !== 'spell' || !card.spell) continue;
      const { effect, kind } = card.spell;
      if (effect === 'rage') {
        const spot = this.allyCluster(sim);
        if (spot && spot.count >= 3 && me.ink >= cost + 1 && spot.forward) {
          if (sim.play(this.team, o.slot, spot.x, spot.y)) return true;
        }
        continue;
      }
      if (effect === 'summon') {
        if (me.ink >= 8) {
          const t = this.weakestTower(sim);
          if (sim.play(this.team, o.slot, t.x, t.y + (this.team === 1 ? -3 : 3))) return true;
        }
        continue;
      }
      if (kind === 'blast' || kind === 'smite' || kind === 'volley') {
        const t = this.weakestTower(sim);
        const total = card.spell.dmg * (card.spell.volleys || 1) * card.spell.towerMul;
        // Achever une tour, ou l'user quand l'encre déborderait de toute façon.
        const finisher = t.hp <= total;
        const chip = this.cfg.pushes && me.ink >= 9.5 && kind === 'blast';
        if ((finisher || chip) && sim.play(this.team, o.slot, t.x, t.y)) return true;
      }
      const cluster = this.bestCluster(sim, card);
      if (cluster && cluster.value >= cost * 0.5 * this.cfg.spellGain) {
        if (sim.play(this.team, o.slot, cluster.x, cluster.y)) return true;
      }
    }
    return false;
  }

  allyCluster(sim) {
    let best = null;
    for (const e of sim.entities) {
      if (!e.alive || e.team !== this.team || e.kind !== 'unit') continue;
      let count = 0;
      for (const o of sim.entities) {
        if (o.alive && o.team === this.team && o.kind === 'unit' && Math.abs(o.x - e.x) < 3 && Math.abs(o.y - e.y) < 3) count++;
      }
      if (!best || count > best.count) best = { x: e.x, y: e.y, count, forward: this.depthOf(e.y) > 12 };
    }
    return best;
  }

  weakestTower(sim) {
    const enemy = sim.towers[1 - this.team];
    let best = null;
    for (const t of enemy) {
      if (t.alive && t.type === 'princess' && (!best || t.hp < best.hp)) best = t;
    }
    return best || enemy[2];
  }

  // --- Attaque ---

  chooseLane(sim) {
    const enemy = sim.towers[1 - this.team];
    if (!enemy[0].alive) return 0;
    if (!enemy[1].alive) return 1;
    if (Math.abs(enemy[0].hp - enemy[1].hp) > 150) return enemy[0].hp < enemy[1].hp ? 0 : 1;
    // Sinon, le côté où l'adversaire a le moins de monde et de bâtiments.
    const presence = [0, 0];
    for (const e of sim.entities) {
      if (e.alive && e.team !== this.team && e.kind !== 'tower') presence[e.x < W / 2 ? 0 : 1] += 1;
    }
    if (presence[0] !== presence[1]) return presence[0] < presence[1] ? 0 : 1;
    return this.lane;
  }

  // Unité à la tête de la poussée, pour placer le soutien juste derrière elle.
  pushAnchor(sim) {
    let best = null;
    for (const e of sim.entities) {
      if (!e.alive || e.team !== this.team || e.kind !== 'unit') continue;
      if (this.depthOf(e.y) < 8) continue;
      if (!best || e.maxHp > best.maxHp) best = e;
    }
    return best;
  }

  support(sim, me) {
    const anchor = this.pushAnchor(sim);
    if (!anchor) return false;
    const options = this.playable(sim, me).filter((o) => o.card.type === 'troop' && !isSiege(o.card));
    if (!options.length) return false;
    // Tireurs et gros dégâts derrière le tank ; on garde de quoi répondre si rien ne presse.
    options.sort((a, b) => dps(b.card) / (b.cost + 1) - dps(a.card) / (a.cost + 1));
    const o = options[0];
    const lane = anchor.x < W / 2 ? 0 : 1;
    const behind = Math.min(13.5, this.depthOf(anchor.y) - 2);
    const spot = this.findSpot(sim, o.card, lane === 0 ? 3.5 : 14.5, Math.max(9, behind));
    return !!(spot && sim.play(this.team, o.slot, spot[0], spot[1]));
  }

  attack(sim, me) {
    const options = this.playable(sim, me);
    if (!options.length) return false;
    const lane = this.chooseLane(sim);
    const x = lane === 0 ? 3.5 : 14.5;
    const troops = options.filter((o) => o.card.type === 'troop');
    const sieges = troops.filter((o) => isSiege(o.card));
    let pick = null;
    if (!this.cfg.pushes) {
      // Le novice pose ce qu'il a sous la main.
      if (troops.length) pick = troops[Math.floor(this.rng() * troops.length)];
    } else if (sieges.length) {
      pick = sieges.reduce((a, b) => (bulk(b.card) > bulk(a.card) ? b : a));
    } else if (troops.length) {
      pick = troops.reduce((a, b) => (bulk(b.card) > bulk(a.card) ? b : a));
    }
    if (!pick) {
      // Main sans troupe : un bâtiment plutôt que de stagner à l'encre pleine.
      if (me.ink < 10) return false;
      pick = options.find((o) => o.card.type === 'building');
      if (!pick) return false;
      const spot = this.findSpot(sim, pick.card, lane === 0 ? 7 : 11, 9);
      return !!(spot && sim.play(this.team, pick.slot, spot[0], spot[1]));
    }
    const u = UNITS[pick.card.unit];
    // Les lents partent de plus loin : cela laisse le temps de recharger pour les soutenir.
    let depth = 13.5;
    if (this.cfg.pushes && u.speed < 0.9) depth = me.ink >= 9 ? 6 : 10;
    else if (u.range > 2) depth = 11;
    const spot = this.findSpot(sim, pick.card, x, depth);
    if (spot && sim.play(this.team, pick.slot, spot[0], spot[1])) {
      this.lane = lane;
      this.supportUntil = sim.time + 10 / Math.max(0.7, u.speed);
      return true;
    }
    return false;
  }
}

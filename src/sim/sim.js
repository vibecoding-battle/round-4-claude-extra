// Simulation déterministe à pas fixe, sans DOM : tourne à l'identique dans le navigateur et sous Node.
// Le camp 0 est en bas (y grand) et monte, le camp 1 est en haut et descend.
import { CARD_BY_ID, TOWERS, UNITS } from './cards.js';

export const W = 18;
export const H = 32;
export const TICK = 1 / 30;
export const RIVER_TOP = 15;
export const RIVER_BOTTOM = 17;
export const BRIDGES = [3.5, 14.5];
export const BRIDGE_HW = 1.5;
export const MATCH_TIME = 180;
export const DOUBLE_AT = 60; // secondes restantes
export const OVERTIME = 60;
export const ELIXIR_MAX = 10;
export const ELIXIR_START = 5;
export const ELIXIR_PERIOD = 2.8;

const SIGHT = 5.5;
const RETARGET = 0.25;
const FORMATION = [
  [0, 0], [-0.6, 0.15], [0.6, 0.15], [0, -0.7], [-0.75, -0.55], [0.75, -0.55], [0, 0.75], [-1.1, 0.3], [1.1, 0.3],
  [-0.7, 0.85], [0.7, 0.85], [-1.3, -0.4], [1.3, -0.4], [-0.4, -1.25], [0.4, -1.25],
];

export function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function dist(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

export class Sim {
  constructor({ decks, seed = 1, elixirRate = [1, 1] }) {
    this.rng = mulberry(seed);
    this.tick = 0;
    this.time = 0;
    this.nextId = 1;
    this.entities = [];
    this.byId = new Map();
    this.projectiles = [];
    this.zones = [];
    this.pendingSpells = [];
    this.events = [];
    this.over = null;
    this.overtime = false;
    this.elixirRate = elixirRate;
    this.players = decks.map((deck, team) => {
      const cards = shuffle(deck.map((id) => CARD_BY_ID[id]), this.rng);
      return {
        team,
        elixir: ELIXIR_START,
        hand: cards.slice(0, 4),
        queue: cards.slice(4),
        last: null,
        crowns: 0,
        stats: { cardsPlayed: 0, elixirSpent: 0, damage: 0, towerDamage: 0, kills: 0 },
      };
    });
    this.towers = [[], []];
    for (const team of [0, 1]) {
      const near = (y) => (team === 0 ? H - y : y);
      this.towers[team].push(
        this.addTower(team, 'princess', 3.5, near(6.5), 0),
        this.addTower(team, 'princess', 14.5, near(6.5), 1),
        this.addTower(team, 'king', 9, near(3), -1),
      );
    }
  }

  addTower(team, type, x, y, lane) {
    const def = TOWERS[type];
    const e = {
      id: this.nextId++, kind: 'tower', type, team, lane, x, y, r: def.hw, hw: def.hw, hh: def.hh,
      hp: def.hp, maxHp: def.hp, dmg: def.dmg, hit: def.hit, range: def.range, targets: 'any',
      proj: { kind: type === 'king' ? 'cannonball' : 'arrow', speed: 13 }, cd: 0, windup: 0, target: null, retarget: 0, deployT: 0, alive: true,
      active: type === 'princess', atk: 0, flash: 0, stun: 0,
    };
    this.entities.push(e);
    this.byId.set(e.id, e);
    return e;
  }

  emit(type, data) {
    this.events.push({ type, ...data });
  }

  // --- Règles de pose ---

  timeLeft() {
    return this.overtime ? MATCH_TIME + OVERTIME - this.time : MATCH_TIME - this.time;
  }

  elixirMultiplier() {
    if (this.overtime) return this.timeLeft() <= 30 ? 3 : 2;
    return this.timeLeft() <= DOUBLE_AT ? 2 : 1;
  }

  resolveCard(team, card) {
    if (card.copy) return this.players[team].last;
    return card;
  }

  costOf(team, card) {
    if (!card.copy) return card.cost;
    const last = this.players[team].last;
    return last ? last.cost + 1 : Infinity;
  }

  // Limite de pose sur l'axe y pour un côté, poche incluse si la tour d'en face est tombée.
  deployBound(team, x) {
    const enemy = this.towers[1 - team];
    const lane = x < W / 2 ? 0 : 1;
    const down = !enemy[lane].alive;
    if (team === 0) return down ? 11 : RIVER_BOTTOM + 0.5;
    return down ? H - 11 : RIVER_TOP - 0.5;
  }

  canPlace(team, card, x, y) {
    const real = this.resolveCard(team, card);
    if (!real) return false;
    if (x < 0 || x > W || y < 0 || y > H) return false;
    if (real.type === 'spell') return true;
    if (x < 0.5 || x > W - 0.5 || y < 0.5 || y > H - 0.5) return false;
    if (y > RIVER_TOP - 0.2 && y < RIVER_BOTTOM + 0.2) return false;
    const bound = this.deployBound(team, x);
    if (team === 0 ? y < bound : y > bound) return false;
    const margin = real.type === 'building' ? 1 : 0.2;
    for (const t of this.towers[0].concat(this.towers[1])) {
      if (!t.alive) continue;
      if (Math.abs(x - t.x) < t.hw + margin && Math.abs(y - t.y) < t.hh + margin) return false;
    }
    if (real.type === 'building') {
      for (const e of this.entities) {
        if (e.kind === 'building' && e.alive && !e.def.untargetable && dist(x, y, e.x, e.y) < e.r + UNITS[real.unit].r) return false;
      }
    }
    return true;
  }

  play(team, slot, x, y) {
    if (this.over) return false;
    const p = this.players[team];
    const card = p.hand[slot];
    if (!card) return false;
    const cost = this.costOf(team, card);
    if (p.elixir < cost) return false;
    if (!this.canPlace(team, card, x, y)) return false;
    const real = this.resolveCard(team, card);
    p.elixir -= cost;
    p.hand[slot] = p.queue.shift();
    p.queue.push(card);
    p.last = real;
    p.stats.cardsPlayed++;
    p.stats.elixirSpent += cost;
    this.emit('play', { team, card: real, x, y, copied: !!card.copy, slot });
    if (real.type === 'spell') this.castSpell(team, real, x, y);
    else this.deployCard(team, real, x, y);
    return true;
  }

  deployCard(team, card, x, y) {
    const flip = team === 0 ? 1 : -1;
    for (let i = 0; i < card.count; i++) {
      const [ox, oy] = FORMATION[i % FORMATION.length];
      this.spawn(team, card.unit, x + ox, y + oy * flip, UNITS[card.unit].deploy || 1);
    }
  }

  spawn(team, unitId, x, y, deployT) {
    const u = UNITS[unitId];
    const e = {
      id: this.nextId++, kind: u.building ? 'building' : 'unit', unit: unitId, def: u, team,
      x: Math.min(W - 0.4, Math.max(0.4, x)), y: Math.min(H - 0.4, Math.max(0.4, y)), r: u.r,
      hp: u.hp, maxHp: u.hp, dmg: u.dmg, hit: u.hit, range: u.range, targets: u.targets, proj: u.proj,
      splash: u.splash || 0, speed: u.speed || 0, mass: u.mass || 1000, air: !!u.air, cd: 0, windup: 0, target: null,
      retarget: 0, deployT, deployMax: deployT, alive: true, rageMul: 1, stun: 0, atk: 0, flash: 0, face: team === 0 ? 1 : -1,
      moving: false, hidden: false, leap: null, leapCd: 0, hop: 0, rampT: 0, slide: 0, charged: 0, charging: false, life: u.life || 0, spawnT: u.spawner ? 1 : u.producer ? u.producer.every : 0, healT: 0,
    };
    this.entities.push(e);
    this.byId.set(e.id, e);
    this.emit('spawn', { id: e.id, team, unit: unitId, x: e.x, y: e.y });
    return e;
  }

  castSpell(team, card, x, y) {
    const king = this.towers[team][2];
    const def = card.spell;
    const delay = Math.max(def.speed >= 40 ? 0.1 : 0.3, dist(king.x, king.y, x, y) / (def.speed || 15));
    const immediate = def.kind === 'zone';
    this.pendingSpells.push({ team, card, x, y, t: immediate ? 0.25 : delay, volleysLeft: def.volleys || 1 });
    this.emit('cast', { team, card, x, y, fromX: king.x, fromY: king.y, delay: immediate ? 0.25 : delay });
  }

  // --- Boucle ---

  step() {
    if (this.over) return;
    this.tick++;
    this.time += TICK;
    this.updateElixir();
    this.updateSpells();
    this.updateZones();
    const list = this.entities;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.alive) this.updateEntity(e);
    }
    this.resolveCollisions();
    this.updateProjectiles();
    this.reap();
    this.checkClock();
  }

  updateElixir() {
    const mul = this.elixirMultiplier();
    for (const p of this.players) {
      if (p.elixir < ELIXIR_MAX) {
        p.elixir = Math.min(ELIXIR_MAX, p.elixir + (TICK / ELIXIR_PERIOD) * mul * this.elixirRate[p.team]);
      }
    }
  }

  checkClock() {
    if (this.over) return;
    const [a, b] = this.players;
    if (!this.overtime && this.time >= MATCH_TIME) {
      if (a.crowns !== b.crowns) this.finish(a.crowns > b.crowns ? 0 : 1, 'crowns');
      else {
        this.overtime = true;
        this.emit('overtime', {});
      }
      return;
    }
    if (this.overtime) {
      if (a.crowns !== b.crowns) {
        this.finish(a.crowns > b.crowns ? 0 : 1, 'sudden');
      } else if (this.time >= MATCH_TIME + OVERTIME) {
        const low = (team) => Math.min(...this.towers[team].filter((t) => t.alive).map((t) => t.hp / t.maxHp));
        const la = low(0);
        const lb = low(1);
        if (Math.abs(la - lb) < 1e-6) this.finish(-1, 'draw');
        else this.finish(la > lb ? 0 : 1, 'tiebreak');
      }
    }
  }

  finish(winner, reason) {
    if (this.over) return;
    this.over = { winner, reason };
    this.emit('over', { winner, reason });
  }

  // --- Sorts et zones ---

  updateSpells() {
    for (let i = this.pendingSpells.length - 1; i >= 0; i--) {
      const s = this.pendingSpells[i];
      s.t -= TICK;
      if (s.t > 0) continue;
      const def = s.card.spell;
      if (def.kind === 'blast') {
        this.applyArea(s.team, s.x, s.y, def.radius, def.dmg, def.towerMul, def.knockback);
        if (def.stun) {
          for (const v of this.enemiesIn(s.team, s.x, s.y, def.radius, () => true)) {
            v.stun = Math.max(v.stun, def.stun);
            v.windup = 0;
          }
        }
        this.emit('blast', { x: s.x, y: s.y, radius: def.radius, team: s.team, card: s.card.id });
      } else if (def.kind === 'volley') {
        this.applyArea(s.team, s.x, s.y, def.radius, def.dmg, def.towerMul, 0);
        this.emit('volley', { x: s.x, y: s.y, radius: def.radius, team: s.team });
        s.volleysLeft--;
        if (s.volleysLeft > 0) {
          s.t = def.gap;
          continue;
        }
      } else if (def.kind === 'smite') {
        const victims = this.enemiesIn(s.team, s.x, s.y, def.radius, () => true)
          .sort((a, b) => b.hp - a.hp || a.id - b.id)
          .slice(0, def.strikes);
        for (const v of victims) {
          const mul = v.kind === 'tower' ? def.towerMul : 1;
          this.hurt(v, def.dmg * mul, s.team);
          v.stun = Math.max(v.stun, def.stun);
          v.windup = 0;
          this.emit('smite', { x: v.x, y: v.y });
        }
        if (!victims.length) this.emit('smite', { x: s.x, y: s.y });
      } else if (def.kind === 'drop') {
        let py = s.y;
        if (py > RIVER_TOP && py < RIVER_BOTTOM) py = py < 16 ? RIVER_TOP - 0.1 : RIVER_BOTTOM + 0.1;
        for (let k = 0; k < def.count; k++) {
          const [ox, oy] = FORMATION[k];
          this.spawn(s.team, def.unit, s.x + ox, py + oy, 0.5);
        }
        this.emit('drop', { x: s.x, y: py, radius: def.radius, team: s.team });
      } else if (def.kind === 'zone') {
        if (def.dmg) this.applyArea(s.team, s.x, s.y, def.radius, def.dmg, def.towerMul, 0);
        this.zones.push({
          team: s.team, x: s.x, y: s.y, radius: def.radius, t: def.duration, duration: def.duration, def, card: s.card.id, tickT: 0,
        });
        this.emit('zone', { x: s.x, y: s.y, radius: def.radius, effect: def.effect, team: s.team });
      }
      this.pendingSpells.splice(i, 1);
    }
  }

  updateZones() {
    for (const e of this.entities) {
      if (e.kind === 'unit' || e.kind === 'building') {
        e.rageMul = 1;
      }
    }
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.t -= TICK;
      const { def } = z;
      if (def.effect === 'freeze') {
        for (const e of this.enemiesIn(z.team, z.x, z.y, z.radius, () => true)) {
          e.stun = Math.max(e.stun, TICK * 2);
          e.windup = 0;
        }
      } else if (def.effect === 'rage') {
        for (const e of this.entities) {
          if (e.alive && e.team === z.team && e.kind === 'unit' && dist(e.x, e.y, z.x, z.y) <= z.radius + e.r) {
            e.rageMul = Math.max(e.rageMul, def.rage);
          }
        }
      }
      if (z.t <= 0) this.zones.splice(i, 1);
    }
  }

  enemiesIn(team, x, y, radius, filter) {
    const out = [];
    for (const e of this.entities) {
      if (!e.alive || e.team === team || e.def?.untargetable) continue;
      const d = this.distTo(x, y, e);
      if (d <= radius && filter(e)) out.push(e);
    }
    return out;
  }

  // Distance d'un point au bord de l'entité.
  distTo(x, y, e) {
    if (e.kind === 'tower') {
      const dx = Math.max(Math.abs(x - e.x) - e.hw, 0);
      const dy = Math.max(Math.abs(y - e.y) - e.hh, 0);
      return Math.sqrt(dx * dx + dy * dy);
    }
    return Math.max(0, dist(x, y, e.x, e.y) - e.r);
  }

  applyArea(team, x, y, radius, dmg, towerMul, knockback, filter) {
    for (const e of this.enemiesIn(team, x, y, radius, filter || (() => true))) {
      const mul = e.kind === 'tower' ? towerMul : 1;
      this.hurt(e, dmg * mul, team);
      if (knockback && e.kind === 'unit' && e.mass < 15) {
        const d = dist(e.x, e.y, x, y) || 1;
        const k = (knockback * (1 - Math.min(1, d / (radius + 1)))) / Math.max(1, e.mass / 6);
        e.x += ((e.x - x) / d) * k;
        e.y += ((e.y - y) / d) * k;
      }
    }
  }

  hurt(e, amount, sourceTeam, silent) {
    if (!e.alive || amount <= 0) return;
    e.hp -= amount;
    if (!silent) e.flash = 1;
    const p = this.players[sourceTeam];
    if (p) {
      p.stats.damage += amount;
      if (e.kind === 'tower') p.stats.towerDamage += amount;
    }
    if (!silent) this.emit('hurt', { id: e.id, x: e.x, y: e.y, amount, team: e.team, kind: e.kind });
    if (e.kind === 'tower' && e.type === 'king' && !e.active) {
      e.active = true;
      this.emit('kingAwake', { team: e.team });
    }
    if (e.hp <= 0) this.kill(e, sourceTeam);
  }

  kill(e, sourceTeam) {
    if (!e.alive) return;
    e.alive = false;
    e.hp = 0;
    if (e.kind === 'tower') {
      this.onTowerDown(e);
      return;
    }
    if (sourceTeam !== undefined && this.players[sourceTeam]) this.players[sourceTeam].stats.kills++;
    const u = e.def;
    this.emit('death', { x: e.x, y: e.y, team: e.team, unit: e.unit, air: e.air, r: e.r, building: e.kind === 'building' });
    if (u.deathDamage) {
      this.applyArea(e.team, e.x, e.y, u.deathDamage.radius, u.deathDamage.dmg, u.deathDamage.towerMul ?? 0.5, 0, (t) => !e.air || !t.air);
      this.emit('blast', { x: e.x, y: e.y, radius: u.deathDamage.radius, team: e.team, card: 'death' });
    }
    if (u.deathSpawn) {
      for (let i = 0; i < u.deathSpawn.count; i++) {
        const [ox, oy] = FORMATION[(i + 1) % FORMATION.length];
        const k = u.deathSpawn.count > 1 ? 1 : 0;
        this.spawn(e.team, u.deathSpawn.unit, e.x + ox * k, e.y + oy * k, 0.2);
      }
    }
  }

  onTowerDown(t) {
    const attacker = 1 - t.team;
    const p = this.players[attacker];
    const king = this.towers[t.team][2];
    if (t.type === 'king') {
      p.crowns = 3;
      for (const other of this.towers[t.team]) {
        if (other.alive) {
          other.alive = false;
          other.hp = 0;
          this.emit('towerDown', { x: other.x, y: other.y, team: t.team, type: other.type, crowns: p.crowns, lane: other.lane, by: attacker });
        }
      }
      this.emit('towerDown', { x: t.x, y: t.y, team: t.team, type: 'king', crowns: 3, lane: -1, by: attacker });
      this.finish(attacker, 'king');
      return;
    }
    p.crowns++;
    this.emit('towerDown', { x: t.x, y: t.y, team: t.team, type: t.type, crowns: p.crowns, lane: t.lane, by: attacker });
    if (!king.active) {
      king.active = true;
      this.emit('kingAwake', { team: t.team });
    }
  }

  // --- Comportement ---

  canTarget(e, t) {
    if (!t.alive || t.team === e.team) return false;
    if (t.kind !== 'tower' && t.deployT > 0.3) return false;
    if (t.def?.untargetable || t.hidden) return false;
    if (e.targets === 'ground') return !t.air;
    if (e.targets === 'buildings') return t.kind === 'tower' || t.kind === 'building';
    return e.targets !== 'none';
  }

  edgeDist(e, t) {
    return Math.max(0, this.distTo(e.x, e.y, t) - (e.kind === 'tower' ? 0 : e.r));
  }

  laneTower(e) {
    const enemy = this.towers[1 - e.team];
    const king = enemy[2];
    if (e.air) {
      let best = king;
      let bestD = Infinity;
      for (const t of enemy) {
        if (!t.alive) continue;
        const d = this.distTo(e.x, e.y, t);
        if (d < bestD) {
          bestD = d;
          best = t;
        }
      }
      return best;
    }
    const lane = e.x < W / 2 ? 0 : 1;
    const own = enemy[lane];
    if (own.alive) return own;
    return king.alive ? king : enemy[1 - lane];
  }

  acquire(e) {
    const sight = Math.max(SIGHT, e.range + (e.kind === 'tower' ? 0 : 1));
    let best = null;
    let bestD = Infinity;
    for (const t of this.entities) {
      if (!this.canTarget(e, t)) continue;
      const d = this.edgeDist(e, t);
      const within = e.kind === 'unit' ? d <= sight : d <= e.range;
      if (!within || (e.def?.minRange && d < e.def.minRange)) continue;
      if (d < bestD - 1e-6) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }

  updateEntity(e) {
    if (e.flash > 0) e.flash = Math.max(0, e.flash - TICK * 5);
    if (e.atk > 0) e.atk = Math.max(0, e.atk - TICK * 2.6);
    if (e.kind === 'tower') {
      if (e.active) this.updateShooter(e);
      return;
    }
    if (e.deployT > 0) {
      e.deployT -= TICK;
      if (e.deployT <= 0 && e.def.spawnDamage) {
        const { radius, dmg } = e.def.spawnDamage;
        this.applyArea(e.team, e.x, e.y, radius, dmg, 1, 0.8, (t) => !t.air);
        this.emit('blast', { x: e.x, y: e.y, radius, team: e.team, card: 'landing' });
      }
      return;
    }
    if (e.kind === 'building') {
      e.life -= TICK;
      const decay = (e.maxHp / e.def.life) * TICK;
      this.hurt(e, decay, undefined, true);
      if (!e.alive) return;
      if (e.life <= 0) {
        this.kill(e);
        return;
      }
      if (e.def.spawner && e.stun <= 0) this.updateSpawner(e);
      if (e.def.producer && e.stun <= 0) this.updateProducer(e);
      if (e.targets !== 'none') this.updateShooter(e);
      else if (e.stun > 0) e.stun -= TICK;
      if (e.def.hides) e.hidden = !e.target;
      return;
    }
    this.updateUnit(e);
  }

  updateSpawner(e) {
    e.spawnT -= TICK;
    if (e.spawnT > 0) return;
    const s = e.def.spawner;
    e.spawnT = s.every;
    const forward = e.team === 0 ? -1 : 1;
    for (let i = 0; i < s.count; i++) {
      this.spawn(e.team, s.unit, e.x + (i - (s.count - 1) / 2) * 0.7, e.y + forward * (e.r + 0.4), 0.2);
    }
    e.atk = 1;
  }

  updateProducer(e) {
    e.spawnT -= TICK;
    if (e.spawnT > 0) return;
    e.spawnT = e.def.producer.every;
    const p = this.players[e.team];
    p.elixir = Math.min(ELIXIR_MAX, p.elixir + e.def.producer.amount);
    e.atk = 1;
    this.emit('elixir', { x: e.x, y: e.y, team: e.team });
  }

  updateShooter(e) {
    if (e.stun > 0) {
      e.stun -= TICK;
      e.rampT = 0;
      return;
    }
    e.cd = Math.max(0, e.cd - TICK);
    if (e.target) {
      const t = this.byId.get(e.target);
      if (!t || !this.canTarget(e, t) || this.edgeDist(e, t) > e.range || (e.def?.minRange && this.edgeDist(e, t) < e.def.minRange)) {
        e.target = null;
        e.rampT = 0;
      }
    }
    if (!e.target) {
      const t = this.acquire(e);
      if (t) e.target = t.id;
    }
    const t = e.target && this.byId.get(e.target);
    if (t) {
      e.rampT += TICK;
      this.tryAttack(e, t);
    } else {
      e.windup = 0;
    }
  }

  updateUnit(e) {
    if (e.stun > 0) {
      e.stun -= TICK;
      e.moving = false;
      return;
    }
    if (e.leap) {
      this.updateLeap(e);
      return;
    }
    e.cd = Math.max(0, e.cd - TICK * e.rageMul);
    e.leapCd = Math.max(0, e.leapCd - TICK);
    if (e.def.spawner) this.updateSpawner(e);

    // Choix de la cible : verrouillée tant qu'elle reste à portée.
    e.retarget -= TICK;
    let target = e.target ? this.byId.get(e.target) : null;
    if (target && !this.canTarget(e, target)) target = null;
    const locked = target && this.edgeDist(e, target) <= e.range;
    if (!locked && e.retarget <= 0) {
      e.retarget = RETARGET;
      target = this.acquire(e) || this.laneTower(e);
    }
    if (!target || !target.alive) target = this.laneTower(e);
    e.target = target && target.alive ? target.id : null;
    if (!target || !target.alive) {
      e.moving = false;
      return;
    }

    if (e.def.leap && e.leapCd <= 0 && this.startLeap(e, target)) return;
    const reach = this.edgeDist(e, target) <= e.range;
    if (reach) {
      e.moving = false;
      this.tryAttack(e, target);
    } else {
      e.windup = 0;
      this.moveToward(e, target);
    }
  }

  // Bond du méga chevalier : jamais par-dessus la rivière, et toujours vers une cible au sol.
  startLeap(e, target) {
    const { min, max, dur } = e.def.leap;
    if (target.kind !== 'unit' || target.air) return false;
    if ((e.y - 16) * (target.y - 16) < 0) return false;
    const d = this.edgeDist(e, target);
    if (d < min || d > max) return false;
    e.leap = { t: 0, dur, fx: e.x, fy: e.y, tx: target.x, ty: target.y };
    e.moving = false;
    e.windup = 0;
    e.face = target.x >= e.x ? 1 : -1;
    this.emit('chargeStart', { id: e.id, x: e.x, y: e.y });
    return true;
  }

  updateLeap(e) {
    const l = e.leap;
    const def = e.def.leap;
    l.t += TICK;
    const k = Math.min(1, l.t / l.dur);
    e.x = l.fx + (l.tx - l.fx) * k;
    e.y = l.fy + (l.ty - l.fy) * k;
    e.hop = Math.sin(k * Math.PI);
    if (k < 1) return;
    e.leap = null;
    e.hop = 0;
    e.leapCd = def.cooldown;
    this.applyArea(e.team, e.x, e.y, def.radius, e.dmg * def.dmgMul, 1, 0.6, (t) => !t.air);
    this.emit('blast', { x: e.x, y: e.y, radius: def.radius, team: e.team, card: 'landing' });
  }

  tryAttack(e, target) {
    const interval = e.hit;
    if (e.windup > 0) {
      e.windup -= TICK * (e.rageMul || 1);
      if (e.windup <= 0) {
        e.windup = 0;
        this.strike(e, target);
        e.cd = interval * 0.7;
      }
      return;
    }
    if (e.cd <= 0) {
      e.windup = interval * 0.3;
      e.atk = 1;
      e.face = target.x >= e.x ? 1 : -1;
    }
  }

  strike(e, target) {
    let dmg = e.dmg;
    if (e.def?.ramp) dmg = e.def.ramp[Math.min(e.def.ramp.length - 1, Math.floor(e.rampT / e.def.rampEvery))];
    if (e.charging) {
      dmg *= e.def.charge.dmgMul;
      e.charging = false;
      e.charged = 0;
      this.emit('chargeHit', { x: target.x, y: target.y });
    }
    if (e.proj) {
      // Le tir part du centre du tireur : `lift` n'est qu'une hauteur d'affichage, sinon un camp tirerait de plus près.
      this.projectiles.push({
        x: e.x, y: e.y, tx: target.x, ty: target.y, target: target.id, team: e.team, dmg,
        lift: e.kind === 'tower' ? 2.4 : e.air ? 1.2 : 0.6,
        splash: e.splash, kind: e.proj.kind, speed: e.proj.speed, arc: !!e.proj.arc, traveled: 0, targets: e.targets,
      });
      this.emit('shoot', { kind: e.proj.kind, x: e.x, y: e.y, team: e.team, tower: e.kind === 'tower' });
    } else if (e.def?.spin) {
      this.applyArea(e.team, e.x, e.y, e.def.spin, dmg, 1, 0, (t) => !t.air);
      this.emit('sweep', { x: e.x, y: e.y, radius: e.def.spin });
    } else if (e.splash) {
      this.applyArea(e.team, target.x, target.y, e.splash, dmg, 1, 0, (t) => !t.air);
      this.emit('sweep', { x: target.x, y: target.y, radius: e.splash });
    } else {
      this.hurt(target, dmg, e.team);
      this.emit('melee', { x: target.x, y: target.y, unit: e.unit, heavy: dmg >= 400, beam: !!e.def?.ramp, zap: !!e.def?.hides, fx: e.x, fy: e.y });
    }
  }

  // Cap vers la cible, en passant par un pont si elle est de l'autre côté de la rivière.
  navPoint(e, gx, gy) {
    if (e.air || e.def.jump) return [gx, gy];
    const south = e.y >= RIVER_BOTTOM;
    const north = e.y <= RIVER_TOP;
    const goalSouth = gy >= RIVER_BOTTOM;
    const goalNorth = gy <= RIVER_TOP;
    if ((south && goalSouth) || (north && goalNorth)) return [gx, gy];
    const pick = BRIDGES[0] + BRIDGES[1] - this.farBridge(e.x, gx);
    if (south) return [pick, RIVER_BOTTOM - 0.5];
    if (north) return [pick, RIVER_TOP + 0.5];
    // Déjà sur le pont : on ressort du côté de la cible.
    const bridge = Math.abs(e.x - BRIDGES[0]) < Math.abs(e.x - BRIDGES[1]) ? BRIDGES[0] : BRIDGES[1];
    if (goalNorth || gy < 16) return [bridge, RIVER_TOP - 0.5];
    return [bridge, RIVER_BOTTOM + 0.5];
  }

  farBridge(x, gx) {
    const cost = (b) => Math.abs(x - b) + Math.abs(gx - b);
    return cost(BRIDGES[0]) <= cost(BRIDGES[1]) ? BRIDGES[1] : BRIDGES[0];
  }

  moveToward(e, target) {
    const [wx, wy] = this.navPoint(e, target.x, target.y);
    let dx = wx - e.x;
    let dy = wy - e.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= len;
    dy /= len;
    if (!e.air) [dx, dy] = this.steer(e, dx, dy, target);
    let speed = e.speed * e.rageMul;
    const charge = e.def.charge;
    if (charge) {
      e.charged += speed * TICK;
      if (e.charged >= charge.dist && !e.charging) {
        e.charging = true;
        this.emit('chargeStart', { id: e.id, x: e.x, y: e.y });
      }
      if (e.charging) speed *= charge.speedMul;
    }
    e.x += dx * speed * TICK;
    e.y += dy * speed * TICK;
    if (Math.abs(dx) > 0.15) e.face = dx > 0 ? 1 : -1;
    e.moving = true;
  }

  // Contourne les tours et bâtiments qui barrent la route, en glissant vers l'angle le plus proche.
  steer(e, dx, dy, target) {
    for (const o of this.entities) {
      if (!o.alive || o === e || o.kind === 'unit' || o === target || o.def?.untargetable) continue;
      let nx;
      let ny;
      let gap;
      if (o.kind === 'tower') {
        const cx = Math.max(o.x - o.hw, Math.min(e.x, o.x + o.hw));
        const cy = Math.max(o.y - o.hh, Math.min(e.y, o.y + o.hh));
        nx = e.x - cx;
        ny = e.y - cy;
        gap = Math.sqrt(nx * nx + ny * ny);
        if (gap > e.r + 0.7) continue;
        if (gap < 1e-6) {
          nx = 1;
          ny = 0;
          gap = 1;
        }
        nx /= gap;
        ny /= gap;
      } else {
        nx = e.x - o.x;
        ny = e.y - o.y;
        const d = Math.sqrt(nx * nx + ny * ny) || 1;
        gap = d - o.r;
        if (gap > e.r + 0.7) continue;
        nx /= d;
        ny /= d;
      }
      const into = -(dx * nx + dy * ny);
      if (into < 0.1) continue;
      const tx = -ny;
      const ty = nx;
      const along = dx * tx + dy * ty;
      let sign = along > 0.15 ? 1 : along < -0.15 ? -1 : e.slide;
      if (!sign) {
        sign = (e.x - o.x) * tx + (e.y - o.y) * ty >= 0 ? 1 : -1;
        e.slide = sign;
      }
      dx = dx + nx * into + tx * sign * into;
      dy = dy + ny * into + ty * sign * into;
      const l = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= l;
      dy /= l;
    }
    return [dx, dy];
  }

  resolveCollisions() {
    const list = this.entities;
    const units = [];
    for (const e of list) if (e.alive && e.kind === 'unit') units.push(e);
    for (let i = 0; i < units.length; i++) {
      const a = units[i];
      for (let j = i + 1; j < units.length; j++) {
        const b = units[j];
        if (a.air !== b.air) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const rr = a.r + b.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr) continue;
        const d = Math.sqrt(d2) || 0.001;
        const nx = d2 ? dx / d : (a.id % 2 ? 1 : -1);
        const ny = d2 ? dy / d : 0;
        const overlap = (rr - d) * 0.35;
        const total = a.mass + b.mass;
        a.x -= nx * overlap * (b.mass / total);
        a.y -= ny * overlap * (b.mass / total);
        b.x += nx * overlap * (a.mass / total);
        b.y += ny * overlap * (a.mass / total);
      }
    }
    for (const e of units) {
      if (!e.air) {
        for (const o of list) {
          if (!o.alive || o.kind === 'unit' || o.def?.untargetable) continue;
          if (o.kind === 'tower') this.pushOutRect(e, o);
          else this.pushOutCircle(e, o);
        }
        if (!e.def.jump) this.constrainRiver(e);
      }
      e.x = Math.min(W - 0.3, Math.max(0.3, e.x));
      e.y = Math.min(H - 0.3, Math.max(0.3, e.y));
    }
  }

  pushOutRect(e, o) {
    const cx = Math.max(o.x - o.hw, Math.min(e.x, o.x + o.hw));
    const cy = Math.max(o.y - o.hh, Math.min(e.y, o.y + o.hh));
    const dx = e.x - cx;
    const dy = e.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 >= e.r * e.r) return;
    if (d2 > 1e-9) {
      const d = Math.sqrt(d2);
      e.x = cx + (dx / d) * e.r;
      e.y = cy + (dy / d) * e.r;
      return;
    }
    // Centre à l'intérieur de la tour : sortie par le bord le plus proche.
    const left = e.x - (o.x - o.hw);
    const right = o.x + o.hw - e.x;
    const top = e.y - (o.y - o.hh);
    const bottom = o.y + o.hh - e.y;
    const m = Math.min(left, right, top, bottom);
    if (m === left) e.x = o.x - o.hw - e.r;
    else if (m === right) e.x = o.x + o.hw + e.r;
    else if (m === top) e.y = o.y - o.hh - e.r;
    else e.y = o.y + o.hh + e.r;
  }

  pushOutCircle(e, o) {
    const dx = e.x - o.x;
    const dy = e.y - o.y;
    const rr = e.r + o.r;
    const d2 = dx * dx + dy * dy;
    if (d2 >= rr * rr) return;
    const d = Math.sqrt(d2) || 0.001;
    e.x = o.x + (d2 ? dx / d : 1) * rr;
    e.y = o.y + (d2 ? dy / d : 0) * rr;
  }

  constrainRiver(e) {
    if (e.y <= RIVER_TOP || e.y >= RIVER_BOTTOM) return;
    const bridge = Math.abs(e.x - BRIDGES[0]) < Math.abs(e.x - BRIDGES[1]) ? BRIDGES[0] : BRIDGES[1];
    if (Math.abs(e.x - bridge) <= BRIDGE_HW - 0.1) return;
    if (Math.abs(e.x - bridge) <= BRIDGE_HW + e.r) {
      e.x = bridge + Math.sign(e.x - bridge) * (BRIDGE_HW - 0.1);
      return;
    }
    e.y = e.y < 16 ? RIVER_TOP : RIVER_BOTTOM;
  }

  updateProjectiles() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const t = this.byId.get(p.target);
      if (t && t.alive) {
        p.tx = t.x;
        p.ty = t.y;
      }
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const step = p.speed * TICK;
      if (d > step + 0.15) {
        p.x += (dx / d) * step;
        p.y += (dy / d) * step;
        p.traveled += step;
        continue;
      }
      if (p.splash) {
        const filter = (e) => p.targets !== 'ground' || !e.air;
        this.applyArea(p.team, p.tx, p.ty, p.splash, p.dmg, 1, 0, filter);
        this.emit('splash', { x: p.tx, y: p.ty, radius: p.splash, kind: p.kind });
      } else if (t && t.alive) {
        this.hurt(t, p.dmg, p.team);
        this.emit('impact', { x: p.tx, y: p.ty, kind: p.kind });
      }
      this.projectiles.splice(i, 1);
    }
  }

  reap() {
    const list = this.entities;
    let w = 0;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.alive || e.kind === 'tower') {
        list[w++] = e;
      } else {
        this.byId.delete(e.id);
      }
    }
    list.length = w;
  }
}

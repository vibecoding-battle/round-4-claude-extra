// Rendu Canvas 2D de la bataille : arène peinte en cache, figures en calques, particules.
import { CARD_BY_ID, UNITS } from '../sim/cards.js';
import { BRIDGES, BRIDGE_HW, H, mulberry, RIVER_BOTTOM, RIVER_TOP, W } from '../sim/sim.js';
import { circ, drawParts, INK, PIGMENT as P, TEAMS } from './art.js';
import { blit, SpriteBook } from './sprites.js';

const MARGIN_X = 1.1; // falaises de chaque côté du terrain, en cases
const MARGIN_Y = 1.4;
const FONT = '"Lilita One", "Arial Black", sans-serif';
const MAX_PARTICLES = 420;
const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.book = new SpriteBook();
    this.page = null;
    this.tile = 20;
    this.ox = 0;
    this.oy = 0;
    this.time = 0;
    this.particles = [];
    this.stains = [];
    this.rings = [];
    this.spells = [];
    this.bolts = [];
    this.ruins = [];
    this.floaters = [];
    this.shake = 0;
    this.ghost = null;
    this.showZones = false;
    this.anim = new Map();
    this.rng = mulberry(99);
    this.dpr = 1;
    this.cssW = 0;
    this.cssH = 0;
  }

  resize(cssW, cssH) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cssW === this.cssW && cssH === this.cssH && dpr === this.dpr) return;
    this.dpr = dpr;
    this.cssW = cssW;
    this.cssH = cssH;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    const tile = Math.min(cssW / (W + MARGIN_X * 2), cssH / (H + MARGIN_Y * 2));
    this.tile = tile;
    this.ox = (cssW - W * tile) / 2;
    this.oy = (cssH - H * tile) / 2;
    this.book.setScale(tile * dpr);
    this.page = this.paintPage();
  }

  sx(x) {
    return this.ox + x * this.tile;
  }

  sy(y) {
    return this.oy + y * this.tile;
  }

  toWorld(px, py) {
    return [(px - this.ox) / this.tile, (py - this.oy) / this.tile];
  }

  // --- L'arène : pelouse claire, chemins de terre, rivière, ponts de bois, clôtures et falaises ---

  paintPage() {
    const c = document.createElement('canvas');
    c.width = this.canvas.width;
    c.height = this.canvas.height;
    const g = c.getContext('2d');
    g.scale(this.dpr, this.dpr);
    const t = this.tile;
    const rng = mulberry(1224);
    const x0 = this.ox;
    const y0 = this.oy;
    const ww = W * t;
    const X = (x) => x0 + x * t;
    const Y = (y) => y0 + y * t;

    // Herbe sombre au-delà du terrain, falaises de terre et de roche sur les côtés.
    g.fillStyle = '#4f9a35';
    g.fillRect(0, 0, this.cssW, this.cssH);
    for (const [from, to] of [[0, x0], [x0 + ww, this.cssW]]) {
      g.fillStyle = '#8a6237';
      g.fillRect(from, y0 - t, to - from, (H + 2) * t);
      for (let i = 0; i < 90; i++) {
        const px = from + rng() * (to - from);
        const py = y0 - t + rng() * (H + 2) * t;
        g.fillStyle = rng() < 0.5 ? '#6f4d2a' : '#9c7443';
        g.beginPath();
        g.ellipse(px, py, t * (0.2 + rng() * 0.3), t * (0.14 + rng() * 0.2), 0, 0, 7);
        g.fill();
      }
    }
    // Pelouse : damier très léger, comme la grille du terrain.
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        g.fillStyle = (x + y) % 2 ? '#8ccd52' : '#86c74c';
        g.fillRect(X(x), Y(y), t + 0.5, t + 0.5);
      }
    }
    // Bord d'herbe sur les falaises.
    g.strokeStyle = '#5da838';
    g.lineWidth = t * 0.28;
    g.strokeRect(x0 - t * 0.12, y0 - t * 0.12, ww + t * 0.24, H * t + t * 0.24);

    // Chemins : des bords de pont jusqu'aux tours, puis une allée derrière le roi.
    g.lineCap = 'butt';
    g.lineJoin = 'miter';
    const lanes = [
      [[3.5, 15], [3.5, 3], [14.5, 3], [14.5, 15]],
      [[3.5, 17], [3.5, 29], [14.5, 29], [14.5, 17]],
    ];
    const stroke = (color, width) => {
      g.strokeStyle = color;
      g.lineWidth = width;
      for (const pts of lanes) {
        g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
        g.stroke();
      }
    };
    stroke('#b98f55', t * 1.2);
    stroke('#d8b57c', t * 0.98);

    // Rivière : berges de terre, eau turquoise, reflets.
    const ry = Y(RIVER_TOP);
    const rh = (RIVER_BOTTOM - RIVER_TOP) * t;
    g.fillStyle = '#8a6237';
    g.fillRect(x0, ry - t * 0.22, ww, rh + t * 0.44);
    g.fillStyle = '#2ea6e6';
    g.fillRect(x0, ry, ww, rh);
    g.fillStyle = '#58c4f3';
    g.fillRect(x0, ry + rh * 0.08, ww, rh * 0.32);
    g.strokeStyle = 'rgba(255,255,255,.55)';
    g.lineWidth = Math.max(1, t * 0.07);
    g.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const px = x0 + rng() * ww;
      const py = ry + rng() * rh;
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px + t * (0.3 + rng() * 0.5), py);
      g.stroke();
    }
    // Rochers à l'embouchure et le long des berges.
    const rock = (x, y, r) => {
      g.fillStyle = '#7f8792';
      g.strokeStyle = 'rgba(40,40,60,.55)';
      g.lineWidth = Math.max(1, t * 0.05);
      g.beginPath();
      g.ellipse(X(x), Y(y), r * t, r * t * 0.82, 0, 0, 7);
      g.fill();
      g.stroke();
      g.fillStyle = '#b0b7c1';
      g.beginPath();
      g.ellipse(X(x) - r * t * 0.2, Y(y) - r * t * 0.28, r * t * 0.55, r * t * 0.38, 0, 0, 7);
      g.fill();
    };
    for (const y of [14.6, 17.4]) {
      rock(0.4, y, 0.6);
      rock(17.6, y, 0.6);
    }
    // Ponts de bois.
    for (const bx of BRIDGES) {
      const px = X(bx - BRIDGE_HW + 0.3);
      const bw = (BRIDGE_HW - 0.3) * 2 * t;
      const py = ry - t * 0.5;
      const bh = rh + t;
      g.fillStyle = 'rgba(0,30,60,.35)';
      g.fillRect(px - t * 0.05, py + t * 0.12, bw + t * 0.1, bh);
      g.fillStyle = '#c99455';
      g.fillRect(px, py, bw, bh);
      g.strokeStyle = '#7c5228';
      g.lineWidth = Math.max(1, t * 0.06);
      for (let i = 0; i <= 8; i++) {
        const yy = py + (bh * i) / 8;
        g.beginPath();
        g.moveTo(px, yy);
        g.lineTo(px + bw, yy);
        g.stroke();
      }
      g.fillStyle = '#8a5a2b';
      g.fillRect(px - t * 0.14, py - t * 0.05, t * 0.22, bh + t * 0.1);
      g.fillRect(px + bw - t * 0.08, py - t * 0.05, t * 0.22, bh + t * 0.1);
    }
    // Clôtures aux coins, derrière chaque roi.
    const fence = (a, b, y) => {
      g.fillStyle = '#8a5a2b';
      g.strokeStyle = '#4f3216';
      g.lineWidth = Math.max(1, t * 0.05);
      g.fillRect(X(a), Y(y - 0.45), (b - a) * t, t * 0.18);
      g.strokeRect(X(a), Y(y - 0.45), (b - a) * t, t * 0.18);
      g.fillRect(X(a), Y(y - 0.1), (b - a) * t, t * 0.18);
      g.strokeRect(X(a), Y(y - 0.1), (b - a) * t, t * 0.18);
      for (let x = a; x <= b + 0.01; x += (b - a) / 2) {
        g.fillRect(X(x) - t * 0.13, Y(y - 0.75), t * 0.26, t * 1.05);
        g.strokeRect(X(x) - t * 0.13, Y(y - 0.75), t * 0.26, t * 1.05);
      }
    };
    fence(1.2, 5.6, 1.2);
    fence(12.4, 16.8, 1.2);
    fence(1.2, 5.6, 31.2);
    fence(12.4, 16.8, 31.2);
    // Blason de couronne au fond de chaque camp.
    for (const y of [0.55, 31.45]) {
      g.save();
      g.translate(X(9), Y(y));
      g.scale(t * 0.018, t * 0.018);
      drawParts(g, [['M-22 12L-26-14L-12-2L0-20L12-2L26-14L22 12Z', P.gold]]);
      g.restore();
    }
    // Arbres et rochers de décor, sur les bords hors terrain.
    const tree = (x, y, r) => {
      for (const [dx, dy, k, col] of [[0, 0, 1, '#2f7d33'], [-0.4, 0.2, 0.7, '#37903a'], [0.35, -0.2, 0.68, '#46a647']]) {
        g.fillStyle = col;
        g.beginPath();
        g.arc(X(x + dx * r), Y(y + dy * r), r * k * t, 0, 7);
        g.fill();
      }
    };
    tree(-0.6, 1.4, 1.1);
    tree(18.7, 2.4, 1.2);
    tree(-0.6, 11, 0.8);
    tree(18.7, 10, 0.8);
    tree(-0.6, 24, 0.9);
    tree(18.7, 22, 0.85);
    tree(-0.6, 30.5, 1.1);
    tree(18.7, 30.6, 1);
    rock(-0.6, 6, 0.7);
    rock(18.7, 6.2, 0.75);
    rock(-0.7, 19.5, 0.65);
    rock(18.7, 26, 0.7);
    return c;
  }

  // --- Événements de la simulation vers les effets ---

  consume(events, audio) {
    for (const ev of events) this.onEvent(ev, audio);
  }

  onEvent(ev, audio) {
    switch (ev.type) {
      case 'spawn':
        this.burst(ev.x, ev.y, 7, { color: ev.team === 0 ? P.blueLight : P.redLight, speed: 1.6, life: 0.4, size: 0.1 });
        break;
      case 'play':
        audio?.play('deploy');
        break;
      case 'hurt':
        if (ev.kind === 'tower') {
          this.burst(ev.x, ev.y - 1.2, 3, { color: P.stoneLight, speed: 2.4, life: 0.35, size: 0.1 });
        } else {
          this.burst(ev.x, ev.y - 0.5, Math.min(5, 1 + Math.floor(ev.amount / 60)), { color: INK, speed: 2.6, life: 0.35, size: 0.09 });
        }
        break;
      case 'melee':
        if (ev.beam) break;
        if (ev.zap) {
          audio?.play('thunder');
          this.bolts.push({ x: ev.x, y: ev.y, fromX: ev.fx, fromY: ev.fy - 2, t: 0, dur: 0.14, kind: 'spark', seed: this.rng() });
          break;
        }
        audio?.play(ev.heavy ? 'heavy' : 'hit');
        this.burst(ev.x, ev.y - 0.5, ev.heavy ? 9 : 4, { color: P.goldLight, speed: ev.heavy ? 4.2 : 3, life: 0.28, size: 0.09 });
        if (ev.heavy) this.addShake(0.12);
        break;
      case 'shoot':
        audio?.play(ev.kind === 'fire' || ev.kind === 'magic' ? 'fire' : ev.kind === 'bomb' || ev.kind === 'cannonball' ? 'pop' : 'arrow');
        break;
      case 'impact':
        this.burst(ev.x, ev.y - 0.4, 3, { color: P.goldLight, speed: 2.2, life: 0.22, size: 0.08 });
        break;
      case 'splash':
        audio?.play('pop');
        this.addRing(ev.x, ev.y, ev.radius, ev.kind === 'magic' ? P.elixirLight : '#f08a24', 0.35);
        this.burst(ev.x, ev.y, 14, { color: ev.kind === 'magic' ? P.elixirLight : '#f08a24', speed: 3.6, life: 0.4, size: 0.13 });
        break;
      case 'blast':
        audio?.play('boom');
        this.addRing(ev.x, ev.y, ev.radius, '#f08a24', 0.5);
        this.burst(ev.x, ev.y, 34, { color: '#f08a24', speed: 6, life: 0.55, size: 0.2 });
        this.burst(ev.x, ev.y, 16, { color: INK, speed: 3, life: 0.8, size: 0.24 });
        this.addStain(ev.x, ev.y, ev.radius * 0.7, 'rgba(27,20,16,.55)');
        this.addShake(0.18);
        break;
      case 'sweep':
        audio?.play('hit');
        this.addRing(ev.x, ev.y, ev.radius, P.white, 0.25);
        break;
      case 'drop':
        audio?.play('boom');
        this.addRing(ev.x, ev.y, ev.radius, P.woodLight, 0.35);
        this.burst(ev.x, ev.y, 18, { color: P.wood, speed: 4, life: 0.5, size: 0.14 });
        break;
      case 'elixir':
        audio?.play('pick');
        this.burst(ev.x, ev.y - 1.5, 10, { color: P.elixirLight, speed: 1.6, life: 0.8, size: 0.12, rise: 1.6 });
        break;
      case 'volley':
        audio?.play('volley');
        this.addRing(ev.x, ev.y, ev.radius, P.bone, 0.25);
        for (let i = 0; i < 16; i++) {
          const a = this.rng() * Math.PI * 2;
          const d = Math.sqrt(this.rng()) * ev.radius;
          this.bolts.push({ x: ev.x + Math.cos(a) * d, y: ev.y + Math.sin(a) * d, t: 0, dur: 0.22 + this.rng() * 0.1, kind: 'arrow' });
        }
        break;
      case 'smite':
        audio?.play('thunder');
        this.bolts.push({ x: ev.x, y: ev.y, t: 0, dur: 0.32, kind: 'lightning', seed: this.rng() });
        this.burst(ev.x, ev.y, 16, { color: P.goldLight, speed: 5, life: 0.45, size: 0.13 });
        this.addShake(0.2);
        break;
      case 'zone':
        audio?.play(ev.effect === 'rage' ? 'bell' : 'splat');
        break;
      case 'cast':
        audio?.play('cast');
        if (ev.card.spell.kind !== 'zone') {
          this.spells.push({ card: ev.card, t: 0, dur: ev.delay, fromX: ev.fromX, fromY: ev.fromY - 2, x: ev.x, y: ev.y });
        }
        break;
      case 'death':
        audio?.play(ev.building ? 'crumble' : 'poof');
        this.addStain(ev.x, ev.y, Math.max(0.5, ev.r * 1.05), ev.air ? 'rgba(27,20,16,.3)' : 'rgba(27,20,16,.5)');
        this.burst(ev.x, ev.y - (ev.air ? 1.2 : 0.5), 12, { color: INK, speed: 3, life: 0.5, size: 0.14 });
        this.burst(ev.x, ev.y - (ev.air ? 1.2 : 0.5), 6, { color: ev.team === 0 ? P.blueLight : P.redLight, speed: 3.2, life: 0.5, size: 0.11 });
        break;
      case 'towerDown':
        audio?.play('towerfall');
        this.ruins.push({ x: ev.x, y: ev.y, type: ev.type, t: 0 });
        this.addStain(ev.x, ev.y, 2.4, 'rgba(27,20,16,.45)');
        this.burst(ev.x, ev.y - 1.5, 60, { color: P.stoneLight, speed: 7, life: 0.9, size: 0.26 });
        this.burst(ev.x, ev.y - 1.5, 26, { color: P.gold, speed: 8, life: 1, size: 0.14 });
        this.addShake(0.55);
        break;
      case 'heal':
        this.burst(ev.x, ev.y - 0.8, 1, { color: P.goldLight, speed: 0.9, life: 0.6, size: 0.1, rise: 1.4 });
        break;
      case 'chargeStart':
        audio?.play('charge');
        break;
      case 'chargeHit':
        audio?.play('heavy');
        this.addShake(0.14);
        this.burst(ev.x, ev.y - 0.5, 12, { color: P.goldLight, speed: 5, life: 0.35, size: 0.12 });
        break;
      case 'kingAwake':
        audio?.play('bell');
        break;
      default:
    }
  }

  burst(x, y, n, { color, speed, life, size, rise = 0 }) {
    if (this.particles.length > MAX_PARTICLES) return;
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2;
      const v = speed * (0.35 + this.rng() * 0.75);
      this.particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - rise, life: life * (0.6 + this.rng() * 0.6), max: life,
        size: size * (0.6 + this.rng() * 0.8), color, rot: this.rng() * 6, grav: rise ? -0.4 : 5,
      });
    }
  }

  addRing(x, y, r, color, dur) {
    this.rings.push({ x, y, r, color, t: 0, dur });
  }

  addStain(x, y, r, color) {
    const blobs = [];
    const n = 5 + Math.floor(this.rng() * 4);
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2;
      const d = r * (0.2 + this.rng() * 0.8);
      blobs.push([Math.cos(a) * d, Math.sin(a) * d * 0.7, r * (0.18 + this.rng() * 0.3)]);
    }
    this.stains.push({ x, y, r, color, blobs, t: 0, dur: 14 });
    if (this.stains.length > 46) this.stains.shift();
  }

  addShake(a) {
    if (REDUCED) return;
    this.shake = Math.min(1, this.shake + a);
  }

  animOf(id) {
    let a = this.anim.get(id);
    if (!a) {
      a = { phase: this.rng() * 6, seen: this.time };
      this.anim.set(id, a);
    }
    return a;
  }

  update(dt) {
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 1.8);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.grav * dt;
      p.vx *= 1 - dt * 2.2;
    }
    const age = (list) => {
      for (let i = list.length - 1; i >= 0; i--) {
        list[i].t += dt;
        if (list[i].t >= list[i].dur) list.splice(i, 1);
      }
    };
    age(this.rings);
    age(this.stains);
    age(this.spells);
    age(this.bolts);
    for (const r of this.ruins) r.t += dt;
  }

  // --- Dessin ---

  draw(sim, alpha, options = {}) {
    const { ctx } = this;
    const { dpr } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.page) ctx.drawImage(this.page, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.shake > 0) {
      const s = this.shake * this.shake * this.tile * 0.5;
      ctx.translate(Math.sin(this.time * 71) * s, Math.cos(this.time * 53) * s);
    }
    this.drawStains(ctx);
    if (this.ghost) this.drawZones(ctx, sim);
    this.drawGroundZones(ctx, sim);
    this.drawRings(ctx);

    // Tri par profondeur, volants au-dessus.
    const list = [];
    for (const e of sim.entities) {
      const a = alpha === undefined ? 1 : alpha;
      const x = e.px === undefined ? e.x : e.px + (e.x - e.px) * a;
      const y = e.py === undefined ? e.y : e.py + (e.y - e.py) * a;
      if (e.kind === 'tower' && !e.alive) continue;
      e.rx = x;
      e.ry = y;
      list.push(e);
    }
    list.sort((a, b) => (a.air ? 1 : 0) - (b.air ? 1 : 0) || a.ry - b.ry);
    this.drawRuins(ctx);
    for (const e of list) this.drawShadow(ctx, e);
    for (const e of list) {
      if (e.kind === 'tower') this.drawTower(ctx, e);
      else this.drawUnit(ctx, e);
    }
    this.drawBeams(ctx, sim);
    this.drawProjectiles(ctx, sim, alpha);
    this.drawSpellsInFlight(ctx);
    this.drawBolts(ctx);
    this.drawParticles(ctx);
    for (const e of list) this.drawBars(ctx, e);
    if (this.ghost) this.drawBrackets(ctx, sim);
    if (this.ghost) this.drawGhost(ctx);
    if (options.dim) {
      ctx.fillStyle = `rgba(12,24,60,${options.dim})`;
      ctx.fillRect(-20, -20, this.cssW + 40, this.cssH + 40);
    }
  }

  drawStains(ctx) {
    const t = this.tile;
    for (const s of this.stains) {
      const fade = s.t < s.dur - 3 ? 1 : (s.dur - s.t) / 3;
      ctx.globalAlpha = fade;
      ctx.fillStyle = s.color;
      const cx = this.sx(s.x);
      const cy = this.sy(s.y);
      for (const [dx, dy, r] of s.blobs) {
        ctx.beginPath();
        ctx.arc(cx + dx * t, cy + dy * t, r * t, 0, 7);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // Zone interdite teintée en rouge quand une carte est prise en main.
  drawZones(ctx, sim) {
    const { ghost } = this;
    if (ghost.type === 'spell') return;
    const t = this.tile;
    const leftBound = sim.deployBound(0, 2);
    const rightBound = sim.deployBound(0, 16);
    ctx.fillStyle = 'rgba(224,50,50,.32)';
    ctx.fillRect(this.sx(0), this.sy(0), (W / 2) * t, leftBound * t);
    ctx.fillRect(this.sx(W / 2), this.sy(0), (W / 2) * t, rightBound * t);
    ctx.strokeStyle = P.white;
    ctx.lineWidth = Math.max(2, t * 0.1);
    ctx.setLineDash([t * 0.45, t * 0.3]);
    ctx.beginPath();
    ctx.moveTo(this.sx(0), this.sy(leftBound));
    ctx.lineTo(this.sx(W / 2), this.sy(leftBound));
    ctx.lineTo(this.sx(W / 2), this.sy(rightBound));
    ctx.lineTo(this.sx(W), this.sy(rightBound));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Crochets roses autour des tours ennemies, comme sur la capture du jeu.
  drawBrackets(ctx, sim) {
    const t = this.tile;
    ctx.strokeStyle = '#f0386b';
    ctx.lineWidth = Math.max(2, t * 0.2);
    ctx.lineCap = 'butt';
    const pulse = 1 + Math.sin(this.time * 5) * 0.03;
    for (const e of sim.towers[1]) {
      if (!e.alive) continue;
      const hw = (e.hw + 0.35) * t * pulse;
      const top = this.sy(e.y - e.hh - 1.1);
      const bot = this.sy(e.y + e.hh + 0.2);
      const cx = this.sx(e.x);
      const arm = t * 0.8;
      for (const sx of [-1, 1]) {
        for (const [y, sy] of [[top, 1], [bot, -1]]) {
          ctx.beginPath();
          ctx.moveTo(cx + sx * hw, y + sy * arm);
          ctx.lineTo(cx + sx * hw, y);
          ctx.lineTo(cx + sx * (hw - arm), y);
          ctx.stroke();
        }
      }
    }
  }

  drawGroundZones(ctx, sim) {
    const t = this.tile;
    for (const z of sim.zones) {
      const cx = this.sx(z.x);
      const cy = this.sy(z.y);
      const r = z.radius * t;
      const life = Math.min(1, z.t / 0.5, (z.duration - z.t + 0.2) / 0.3);
      ctx.save();
      ctx.globalAlpha = Math.max(0, life);
      const ice = z.def.effect === 'freeze';
      const pulse = 0.5 + Math.sin(this.time * 6) * 0.5;
      ctx.fillStyle = ice ? 'rgba(160,232,255,.42)' : `rgba(217,62,224,${0.2 + pulse * 0.1})`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 7);
      ctx.fill();
      ctx.strokeStyle = ice ? P.white : P.elixirLight;
      ctx.lineWidth = Math.max(2, t * 0.12);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Rayon de la tour de l'enfer, de plus en plus épais à mesure qu'il chauffe.
  drawBeams(ctx, sim) {
    const t = this.tile;
    for (const e of sim.entities) {
      if (!e.alive || !e.def?.ramp || !e.target || e.stun > 0) continue;
      const v = sim.byId.get(e.target);
      if (!v) continue;
      const k = Math.min(1, e.rampT / 4);
      const x1 = this.sx(e.rx ?? e.x);
      const y1 = this.sy((e.ry ?? e.y) - 2);
      const x2 = this.sx(v.x);
      const y2 = this.sy(v.y - (v.air ? 1.5 : 0.5));
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#ff5a2a';
      ctx.lineWidth = t * (0.12 + k * 0.28);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = P.goldLight;
      ctx.lineWidth = t * (0.04 + k * 0.1);
      ctx.stroke();
    }
  }

  drawRings(ctx) {
    const t = this.tile;
    for (const r of this.rings) {
      const k = r.t / r.dur;
      const ease = 1 - (1 - k) * (1 - k);
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = Math.max(1, (1 - k) * t * 0.4);
      ctx.beginPath();
      ctx.arc(this.sx(r.x), this.sy(r.y), r.r * t * ease, 0, 7);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawRuins(ctx) {
    for (const r of this.ruins) {
      const s = this.book.tower('ruin', 0);
      ctx.save();
      ctx.translate(this.sx(r.x), this.sy(r.y + (r.type === 'king' ? 1.8 : 1.4)));
      const u = (r.type === 'king' ? 1.4 : 1) / this.dpr;
      ctx.scale(u, u);
      blit(ctx, s.body, s.scale);
      ctx.restore();
    }
  }

  drawShadow(ctx, e) {
    const t = this.tile;
    const x = this.sx(e.rx);
    if (e.kind === 'tower') {
      ctx.fillStyle = 'rgba(15,20,20,.34)';
      ctx.beginPath();
      ctx.ellipse(x, this.sy(e.ry + e.hh * 0.86), e.hw * t * 1.2, e.hh * t * 0.42, 0, 0, 7);
      ctx.fill();
      return;
    }
    const y = this.sy(e.ry);
    const rx = e.r * t * 1.1;
    const ry = e.r * t * 0.55;
    ctx.fillStyle = e.air ? 'rgba(15,20,20,.22)' : 'rgba(15,20,20,.36)';
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, 7);
    ctx.fill();
    // Liseré de camp : on reconnaît son équipe même dans la mêlée.
    if (!e.air) {
      ctx.strokeStyle = TEAMS[e.team].main;
      ctx.lineWidth = Math.max(1.5, t * 0.09);
      ctx.stroke();
    }
  }

  drawTower(ctx, e) {
    const s = this.book.tower(e.type, e.team);
    const baseY = e.ry + e.hh * 0.95;
    const x = this.sx(e.rx);
    const y = this.sy(baseY);
    ctx.save();
    ctx.translate(x, y);
    const u = 1 / this.dpr;
    ctx.scale(u, u);
    blit(ctx, s.body, s.scale);
    if (e.flash > 0) {
      ctx.globalAlpha = e.flash * 0.5;
      blit(ctx, s.flash, s.scale);
    }
    ctx.restore();
    this.drawCrew(ctx, e, x, y);
  }

  // L'archère de la tour, ou le roi et son canon : le roi dort tant qu'il n'est pas réveillé.
  drawCrew(ctx, e, x, y) {
    const t = this.tile;
    const king = e.type === 'king';
    const T = TEAMS[e.team];
    const py = y - (king ? 3.55 : 3.15) * t;
    const scale = t * (king ? 0.02 : 0.016);
    const recoil = e.atk * 3;
    ctx.save();
    ctx.translate(x, py + recoil * scale * 2);
    ctx.scale(scale, scale);
    if (king) {
      const awake = e.active;
      drawParts(ctx, [
        ['M-24 10C-24-14 24-14 24 10Z', T.main],
        ['M-20-26C-20-50 20-50 20-26C20-10 10-6 0-6C-10-6-20-10-20-26Z', P.skin],
        ['M-22-42L-22-66L-11-52L0-70L11-52L22-66L22-42Z', P.gold],
        ['M-12-18c3 6 21 6 24 0c-3 8-21 8-24 0Z', '#e8e0d0', 2],
        ...(awake ? [[circ(-7, -28, 3.2), INK, 0], [circ(8, -28, 3.2), INK, 0]]
          : [['M-12-28c3-3 6-3 8 0M4-28c3-3 6-3 8 0', null, 2.5]]),
      ]);
      if (!awake) {
        ctx.fillStyle = P.white;
        ctx.font = `22px ${FONT}`;
        const b = Math.sin(this.time * 2) * 4;
        ctx.fillText('z', 26, -44 + b);
        ctx.font = `15px ${FONT}`;
        ctx.fillText('z', 40, -58 + b);
      }
      if (awake) {
        drawParts(ctx, [
          [`M-18 ${e.team === 0 ? -6 : 22}H18V${e.team === 0 ? -34 : 50}H-18Z`, P.iron],
          [`M-22 ${e.team === 0 ? -34 : 42}H22V${e.team === 0 ? -42 : 50}H-22Z`, P.ironDark],
        ]);
      }
    } else {
      drawParts(ctx, [
        ['M-16 8C-16-12 16-12 16 8Z', T.main],
        ['M-14-24C-14-44 14-44 14-24C14-10 6-6 0-6C-6-6-14-10-14-24Z', P.skin],
        ['M-18-20C-24-52 22-58 18-30C10-42-6-42-12-26C-12-16-14-12-18-20Z', P.pink],
        [circ(-3, -24, 2.6), INK, 0],
        [circ(7, -24, 2.6), INK, 0],
        ['M22-36C34-22 34 0 22 14', null, 3.5, P.woodDark],
      ]);
    }
    ctx.restore();
  }

  drawUnit(ctx, e) {
    const s = this.book.get(e.unit, e.team);
    const a = this.animOf(e.id);
    const t = this.tile;
    const dep = e.deployMax ? 1 - Math.max(0, e.deployT) / e.deployMax : 1;
    const speedK = e.moving ? (e.speed || 1) * e.rageMul * (e.charging ? 1.8 : 1) : 0;
    a.phase += (speedK ? 7 + speedK * 3 : 0) * (1 / 60);
    const bob = e.moving ? Math.abs(Math.sin(a.phase)) : 0;
    const flyer = s.flyer;
    const jump = e.def?.jump && e.ry > RIVER_TOP - 0.6 && e.ry < RIVER_BOTTOM + 0.6 ? Math.sin(((e.ry - (RIVER_TOP - 0.6)) / 3.2) * Math.PI) * 1.4 : 0;
    const hover = flyer ? 1.25 + Math.sin(this.time * 2.6 + e.id) * 0.1 : 0;
    const x = this.sx(e.rx);
    const y = this.sy(e.ry - hover - jump - (e.hop || 0) * 2.4) - bob * t * 0.1;
    // Coup : bascule vers la cible, comme une figurine découpée qu'on agite.
    const atk = e.atk || 0;
    const swing = atk > 0 ? Math.sin((1 - atk) * Math.PI) : 0;
    const armAngle = atk > 0 ? (atk > 0.55 ? -0.9 * ((1 - atk) / 0.45) : -0.9 + 2.2 * ((0.55 - atk) / 0.55)) : Math.sin(this.time * 1.4 + e.id) * 0.04;
    const tilt = (e.moving ? Math.sin(a.phase) * 0.07 : Math.sin(this.time * 1.7 + e.id) * 0.015) + swing * 0.12;
    const pop = dep < 1 ? easeBack(dep) : 1;
    const u = 1 / this.dpr;

    ctx.save();
    ctx.translate(x + (swing * e.face * t * 0.1), y);
    // La Tesla reste à moitié enterrée tant qu'elle n'a pas de cible.
    const sink = e.hidden ? 0.42 : 1;
    ctx.scale(pop * e.face * u, pop * u * sink);
    ctx.rotate(tilt);
    if (dep < 1) ctx.globalAlpha = Math.min(1, dep * 1.6 + 0.15);
    const sc = s.scale;
    const flap = Math.sin(this.time * (flyer ? 16 : 0) + e.id);
    s.legs.forEach((leg, i) => {
      ctx.save();
      const angle = leg.wing ? (i === 0 ? 1 : -1) * flap * 0.35 : (e.moving ? Math.sin(a.phase + (i ? Math.PI : 0)) * 0.55 : 0);
      if (angle) {
        ctx.translate(leg.pivot[0] * sc, leg.pivot[1] * sc);
        ctx.rotate(angle);
        ctx.translate(-leg.pivot[0] * sc, -leg.pivot[1] * sc);
      }
      blit(ctx, leg.img, sc);
      ctx.restore();
    });
    blit(ctx, s.body, sc);
    if (s.arm) {
      ctx.save();
      ctx.translate(s.arm.pivot[0] * sc, s.arm.pivot[1] * sc);
      ctx.rotate(e.kind === 'building' ? armAngle * 0.1 : armAngle);
      ctx.translate(-s.arm.pivot[0] * sc, -s.arm.pivot[1] * sc);
      blit(ctx, s.arm.img, sc);
      ctx.restore();
    }
    if (e.flash > 0) {
      ctx.globalAlpha = e.flash * 0.4;
      blit(ctx, s.flash, sc);
    }
    ctx.restore();

    if (e.stun > 0) {
      const sy = y - s.size * t * 0.95;
      for (let i = 0; i < 3; i++) {
        const an = this.time * 6 + i * 2.1;
        ctx.fillStyle = P.blueLight;
        ctx.beginPath();
        ctx.arc(x + Math.cos(an) * t * 0.35, sy + Math.sin(an) * t * 0.12, t * 0.08, 0, 7);
        ctx.fill();
      }
    }
    if (e.charging) {
      ctx.strokeStyle = P.goldLight;
      ctx.lineWidth = Math.max(1.5, t * 0.08);
      for (let i = 0; i < 3; i++) {
        const off = (i - 1) * t * 0.3;
        ctx.beginPath();
        ctx.moveTo(x - e.face * t * 0.9, y - t * 0.7 + off);
        ctx.lineTo(x - e.face * t * 1.5, y - t * 0.7 + off);
        ctx.stroke();
      }
    }
    if (e.rageMul > 1) {
      ctx.fillStyle = P.elixirLight;
      ctx.beginPath();
      ctx.arc(x + Math.sin(this.time * 9 + e.id) * e.r * t, y - s.size * t * 0.9, t * 0.07, 0, 7);
      ctx.fill();
    }
  }

  drawBars(ctx, e) {
    const t = this.tile;
    if (!e.alive) return;
    const T = TEAMS[e.team];
    if (e.kind === 'tower') {
      // Couronne, points de vie et jauge au-dessus de la tour, comme dans le jeu.
      const w = (e.type === 'king' ? 3.6 : 2.8) * t;
      const h = Math.max(4, t * 0.26);
      const x = this.sx(e.rx) - w / 2;
      const y = this.sy(e.ry - e.hh - 1.05);
      const hurt = e.hp < e.maxHp;
      ctx.fillStyle = 'rgba(15,20,45,.85)';
      ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = e.team === 0 ? P.blueLight : P.red;
      ctx.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), h);
      ctx.font = `${Math.max(10, t * 0.62)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.lineWidth = Math.max(2, t * 0.12);
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(15,20,45,.95)';
      const label = hurt || e.type !== 'king' ? String(Math.ceil(e.hp)) : String(e.maxHp);
      ctx.strokeText(label, this.sx(e.rx) + t * 0.2, y - 1);
      ctx.fillStyle = P.white;
      ctx.fillText(label, this.sx(e.rx) + t * 0.2, y - 1);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
      const tw = ctx.measureText(label).width;
      ctx.save();
      ctx.translate(this.sx(e.rx) + t * 0.2 - tw / 2 - t * 0.38, y - t * 0.34);
      ctx.scale(t * 0.013, t * 0.013);
      drawParts(ctx, [['M-22 12L-26-14L-12-2L0-20L12-2L26-14L22 12Z', P.gold, 5]]);
      ctx.restore();
      return;
    }
    const isBuilding = e.kind === 'building';
    if ((e.hp >= e.maxHp && !isBuilding) || e.def?.untargetable) return;
    const s = this.book.get(e.unit, e.team);
    const w = Math.max(t * 0.9, e.r * t * 1.9);
    const h = Math.max(3, t * 0.16);
    const x = this.sx(e.rx) - w / 2;
    const hover = e.air ? 1.25 : 0;
    const y = this.sy(e.ry - hover) - s.size * t * (e.air ? 0.8 : 1) - h - 1;
    ctx.fillStyle = INK;
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = T.main;
    ctx.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), h);
  }

  drawProjectiles(ctx, sim, alpha) {
    const t = this.tile;
    for (const p of sim.projectiles) {
      const a = alpha === undefined ? 1 : alpha;
      const px = p.px === undefined ? p.x : p.px + (p.x - p.px) * a;
      const py = p.py === undefined ? p.y : p.py + (p.y - p.py) * a;
      const total = Math.max(0.1, p.traveled + Math.hypot(p.tx - p.x, p.ty - p.y));
      const k = p.traveled / total;
      const lift = (p.arc ? Math.sin(k * Math.PI) * 1.6 : 0) + (p.lift || 0) * (1 - k);
      const x = this.sx(px);
      const y = this.sy(py - lift);
      const angle = Math.atan2(p.ty - p.y, p.tx - p.x);
      ctx.save();
      ctx.translate(x, y);
      switch (p.kind) {
        case 'arrow':
        case 'bolt':
        case 'spear':
          ctx.rotate(angle);
          ctx.strokeStyle = P.woodDark;
          ctx.lineWidth = Math.max(1.6, t * (p.kind === 'bolt' ? 0.14 : 0.08));
          ctx.beginPath();
          ctx.moveTo(-t * 0.45, 0);
          ctx.lineTo(t * 0.32, 0);
          ctx.stroke();
          ctx.fillStyle = P.steel;
          ctx.beginPath();
          ctx.moveTo(t * 0.45, 0);
          ctx.lineTo(t * 0.22, -t * 0.12);
          ctx.lineTo(t * 0.22, t * 0.12);
          ctx.fill();
          break;
        case 'bomb':
        case 'cannonball':
          ctx.fillStyle = P.iron;
          ctx.strokeStyle = INK;
          ctx.lineWidth = Math.max(1, t * 0.05);
          ctx.beginPath();
          ctx.arc(0, 0, t * (p.kind === 'bomb' ? 0.24 : 0.17), 0, 7);
          ctx.fill();
          ctx.stroke();
          break;
        case 'bullet':
          ctx.fillStyle = P.goldLight;
          ctx.beginPath();
          ctx.arc(0, 0, t * 0.09, 0, 7);
          ctx.fill();
          break;
        case 'fire':
        case 'magic': {
          const hot = p.kind === 'fire';
          ctx.fillStyle = hot ? '#f08a24' : P.elixir;
          ctx.beginPath();
          ctx.arc(0, 0, t * 0.26, 0, 7);
          ctx.fill();
          ctx.fillStyle = hot ? P.goldLight : P.elixirLight;
          ctx.beginPath();
          ctx.arc(0, 0, t * 0.13, 0, 7);
          ctx.fill();
          if (this.particles.length < MAX_PARTICLES) this.particles.push({ x: px, y: py, vx: 0, vy: -0.4, life: 0.25, max: 0.25, size: 0.1, color: hot ? '#f08a24' : P.elixir, rot: 0, grav: 0 });
          break;
        }
        case 'spit':
          ctx.fillStyle = '#7fb0ff';
          ctx.strokeStyle = INK;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, t * 0.13, 0, 7);
          ctx.fill();
          ctx.stroke();
          break;
        default:
          ctx.fillStyle = P.goldLight;
          ctx.beginPath();
          ctx.arc(0, 0, t * 0.14, 0, 7);
          ctx.fill();
      }
      ctx.restore();
    }
  }

  drawSpellsInFlight(ctx) {
    const t = this.tile;
    for (const s of this.spells) {
      if (s.card.id === 'arrows' || s.card.id === 'lightning' || s.card.id === 'zap') continue;
      const k = Math.min(1, s.t / s.dur);
      const x = s.fromX + (s.x - s.fromX) * k;
      const y = s.fromY + (s.y - s.fromY) * k - Math.sin(k * Math.PI) * 3.4;
      const px = this.sx(x);
      const py = this.sy(y);
      if (s.card.id === 'goblin-barrel') {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(this.time * 8);
        ctx.fillStyle = P.wood;
        ctx.strokeStyle = INK;
        ctx.lineWidth = Math.max(1.5, t * 0.07);
        ctx.fillRect(-t * 0.42, -t * 0.55, t * 0.84, t * 1.1);
        ctx.strokeRect(-t * 0.42, -t * 0.55, t * 0.84, t * 1.1);
        ctx.restore();
      } else {
        ctx.fillStyle = '#f08a24';
        ctx.beginPath();
        ctx.arc(px, py, t * (s.card.id === 'rocket' ? 0.5 : 0.7), 0, 7);
        ctx.fill();
        ctx.fillStyle = P.goldLight;
        ctx.beginPath();
        ctx.arc(px, py, t * 0.34, 0, 7);
        ctx.fill();
        this.burst(x, y, 2, { color: '#f08a24', speed: 0.8, life: 0.35, size: 0.14 });
      }
    }
  }

  drawBolts(ctx) {
    const t = this.tile;
    for (const b of this.bolts) {
      const k = b.t / b.dur;
      const x = this.sx(b.x);
      const y = this.sy(b.y);
      if (b.kind === 'arrow') {
        const top = y - (1 - k) * t * 5;
        ctx.strokeStyle = INK;
        ctx.lineWidth = Math.max(1.6, t * 0.08);
        ctx.beginPath();
        ctx.moveTo(x, top - t * 0.6);
        ctx.lineTo(x, top);
        ctx.stroke();
      } else if (b.kind === 'spark') {
        ctx.strokeStyle = P.blueLight;
        ctx.lineWidth = Math.max(2, t * 0.14);
        ctx.beginPath();
        ctx.moveTo(this.sx(b.fromX), this.sy(b.fromY));
        ctx.lineTo((x + this.sx(b.fromX)) / 2 + (b.seed - 0.5) * t, (y + this.sy(b.fromY)) / 2);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.globalAlpha = 1 - k * 0.8;
        const rng = mulberry(Math.floor(b.seed * 1e6) + Math.floor(k * 6));
        let px = x;
        let py = y - t * 18;
        ctx.strokeStyle = P.goldLight;
        ctx.lineWidth = Math.max(3, t * 0.28);
        ctx.beginPath();
        ctx.moveTo(px, py);
        while (py < y) {
          py += t * 1.8;
          px = x + (rng() - 0.5) * t * 2.2;
          ctx.lineTo(px, Math.min(py, y));
        }
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = Math.max(1, t * 0.1);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  drawParticles(ctx) {
    const t = this.tile;
    for (const p of this.particles) {
      const k = p.life / p.max;
      ctx.globalAlpha = Math.min(1, k * 1.6);
      ctx.fillStyle = p.color;
      const r = p.size * t * (0.4 + k * 0.6);
      ctx.fillRect(this.sx(p.x) - r, this.sy(p.y) - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }

  drawGhost(ctx) {
    const { ghost } = this;
    const t = this.tile;
    const x = this.sx(ghost.x);
    const y = this.sy(ghost.y);
    const card = CARD_BY_ID[ghost.id];
    const color = ghost.valid ? P.white : P.redLight;
    if (card.type === 'spell') {
      const r = (card.spell?.radius || 2.5) * t;
      ctx.fillStyle = ghost.valid ? 'rgba(255,255,255,.22)' : 'rgba(232,64,58,.25)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 7);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, t * 0.12);
      ctx.setLineDash([t * 0.4, t * 0.25]);
      ctx.lineDashOffset = -this.time * t;
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }
    const u = UNITS[card.unit];
    if (u.range > 1.5) {
      ctx.strokeStyle = 'rgba(255,255,255,.6)';
      ctx.lineWidth = Math.max(1, t * 0.05);
      ctx.setLineDash([t * 0.2, t * 0.2]);
      ctx.beginPath();
      ctx.arc(x, y, u.range * t, 0, 7);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, t * 0.1);
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(u.r, 0.4) * t * 1.15, Math.max(u.r, 0.4) * t * 0.62, 0, 0, 7);
    ctx.stroke();
    const s = this.book.get(card.unit, 0);
    const dpr = 1 / this.dpr;
    const count = card.count || 1;
    ctx.save();
    ctx.globalAlpha = ghost.valid ? 0.8 : 0.4;
    const offs = count === 1 ? [[0, 0]] : [[0, 0], [-0.6, 0.15], [0.6, 0.15], [0, -0.7], [-0.75, -0.55], [0.75, -0.55]].slice(0, count);
    for (const [ox, oy] of offs) {
      ctx.save();
      ctx.translate(x + ox * t, y + oy * t - (s.flyer ? 1.25 * t : 0));
      ctx.scale(dpr, dpr);
      s.legs.forEach((leg) => blit(ctx, leg.img, s.scale));
      blit(ctx, s.body, s.scale);
      if (s.arm) blit(ctx, s.arm.img, s.scale);
      ctx.restore();
    }
    ctx.restore();
  }

  pruneAnim(sim) {
    if (this.anim.size < 200) return;
    for (const id of this.anim.keys()) if (!sim.byId.has(id)) this.anim.delete(id);
  }
}

function easeBack(k) {
  const c = 1.9;
  const u = k - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

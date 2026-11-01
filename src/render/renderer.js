// Rendu Canvas 2D de la bataille : page peinte en cache, figures découpées à la Gilliam, particules d'encre et d'or.
import { CARD_BY_ID, UNITS } from '../sim/cards.js';
import { BRIDGES, BRIDGE_HW, H, mulberry, RIVER_BOTTOM, RIVER_TOP, W } from '../sim/sim.js';
import { drawParts, INK, PIGMENT as P, SPELL_ICONS, TEAMS } from './art.js';
import { blit, SpriteBook } from './sprites.js';

const MARGIN = 0.55; // cadre doré autour du terrain, en cases
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
    const tile = Math.min(cssW / (W + MARGIN * 2), cssH / (H + MARGIN * 2));
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

  // --- La page : prairie à mille fleurs, rivière d'encre bleue, ponts et cadre d'or ---

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
    const hh = H * t;

    g.fillStyle = P.purpleDark;
    g.fillRect(0, 0, this.cssW, this.cssH);

    // Prairie : damier discret, utile pour viser une case.
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const south = y >= H / 2;
        const odd = (x + y) % 2 === 0;
        g.fillStyle = south ? (odd ? '#25825c' : '#1f7752') : (odd ? '#2b7a4e' : '#256f47');
        g.fillRect(x0 + x * t, y0 + y * t, t + 0.5, t + 0.5);
      }
    }

    // Chemins de terre vers les ponts et le donjon.
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const lanePaths = [
      [[3.5, 15], [3.5, 8.5], [6.5, 5], [9, 3]], [[14.5, 15], [14.5, 8.5], [11.5, 5], [9, 3]],
      [[3.5, 17], [3.5, 23.5], [6.5, 27], [9, 29]], [[14.5, 17], [14.5, 23.5], [11.5, 27], [9, 29]],
    ];
    const stroke = (color, width) => {
      g.strokeStyle = color;
      g.lineWidth = width;
      for (const pts of lanePaths) {
        g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(x0 + x * t, y0 + y * t) : g.moveTo(x0 + x * t, y0 + y * t)));
        g.stroke();
      }
    };
    stroke(INK, t * 2.0);
    stroke('#b98f4f', t * 1.8);
    stroke('#caa263', t * 1.05);

    // Mille-fleurs, en évitant la rivière et les chemins.
    const palette = ['#d9e6b0', '#e6cf6a', '#d98f6e', '#a9c6d6', '#dcb4c0'];
    for (let i = 0; i < 130; i++) {
      const fx = rng() * W;
      const fy = rng() * H;
      if (fy > RIVER_TOP - 0.3 && fy < RIVER_BOTTOM + 0.3) continue;
      const nearLane = Math.abs(fx - 3.5) < 1.1 || Math.abs(fx - 14.5) < 1.1;
      if (nearLane && ((fy > 8 && fy < 15) || (fy > 17 && fy < 24))) continue;
      const px = x0 + fx * t;
      const py = y0 + fy * t;
      const s = t * (0.04 + rng() * 0.035);
      g.strokeStyle = 'rgba(15,77,58,.9)';
      g.lineWidth = Math.max(0.8, t * 0.04);
      g.beginPath();
      g.moveTo(px, py);
      g.quadraticCurveTo(px + s, py + s * 3, px - s * 0.5, py + s * 5);
      g.stroke();
      g.fillStyle = palette[Math.floor(rng() * palette.length)];
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        g.beginPath();
        g.arc(px + Math.cos(a) * s * 1.4, py + Math.sin(a) * s * 1.4, s, 0, 7);
        g.fill();
      }
      g.fillStyle = '#f2dc7a';
      g.beginPath();
      g.arc(px, py, s * 0.8, 0, 7);
      g.fill();
    }

    // Rivière : lapis et vagues en écailles.
    const ry = y0 + RIVER_TOP * t;
    const rh = (RIVER_BOTTOM - RIVER_TOP) * t;
    g.fillStyle = P.lapisDark;
    g.fillRect(x0, ry, ww, rh);
    const wave = t * 0.75;
    for (let row = 0; row < 3; row++) {
      const yy = ry + rh * (0.2 + row * 0.3);
      g.strokeStyle = row === 1 ? P.lapisLight : P.lapis;
      g.lineWidth = Math.max(1.2, t * 0.09);
      g.beginPath();
      for (let x = -1; x < ww / wave + 1; x++) {
        const px = x0 + (x + (row % 2) * 0.5) * wave;
        g.moveTo(px, yy);
        g.quadraticCurveTo(px + wave / 2, yy - wave * 0.55, px + wave, yy);
      }
      g.stroke();
    }
    g.save();
    g.beginPath();
    g.rect(x0, ry, ww, rh);
    g.clip();
    this.paintFish(g, x0 + 9 * t, ry + rh * 0.52, t, 1);
    g.restore();
    g.strokeStyle = INK;
    g.lineWidth = Math.max(2, t * 0.14);
    g.beginPath();
    g.moveTo(x0, ry);
    g.lineTo(x0 + ww, ry);
    g.moveTo(x0, ry + rh);
    g.lineTo(x0 + ww, ry + rh);
    g.stroke();

    // Ponts de pierre.
    for (const bx of BRIDGES) {
      const px = x0 + (bx - BRIDGE_HW) * t;
      const bw = BRIDGE_HW * 2 * t;
      const py = ry - t * 0.35;
      const bh = rh + t * 0.7;
      g.fillStyle = 'rgba(10,10,30,.45)';
      g.fillRect(px - t * 0.1, py + t * 0.12, bw + t * 0.2, bh);
      g.fillStyle = P.stoneLight;
      g.fillRect(px, py, bw, bh);
      g.strokeStyle = 'rgba(27,20,16,.55)';
      g.lineWidth = Math.max(1, t * 0.05);
      for (let i = 1; i < 6; i++) {
        const yy = py + (bh * i) / 6;
        g.beginPath();
        g.moveTo(px, yy);
        g.lineTo(px + bw, yy);
        g.stroke();
        for (let j = 0; j < 3; j++) {
          const xx = px + (bw * (j + (i % 2 ? 0.25 : 0.75))) / 3;
          g.beginPath();
          g.moveTo(xx, yy - bh / 6);
          g.lineTo(xx, yy);
          g.stroke();
        }
      }
      g.fillStyle = P.stone;
      g.fillRect(px - t * 0.12, py, t * 0.3, bh);
      g.fillRect(px + bw - t * 0.18, py, t * 0.3, bh);
      g.strokeStyle = INK;
      g.lineWidth = Math.max(1.6, t * 0.09);
      g.strokeRect(px - t * 0.12, py, bw + t * 0.24, bh);
      g.beginPath();
      g.moveTo(px + t * 0.18, py);
      g.lineTo(px + t * 0.18, py + bh);
      g.moveTo(px + bw - t * 0.18, py);
      g.lineTo(px + bw - t * 0.18, py + bh);
      g.stroke();
    }

    // Cadre d'or et rinceau.
    const m = MARGIN * t;
    g.fillStyle = P.gold;
    g.fillRect(x0 - m, y0 - m, ww + m * 2, m);
    g.fillRect(x0 - m, y0 + hh, ww + m * 2, m);
    g.fillRect(x0 - m, y0, m, hh);
    g.fillRect(x0 + ww, y0, m, hh);
    g.strokeStyle = INK;
    g.lineWidth = Math.max(1.5, t * 0.08);
    g.strokeRect(x0, y0, ww, hh);
    g.strokeRect(x0 - m + 0.5, y0 - m + 0.5, ww + m * 2 - 1, hh + m * 2 - 1);
    this.paintVine(g, x0 - m / 2, y0, x0 - m / 2, y0 + hh, m);
    this.paintVine(g, x0 + ww + m / 2, y0, x0 + ww + m / 2, y0 + hh, m);
    this.paintVine(g, x0, y0 - m / 2, x0 + ww, y0 - m / 2, m);
    this.paintVine(g, x0, y0 + hh + m / 2, x0 + ww, y0 + hh + m / 2, m);
    for (const [cx, cy, color] of [
      [x0 - m / 2, y0 - m / 2, P.vermilion], [x0 + ww + m / 2, y0 - m / 2, P.vermilion],
      [x0 - m / 2, y0 + hh + m / 2, P.lapis], [x0 + ww + m / 2, y0 + hh + m / 2, P.lapis],
    ]) {
      g.fillStyle = color;
      g.beginPath();
      g.arc(cx, cy, m * 0.42, 0, 7);
      g.fill();
      g.stroke();
    }
    return c;
  }

  paintFish(g, x, y, t, dir) {
    g.save();
    g.translate(x, y);
    g.scale(dir * t * 0.022, t * 0.022);
    drawParts(g, [
      ['M-30 0C-18-14 12-14 24 0C12 14-18 14-30 0Z', P.vermilionLight, 3],
      ['M-30 0L-44-10V10Z', P.vermilion, 3],
      ['M12-3a2.5 2.5 0 1 0 .1 0Z', INK, 0],
    ]);
    g.restore();
  }

  paintVine(g, ax, ay, bx, by, m) {
    const len = Math.hypot(bx - ax, by - ay);
    const steps = Math.floor(len / (m * 2.2));
    const nx = (bx - ax) / len;
    const ny = (by - ay) / len;
    const amp = m * 0.2;
    g.strokeStyle = P.goldDark;
    g.lineWidth = Math.max(1, m * 0.1);
    g.beginPath();
    for (let i = 0; i <= steps * 6; i++) {
      const d = (i / (steps * 6)) * len;
      const off = Math.sin((d / (m * 2.2)) * Math.PI) * amp;
      const px = ax + nx * d - ny * off;
      const py = ay + ny * d + nx * off;
      if (i) g.lineTo(px, py);
      else g.moveTo(px, py);
    }
    g.stroke();
    for (let i = 0; i < steps; i++) {
      const d = ((i + 0.5) / steps) * len;
      const side = i % 2 ? 1 : -1;
      g.fillStyle = i % 2 ? P.lapis : P.vermilion;
      g.beginPath();
      g.arc(ax + nx * d - ny * amp * side, ay + ny * d + nx * amp * side, m * 0.15, 0, 7);
      g.fill();
    }
  }

  // --- Événements de la simulation vers les effets ---

  consume(events, audio) {
    for (const ev of events) this.onEvent(ev, audio);
  }

  onEvent(ev, audio) {
    switch (ev.type) {
      case 'spawn':
        this.burst(ev.x, ev.y, 7, { color: ev.team === 0 ? P.lapisLight : P.vermilionLight, speed: 1.6, life: 0.4, size: 0.1 });
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
        audio?.play(ev.heavy ? 'heavy' : 'hit');
        this.burst(ev.x, ev.y - 0.5, ev.heavy ? 9 : 4, { color: P.goldLight, speed: ev.heavy ? 4.2 : 3, life: 0.28, size: 0.09 });
        if (ev.heavy) this.addShake(0.12);
        break;
      case 'shoot':
        audio?.play(ev.kind === 'flask' || ev.kind === 'fire' ? 'fire' : 'arrow');
        break;
      case 'impact':
        this.burst(ev.x, ev.y - 0.4, 3, { color: P.goldLight, speed: 2.2, life: 0.22, size: 0.08 });
        break;
      case 'splash':
        audio?.play('pop');
        this.addRing(ev.x, ev.y, ev.radius, ev.kind === 'flask' ? P.malachiteLight : '#f08a24', 0.35);
        this.burst(ev.x, ev.y, 14, { color: ev.kind === 'flask' ? P.malachiteLight : '#f08a24', speed: 3.6, life: 0.4, size: 0.13 });
        break;
      case 'blast':
        audio?.play('boom');
        this.addRing(ev.x, ev.y, ev.radius, '#f08a24', 0.5);
        this.burst(ev.x, ev.y, 34, { color: '#f08a24', speed: 6, life: 0.55, size: 0.2 });
        this.burst(ev.x, ev.y, 16, { color: INK, speed: 3, life: 0.8, size: 0.24 });
        this.addStain(ev.x, ev.y, ev.radius * 0.7, 'rgba(27,20,16,.55)');
        this.addShake(0.18);
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
        audio?.play(ev.effect === 'rage' ? 'bell' : ev.effect === 'summon' ? 'grave' : 'splat');
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
        this.burst(ev.x, ev.y - (ev.air ? 1.2 : 0.5), 6, { color: ev.team === 0 ? P.lapisLight : P.vermilionLight, speed: 3.2, life: 0.5, size: 0.11 });
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
    this.drawProjectiles(ctx, sim, alpha);
    this.drawSpellsInFlight(ctx);
    this.drawBolts(ctx);
    this.drawParticles(ctx);
    for (const e of list) this.drawBars(ctx, e);
    if (this.ghost) this.drawGhost(ctx);
    if (options.dim) {
      ctx.fillStyle = `rgba(44,10,44,${options.dim})`;
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

  drawZones(ctx, sim) {
    // Zones interdites hachurées en vermillon quand une carte est prise en main.
    const { ghost } = this;
    if (ghost.type === 'spell') return;
    const t = this.tile;
    const team = 0;
    const leftBound = sim.deployBound(team, 2);
    const rightBound = sim.deployBound(team, 16);
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.sx(0), this.sy(0), (W / 2) * t, leftBound * t);
    ctx.rect(this.sx(W / 2), this.sy(0), (W / 2) * t, rightBound * t);
    ctx.clip();
    ctx.fillStyle = 'rgba(125,26,18,.5)';
    ctx.fillRect(this.sx(0), this.sy(0), W * t, H * t);
    ctx.strokeStyle = 'rgba(244,118,90,.55)';
    ctx.lineWidth = Math.max(1, t * 0.08);
    ctx.beginPath();
    for (let i = -H; i < W + H; i += 1.2) {
      ctx.moveTo(this.sx(i), this.sy(0));
      ctx.lineTo(this.sx(i + H), this.sy(H));
    }
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = P.goldLight;
    ctx.lineWidth = Math.max(2, t * 0.12);
    ctx.setLineDash([t * 0.45, t * 0.3]);
    ctx.beginPath();
    ctx.moveTo(this.sx(0), this.sy(leftBound));
    ctx.lineTo(this.sx(W / 2), this.sy(leftBound));
    ctx.lineTo(this.sx(W / 2), this.sy(rightBound));
    ctx.lineTo(this.sx(W), this.sy(rightBound));
    ctx.stroke();
    ctx.setLineDash([]);
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
      if (z.def.effect === 'slow') {
        ctx.fillStyle = 'rgba(14,20,54,.72)';
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) {
          const a = (i / 20) * Math.PI * 2;
          const wob = 1 + Math.sin(a * 5 + z.x) * 0.06 + Math.sin(a * 3 + this.time * 2) * 0.03;
          const px = cx + Math.cos(a) * r * wob;
          const py = cy + Math.sin(a) * r * wob;
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.fill();
        ctx.strokeStyle = P.lapisLight;
        ctx.lineWidth = Math.max(1.5, t * 0.08);
        ctx.stroke();
      } else if (z.def.effect === 'rage') {
        const pulse = 0.5 + Math.sin(this.time * 6) * 0.5;
        ctx.fillStyle = `rgba(232,185,35,${0.16 + pulse * 0.1})`;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 7);
        ctx.fill();
        ctx.strokeStyle = P.goldLight;
        ctx.lineWidth = Math.max(2, t * 0.12);
        ctx.setLineDash([t * 0.5, t * 0.3]);
        ctx.lineDashOffset = -this.time * t * 2;
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = 'rgba(44,10,44,.42)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 7);
        ctx.fill();
        ctx.strokeStyle = P.bone;
        ctx.lineWidth = Math.max(1.5, t * 0.07);
        ctx.setLineDash([t * 0.2, t * 0.32]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
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
      ctx.strokeStyle = TEAMS[e.team].light;
      ctx.lineWidth = Math.max(1.2, t * 0.07);
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
    const u = (e.type === 'king' ? 0.8 : 1) / this.dpr;
    ctx.scale(u, u);
    blit(ctx, s.body, s.scale);
    if (e.flash > 0) {
      ctx.globalAlpha = e.flash * 0.5;
      blit(ctx, s.flash, s.scale);
    }
    ctx.restore();
    this.drawCrew(ctx, e, x, y);
  }

  // La garnison qui tire depuis les créneaux : le roi dort tant qu'il n'est pas réveillé.
  drawCrew(ctx, e, x, y) {
    const t = this.tile;
    const king = e.type === 'king';
    const px = x;
    const py = king ? y - 2.5 * t : y - 3.8 * t;
    const scale = t * (king ? 0.017 : 0.014);
    const recoil = e.atk * 3;
    ctx.save();
    ctx.translate(px, py + recoil * scale * 3);
    ctx.scale(scale * (e.team === 0 ? 1 : -1), scale);
    const skin = '#efc9a0';
    const T = TEAMS[e.team];
    if (king) {
      const awake = e.active;
      drawParts(ctx, [
        ['M-22 8C-22-18 22-18 22 8Z', T.main],
        ['M-18-30C-18-52 18-52 18-30C18-14 8-10 0-10C-8-10-18-14-18-30Z', skin],
        ['M-20-44L-20-66L-10-54L0-70L10-54L20-66L20-44Z', P.gold],
        ...(awake ? [['M-6-30a3 3 0 1 0 .1 0Z', INK, 0], ['M8-30a3 3 0 1 0 .1 0Z', INK, 0], ['M-4-18c4 2 8 2 12 0', null, 2.5]]
          : [['M-10-28c3-3 6-3 8 0M4-28c3-3 6-3 8 0', null, 2.5], ['M-3-18h8', null, 2.5]]),
      ]);
      if (!awake) {
        ctx.fillStyle = P.bone;
        ctx.font = `700 ${22}px Grenze, Georgia, serif`;
        const b = Math.sin(this.time * 2) * 4;
        ctx.fillText('z', 24, -44 + b);
        ctx.font = `700 ${15}px Grenze, Georgia, serif`;
        ctx.fillText('z', 38, -58 + b);
      }
    } else {
      drawParts(ctx, [
        ['M-16 8C-16-12 16-12 16 8Z', T.main],
        ['M-14-22C-14-40 14-40 14-22C14-10 6-6 0-6C-6-6-14-10-14-22Z', skin],
        ['M-16-24C-16-48 16-48 16-24L10-30H-10Z', P.steel],
        ['M6-20a2.8 2.8 0 1 0 .1 0Z', INK, 0],
        ['M20-40C34-22 34 2 20 18', null, 3.5],
      ]);
    }
    ctx.restore();
  }

  drawUnit(ctx, e) {
    const s = this.book.get(e.unit, e.team);
    const a = this.animOf(e.id);
    const t = this.tile;
    const dep = e.deployMax ? 1 - Math.max(0, e.deployT) / e.deployMax : 1;
    const speedK = e.moving ? (e.speed || 1) * e.slowMul * e.rageMul * (e.charging ? 1.8 : 1) : 0;
    a.phase += (speedK ? 7 + speedK * 3 : 0) * (1 / 60);
    const bob = e.moving ? Math.abs(Math.sin(a.phase)) : 0;
    const flyer = s.flyer;
    const jump = e.def?.jump && e.ry > RIVER_TOP - 0.6 && e.ry < RIVER_BOTTOM + 0.6 ? Math.sin(((e.ry - (RIVER_TOP - 0.6)) / 3.2) * Math.PI) * 1.4 : 0;
    const hover = flyer ? 1.25 + Math.sin(this.time * 2.6 + e.id) * 0.1 : 0;
    const x = this.sx(e.rx);
    const y = this.sy(e.ry - hover - jump) - bob * t * 0.1;
    // Coup : bascule vers la cible, comme une figurine découpée qu'on agite.
    const atk = e.atk || 0;
    const swing = atk > 0 ? Math.sin((1 - atk) * Math.PI) : 0;
    const armAngle = atk > 0 ? (atk > 0.55 ? -0.9 * ((1 - atk) / 0.45) : -0.9 + 2.2 * ((0.55 - atk) / 0.55)) : Math.sin(this.time * 1.4 + e.id) * 0.04;
    const tilt = (e.moving ? Math.sin(a.phase) * 0.07 : Math.sin(this.time * 1.7 + e.id) * 0.015) + swing * 0.12;
    const pop = dep < 1 ? easeBack(dep) : 1;
    const u = 1 / this.dpr;

    ctx.save();
    ctx.translate(x + (swing * e.face * t * 0.1), y);
    ctx.scale(pop * e.face * u, pop * u);
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
      ctx.globalAlpha = e.flash * 0.75;
      blit(ctx, s.flash, sc);
    }
    ctx.restore();

    if (e.stun > 0) {
      const sy = y - s.size * t * 0.95;
      for (let i = 0; i < 3; i++) {
        const an = this.time * 6 + i * 2.1;
        ctx.fillStyle = P.goldLight;
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
      ctx.fillStyle = P.goldLight;
      ctx.beginPath();
      ctx.arc(x + Math.sin(this.time * 9 + e.id) * e.r * t, y - s.size * t * 0.9, t * 0.07, 0, 7);
      ctx.fill();
    }
    if (e.slowMul < 1) {
      ctx.fillStyle = P.lapisLight;
      ctx.beginPath();
      ctx.arc(x, y + t * 0.05, e.r * t * 0.5, 0, 7);
      ctx.fill();
    }
  }

  drawBars(ctx, e) {
    const t = this.tile;
    if (!e.alive) return;
    const T = TEAMS[e.team];
    if (e.kind === 'tower') {
      const w = (e.type === 'king' ? 4.2 : 3.2) * t;
      const h = Math.max(7, t * 0.42);
      const x = this.sx(e.rx) - w / 2;
      const y = this.sy(e.ry + e.hh * 0.95) + t * 0.12;
      ctx.fillStyle = INK;
      ctx.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
      ctx.fillStyle = '#3a3128';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = e.hp / e.maxHp < 0.3 ? P.goldLight : T.main;
      ctx.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), h);
      ctx.fillStyle = e.hp / e.maxHp < 0.3 ? INK : P.bone;
      ctx.font = `700 ${Math.max(10, h * 0.95)}px Grenze, Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(Math.ceil(e.hp)), x + w / 2, y + h / 2 + 0.5);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
      return;
    }
    const isBuilding = e.kind === 'building';
    if (e.hp >= e.maxHp && !isBuilding) return;
    const s = this.book.get(e.unit, e.team);
    const w = Math.max(t * 0.9, e.r * t * 1.9);
    const h = Math.max(3, t * 0.16);
    const x = this.sx(e.rx) - w / 2;
    const hover = e.air ? 1.25 : 0;
    const y = this.sy(e.ry - hover) - s.size * t * (e.air ? 0.8 : 1) - h - 1;
    ctx.fillStyle = INK;
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = T.main === P.lapis ? P.lapisLight : P.vermilionLight;
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
        case 'feather':
          ctx.rotate(angle);
          ctx.strokeStyle = p.kind === 'feather' ? P.fur : INK;
          ctx.lineWidth = Math.max(1.6, t * (p.kind === 'bolt' ? 0.14 : 0.08));
          ctx.beginPath();
          ctx.moveTo(-t * 0.45, 0);
          ctx.lineTo(t * 0.32, 0);
          ctx.stroke();
          ctx.fillStyle = p.kind === 'feather' ? P.bone : P.steel;
          ctx.beginPath();
          ctx.moveTo(t * 0.45, 0);
          ctx.lineTo(t * 0.22, -t * 0.12);
          ctx.lineTo(t * 0.22, t * 0.12);
          ctx.fill();
          break;
        case 'flask':
          ctx.rotate(this.time * 9);
          ctx.fillStyle = P.malachiteLight;
          ctx.strokeStyle = INK;
          ctx.lineWidth = Math.max(1.2, t * 0.06);
          ctx.beginPath();
          ctx.arc(0, 0, t * 0.2, 0, 7);
          ctx.fill();
          ctx.stroke();
          break;
        case 'fire':
          ctx.fillStyle = '#f08a24';
          ctx.beginPath();
          ctx.arc(0, 0, t * 0.26, 0, 7);
          ctx.fill();
          ctx.fillStyle = P.goldLight;
          ctx.beginPath();
          ctx.arc(0, 0, t * 0.13, 0, 7);
          ctx.fill();
          if (this.particles.length < MAX_PARTICLES) this.particles.push({ x: px, y: py, vx: 0, vy: -0.4, life: 0.25, max: 0.25, size: 0.1, color: '#f08a24', rot: 0, grav: 0 });
          break;
        case 'spit':
          ctx.fillStyle = P.purpleLight;
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
      if (s.card.id === 'fleches') continue;
      const k = Math.min(1, s.t / s.dur);
      const x = s.fromX + (s.x - s.fromX) * k;
      const y = s.fromY + (s.y - s.fromY) * k - Math.sin(k * Math.PI) * 3.4;
      if (s.card.id === 'courroux') continue;
      ctx.save();
      ctx.translate(this.sx(x), this.sy(y));
      ctx.rotate(this.time * 8);
      const sc = t * 0.012;
      ctx.scale(sc, sc);
      ctx.translate(0, 50);
      drawParts(ctx, SPELL_ICONS[s.card.id]());
      ctx.restore();
      this.burst(x, y, 1, { color: '#f08a24', speed: 0.6, life: 0.3, size: 0.09 });
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
    const color = ghost.valid ? P.goldLight : P.vermilionLight;
    if (card.type === 'spell') {
      const r = (card.spell?.radius || 2.5) * t;
      ctx.fillStyle = ghost.valid ? 'rgba(255,226,122,.18)' : 'rgba(214,52,30,.22)';
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
      ctx.strokeStyle = 'rgba(255,226,122,.6)';
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

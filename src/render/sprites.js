// Met les figures en cache sous forme de calques (jambes, corps, bras) : quelques drawImage par unité à chaque image.
import { drawFigureStill, drawParts, figure, INK, PIGMENT, SPELL_ICONS, TEAMS, TOWER_ART } from './art.js';

const BOX = { x: -112, y: -214, w: 224, h: 240 };
const UNIT_ZOOM = 1.22; // les figures sont volontairement plus grandes que leur emprise au sol

function layer(scale, parts, shift = 0) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(BOX.w * scale);
  c.height = Math.ceil(BOX.h * scale);
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);
  ctx.translate(-BOX.x + shift, -BOX.y);
  drawParts(ctx, parts);
  return c;
}

function silhouette(src) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = '#fff6d8';
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

export class SpriteBook {
  constructor() {
    this.cache = new Map();
    this.tile = 24;
  }

  setScale(tile) {
    if (tile === this.tile && this.cache.size) return;
    this.tile = tile;
    this.cache.clear();
  }

  get(id, team) {
    const key = `${id}:${team}`;
    let s = this.cache.get(key);
    if (s) return s;
    const fig = figure(id, team);
    const scale = (fig.size * UNIT_ZOOM * this.tile) / 100;
    s = {
      scale, size: fig.size, flyer: !!fig.flyer,
      body: layer(scale, fig.body),
      legs: (fig.legs || []).map((l) => ({ pivot: l.pivot, wing: !!l.wing, img: layer(scale, l.parts, l.shift || 0) })),
      arm: fig.arm ? { pivot: fig.arm.pivot, img: layer(scale, fig.arm.parts) } : null,
    };
    s.flash = silhouette(s.body);
    this.cache.set(key, s);
    return s;
  }

  tower(kind, team) {
    const key = `tower:${kind}:${team}`;
    let s = this.cache.get(key);
    if (s) return s;
    const scale = this.tile / 34;
    const art = TOWER_ART[kind](TEAMS[team]);
    s = { scale, body: layer(scale, art.body) };
    s.flash = silhouette(s.body);
    this.cache.set(key, s);
    return s;
  }
}

// Pose un calque à l'échelle : le contexte a son origine aux pieds de la figure.
export function blit(ctx, img, scale) {
  ctx.drawImage(img, BOX.x * scale, BOX.y * scale);
}

// Illustration de carte : figure ou icône sur un fond damassé, à la manière d'une miniature.
export function paintCardArt(canvas, card, team = 0) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const ground = card.type === 'spell' ? [PIGMENT.purpleLight, PIGMENT.purple]
    : card.type === 'building' ? [PIGMENT.malachiteLight, PIGMENT.malachite]
      : team === 0 ? ['#3556c8', '#203a96'] : ['#d6503a', '#a02a18'];
  ctx.fillStyle = ground[1];
  ctx.fillRect(0, 0, w, h);
  const step = w / 5;
  ctx.fillStyle = ground[0];
  for (let y = -1; y < h / step + 1; y++) {
    for (let x = -1; x < w / step + 1; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * step, y * step, step, step);
    }
  }
  ctx.fillStyle = PIGMENT.gold;
  for (let y = 0; y < h / step + 1; y++) {
    for (let x = 0; x < w / step + 1; x++) {
      const px = x * step;
      const py = y * step;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(1, step * 0.09), 0, 7);
      ctx.fill();
    }
  }
  ctx.save();
  if (card.type === 'spell') {
    const s = (w / 100) * 0.74;
    ctx.translate(w / 2, h * 0.82);
    ctx.scale(s, s);
    drawParts(ctx, SPELL_ICONS[card.id]());
  } else {
    const fig = figure(card.unit, team);
    // Cadre la figure dans la miniature, quelle que soit sa taille en jeu.
    const heights = { escargot: 118, gargouille: 136, beffroi: 150, cigogne: 112, wyverne: 112, licorne: 128, ours: 136, abbesse: 104, chat: 128, lapin: 120, baliste: 104, terrier: 92 };
    const tall = heights[card.unit] || 100;
    const s = Math.min((h * 0.86) / tall, (w * 0.9) / 150);
    ctx.translate(w / 2 - (card.unit === 'escargot' ? 6 * s : 0), h * 0.93);
    ctx.scale(s, s);
    drawFigureStill(ctx, fig);
  }
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, w * 0.02);
  ctx.strokeRect(0, 0, w, h);
}

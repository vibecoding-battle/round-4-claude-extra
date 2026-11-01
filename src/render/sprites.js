// Met les figures en cache sous forme de calques (jambes, corps, bras) : quelques drawImage par unité à chaque image.
import { drawParts, figure, TEAMS, TOWER_ART } from './art.js';

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
  ctx.fillStyle = '#ffffff';
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

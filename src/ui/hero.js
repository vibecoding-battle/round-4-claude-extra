// La grande initiale historiée de l'accueil : un lapin chevalier et un escargot de siège, en boucle sans fin.
import { PIGMENT as P, INK } from '../render/art.js';
import { blit, SpriteBook } from '../render/sprites.js';

export class HeroInitial {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.book = new SpriteBook();
    this.running = true;
    this.t = 0;
    this.last = performance.now();
    this.still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    if (document.fonts?.ready) document.fonts.ready.then(() => this.paintStatic());
    this.raf = requestAnimationFrame((n) => this.frame(n));
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    this.w = Math.max(100, r.width);
    this.h = Math.max(100, r.height);
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.book.setScale((this.h / 7.2) * dpr);
    this.paintStatic();
  }

  // Fond de la miniature, redessiné seulement au changement de taille ou à l'arrivée de la police.
  paintStatic() {
    const c = document.createElement('canvas');
    c.width = this.canvas.width;
    c.height = this.canvas.height;
    const g = c.getContext('2d');
    g.scale(this.dpr, this.dpr);
    const { w, h } = this;
    const step = h / 8;
    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < Math.ceil(w / step) + 1; x++) {
        g.fillStyle = (x + y) % 2 ? P.lapis : P.lapisDark;
        g.fillRect(x * step, y * step, step + 0.5, step + 0.5);
        g.fillStyle = P.gold;
        g.beginPath();
        g.arc(x * step, y * step, Math.max(1.5, step * 0.07), 0, 7);
        g.fill();
      }
    }
    // Sol de prairie.
    const ground = h * 0.8;
    g.fillStyle = P.malachite;
    g.beginPath();
    g.moveTo(0, ground);
    g.bezierCurveTo(w * 0.3, ground - h * 0.05, w * 0.6, ground + h * 0.03, w, ground - h * 0.02);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.closePath();
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = Math.max(2, h * 0.008);
    g.stroke();
    const dots = ['#fff4d0', '#ffd24a', '#f4765a'];
    for (let i = 0; i < 40; i++) {
      const fx = ((i * 73) % 100) / 100;
      const fy = 0.84 + (((i * 37) % 100) / 100) * 0.14;
      g.fillStyle = dots[i % 3];
      g.beginPath();
      g.arc(fx * w, fy * h, Math.max(1.2, h * 0.006), 0, 7);
      g.fill();
    }
    // La lettre, or sur lapis, comme une vraie initiale.
    const size = h * 0.92;
    g.font = `900 ${size}px "Grenze Gotisch", Georgia, serif`;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    const lx = w / 2;
    const ly = h * 0.74;
    g.lineJoin = 'round';
    g.strokeStyle = INK;
    g.lineWidth = Math.max(4, size * 0.05);
    g.strokeText('G', lx, ly);
    g.fillStyle = P.gold;
    g.fillText('G', lx, ly);
    g.fillStyle = P.goldLight;
    g.save();
    g.beginPath();
    g.rect(0, 0, w, ly - size * 0.42);
    g.clip();
    g.fillText('G', lx, ly);
    g.restore();
    // Cadre.
    const f = Math.max(5, h * 0.022);
    g.lineWidth = f;
    g.strokeStyle = P.gold;
    g.strokeRect(f / 2, f / 2, w - f, h - f);
    g.lineWidth = Math.max(1.5, f * 0.28);
    g.strokeStyle = INK;
    g.strokeRect(0.5, 0.5, w - 1, h - 1);
    g.strokeRect(f, f, w - f * 2, h - f * 2);
    this.bg = c;
  }

  frame(now) {
    if (!this.running) return;
    this.raf = requestAnimationFrame((n) => this.frame(n));
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (!this.still) this.t += dt;
    this.draw();
  }

  draw() {
    const { ctx, w, h, t } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.bg) ctx.drawImage(this.bg, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const rabbit = this.book.get('lapin', 0);
    const snail = this.book.get('escargot', 1);
    const cycle = t % 3.2;
    const lunge = cycle < 0.5 ? Math.sin((cycle / 0.5) * Math.PI) : 0;
    const armSwing = cycle < 0.5 ? -0.8 + (cycle / 0.5) * 2.2 : -0.1 + Math.sin(t * 2) * 0.05;
    const hop = Math.abs(Math.sin(t * 3)) * (1 - lunge);
    const groundY = h * 0.92;
    const sc = 1 / this.dpr;
    // Lapin
    ctx.save();
    ctx.translate(w * 0.2 + lunge * w * 0.1, groundY - hop * h * 0.012);
    ctx.scale(sc * 1.2, sc * 1.2);
    ctx.rotate(lunge * 0.14);
    for (const leg of rabbit.legs) blit(ctx, leg.img, rabbit.scale);
    blit(ctx, rabbit.body, rabbit.scale);
    ctx.translate(rabbit.arm.pivot[0] * rabbit.scale, rabbit.arm.pivot[1] * rabbit.scale);
    ctx.rotate(armSwing);
    ctx.translate(-rabbit.arm.pivot[0] * rabbit.scale, -rabbit.arm.pivot[1] * rabbit.scale);
    blit(ctx, rabbit.arm.img, rabbit.scale);
    ctx.restore();
    // Escargot, qui encaisse sans ciller.
    const recoil = cycle > 0.2 && cycle < 0.55 ? Math.sin(((cycle - 0.2) / 0.35) * Math.PI) : 0;
    ctx.save();
    ctx.translate(w * 0.78 + recoil * w * 0.015, groundY);
    ctx.scale(-sc * 0.95, sc * 0.95);
    ctx.rotate(recoil * -0.06);
    blit(ctx, snail.body, snail.scale);
    ctx.translate(snail.arm.pivot[0] * snail.scale, snail.arm.pivot[1] * snail.scale);
    ctx.rotate(Math.sin(t * 1.1) * 0.12);
    ctx.translate(-snail.arm.pivot[0] * snail.scale, -snail.arm.pivot[1] * snail.scale);
    blit(ctx, snail.arm.img, snail.scale);
    ctx.restore();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
  }
}

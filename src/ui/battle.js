// Contrôleur d'une partie : boucle à pas fixe, saisie du joueur, HUD, et lien entre simulation et rendu.
import { AI } from '../sim/ai.js';
import { ELIXIR_MAX, Sim, TICK } from '../sim/sim.js';
import { Renderer } from '../render/renderer.js';
import { crownIcon, iconPause } from './dom.js';

const MAX_FRAME = 0.1;
export class Battle {
  constructor({ root, audio, deck, opponent, profile, onEnd, onQuit }) {
    this.root = root;
    this.audio = audio;
    this.opponent = opponent;
    this.onEnd = onEnd;
    this.onQuit = onQuit;
    this.profile = profile;
    this.deck = deck;
    this.selected = -1;
    this.dragging = false;
    this.pointer = null;
    this.paused = false;
    this.started = false;
    this.finished = false;
    this.acc = 0;
    this.lastTime = 0;
    this.outroT = 0;
    this.lastSecond = null;
    this.doubleAnnounced = false;
    this.tauntTimer = 0;
    this.nextHintAt = 0;
    this.hintStep = profile.tutorial ? -1 : 0;
    this.slotCards = [null, null, null, null];
    this.nextCardId = null;
    this.seed = Math.floor(Math.random() * 2 ** 31);
    this.sim = new Sim({ decks: [deck, opponent.deck], seed: this.seed, elixirRate: [1, opponent.elixirRate || 1] });
    this.ai = new AI(1, opponent.level, this.seed ^ 0x5bd1);
    this.build();
    this.renderer = new Renderer(this.dom.canvas);
    this.onResize = () => this.layout();
    this.onKey = (e) => this.handleKey(e);
    this.onMove = (e) => this.handlePointerMove(e);
    this.onUp = (e) => this.handlePointerUp(e);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
    this.layout();
    this.refreshHand(true);
    this.renderer.draw(this.sim, 1);
    this.intro();
    window.__battle = this; // point d'entrée des scénarios de test de bout en bout
  }

  build() {
    const o = this.opponent;
    this.root.innerHTML = `
      <div class="battle">
        <p class="rotate">Tourne ton appareil : le jeu se joue à la verticale.</p>
        <main class="stage" data-ref="stage">
          <div class="field" data-ref="field">
            <canvas class="arena" data-ref="canvas" aria-label="Terrain de bataille"></canvas>
            <div class="hud hud-foe"><span class="hud-name">${o.name}</span></div>
            <div class="hud hud-clock" data-ref="clockBox">
              <span class="clock-label" data-ref="clockLabel">Temps restant</span>
              <span class="clock" data-ref="clock" role="timer">3:00</span>
            </div>
            <div class="hud scoreboard" aria-label="Couronnes">
              <div class="score-box t1"><b data-ref="foeCrowns">0</b>${crownIcon}</div>
              <div class="score-box t0"><b data-ref="myCrowns">0</b>${crownIcon}</div>
            </div>
            <button class="pause-btn" data-ref="pauseBtn" aria-label="Mettre en pause">${iconPause}</button>
            <div class="emote" data-ref="taunt" aria-live="polite"></div>
            <div class="banner" data-ref="banner" aria-live="polite"></div>
            <div class="hint" data-ref="hint"></div>
            <div class="overlay" data-ref="overlay"></div>
          </div>
          <div class="tray">
            <div class="hand-row">
              <div class="next" aria-label="Carte suivante">
                <span class="next-label">Suivante</span>
                <img class="next-art" data-ref="nextArt" alt="" draggable="false">
              </div>
              <div class="hand" data-ref="hand" role="group" aria-label="Votre main"></div>
            </div>
            <div class="elixir" aria-label="Élixir">
              <span class="elixir-drop"><svg viewBox="0 0 24 30" aria-hidden="true"><path d="M12 1C8 9 2 14 2 20a10 9.5 0 0 0 20 0C22 14 16 9 12 1Z"/></svg><b data-ref="elixirNum">5</b></span>
              <div class="elixir-bar" data-ref="elixirBar" role="meter" aria-valuemin="0" aria-valuemax="10" aria-valuenow="5">
                <div class="elixir-fill" data-ref="elixirFill"></div>
                <div class="elixir-ticks">${'<i></i>'.repeat(9)}</div>
              </div>
            </div>
          </div>
        </main>
      </div>`;
    this.dom = {};
    this.root.querySelectorAll('[data-ref]').forEach((n) => {
      this.dom[n.dataset.ref] = n;
    });
    this.dom.pauseBtn.addEventListener('click', () => this.togglePause());
    this.dom.canvas.addEventListener('pointerdown', (e) => this.handleArenaDown(e));
    this.dom.hand.innerHTML = [0, 1, 2, 3].map((i) => `
      <button class="card" data-slot="${i}" type="button">
        <img alt="" draggable="false">
        <span class="cost"></span>
      </button>`).join('');
    this.cards = [...this.dom.hand.children];
    this.cards.forEach((node, i) => {
      node.addEventListener('pointerdown', (e) => this.handleCardDown(e, i));
      node.addEventListener('click', (e) => e.preventDefault());
    });
    this.updateCrowns();
  }

  layout() {
    const { field } = this.dom;
    const rect = field.getBoundingClientRect();
    this.renderer.resize(Math.max(120, Math.floor(rect.width)), Math.max(200, Math.floor(rect.height)));
    this.renderer.page && this.renderer.draw(this.sim, 1);
  }

  // --- Intro, fin et boucle ---

  intro() {
    const { overlay } = this.dom;
    overlay.className = 'overlay show intro';
    overlay.innerHTML = `<div class="duel-card"><p class="duel-vs">Contre</p><h2 class="stroke">${this.opponent.name}</h2><p class="duel-title">${this.opponent.title}</p></div>`;
    this.say(this.opponent.taunts.start);
    this.audio.startMusic(92);
    this.running = true;
    const steps = ['3', '2', '1', 'Combat !'];
    let k = -1;
    const tick = () => {
      if (!this.running) return;
      k++;
      if (k >= steps.length) {
        overlay.className = 'overlay';
        overlay.innerHTML = '';
        this.started = true;
        this.lastTime = performance.now();
        if (this.hintStep === 0) this.showHint('Glisse une carte sur ta moitié du terrain pour la poser.');
        return;
      }
      overlay.innerHTML = `<div class="countdown">${steps[k]}</div>`;
      this.audio.play(k === 3 ? 'crown' : 'tick');
      this.introTimer = setTimeout(tick, k === 3 ? 500 : 650);
    };
    this.introTimer = setTimeout(tick, 1300);
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  frame(now) {
    if (!this.running) return;
    this.raf = requestAnimationFrame((t) => this.frame(t));
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dt > MAX_FRAME) dt = MAX_FRAME;
    if (this.paused) return;
    const { sim, renderer } = this;
    if (this.started && !this.finished) {
      this.acc += dt;
      while (this.acc >= TICK) {
        this.acc -= TICK;
        this.stepOnce();
        if (sim.over) break;
      }
    }
    renderer.update(dt);
    renderer.draw(sim, this.acc / TICK);
    renderer.pruneAnim(sim);
    this.updateHud();
    if (this.finished) {
      this.outroT += dt;
      if (this.outroT > 1.7 && !this.ended) {
        this.ended = true;
        this.onEnd(this.result());
      }
    }
  }

  stepOnce() {
    const { sim } = this;
    for (const e of sim.entities) {
      e.px = e.x;
      e.py = e.y;
    }
    for (const p of sim.projectiles) {
      p.px = p.x;
      p.py = p.y;
    }
    this.ai.update(sim);
    sim.step();
    if (sim.events.length) {
      for (const ev of sim.events) this.onSimEvent(ev);
      this.renderer.consume(sim.events, this.audio);
      sim.events.length = 0;
    }
    this.tauntTimer = Math.max(0, this.tauntTimer - TICK);
  }

  onSimEvent(ev) {
    switch (ev.type) {
      case 'play': {
        if (ev.team === 0) {
          this.refreshHand();
          this.advanceHint();
        }
        break;
      }
      case 'towerDown':
        this.updateCrowns();
        this.audio.play('crown');
        if (ev.by === 0) {
          this.showBanner(ev.type === 'king' ? 'La tour du roi s’effondre !' : 'Une tour tombe !', 'good');
          this.say(this.opponent.taunts.hit, true);
        } else {
          this.showBanner(ev.type === 'king' ? 'Ta tour du roi s’effondre…' : 'Ta tour est tombée', 'bad');
          this.say(this.opponent.taunts.score, true);
        }
        break;
      case 'overtime':
        this.showBanner('Mort subite : première tour, partie gagnée', 'good');
        this.audio.play('double');
        this.audio.setTempo(120);
        break;
      case 'over':
        this.finished = true;
        this.clearSelection();
        this.audio.stopMusic();
        this.audio.play(ev.winner === 0 ? 'win' : ev.winner === 1 ? 'lose' : 'click');
        this.say(ev.winner === 0 ? this.opponent.taunts.lose : this.opponent.taunts.win, true);
        break;
      default:
    }
  }

  result() {
    const { sim } = this;
    return {
      winner: sim.over.winner,
      reason: sim.over.reason,
      myCrowns: sim.players[0].crowns,
      foeCrowns: sim.players[1].crowns,
      stats: sim.players[0].stats,
      foeStats: sim.players[1].stats,
      time: sim.time,
    };
  }

  // --- HUD ---

  updateHud() {
    const { sim, dom } = this;
    const me = sim.players[0];
    const { elixir } = me;
    dom.elixirFill.style.transform = `scaleX(${elixir / ELIXIR_MAX})`;
    const whole = Math.floor(elixir + 1e-6);
    if (whole !== this.lastElixir) {
      this.lastElixir = whole;
      dom.elixirNum.textContent = whole;
      dom.elixirBar.setAttribute('aria-valuenow', whole);
    }
    const left = Math.max(0, Math.ceil(sim.timeLeft()));
    if (left !== this.lastSecond) {
      this.lastSecond = left;
      dom.clock.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      dom.clockBox.classList.toggle('urgent', left <= 30);
      if (sim.overtime) dom.clockLabel.textContent = 'Prolongation';
      else if (sim.elixirMultiplier() > 1) dom.clockLabel.textContent = 'Élixir ×2';
      if (left <= 10 && left > 0 && this.started && !this.finished) this.audio.play('tick');
    }
    if (!sim.overtime && sim.elixirMultiplier() > 1 && !this.doubleAnnounced) {
      this.doubleAnnounced = true;
      this.showBanner('Élixir ×2 !', 'good');
      this.audio.play('double');
      this.audio.setTempo(112);
    }
    this.cards.forEach((node, i) => {
      const card = me.hand[i];
      if (!card) return;
      const cost = sim.costOf(0, card);
      const can = elixir >= cost;
      node.classList.toggle('poor', !can);
      node.classList.toggle('picked', i === this.selected);
      const shown = cost === Infinity ? '–' : String(cost);
      if (node._cost !== shown) {
        node._cost = shown;
        node.querySelector('.cost').textContent = shown;
      }
    });
    if (this.nextHintAt && performance.now() > this.nextHintAt) this.advanceHint(true);
  }

  refreshHand(initial) {
    const me = this.sim.players[0];
    this.cards.forEach((node, i) => {
      const card = me.hand[i];
      if (this.slotCards[i] === card) return;
      this.slotCards[i] = card;
      node.querySelector('img').src = `assets/cards/${card.id}.png`;
      node.setAttribute('aria-label', `${card.name}, ${card.copy ? 'coût variable' : `${card.cost} d’élixir`}. ${card.blurb}`);
      node.dataset.rarity = card.rarity;
      if (!initial) {
        node.classList.remove('drawn');
        void node.offsetWidth;
        node.classList.add('drawn');
      }
    });
    const nextCard = me.queue[0];
    if (nextCard && this.nextCardId !== nextCard.id) {
      this.nextCardId = nextCard.id;
      this.dom.nextArt.src = `assets/cards/${nextCard.id}.png`;
      this.dom.nextArt.alt = nextCard.name;
    }
  }

  updateCrowns() {
    this.dom.foeCrowns.textContent = this.sim.players[1].crowns;
    this.dom.myCrowns.textContent = this.sim.players[0].crowns;
  }

  say(pool, force) {
    if (!pool || !pool.length) return;
    if (this.tauntTimer > 0 && !force) return;
    this.tauntTimer = 8;
    const line = pool[Math.floor(Math.random() * pool.length)];
    const node = this.dom.taunt;
    node.textContent = line;
    node.classList.remove('show');
    void node.offsetWidth;
    node.classList.add('show');
  }

  showBanner(text, tone) {
    const { banner } = this.dom;
    banner.textContent = text;
    banner.className = `banner show ${tone || ''}`;
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => {
      banner.className = 'banner';
    }, 2200);
  }

  showHint(text) {
    const { hint } = this.dom;
    hint.textContent = text;
    hint.classList.add('show');
  }

  advanceHint(fromTimer) {
    if (this.hintStep < 0) return;
    if (this.hintStep === 0 && fromTimer) return;
    this.hintStep++;
    if (this.hintStep === 1) {
      this.showHint('L’élixir remonte seul. Chaque carte en coûte : garde-en pour répondre.');
      this.nextHintAt = performance.now() + 6500;
    } else if (this.hintStep === 2) {
      this.showHint('Détruis les tours d’en face. La tour du roi vaut la partie.');
      this.nextHintAt = performance.now() + 6500;
    } else {
      this.dom.hint.classList.remove('show');
      this.hintStep = -1;
      this.nextHintAt = 0;
      this.profile.tutorial = true;
    }
  }

  // --- Saisie ---

  handleKey(e) {
    if (e.key === 'Escape') {
      if (this.selected >= 0) this.clearSelection();
      else this.togglePause();
      return;
    }
    if (e.key >= '1' && e.key <= '4' && this.started && !this.paused && !this.finished) {
      this.selectCard(Number(e.key) - 1, true);
      this.updateGhostFromPointer();
    }
  }

  canPayFor(slot) {
    const me = this.sim.players[0];
    const card = me.hand[slot];
    if (!card) return false;
    return me.elixir >= this.sim.costOf(0, card);
  }

  selectCard(slot, toggle) {
    if (toggle && this.selected === slot) {
      this.clearSelection();
      return;
    }
    this.selected = slot;
    this.audio.play('pick');
    this.syncGhostType();
  }

  syncGhostType() {
    if (this.selected < 0) {
      this.renderer.ghost = null;
      return;
    }
    this.updateGhostFromPointer();
  }

  clearSelection() {
    this.selected = -1;
    this.dragging = false;
    this.renderer.ghost = null;
    this.cards.forEach((c) => c.classList.remove('dragging'));
  }

  handleCardDown(e, slot) {
    if (!this.started || this.paused || this.finished) return;
    e.preventDefault();
    this.audio.unlock();
    const me = this.sim.players[0];
    if (me.hand[slot]?.copy && !me.last) {
      this.flashCard(slot, 'Rien à copier : joue une autre carte d’abord');
      return;
    }
    const wasSelected = this.selected === slot;
    this.selected = slot;
    this.dragging = true;
    this.dragStart = { x: e.clientX, y: e.clientY, wasSelected };
    this.pointer = { x: e.clientX, y: e.clientY };
    this.audio.play('pick');
    this.cards[slot].classList.add('dragging');
    this.updateGhostFromPointer();
  }

  handleArenaDown(e) {
    if (!this.started || this.paused || this.finished) return;
    this.audio.unlock();
    this.pointer = { x: e.clientX, y: e.clientY };
    if (this.selected >= 0) {
      this.updateGhostFromPointer();
      this.tryPlaceAtGhost();
    }
  }

  handlePointerMove(e) {
    this.pointer = { x: e.clientX, y: e.clientY };
    if (this.selected >= 0) this.updateGhostFromPointer();
  }

  handlePointerUp(e) {
    if (!this.dragging) return;
    this.pointer = { x: e.clientX, y: e.clientY };
    this.dragging = false;
    this.cards.forEach((c) => c.classList.remove('dragging'));
    const start = this.dragStart;
    const moved = start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12;
    if (!moved) {
      // Simple tap sur une carte : elle reste sélectionnée, un second tap la repose.
      if (start && start.wasSelected) this.clearSelection();
      return;
    }
    this.updateGhostFromPointer();
    if (this.renderer.ghost) this.tryPlaceAtGhost();
    else this.clearSelection();
  }

  worldFromPointer() {
    if (!this.pointer) return null;
    const rect = this.dom.canvas.getBoundingClientRect();
    const px = this.pointer.x - rect.left;
    const py = this.pointer.y - rect.top;
    if (px < 0 || py < 0 || px > rect.width || py > rect.height) return null;
    const [x, y] = this.renderer.toWorld(px, py);
    // Aimantation à la demi-case pour des poses précises.
    return [Math.round(x * 2) / 2, Math.round(y * 2) / 2];
  }

  updateGhostFromPointer() {
    if (this.selected < 0) {
      this.renderer.ghost = null;
      return;
    }
    const world = this.worldFromPointer();
    const me = this.sim.players[0];
    const card = me.hand[this.selected];
    if (!world || !card) {
      this.renderer.ghost = null;
      return;
    }
    const real = this.sim.resolveCard(0, card);
    if (!real) {
      this.renderer.ghost = null;
      return;
    }
    const [x, y] = world;
    this.renderer.ghost = { id: real.id, type: real.type, x, y, valid: this.sim.canPlace(0, card, x, y) && this.canPayFor(this.selected) };
  }

  tryPlaceAtGhost() {
    const { ghost } = this.renderer;
    if (!ghost) return;
    const slot = this.selected;
    if (!this.canPayFor(slot)) {
      this.flashCard(slot, 'Pas assez d’élixir');
      return;
    }
    if (!ghost.valid) {
      this.flashCard(slot, 'Pas ici : reste de ton côté');
      return;
    }
    if (this.sim.play(0, slot, ghost.x, ghost.y)) {
      this.clearSelection();
    }
  }

  flashCard(slot, message) {
    this.audio.play('refuse');
    const node = this.cards[slot];
    node.classList.remove('refused');
    void node.offsetWidth;
    node.classList.add('refused');
    this.showBanner(message, 'bad');
  }

  // --- Pause ---

  togglePause(force) {
    if (this.finished || !this.started) return;
    this.paused = force === undefined ? !this.paused : force;
    const { overlay } = this.dom;
    if (this.paused) {
      this.clearSelection();
      overlay.className = 'overlay show paused';
      overlay.innerHTML = `
        <div class="pause-card">
          <h2 class="stroke">Pause</h2>
          <button class="btn btn-rubric" data-act="resume">Reprendre</button>
          <label class="check"><input type="checkbox" data-act="music" ${this.audio.muted.music ? '' : 'checked'}> Musique</label>
          <label class="check"><input type="checkbox" data-act="sfx" ${this.audio.muted.sfx ? '' : 'checked'}> Effets sonores</label>
          <button class="btn btn-quiet" data-act="quit">Abandonner</button>
        </div>`;
      overlay.querySelector('[data-act=resume]').addEventListener('click', () => this.togglePause(false));
      overlay.querySelector('[data-act=quit]').addEventListener('click', () => this.quit());
      overlay.querySelector('[data-act=music]').addEventListener('change', (e) => this.setSound('music', !e.target.checked));
      overlay.querySelector('[data-act=sfx]').addEventListener('change', (e) => this.setSound('sfx', !e.target.checked));
      overlay.querySelector('[data-act=resume]').focus();
    } else {
      overlay.className = 'overlay';
      overlay.innerHTML = '';
      this.lastTime = performance.now();
    }
  }

  setSound(kind, muted) {
    this.audio.setMuted(kind, muted);
    this.profile[kind === 'music' ? 'musicMuted' : 'sfxMuted'] = muted;
  }

  quit() {
    this.destroy();
    this.onQuit();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.introTimer);
    clearTimeout(this.bannerTimer);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
    this.audio.stopMusic();
    if (window.__battle === this) window.__battle = null;
  }
}

// Les écrans : accueil, cartes, règles, combat et résultat.
import { AudioEngine } from './audio/audio.js';
import { CHAPTERS, RANKS, SKIRMISH_DECKS, rankFor } from './data/campaign.js';
import { LEVELS } from './sim/ai.js';
import { CARDS, CARD_BY_ID, UNITS } from './sim/cards.js';
import { Battle } from './ui/battle.js';
import { crownIcon, iconLock, iconMute, iconSound } from './ui/dom.js';
import { loadProfile, saveProfile, unlockSource, unlockedCards } from './ui/store.js';

const app = document.getElementById('app');
const audio = new AudioEngine();
const profile = loadProfile();
audio.setMuted('sfx', profile.sfxMuted);
audio.setMuted('music', profile.musicMuted);

let battle = null;
let deckState = { inspect: null, filter: 'tout' };

window.addEventListener('pointerdown', () => audio.unlock(), { capture: true });
window.addEventListener('keydown', () => audio.unlock(), { capture: true });

function teardown() {
  if (battle) battle.destroy();
  battle = null;
}

function click() {
  audio.play('click');
}

const TYPE_LABEL = { troop: 'Troupe', building: 'Bâtiment', spell: 'Sort' };
const RARITY_LABEL = { commune: 'Commune', rare: 'Rare', epique: 'Épique', legendaire: 'Légendaire' };

function cardFace(card, { locked = false, extra = '' } = {}) {
  return `<button type="button" class="card card-flat ${locked ? 'locked' : ''}"
      data-card="${card.id}" data-rarity="${card.rarity}" aria-label="${card.name}${locked ? ', verrouillée' : ''}">
      <img src="assets/cards/${card.id}.png" alt="" draggable="false">
      <span class="cost">${card.copy ? '?' : card.cost}</span>
      ${locked ? `<span class="lock">${iconLock}</span>` : ''}${extra}
    </button>`;
}

function ribbons(active) {
  const tabs = [['deck', 'Cartes'], ['home', 'Combat'], ['rules', 'Règles']];
  const soundOn = !profile.sfxMuted || !profile.musicMuted;
  return `<nav class="tabs" aria-label="Navigation">
      ${tabs.map(([id, label]) => `<button class="tab ${active === id ? 'on' : ''}" data-nav="${id}" ${active === id ? 'aria-current="page"' : ''}>${label}</button>`).join('')}
      <button class="tab tab-sound" data-sound aria-label="${soundOn ? 'Couper le son' : 'Rétablir le son'}">${soundOn ? iconSound : iconMute}</button>
    </nav>`;
}

function bindNav(root) {
  root.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => {
    click();
    show(b.dataset.nav);
  }));
  const s = root.querySelector('[data-sound]');
  if (s) {
    s.addEventListener('click', () => {
      const on = !profile.sfxMuted || !profile.musicMuted;
      profile.sfxMuted = on;
      profile.musicMuted = on;
      audio.setMuted('sfx', on);
      audio.setMuted('music', on);
      saveProfile(profile);
      s.innerHTML = on ? iconMute : iconSound;
      s.setAttribute('aria-label', on ? 'Rétablir le son' : 'Couper le son');
      click();
    });
  }
}

function show(screen, arg) {
  teardown();
  if (screen === 'home') renderHome();
  else if (screen === 'deck') renderDeck();
  else if (screen === 'rules') renderRules();
  else if (screen === 'battle') startBattle(arg);
  window.scrollTo(0, 0);
}

// --- Accueil ---

function nextRank() {
  return RANKS.find(([min]) => min > profile.trophies) || null;
}

function renderHome() {
  const current = Math.min(profile.beaten, CHAPTERS.length - 1);
  const target = CHAPTERS[current];
  const done = profile.beaten >= CHAPTERS.length;
  const next = nextRank();
  const show5 = ['knight', 'archers', 'mega-knight', 'giant', 'fireball'];
  app.innerHTML = `
    <div class="screen">
      <header class="logo">
        <h1>Clash<br>Royale</h1>
        <p>Projet de fan, non affilié à Supercell</p>
      </header>
      <div class="showcase" aria-hidden="true">${show5.map((id) => `<img src="assets/cards/${id}.png" alt="">`).join('')}</div>
      <section class="panel">
        <p class="rank stroke">${rankFor(profile.trophies)}</p>
        <dl class="ledger">
          <div><dt>Trophées</dt><dd>${profile.trophies}${next ? ` <small>/ ${next[0]}</small>` : ''}</dd></div>
          <div><dt>Victoires</dt><dd>${profile.wins}</dd></div>
          <div><dt>Défaites</dt><dd>${profile.losses}</dd></div>
          <div><dt>Couronnes</dt><dd>${profile.crowns}</dd></div>
        </dl>
      </section>
      <div>
        <button class="btn btn-rubric btn-big" data-chapter="${current}">${done ? 'Rejouer' : 'Combat'}</button>
        <p class="primary-note">${target.name} · ${target.title} · ${LEVELS[target.level].label}</p>
      </div>
      <section class="panel">
        <h2 class="rubric stroke">Les arènes</h2>
        <ol class="folios">
          ${CHAPTERS.map((ch, i) => {
    const state = i < profile.beaten ? 'beaten' : i === profile.beaten ? 'open' : 'closed';
    return `<li class="fol ${state}">
              <button type="button" ${state === 'closed' ? 'disabled' : ''} data-chapter="${i}">
                <span class="fol-num">${ch.numeral}</span>
                <span class="fol-who"><b>${ch.title}</b><small>${state === 'closed' ? 'Arène verrouillée' : ch.name}</small></span>
                <span class="fol-state">${state === 'beaten' ? `<span class="crown on t0">${crownIcon}</span>` : state === 'open' ? LEVELS[ch.level].label : iconLock}</span>
              </button>
            </li>`;
  }).join('')}
        </ol>
      </section>
      <section class="panel skirmish">
        <h2 class="rubric stroke">Combat amical</h2>
        <p>Un dresseur au hasard, sans enjeu pour la campagne.</p>
        <div class="levels">
          ${Object.entries(LEVELS).map(([id, l]) => `<button class="btn btn-quiet" data-skirmish="${id}">${l.label}</button>`).join('')}
        </div>
      </section>
      ${ribbons('home')}
    </div>`;
  bindNav(app);
  app.querySelectorAll('[data-chapter]').forEach((b) => b.addEventListener('click', () => {
    click();
    show('battle', { chapter: Number(b.dataset.chapter) });
  }));
  app.querySelectorAll('[data-skirmish]').forEach((b) => b.addEventListener('click', () => {
    click();
    show('battle', { skirmish: b.dataset.skirmish });
  }));
}

// --- Cartes ---

function statRows(card) {
  if (card.type === 'spell') {
    const s = card.spell;
    if (!s) return [['Effet', 'Recopie la dernière carte jouée'], ['Coût', 'Dernière carte + 1']];
    const rows = [['Rayon', `${s.radius} cases`]];
    if (s.dmg) rows.push(['Dégâts', s.volleys ? `${s.dmg} × ${s.volleys}` : s.strikes ? `${s.dmg} × ${s.strikes} cibles` : s.dmg]);
    if (s.count) rows.push(['Gobelins', `× ${s.count}`]);
    if (s.stun) rows.push(['Étourdit', `${String(s.stun).replace('.', ',')} s`]);
    if (s.duration) rows.push(['Durée', `${s.duration} s`]);
    if (s.towerMul) rows.push(['Sur les tours', `${Math.round(s.towerMul * 100)} %`]);
    if (s.rage) rows.push(['Accélère', `${Math.round((s.rage - 1) * 100)} %`]);
    return rows;
  }
  const u = UNITS[card.unit];
  const rows = [['Vie', u.hp]];
  if (card.count > 1) rows.push(['Nombre', `× ${card.count}`]);
  if (u.dmg) rows.push(['Dégâts', u.dmg], ['Cadence', `${u.hit} s`]);
  if (u.ramp) rows.push(['Rayon', u.ramp.join(' → ')]);
  if (u.producer) rows.push(['Produit', `${u.producer.amount} élixir toutes les ${u.producer.every} s`]);
  if (u.spawner) rows.push(['Engendre', `${u.spawner.count} toutes les ${String(u.spawner.every).replace('.', ',')} s`]);
  if (u.speed) rows.push(['Vitesse', u.speed >= 2 ? 'Très rapide' : u.speed >= 1.5 ? 'Rapide' : u.speed >= 1 ? 'Moyenne' : 'Lente']);
  if (u.range > 1) rows.push(['Portée', `${String(u.range).replace('.', ',')} cases`]);
  else if (u.dmg) rows.push(['Portée', 'Contact']);
  if (u.life) rows.push(['Durée', `${u.life} s`]);
  const t = { any: 'Sol et air', ground: 'Sol seulement', buildings: 'Bâtiments seulement', none: 'Aucune' }[u.targets];
  rows.push(['Cibles', t]);
  if (u.air) rows.push(['Déplacement', 'Vole']);
  return rows;
}

function renderDeck() {
  const owned = unlockedCards(profile);
  const { filter } = deckState;
  const filters = [['tout', 'Toutes'], ['troop', 'Troupes'], ['building', 'Bâtiments'], ['spell', 'Sorts']];
  const list = CARDS.filter((c) => filter === 'tout' || c.type === filter).sort((a, b) => (owned.has(b.id) - owned.has(a.id)) || a.cost - b.cost);
  const deck = profile.deck.map((id) => CARD_BY_ID[id]);
  const known = deck.filter((c) => !c.copy);
  const avg = known.length ? (known.reduce((s, c) => s + c.cost, 0) / known.length).toFixed(1).replace('.', ',') : '–';
  const inspected = deckState.inspect ? CARD_BY_ID[deckState.inspect] : deck[0] || CARDS[0];
  const isIn = profile.deck.includes(inspected.id);
  const isOwned = owned.has(inspected.id);
  const source = unlockSource(inspected.id);
  const full = profile.deck.length >= 8;

  app.innerHTML = `
    <div class="screen screen-wide codex-deck">
      <div class="deck-main">
        <section class="panel">
          <header class="deck-head">
            <h1 class="page-title stroke">Mon deck</h1>
            <p class="deck-meta" role="status">${profile.deck.length} / 8 cartes · coût moyen <b>${avg}</b></p>
          </header>
          <div class="deck-slots" style="margin-top:10px">
            ${Array.from({ length: 8 }, (_, i) => (deck[i] ? cardFace(deck[i]) : '<div class="slot-empty" aria-label="Emplacement vide"></div>')).join('')}
          </div>
        </section>
        <section class="panel">
          <div class="filters" role="group" aria-label="Filtrer" style="margin-bottom:12px">
            ${filters.map(([id, label]) => `<button class="chip ${filter === id ? 'on' : ''}" data-filter="${id}">${label}</button>`).join('')}
          </div>
          <div class="collection">
            ${list.map((c) => cardFace(c, { locked: !owned.has(c.id), extra: profile.deck.includes(c.id) ? '<span class="in-deck">Deck</span>' : '' })).join('')}
          </div>
        </section>
      </div>
      <aside class="panel inspector" aria-live="polite">
        <img class="inspect-art" src="assets/cards/${inspected.id}.png" alt="">
        <h2 class="stroke">${inspected.name}</h2>
        <p class="inspect-kind">${TYPE_LABEL[inspected.type]} · ${RARITY_LABEL[inspected.rarity]} · ${inspected.copy ? 'coût variable' : `${inspected.cost} d’élixir`}</p>
        <p>${inspected.blurb}</p>
        <table class="stats">
          ${statRows(inspected).map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}
        </table>
        ${isOwned
    ? `<button class="btn ${isIn ? 'btn-quiet' : 'btn-rubric'}" data-toggle="${inspected.id}" ${!isIn && full ? 'disabled' : ''}>${isIn ? 'Retirer du deck' : full ? 'Deck complet' : 'Ajouter au deck'}</button>`
    : `<p class="inspect-lock">${iconLock} À gagner en battant ${source ? source.name : 'la campagne'}.</p>`}
      </aside>
      ${ribbons('deck')}
    </div>`;
  bindNav(app);
  app.querySelectorAll('[data-card]').forEach((b) => b.addEventListener('click', () => {
    click();
    deckState.inspect = b.dataset.card;
    renderDeck();
    // Sur écran étroit, la fiche est sous la collection : on l'amène à l'œil.
    if (window.innerWidth <= 880) app.querySelector('.inspector').scrollIntoView({ block: 'start' });
  }));
  app.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => {
    click();
    deckState.filter = b.dataset.filter;
    renderDeck();
  }));
  const t = app.querySelector('[data-toggle]');
  if (t) {
    t.addEventListener('click', () => {
      click();
      const id = t.dataset.toggle;
      if (profile.deck.includes(id)) profile.deck = profile.deck.filter((d) => d !== id);
      else if (profile.deck.length < 8) profile.deck = [...profile.deck, id];
      saveProfile(profile);
      renderDeck();
    });
  }
}

// --- Règles ---

function renderRules() {
  app.innerHTML = `
    <div class="screen screen-wide">
      <section class="panel">
        <h1 class="page-title stroke" style="margin-bottom:.3em">Règles</h1>
        <div class="rule-cols">
          <div>
            <h2 class="rubric stroke">Gagner</h2>
            <p>Chaque camp a deux tours de princesse et une tour du roi. Une tour détruite rapporte une couronne, la tour du roi en rapporte trois et termine le combat.</p>
            <p>Au bout de trois minutes, le camp qui a le plus de couronnes gagne. À égalité, une minute de mort subite : la première tour détruite décide. Si rien ne tombe, la tour la plus abîmée perd.</p>
            <h2 class="rubric stroke">Jouer une carte</h2>
            <p>Glisse une carte sur le terrain, ou touche-la puis touche le terrain. Troupes et bâtiments se posent de ton côté, les sorts où tu veux.</p>
            <p>Ta main compte quatre cartes, ton deck huit. Chaque carte jouée repart sous le paquet et la suivante la remplace.</p>
          </div>
          <div>
            <h2 class="rubric stroke">L’élixir</h2>
            <p>Il remonte seul, un point toutes les 2,8 secondes, jusqu’à dix. Il monte deux fois plus vite pendant la dernière minute, trois fois plus vite à la fin de la prolongation.</p>
            <h2 class="rubric stroke">Le terrain</h2>
            <p>La rivière ne se franchit que par les deux ponts, sauf pour les volants, le Chevaucheur et le Prince qui sautent. Le roi dort tant que sa tour est intacte et que ses tours de princesse tiennent.</p>
            <p>Quand une tour adverse tombe, tu peux poser des troupes plus loin de ce côté.</p>
            <h2 class="rubric stroke">Qui frappe quoi</h2>
            <p>Les épées ne touchent que le sol. Archères, sorts et tours atteignent aussi les airs. Le Géant, le Chevaucheur, le Ballon et le Golem ne visent que les bâtiments : un bâtiment bien placé les détourne.</p>
          </div>
        </div>
      </section>
      ${ribbons('rules')}
    </div>`;
  bindNav(app);
}

// --- Partie ---

function startBattle({ chapter, skirmish }) {
  if (profile.deck.length !== 8) {
    deckState.inspect = null;
    show('deck');
    const meta = app.querySelector('.deck-meta');
    if (meta) meta.innerHTML = `<b class="warn">Il te faut 8 cartes pour combattre.</b> ${meta.innerHTML}`;
    return;
  }
  let opponent;
  if (skirmish) {
    const deck = SKIRMISH_DECKS[Math.floor(Math.random() * SKIRMISH_DECKS.length)];
    const pool = CHAPTERS[Math.floor(Math.random() * CHAPTERS.length)];
    opponent = { ...pool, deck, level: skirmish, elixirRate: 1, note: null, title: `Combat amical, niveau ${LEVELS[skirmish].label}` };
  } else {
    opponent = CHAPTERS[chapter];
  }
  app.innerHTML = '<div class="battle-root"></div>';
  const root = app.querySelector('.battle-root');
  battle = new Battle({
    root, audio, opponent, profile, deck: profile.deck,
    onQuit: () => {
      saveProfile(profile);
      show('home');
    },
    onEnd: (res) => endBattle(res, { chapter, skirmish, opponent }),
  });
}

function endBattle(res, ctx) {
  const won = res.winner === 0;
  const draw = res.winner === -1;
  let trophyGain = 0;
  let unlockedNow = [];
  if (won) {
    trophyGain = 20 + res.myCrowns * 10;
    profile.wins++;
    if (ctx.chapter !== undefined && ctx.chapter === profile.beaten) {
      profile.beaten++;
      unlockedNow = CHAPTERS[ctx.chapter].unlocks;
    }
  } else if (!draw) {
    trophyGain = -10;
    profile.losses++;
  }
  if (ctx.skirmish) trophyGain = Math.round(trophyGain / 2);
  profile.trophies = Math.max(0, profile.trophies + trophyGain);
  profile.crowns += res.myCrowns;
  saveProfile(profile);

  const headline = won ? 'Victoire' : draw ? 'Égalité' : 'Défaite';
  const reasonText = {
    king: won ? 'La tour du roi adverse est détruite.' : 'Ta tour du roi est détruite.',
    crowns: won ? 'Plus de couronnes au terme du temps.' : 'Moins de couronnes au terme du temps.',
    sudden: won ? 'Première tour abattue en mort subite.' : 'Première tour perdue en mort subite.',
    tiebreak: won ? 'Leur tour la plus abîmée a cédé sur le fil.' : 'Ta tour la plus abîmée te coûte la partie.',
    draw: 'Aucun camp ne l’emporte.',
  }[res.reason];
  const m = Math.floor(res.time / 60);
  const s = String(Math.floor(res.time % 60)).padStart(2, '0');
  const crowns = (n, team) => [0, 1, 2].map((i) => `<span class="crown ${i < n ? 'on' : ''} t${team}" style="--i:${i}">${crownIcon}</span>`).join('');
  const nextChapter = ctx.chapter !== undefined && won && ctx.chapter + 1 < CHAPTERS.length ? ctx.chapter + 1 : null;

  const overlay = battle.dom.overlay;
  overlay.className = `overlay show result ${won ? 'won' : draw ? 'tied' : 'lost'}`;
  overlay.innerHTML = `
    <div class="result-card">
      <h2 class="result-title stroke">${headline}</h2>
      <p class="result-reason">${reasonText}</p>
      <div class="score">
        <div class="score-side"><span>Toi</span><div class="crowns">${crowns(res.myCrowns, 0)}</div></div>
        <div class="score-side"><span>${ctx.opponent.name}</span><div class="crowns">${crowns(res.foeCrowns, 1)}</div></div>
      </div>
      <table class="stats result-stats">
        <tr><th scope="row">Durée</th><td>${m}:${s}</td></tr>
        <tr><th scope="row">Cartes posées</th><td>${res.stats.cardsPlayed}</td></tr>
        <tr><th scope="row">Dégâts sur les tours</th><td>${Math.round(res.stats.towerDamage)}</td></tr>
        <tr><th scope="row">Trophées</th><td>${trophyGain >= 0 ? '+' : ''}${trophyGain} (${profile.trophies})</td></tr>
      </table>
      ${unlockedNow.length ? `
        <div class="unlocks">
          <h3 class="rubric stroke">Nouvelles cartes</h3>
          <div class="unlock-row">${unlockedNow.map((id) => cardFace(CARD_BY_ID[id])).join('')}</div>
        </div>` : ''}
      <div class="result-actions">
        ${nextChapter !== null ? `<button class="btn btn-rubric" data-act="next">Arène suivante : ${CHAPTERS[nextChapter].title}</button>` : ''}
        <button class="btn ${nextChapter !== null ? 'btn-quiet' : 'btn-rubric'}" data-act="again">Rejouer</button>
        <button class="btn btn-quiet" data-act="home">Accueil</button>
      </div>
    </div>`;
  overlay.querySelector('[data-act=again]').addEventListener('click', () => {
    click();
    show('battle', ctx.skirmish ? { skirmish: ctx.skirmish } : { chapter: ctx.chapter });
  });
  overlay.querySelector('[data-act=home]').addEventListener('click', () => {
    click();
    show('home');
  });
  const nxt = overlay.querySelector('[data-act=next]');
  if (nxt) {
    nxt.addEventListener('click', () => {
      click();
      show('battle', { chapter: nextChapter });
    });
  }
}

show('home');

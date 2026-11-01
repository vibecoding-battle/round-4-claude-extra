// Les écrans du codex : accueil, grimoire, règles, combat et résultat.
import { AudioEngine } from './audio/audio.js';
import { CHAPTERS, RANKS, SKIRMISH_DECKS, rankFor } from './data/campaign.js';
import { paintCardArt } from './render/sprites.js';
import { LEVELS } from './sim/ai.js';
import { CARDS, CARD_BY_ID, UNITS } from './sim/cards.js';
import { Battle } from './ui/battle.js';
import { crownIcon, iconLock, iconMute, iconSound } from './ui/dom.js';
import { HeroInitial } from './ui/hero.js';
import { loadProfile, saveProfile, unlockSource, unlockedCards } from './ui/store.js';

const app = document.getElementById('app');
const audio = new AudioEngine();
const profile = loadProfile();
audio.setMuted('sfx', profile.sfxMuted);
audio.setMuted('music', profile.musicMuted);

let battle = null;
let hero = null;
let deckState = { inspect: null, filter: 'tout' };

window.addEventListener('pointerdown', () => audio.unlock(), { capture: true });
window.addEventListener('keydown', () => audio.unlock(), { capture: true });

function teardown() {
  if (hero) hero.destroy();
  hero = null;
  if (battle) battle.destroy();
  battle = null;
}

function click() {
  audio.play('click');
}

const TYPE_LABEL = { troop: 'Troupe', building: 'Bâtiment', spell: 'Sort' };
const RARITY_LABEL = { commune: 'Commune', rare: 'Rare', epique: 'Épique' };

function cardFace(card, { locked = false, extra = '' } = {}) {
  return `<button type="button" class="card card-flat ${locked ? 'locked' : ''} ${card.type === 'spell' ? 'kind-spell' : card.type === 'building' ? 'kind-building' : ''}"
      data-card="${card.id}" data-rarity="${card.rarity}" aria-label="${card.name}${locked ? ', verrouillée' : ''}">
      <canvas width="150" height="170" data-art="${card.id}"></canvas>
      <span class="cost">${card.copy ? '+1' : card.cost}</span>
      <span class="card-name">${card.name}</span>
      ${locked ? `<span class="lock">${iconLock}</span>` : ''}${extra}
    </button>`;
}

function paintArts(root) {
  root.querySelectorAll('canvas[data-art]').forEach((c) => paintCardArt(c, CARD_BY_ID[c.dataset.art], 0));
}

function ribbons(active) {
  const tabs = [['home', 'Campagne'], ['deck', 'Grimoire'], ['rules', 'Règles']];
  const soundOn = !profile.sfxMuted || !profile.musicMuted;
  return `<nav class="ribbons" aria-label="Signets">
      ${tabs.map(([id, label]) => `<button class="ribbon ${active === id ? 'on' : ''}" data-nav="${id}" ${active === id ? 'aria-current="page"' : ''}>${label}</button>`).join('')}
      <button class="ribbon ribbon-sound" data-sound aria-label="${soundOn ? 'Couper le son' : 'Rétablir le son'}">${soundOn ? iconSound : iconMute}</button>
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
  return RANKS.find(([min]) => min > profile.seals) || null;
}

function renderHome() {
  const current = Math.min(profile.beaten, CHAPTERS.length - 1);
  const target = CHAPTERS[current];
  const done = profile.beaten >= CHAPTERS.length;
  const next = nextRank();
  app.innerHTML = `
    <div class="codex">
      ${ribbons('home')}
      <section class="folio folio-left">
        <div class="title-block">
          <canvas class="initial" data-ref="initial" role="img" aria-label="Lettrine G : un lapin chevalier affronte un escargot de siège"></canvas>
          <h1 class="title"><span class="sr">G</span>uerre<br>des Marges</h1>
        </div>
        <p class="lede">Dans les marges du manuscrit, les drôleries ont pris les armes. Deux pages, trois tours de chaque côté, et une encre qui sèche vite.</p>
        <div class="primary">
          <button class="btn btn-rubric btn-big" data-chapter="${current}">
            ${done ? 'Rejouer contre' : 'Affronter'} ${target.name}
          </button>
          <p class="primary-note">Folio ${target.numeral} · ${target.title} · ${LEVELS[target.level].label}</p>
        </div>
        <dl class="ledger">
          <div><dt>Rang</dt><dd>${rankFor(profile.seals)}</dd></div>
          <div><dt>Sceaux</dt><dd>${profile.seals}${next ? ` <small>/ ${next[0]}</small>` : ''}</dd></div>
          <div><dt>Victoires</dt><dd>${profile.wins}</dd></div>
          <div><dt>Couronnes</dt><dd>${profile.crowns}</dd></div>
        </dl>
      </section>
      <section class="folio folio-right">
        <h2 class="rubric">Les huit folios</h2>
        <ol class="folios">
          ${CHAPTERS.map((ch, i) => {
    const state = i < profile.beaten ? 'beaten' : i === profile.beaten ? 'open' : 'closed';
    return `<li class="fol ${state}">
              <button type="button" ${state === 'closed' ? 'disabled' : ''} data-chapter="${i}">
                <span class="fol-num">${ch.numeral}</span>
                <span class="fol-who"><b>${ch.name}</b><small>${state === 'closed' ? 'Page encore scellée' : ch.title}</small></span>
                <span class="fol-state">${state === 'beaten' ? `<span class="crown on t0">${crownIcon}</span>` : state === 'open' ? LEVELS[ch.level].label : iconLock}</span>
              </button>
            </li>`;
  }).join('')}
        </ol>
        <div class="skirmish">
          <h2 class="rubric">Escarmouche libre</h2>
          <p>Un adversaire au hasard, sans enjeu de campagne.</p>
          <div class="levels">
            ${Object.entries(LEVELS).map(([id, l]) => `<button class="btn btn-quiet" data-skirmish="${id}">${l.label}</button>`).join('')}
          </div>
        </div>
      </section>
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
  hero = new HeroInitial(app.querySelector('[data-ref=initial]'));
}

// --- Grimoire ---

function statRows(card) {
  if (card.type === 'spell') {
    const s = card.spell;
    if (!s) return [['Effet', 'Recopie la dernière carte jouée'], ['Coût', 'Dernière carte + 1']];
    const rows = [['Rayon', `${s.radius} cases`]];
    if (s.dmg) rows.push(['Dégâts', s.volleys ? `${s.dmg} × ${s.volleys}` : s.strikes ? `${s.dmg} × ${s.strikes} cibles` : s.dmg]);
    if (s.dps) rows.push(['Par seconde', s.dps]);
    if (s.duration) rows.push(['Durée', `${s.duration} s`]);
    if (s.towerMul) rows.push(['Sur les tours', `${Math.round(s.towerMul * 100)} %`]);
    if (s.slow) rows.push(['Ralentit', `${Math.round((1 - s.slow) * 100)} %`]);
    if (s.rage) rows.push(['Accélère', `${Math.round((s.rage - 1) * 100)} %`]);
    return rows;
  }
  const u = UNITS[card.unit];
  const rows = [['Vie', u.hp]];
  if (card.count > 1) rows.push(['Nombre', `× ${card.count}`]);
  if (u.dmg) rows.push(['Dégâts', u.dmg], ['Cadence', `${u.hit} s`]);
  if (u.kamikaze) rows.push(['Explosion', u.kamikaze.dmg]);
  if (u.heal) rows.push(['Soin par seconde', u.heal.hps]);
  if (u.spawner) rows.push(['Engendre', `${u.spawner.count} toutes les ${String(u.spawner.every).replace('.', ',')} s`]);
  if (u.speed) rows.push(['Vitesse', u.speed >= 1.5 ? 'Rapide' : u.speed >= 1 ? 'Moyenne' : 'Lente']);
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
    <div class="codex codex-deck">
      ${ribbons('deck')}
      <section class="folio folio-wide">
        <header class="deck-head">
          <h1 class="page-title">Le Grimoire</h1>
          <p class="deck-meta" role="status">${profile.deck.length} / 8 cartes · coût moyen <b>${avg}</b></p>
        </header>
        <div class="deck-slots">
          ${Array.from({ length: 8 }, (_, i) => (deck[i] ? cardFace(deck[i], { extra: '' }) : '<div class="slot-empty" aria-label="Emplacement vide"></div>')).join('')}
        </div>
        <div class="filters" role="group" aria-label="Filtrer">
          ${filters.map(([id, label]) => `<button class="chip ${filter === id ? 'on' : ''}" data-filter="${id}">${label}</button>`).join('')}
        </div>
        <div class="collection">
          ${list.map((c) => cardFace(c, { locked: !owned.has(c.id), extra: profile.deck.includes(c.id) ? '<span class="in-deck">Au deck</span>' : '' })).join('')}
        </div>
      </section>
      <aside class="folio inspector" aria-live="polite">
        <canvas class="inspect-art" width="340" height="340" data-art="${inspected.id}"></canvas>
        <h2>${inspected.name}</h2>
        <p class="inspect-kind">${TYPE_LABEL[inspected.type]} · ${RARITY_LABEL[inspected.rarity]} · ${inspected.copy ? 'coût variable' : `${inspected.cost} d’encre`}</p>
        <p class="inspect-blurb">${inspected.blurb}</p>
        <table class="stats">
          ${statRows(inspected).map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}
        </table>
        ${isOwned
    ? `<button class="btn ${isIn ? 'btn-quiet' : 'btn-rubric'}" data-toggle="${inspected.id}" ${!isIn && full ? 'disabled' : ''}>${isIn ? 'Retirer du deck' : full ? 'Deck complet : retire une carte' : 'Ajouter au deck'}</button>`
    : `<p class="inspect-lock">${iconLock} À gagner en battant ${source ? source.name : 'la campagne'}.</p>`}
      </aside>
    </div>`;
  bindNav(app);
  paintArts(app);
  app.querySelectorAll('[data-card]').forEach((b) => b.addEventListener('click', () => {
    click();
    deckState.inspect = b.dataset.card;
    renderDeck();
    // Sur écran étroit, la fiche est sous la collection : on l'amène à l'œil.
    if (window.innerWidth <= 980) app.querySelector('.inspector').scrollIntoView({ block: 'start' });
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
    <div class="codex codex-rules">
      ${ribbons('rules')}
      <section class="folio folio-wide rules">
        <h1 class="page-title">La Règle</h1>
        <div class="rule-cols">
          <div>
            <h2 class="rubric">Gagner</h2>
            <p>Chaque camp garde deux tours et un donjon. Une tour abattue rapporte une couronne, le donjon en rapporte trois et clôt la partie sur-le-champ.</p>
            <p>Au bout de trois minutes, le plus couronné l’emporte. À égalité vient une minute de mort subite : la première tour abattue décide. Si rien ne tombe, la tour la plus abîmée perd.</p>
            <h2 class="rubric">Jouer une carte</h2>
            <p>Glisse une carte de ta main sur la page, ou touche-la puis touche la page. Les troupes et les bâtiments se posent sur ta moitié, les sorts où tu veux.</p>
            <p>Ta main compte quatre cartes, ton deck huit. Chaque carte jouée repart sous le paquet et la suivante la remplace.</p>
          </div>
          <div>
            <h2 class="rubric">L’encre</h2>
            <p>Elle remonte seule, une goutte toutes les 2,8 secondes, jusqu’à dix. Elle coule deux fois plus vite pendant la dernière minute, trois fois plus vite à la fin de la prolongation.</p>
            <h2 class="rubric">Le terrain</h2>
            <p>La rivière ne se franchit que par les deux ponts, sauf pour les volants et les bondisseurs. Le roi dort dans son donjon tant que celui-ci est intact et que ses tours tiennent : réveillé, il tire aussi.</p>
            <p>Quand une tour adverse tombe, tu peux poser des troupes plus loin de ce côté de la page.</p>
            <h2 class="rubric">Qui frappe quoi</h2>
            <p>Les lames ne touchent que le sol. Archers, sorts et tours atteignent aussi les airs. Le Grylle, l’Escargot, la Gargouille et la Cigogne ne visent que les bâtiments : un bâtiment bien placé les détourne.</p>
          </div>
        </div>
      </section>
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
    opponent = { ...pool, deck, level: skirmish, inkRate: 1, note: null, title: `Escarmouche, niveau ${LEVELS[skirmish].label}` };
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
  let sealGain = 0;
  let unlockedNow = [];
  if (won) {
    sealGain = 20 + res.myCrowns * 10;
    profile.wins++;
    if (ctx.chapter !== undefined && ctx.chapter === profile.beaten) {
      profile.beaten++;
      unlockedNow = CHAPTERS[ctx.chapter].unlocks;
    }
  } else if (!draw) {
    sealGain = -10;
    profile.losses++;
  }
  if (ctx.skirmish) sealGain = Math.round(sealGain / 2);
  profile.seals = Math.max(0, profile.seals + sealGain);
  profile.crowns += res.myCrowns;
  saveProfile(profile);

  const headline = won ? 'Victoire' : draw ? 'Égalité' : 'Défaite';
  const reasonText = {
    king: won ? 'Le donjon adverse est à terre.' : 'Ton donjon est à terre.',
    crowns: won ? 'Plus de couronnes au terme du temps.' : 'Moins de couronnes au terme du temps.',
    sudden: won ? 'Première tour abattue en mort subite.' : 'Première tour perdue en mort subite.',
    tiebreak: won ? 'Leur tour la plus abîmée a cédé sur le fil.' : 'Ta tour la plus abîmée te coûte la partie.',
    draw: 'Aucune page ne l’emporte.',
  }[res.reason];
  const m = Math.floor(res.time / 60);
  const s = String(Math.floor(res.time % 60)).padStart(2, '0');
  const crowns = (n, team) => [0, 1, 2].map((i) => `<span class="crown ${i < n ? 'on' : ''} t${team}" style="--i:${i}">${crownIcon}</span>`).join('');
  const nextChapter = ctx.chapter !== undefined && won && ctx.chapter + 1 < CHAPTERS.length ? ctx.chapter + 1 : null;

  const overlay = battle.dom.overlay;
  overlay.className = `overlay show result ${won ? 'won' : draw ? 'tied' : 'lost'}`;
  overlay.innerHTML = `
    <div class="result-card">
      <h2 class="result-title">${headline}</h2>
      <p class="result-reason">${reasonText}</p>
      <div class="score">
        <div class="score-side"><span>Toi</span><div class="crowns">${crowns(res.myCrowns, 0)}</div></div>
        <div class="score-side"><span>${ctx.opponent.name}</span><div class="crowns">${crowns(res.foeCrowns, 1)}</div></div>
      </div>
      <table class="stats result-stats">
        <tr><th scope="row">Durée</th><td>${m}:${s}</td></tr>
        <tr><th scope="row">Cartes posées</th><td>${res.stats.cardsPlayed}</td></tr>
        <tr><th scope="row">Dégâts sur les tours</th><td>${Math.round(res.stats.towerDamage)}</td></tr>
        <tr><th scope="row">Sceaux</th><td>${sealGain >= 0 ? '+' : ''}${sealGain} (${profile.seals})</td></tr>
      </table>
      ${unlockedNow.length ? `
        <div class="unlocks">
          <h3 class="rubric">Nouvelles cartes au grimoire</h3>
          <div class="unlock-row">${unlockedNow.map((id) => cardFace(CARD_BY_ID[id])).join('')}</div>
        </div>` : ''}
      <div class="result-actions">
        ${nextChapter !== null ? `<button class="btn btn-rubric" data-act="next">Folio suivant : ${CHAPTERS[nextChapter].name}</button>` : ''}
        <button class="btn ${nextChapter !== null ? 'btn-quiet' : 'btn-rubric'}" data-act="again">Rejouer</button>
        <button class="btn btn-quiet" data-act="home">Fermer le livre</button>
      </div>
    </div>`;
  paintArts(overlay);
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

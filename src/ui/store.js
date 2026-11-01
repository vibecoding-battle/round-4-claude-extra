// Progression du joueur, conservée dans le navigateur. La partie reste jouable si le stockage est bloqué.
import { CARD_BY_ID, DEFAULT_DECK } from '../sim/cards.js';
import { CHAPTERS, STARTER_CARDS } from '../data/campaign.js';

const KEY = 'clash-royale-fan.v1';

const FRESH = {
  deck: DEFAULT_DECK,
  beaten: 0,
  trophies: 0,
  wins: 0,
  losses: 0,
  crowns: 0,
  tutorial: false,
  sfxMuted: false,
  musicMuted: false,
};

export function loadProfile() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(KEY));
  } catch {
    saved = null;
  }
  const profile = { ...FRESH, ...(saved || {}) };
  const clean = (profile.deck || []).filter((id) => CARD_BY_ID[id]);
  profile.deck = clean.length === 8 ? clean : DEFAULT_DECK.slice();
  return profile;
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // Navigation privée ou quota : la progression vit le temps de la session.
  }
}

export function unlockedCards(profile) {
  const ids = new Set(STARTER_CARDS);
  CHAPTERS.slice(0, profile.beaten).forEach((ch) => ch.unlocks.forEach((id) => ids.add(id)));
  return ids;
}

export function unlockSource(cardId) {
  return CHAPTERS.find((ch) => ch.unlocks.includes(cardId)) || null;
}

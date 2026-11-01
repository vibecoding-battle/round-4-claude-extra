// Les arènes de la campagne : chaque dresseur a son deck, son niveau de jeu et ses répliques.

export const STARTER_CARDS = ['knight', 'archers', 'goblins', 'skeletons', 'bomber', 'spear-goblins', 'minions', 'giant', 'cannon', 'fireball', 'arrows', 'zap'];

const lines = (start, hit, score, lose, win) => ({ start: [start], hit: [hit], score: [score], lose: [lose], win: [win] });

export const CHAPTERS = [
  {
    id: 'earl', numeral: '1', name: 'Trainer Earl', title: 'Camp d’entraînement', level: 'novice', elixirRate: 1,
    deck: ['knight', 'archers', 'goblins', 'skeletons', 'bomber', 'cannon', 'arrows', 'minions'],
    unlocks: ['barbarians', 'musketeer', 'tombstone', 'mortar'],
    taunts: lines('Bien le bonjour !', 'Pas mal, pas mal !', 'Hé hé !', 'Bien joué !', 'Merci d’être venu !'),
  },
  {
    id: 'gob', numeral: '2', name: 'Trainer Gob', title: 'Stade des gobelins', level: 'novice', elixirRate: 1,
    deck: ['goblins', 'spear-goblins', 'goblin-hut', 'knight', 'minions', 'bomber', 'arrows', 'fireball'],
    unlocks: ['goblin-hut', 'goblin-barrel', 'minion-horde', 'mini-pekka'],
    taunts: lines('Hi hi hi ! Tes tours sont à moi.', 'Aïe !', 'Hi hi !', 'Pas juste !', 'Encore, encore !'),
  },
  {
    id: 'bones', numeral: '3', name: 'Trainer Ossa', title: 'Fosse des os', level: 'moyen', elixirRate: 1,
    deck: ['skeleton-army', 'skeletons', 'tombstone', 'giant', 'witch', 'minions', 'zap', 'arrows'],
    unlocks: ['witch', 'skeleton-army', 'giant-skeleton', 'bomb-tower'],
    taunts: lines('Mes os te saluent.', 'Crac !', 'Un de plus au cimetière.', 'Je reviendrai en morceaux.', 'Repose en paix.'),
  },
  {
    id: 'barb', numeral: '4', name: 'Trainer Brutus', title: 'Colisée des barbares', level: 'moyen', elixirRate: 1,
    deck: ['barbarians', 'barbarian-hut', 'valkyrie', 'hog-rider', 'archers', 'cannon', 'fireball', 'rage'],
    unlocks: ['barbarian-hut', 'valkyrie', 'hog-rider', 'rage'],
    taunts: lines('Par ma moustache !', 'Grrr !', 'Pour le clan !', 'Honorable combat.', 'Moustache victorieuse !'),
  },
  {
    id: 'spell', numeral: '5', name: 'Trainer Merlin', title: 'Vallée des sorts', level: 'fort', elixirRate: 1,
    deck: ['wizard', 'baby-dragon', 'knight', 'tesla', 'freeze', 'fireball', 'zap', 'mirror'],
    unlocks: ['wizard', 'freeze', 'mirror', 'baby-dragon'],
    taunts: lines('Abracadabra.', 'Mauvais sort !', 'Et hop, disparue.', 'Ma baguette a fourché.', 'Quelle magie !'),
  },
  {
    id: 'build', numeral: '6', name: 'Trainer Tess', title: 'Atelier du constructeur', level: 'fort', elixirRate: 1,
    deck: ['x-bow', 'tesla', 'mortar', 'knight', 'archers', 'elixir-collector', 'rocket', 'skeletons'],
    unlocks: ['tesla', 'x-bow', 'elixir-collector', 'rocket'],
    taunts: lines('Tout est calculé.', 'À réparer.', 'Selon le plan.', 'Erreur de conception.', 'Livraison terminée.'),
  },
  {
    id: 'royal', numeral: '7', name: 'Trainer Roy', title: 'Arène royale', level: 'expert', elixirRate: 1,
    deck: ['prince', 'pekka', 'balloon', 'lightning', 'musketeer', 'inferno-tower', 'goblins', 'arrows'],
    unlocks: ['prince', 'balloon', 'lightning', 'inferno-tower', 'pekka'],
    taunts: lines('À genoux.', 'Insolent !', 'Vive le roi !', 'Bien joué, manant.', 'Échec et mat.'),
  },
  {
    id: 'legend', numeral: '8', name: 'Trainer Mega', title: 'Arène légendaire', level: 'expert', elixirRate: 1.15,
    deck: ['mega-knight', 'golem', 'baby-dragon', 'witch', 'lightning', 'minion-horde', 'tombstone', 'zap'],
    unlocks: ['mega-knight', 'golem'],
    note: 'Son élixir remonte 15 % plus vite.',
    taunts: lines('Attention à la tête.', 'Ça chatouille.', 'BOUM.', 'Je rebondirai.', 'Écrasé.'),
  },
];

export const SKIRMISH_DECKS = [
  ['knight', 'archers', 'goblins', 'cannon', 'fireball', 'arrows', 'minions', 'giant'],
  ['giant', 'musketeer', 'mini-pekka', 'skeletons', 'fireball', 'zap', 'minions', 'goblins'],
  ['hog-rider', 'valkyrie', 'tesla', 'skeletons', 'arrows', 'musketeer', 'spear-goblins', 'freeze'],
  ['pekka', 'witch', 'balloon', 'bomber', 'zap', 'arrows', 'minion-horde', 'rage'],
  ['golem', 'baby-dragon', 'wizard', 'tombstone', 'lightning', 'goblins', 'skeletons', 'fireball'],
  ['mega-knight', 'prince', 'goblin-barrel', 'inferno-tower', 'rocket', 'bomber', 'skeleton-army', 'zap'],
];

export const RANKS = [
  [0, 'Camp d’entraînement'], [120, 'Stade des gobelins'], [300, 'Fosse des os'], [550, 'Colisée des barbares'], [850, 'Vallée des sorts'], [1200, 'Atelier du constructeur'], [1700, 'Arène royale'], [2300, 'Arène légendaire'],
];

export function rankFor(trophies) {
  let name = RANKS[0][1];
  for (const [min, label] of RANKS) if (trophies >= min) name = label;
  return name;
}

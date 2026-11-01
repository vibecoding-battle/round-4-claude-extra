// Données de jeu : profils d'unités et cartes. Les distances sont en cases (arène de 18 x 32).
// `targets` : 'any' (sol + air), 'ground' (sol seul), 'buildings' (bâtiments et tours seulement).
// Valeurs de base tirées des données publiées par RoyaleAPI (cr-api-data), ramenées au niveau 9 par rareté.

const LV = { c: 2.12, r: 1.76, e: 1.33, l: 1 };
const lv = (rarity, n) => Math.round(n * LV[rarity]);

function troop(name, rarity, hp, dmg, hit, speed, range, r, mass, extra = {}) {
  return { name, hp: lv(rarity, hp), dmg: lv(rarity, dmg), hit, speed: speed / 60, range, r, mass, targets: 'ground', ...extra };
}

function tower(name, rarity, hp, dmg, hit, range, life, extra = {}) {
  return { name, building: true, hp: lv(rarity, hp), dmg: lv(rarity, dmg), hit, range, r: 0.95, life, targets: 'ground', ...extra };
}

export const UNITS = {
  skeleton: troop('Squelette', 'c', 32, 32, 1, 90, 0.5, 0.3, 1),
  goblin: troop('Gobelin', 'c', 79, 47, 1.1, 120, 0.5, 0.33, 2),
  'spear-goblin': troop('Gobelin à lances', 'c', 52, 32, 1.7, 120, 5.5, 0.33, 1, { targets: 'any', proj: { kind: 'spear', speed: 13 } }),
  bomber: troop('Bombardier', 'c', 130, 87, 1.8, 60, 4.5, 0.38, 4, { splash: 1.5, proj: { kind: 'bomb', speed: 7, arc: true } }),
  knight: troop('Chevalier', 'c', 690, 79, 1.2, 60, 1.2, 0.5, 6),
  archer: troop('Archère', 'c', 119, 42, 0.9, 60, 5, 0.38, 3, { targets: 'any', proj: { kind: 'arrow', speed: 13 } }),
  minion: troop('Gargouille', 'c', 90, 46, 1, 90, 1.6, 0.36, 2, { air: true, targets: 'any', proj: { kind: 'spit', speed: 10 } }),
  barbarian: troop('Barbare', 'c', 262, 75, 1.3, 60, 0.7, 0.45, 4),
  musketeer: troop('Mousquetaire', 'r', 340, 103, 1, 60, 6, 0.42, 5, { targets: 'any', proj: { kind: 'bullet', speed: 18 } }),
  valkyrie: troop('Valkyrie', 'r', 900, 126, 1.5, 60, 1.2, 0.5, 5, { spin: 2 }),
  'hog-rider': troop('Chevaucheur de cochon', 'r', 800, 150, 1.6, 120, 0.8, 0.6, 4, { targets: 'buildings', jump: true }),
  'mini-pekka': troop('Mini P.E.K.K.A', 'r', 642, 340, 1.6, 90, 0.8, 0.45, 4),
  giant: troop('Géant', 'r', 1930, 120, 1.5, 45, 1.2, 0.75, 18, { targets: 'buildings' }),
  wizard: troop('Sorcier', 'r', 340, 133, 1.4, 60, 5.5, 0.42, 5, { targets: 'any', splash: 1.5, proj: { kind: 'fire', speed: 10 } }),
  'baby-dragon': troop('Bébé dragon', 'e', 720, 133, 1.5, 90, 3.5, 0.55, 5, { air: true, targets: 'any', splash: 1.5, proj: { kind: 'fire', speed: 10 } }),
  witch: troop('Sorcière', 'e', 524, 84, 1.1, 60, 5.5, 0.42, 8, { targets: 'any', splash: 1, proj: { kind: 'magic', speed: 10 }, spawner: { unit: 'skeleton', count: 4, every: 7 } }),
  prince: troop('Prince', 'e', 1200, 245, 1.4, 60, 1.6, 0.6, 6, { jump: true, charge: { dist: 3, speedMul: 2, dmgMul: 2 } }),
  balloon: troop('Ballon', 'e', 1050, 400, 2, 60, 0.1, 0.55, 6, { air: true, targets: 'buildings', deathDamage: { radius: 3, dmg: lv('e', 150), towerMul: 1 } }),
  'giant-skeleton': troop('Squelette géant', 'e', 2140, 167, 1.4, 60, 0.8, 0.95, 18, { deathSpawn: { unit: 'gs-bomb', count: 1 } }),
  pekka: troop('P.E.K.K.A', 'e', 2350, 510, 1.8, 45, 1.2, 0.75, 18),
  golem: troop('Golem', 'e', 3200, 195, 2.5, 45, 0.75, 0.9, 20, { targets: 'buildings', deploy: 3, deathSpawn: { unit: 'golemite', count: 2 }, deathDamage: { radius: 2, dmg: lv('e', 140), towerMul: 1 } }),
  golemite: troop('Golemite', 'e', 650, 31, 2.5, 45, 0.25, 0.5, 6, { targets: 'buildings', deathDamage: { radius: 1.5, dmg: lv('e', 62), towerMul: 1 } }),
  'mega-knight': troop('Méga chevalier', 'l', 3300, 222, 1.7, 60, 1.2, 0.75, 18, {
    splash: 1.3, spawnDamage: { radius: 3, dmg: 444 }, leap: { min: 3.5, max: 5, dmgMul: 2, radius: 2.2, dur: 0.75, cooldown: 1.2 },
  }),
  cannon: tower('Canon', 'c', 322, 83, 0.9, 5.5, 30, { proj: { kind: 'cannonball', speed: 14 } }),
  tesla: tower('Tesla', 'c', 450, 90, 1.1, 5.5, 30, { targets: 'any', hides: true }),
  mortar: tower('Mortier', 'c', 535, 104, 5, 11.5, 30, { deploy: 3.5, minRange: 3.5, splash: 2, proj: { kind: 'bomb', speed: 5, arc: true } }),
  tombstone: tower('Pierre tombale', 'r', 250, 0, 1, 0, 30, { targets: 'none', spawner: { unit: 'skeleton', count: 2, every: 3.5 }, deathSpawn: { unit: 'skeleton', count: 4 } }),
  'bomb-tower': tower('Tour à bombes', 'r', 640, 105, 1.6, 6, 30, { splash: 1.5, proj: { kind: 'bomb', speed: 8, arc: true }, deathDamage: { radius: 3, dmg: lv('r', 105), towerMul: 1 } }),
  'inferno-tower': tower('Tour de l’enfer', 'r', 825, 20, 0.4, 6, 30, { targets: 'any', ramp: [lv('r', 20), lv('r', 75), lv('r', 400)], rampEvery: 2 }),
  'goblin-hut': tower('Cabane de gobelins', 'r', 400, 0, 1, 0, 29, { targets: 'none', spawner: { unit: 'spear-goblin', count: 3, every: 10 }, deathSpawn: { unit: 'spear-goblin', count: 1 } }),
  'elixir-collector': tower('Extracteur d’élixir', 'r', 505, 0, 1, 0, 65, { targets: 'none', producer: { every: 9, amount: 1 } }),
  'barbarian-hut': tower('Cabane de barbares', 'r', 550, 0, 1, 0, 30, { targets: 'none', spawner: { unit: 'barbarian', count: 3, every: 14 }, deathSpawn: { unit: 'barbarian', count: 1 } }),
  'x-bow': tower('Arbalète X', 'e', 1000, 26, 0.3, 11.5, 30, { deploy: 3.5, proj: { kind: 'bolt', speed: 20 } }),
  // La bombe du squelette géant : ni ciblable ni bloquante, elle explose au bout de sa durée.
  'gs-bomb': { name: 'Bombe', building: true, untargetable: true, hp: 1e6, dmg: 0, hit: 1, range: 0, r: 0.5, life: 3, targets: 'none', deathDamage: { radius: 3, dmg: lv('e', 740), towerMul: 1 } },
};

const card = (id, name, cost, type, rarity, blurb, more) => ({ id, name, cost, type, rarity, blurb, count: 1, ...more });
const t = (id, name, cost, rarity, unit, count, blurb) => card(id, name, cost, 'troop', rarity, blurb, { unit, count });
const b = (id, name, cost, rarity, blurb) => card(id, name, cost, 'building', rarity, blurb, { unit: id });
const s = (id, name, cost, rarity, spell, blurb) => card(id, name, cost, 'spell', rarity, blurb, { spell });

export const CARDS = [
  t('skeletons', 'Squelettes', 1, 'commune', 'skeleton', 3, 'Trois squelettes fragiles pour un seul élixir. Parfaits pour distraire.'),
  t('bomber', 'Bombardier', 2, 'commune', 'bomber', 1, 'Lance des bombes en cloche sur les groupes au sol. Très fragile.'),
  t('goblins', 'Gobelins', 2, 'commune', 'goblin', 4, 'Quatre gobelins très rapides, redoutables au contact.'),
  t('spear-goblins', 'Gobelins à lances', 2, 'commune', 'spear-goblin', 3, 'Trois lanceurs très rapides, au sol comme en l’air.'),
  t('knight', 'Chevalier', 3, 'commune', 'knight', 1, 'Solide et moustachu : le meilleur rapport vie et prix.'),
  t('archers', 'Archères', 3, 'commune', 'archer', 2, 'Deux tireuses à longue portée, sol et air.'),
  t('minions', 'Gargouilles', 3, 'commune', 'minion', 3, 'Trois petites volantes qui crachent au contact.'),
  t('barbarians', 'Barbares', 5, 'commune', 'barbarian', 5, 'Cinq costauds à l’épée, une vraie ligne de front.'),
  t('minion-horde', 'Horde de gargouilles', 5, 'commune', 'minion', 6, 'Six gargouilles : énorme dégâts si personne ne les arrose.'),
  t('musketeer', 'Mousquetaire', 4, 'rare', 'musketeer', 1, 'Très longue portée et tir précis, au sol comme en l’air.'),
  t('valkyrie', 'Valkyrie', 4, 'rare', 'valkyrie', 1, 'Sa hache balaie tout autour d’elle. Idéale contre les nuées.'),
  t('hog-rider', 'Chevaucheur de cochon', 4, 'rare', 'hog-rider', 1, 'Fonce sur les bâtiments et saute la rivière.'),
  t('mini-pekka', 'Mini P.E.K.K.A', 4, 'rare', 'mini-pekka', 1, 'Petit, rapide, et des coups énormes. Crêpes !'),
  t('giant', 'Géant', 5, 'rare', 'giant', 1, 'Très lent, très solide, ne vise que les bâtiments.'),
  t('wizard', 'Sorcier', 5, 'rare', 'wizard', 1, 'Boules de feu à distance, dégâts de zone sol et air.'),
  t('skeleton-army', 'Armée de squelettes', 3, 'epique', 'skeleton', 15, 'Quinze squelettes d’un coup. Un sort de zone les balaie.'),
  t('baby-dragon', 'Bébé dragon', 4, 'epique', 'baby-dragon', 1, 'Vole et crache un feu de zone.'),
  t('witch', 'Sorcière', 5, 'epique', 'witch', 1, 'Attaque à distance et invoque quatre squelettes toutes les 7 s.'),
  t('prince', 'Prince', 5, 'epique', 'prince', 1, 'Prend son élan : son premier coup après une charge frappe double.'),
  t('balloon', 'Ballon', 5, 'epique', 'balloon', 1, 'Vole droit sur les bâtiments et lâche ses bombes. Explose à sa mort.'),
  t('giant-skeleton', 'Squelette géant', 6, 'epique', 'giant-skeleton', 1, 'À sa mort, il lâche une bombe dévastatrice après 3 s.'),
  t('pekka', 'P.E.K.K.A', 7, 'epique', 'pekka', 1, 'Une armure ambulante, lente, aux dégâts colossaux.'),
  t('golem', 'Golem', 8, 'epique', 'golem', 1, 'Le plus gros tank. Vise les bâtiments et se scinde en deux golemites.'),
  t('mega-knight', 'Méga chevalier', 7, 'legendaire', 'mega-knight', 1, 'Atterrit en écrasant tout, puis bondit d’ennemi en ennemi.'),
  b('cannon', 'Canon', 3, 'commune', 'Défense au sol bon marché, attire les chercheurs de bâtiments.'),
  b('tesla', 'Tesla', 4, 'commune', 'Se cache sous terre tant qu’aucun ennemi n’approche. Sol et air.'),
  b('mortar', 'Mortier', 4, 'commune', 'Très longue portée, zone morte de près. Vise le sol.'),
  b('tombstone', 'Pierre tombale', 3, 'rare', 'Deux squelettes toutes les 3,5 s, et quatre de plus à sa chute.'),
  b('bomb-tower', 'Tour à bombes', 4, 'rare', 'Bombarde le sol, et laisse une dernière bombe en tombant.'),
  b('inferno-tower', 'Tour de l’enfer', 5, 'rare', 'Son rayon chauffe : plus il reste sur une cible, plus il fait mal.'),
  b('goblin-hut', 'Cabane de gobelins', 5, 'rare', 'Trois gobelins à lances toutes les 10 s.'),
  b('elixir-collector', 'Extracteur d’élixir', 6, 'rare', 'Produit un élixir toutes les 9 s, pendant 65 s.'),
  b('barbarian-hut', 'Cabane de barbares', 7, 'rare', 'Trois barbares toutes les 14 s.'),
  b('x-bow', 'Arbalète X', 6, 'epique', 'Tir très rapide à très longue portée, depuis votre moitié jusqu’aux tours.'),
  s('zap', 'Électrocution', 2, 'commune', { kind: 'blast', radius: 2.5, dmg: lv('c', 75), towerMul: 0.3, stun: 0.5, speed: 40 }, 'Décharge instantanée, étourdit une demi-seconde.'),
  s('arrows', 'Flèches', 3, 'commune', { kind: 'volley', radius: 4, dmg: lv('c', 48), volleys: 3, gap: 0.3, towerMul: 0.3 }, 'Trois volées sur une large zone. Rase les nuées.'),
  s('fireball', 'Boule de feu', 4, 'rare', { kind: 'blast', radius: 2.5, dmg: lv('r', 325), towerMul: 0.3, knockback: 1.1 }, 'Grosse explosion qui repousse. Dégâts réduits sur les tours.'),
  s('rocket', 'Roquette', 6, 'rare', { kind: 'blast', radius: 2, dmg: lv('r', 700), towerMul: 0.25, knockback: 1.8, speed: 6 }, 'Lente, étroite, et des dégâts monstrueux.'),
  s('goblin-barrel', 'Fût à gobelins', 3, 'epique', { kind: 'drop', radius: 1.5, unit: 'goblin', count: 3, speed: 7 }, 'Trois gobelins atterrissent où vous voulez, même chez l’ennemi.'),
  s('rage', 'Rage', 2, 'epique', { kind: 'zone', effect: 'rage', radius: 3, duration: 6, rage: 1.35 }, 'Vos troupes dans la zone bougent et frappent 35 % plus vite.'),
  s('freeze', 'Gel', 4, 'epique', { kind: 'zone', effect: 'freeze', radius: 3, duration: 4, dmg: lv('e', 72), towerMul: 0.3 }, 'Fige tout ce qui est ennemi dans la zone pendant 4 s, tours comprises.'),
  s('lightning', 'Foudre', 6, 'epique', { kind: 'smite', radius: 3.5, dmg: lv('e', 650), strikes: 3, stun: 0.5, towerMul: 0.3 }, 'Frappe les trois cibles les plus robustes de la zone.'),
  { id: 'mirror', name: 'Miroir', cost: 0, type: 'spell', rarity: 'epique', copy: true, count: 1, blurb: 'Rejoue votre dernière carte pour un élixir de plus.' },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

export const TOWERS = {
  princess: { hp: 2534, dmg: 90, hit: 0.8, range: 7.5, hw: 1.5, hh: 1.5 },
  king: { hp: 4008, dmg: 90, hit: 1.0, range: 7, hw: 2, hh: 2 },
};

export const DEFAULT_DECK = ['knight', 'archers', 'goblins', 'giant', 'minions', 'cannon', 'fireball', 'arrows'];

// Valeur d'un soldat, utilisée par l'IA pour estimer les menaces et les échanges.
export function unitValue(unitId) {
  const u = UNITS[unitId];
  const dps = u.hit ? u.dmg / u.hit : 0;
  return (u.hp + dps * 8) / 900;
}

// Données de jeu : profils d'unités et cartes. Les distances sont en cases (arène de 18 x 32).
// `targets` : 'any' (sol + air), 'ground' (sol seul), 'buildings' (bâtiments et tours seulement).

export const UNITS = {
  lapin: { name: 'Lapin Chevalier', hp: 860, dmg: 95, hit: 1.1, speed: 1.05, range: 0.5, r: 0.45, mass: 6, targets: 'ground' },
  moine: { name: 'Moine Archer', hp: 200, dmg: 55, hit: 1.0, speed: 1.0, range: 5.2, r: 0.35, mass: 3, targets: 'any', proj: { kind: 'arrow', speed: 11 } },
  escargot: { name: 'Escargot de Siège', hp: 2400, dmg: 160, hit: 1.5, speed: 0.72, range: 0.5, r: 0.85, mass: 20, targets: 'buildings' },
  souris: { name: 'Souris à Aiguille', hp: 82, dmg: 42, hit: 0.9, speed: 1.65, range: 0.4, r: 0.25, mass: 1, targets: 'ground' },
  goupil: { name: 'Goupil Chapardeur', hp: 360, dmg: 96, hit: 0.8, speed: 1.6, range: 0.5, r: 0.36, mass: 3, targets: 'ground' },
  licorne: { name: 'Licorne Furieuse', hp: 980, dmg: 165, hit: 1.4, speed: 1.2, range: 0.6, r: 0.55, mass: 9, targets: 'ground', charge: { dist: 2.5, speedMul: 2, dmgMul: 2 } },
  ours: { name: 'Ours Bourreau', hp: 1080, dmg: 430, hit: 1.8, speed: 1.0, range: 0.5, r: 0.58, mass: 10, targets: 'ground' },
  grylle: { name: 'Grylle Bondissant', hp: 1250, dmg: 190, hit: 1.6, speed: 1.75, range: 0.5, r: 0.5, mass: 6, targets: 'buildings', jump: true },
  chat: { name: 'Chat Alchimiste', hp: 470, dmg: 140, hit: 1.4, speed: 1.0, range: 5.5, r: 0.4, mass: 4, targets: 'any', splash: 1.3, proj: { kind: 'flask', speed: 8, arc: true } },
  abbesse: { name: 'Abbesse Guérisseuse', hp: 560, dmg: 58, hit: 1.2, speed: 1.0, range: 4, r: 0.42, mass: 4, targets: 'any', proj: { kind: 'spark', speed: 10 }, heal: { radius: 3.6, hps: 55 } },
  squelette: { name: 'Squelette Danseur', hp: 64, dmg: 58, hit: 1.0, speed: 1.5, range: 0.4, r: 0.27, mass: 1, targets: 'ground' },
  cochon: { name: 'Cochon Poudrier', hp: 230, dmg: 0, hit: 1, speed: 1.8, range: 0.2, r: 0.42, mass: 3, targets: 'ground', kamikaze: { radius: 2.2, dmg: 320, towerMul: 0.6 } },
  gargouille: { name: 'Gargouille Colossale', hp: 3700, dmg: 185, hit: 1.5, speed: 0.7, range: 0.5, r: 1.05, mass: 40, targets: 'buildings', deathSpawn: { unit: 'gargouillon', count: 3 }, deathDamage: { radius: 2.5, dmg: 180 } },
  gargouillon: { name: 'Gargouillon', hp: 300, dmg: 58, hit: 1.0, speed: 1.2, range: 0.4, r: 0.32, mass: 2, targets: 'ground' },
  diablotin: { name: 'Diablotin Ailé', hp: 140, dmg: 58, hit: 1.0, speed: 1.65, range: 2, r: 0.3, mass: 1, air: true, targets: 'any', proj: { kind: 'spit', speed: 10 } },
  wyverne: { name: 'Wyverne Enluminée', hp: 820, dmg: 90, hit: 1.6, speed: 1.25, range: 3.5, r: 0.6, mass: 6, air: true, targets: 'any', splash: 1.25, proj: { kind: 'fire', speed: 8 } },
  chouette: { name: 'Chouette Savante', hp: 390, dmg: 95, hit: 1.1, speed: 1.3, range: 4.5, r: 0.42, mass: 3, air: true, targets: 'any', proj: { kind: 'feather', speed: 11 } },
  cigogne: { name: 'Cigogne Ardente', hp: 1120, dmg: 420, hit: 2.4, speed: 1.0, range: 0.3, r: 0.65, mass: 8, air: true, targets: 'buildings', splash: 1.2, deathDamage: { radius: 2.5, dmg: 120 } },
  baliste: { name: 'Baliste de Rempart', building: true, hp: 760, dmg: 124, hit: 1.2, range: 6.5, r: 0.95, life: 30, targets: 'ground', proj: { kind: 'bolt', speed: 14 } },
  beffroi: { name: 'Beffroi des Veilleurs', building: true, hp: 980, dmg: 72, hit: 0.8, range: 7.2, r: 1.0, life: 36, targets: 'any', proj: { kind: 'arrow', speed: 12 } },
  terrier: { name: 'Terrier des Rongeurs', building: true, hp: 680, dmg: 0, hit: 1, range: 0, r: 0.95, life: 28, targets: 'none', spawner: { unit: 'souris', count: 2, every: 4.5 }, deathSpawn: { unit: 'souris', count: 2 } },
};

export const CARDS = [
  { id: 'lapin', name: 'Lapin Chevalier', cost: 3, type: 'troop', rarity: 'commune', unit: 'lapin', count: 1, blurb: "Il n'a peur de rien, surtout pas des escargots. Solide au contact." },
  { id: 'moines', name: 'Moines Archers', cost: 3, type: 'troop', rarity: 'commune', unit: 'moine', count: 2, blurb: 'Deux frères, deux arcs, zéro vocation pour la paix. Tirent au sol et en l’air.' },
  { id: 'souris', name: 'Souris à Aiguille', cost: 2, type: 'troop', rarity: 'commune', unit: 'souris', count: 6, blurb: 'Six couturières rapides et fragiles. Redoutables contre tout ce qui frappe lentement.' },
  { id: 'goupil', name: 'Goupil Chapardeur', cost: 2, type: 'troop', rarity: 'commune', unit: 'goupil', count: 1, blurb: 'Vif, bon marché, parfait pour détourner une attaque.' },
  { id: 'squelettes', name: 'Trio Macabre', cost: 1, type: 'troop', rarity: 'commune', unit: 'squelette', count: 3, blurb: 'Trois os pour une goutte d’encre. Occupent le terrain le temps d’une danse.' },
  { id: 'diablotins', name: 'Diablotins Ailés', cost: 3, type: 'troop', rarity: 'commune', unit: 'diablotin', count: 3, blurb: 'Un trio volant qui crache depuis les airs. Hors de portée des lames.' },
  { id: 'chouette', name: 'Chouette Savante', cost: 3, type: 'troop', rarity: 'commune', unit: 'chouette', count: 1, blurb: 'Elle a tout lu et le fait savoir à coups de plume, en plein vol.' },
  { id: 'cochon', name: 'Cochon Poudrier', cost: 2, type: 'troop', rarity: 'rare', unit: 'cochon', count: 1, blurb: 'Fonce sur la première cible et saute avec son baril. Dégâts de zone.' },
  { id: 'licorne', name: 'Licorne Furieuse', cost: 4, type: 'troop', rarity: 'rare', unit: 'licorne', count: 1, blurb: 'Prend de la vitesse en ligne droite : le premier coup de corne frappe double.' },
  { id: 'ours', name: 'Ours Bourreau', cost: 4, type: 'troop', rarity: 'rare', unit: 'ours', count: 1, blurb: 'Lent à lever la hache, définitif quand elle retombe.' },
  { id: 'grylle', name: 'Grylle Bondissant', cost: 4, type: 'troop', rarity: 'rare', unit: 'grylle', count: 1, blurb: 'Une tête sur deux pattes. Saute la rivière et ne vise que les bâtiments.' },
  { id: 'abbesse', name: 'Abbesse Guérisseuse', cost: 4, type: 'troop', rarity: 'rare', unit: 'abbesse', count: 1, blurb: 'Soigne en continu les alliés autour d’elle. À protéger.' },
  { id: 'wyverne', name: 'Wyverne Enluminée', cost: 4, type: 'troop', rarity: 'rare', unit: 'wyverne', count: 1, blurb: 'Dorée à la feuille, elle crache un feu qui éclabousse les groupes.' },
  { id: 'chat', name: 'Chat Alchimiste', cost: 5, type: 'troop', rarity: 'rare', unit: 'chat', count: 1, blurb: 'Lance des fioles explosives à longue portée. Fragile mais dévastateur.' },
  { id: 'escargot', name: 'Escargot de Siège', cost: 5, type: 'troop', rarity: 'rare', unit: 'escargot', count: 1, blurb: 'Il porte un château et n’a d’yeux que pour les vôtres. Très lent, très solide.' },
  { id: 'cigogne', name: 'Cigogne Ardente', cost: 5, type: 'troop', rarity: 'epique', unit: 'cigogne', count: 1, blurb: 'Survole tout et lâche son pot de feu sur les bâtiments. Se fracasse à sa mort.' },
  { id: 'gargouille', name: 'Gargouille Colossale', cost: 8, type: 'troop', rarity: 'epique', unit: 'gargouille', count: 1, blurb: 'Un morceau de cathédrale en marche. S’effondre en petits gargouillons.' },
  { id: 'baliste', name: 'Baliste de Rempart', cost: 3, type: 'building', rarity: 'commune', unit: 'baliste', count: 1, blurb: 'Attire les assaillants au sol et les perce à distance. Se délabre en 30 s.' },
  { id: 'beffroi', name: 'Beffroi des Veilleurs', cost: 4, type: 'building', rarity: 'rare', unit: 'beffroi', count: 1, blurb: 'Tir rapide sur le sol et les airs, depuis très loin. Dure 36 s.' },
  { id: 'terrier', name: 'Terrier des Rongeurs', cost: 4, type: 'building', rarity: 'rare', unit: 'terrier', count: 1, blurb: 'Deux souris toutes les 4,5 s tant qu’il tient debout. Dure 28 s.' },
  { id: 'feu', name: 'Feu Grégeois', cost: 4, type: 'spell', rarity: 'rare', blurb: 'Une grenade de feu qui brûle et repousse. Dégâts réduits sur les tours.',
    spell: { kind: 'blast', radius: 2.5, dmg: 340, towerMul: 0.35, knockback: 1.1 } },
  { id: 'fleches', name: 'Pluie de Flèches', cost: 3, type: 'spell', rarity: 'commune', blurb: 'Trois volées sur une large zone. Idéal contre les nuées, au sol comme en l’air.',
    spell: { kind: 'volley', radius: 3.8, dmg: 58, volleys: 3, gap: 0.35, towerMul: 0.35 } },
  { id: 'encre', name: 'Encre Renversée', cost: 2, type: 'spell', rarity: 'commune', blurb: 'Un encrier sur la page : ralentit de moitié et ronge doucement pendant 5 s.',
    spell: { kind: 'zone', effect: 'slow', radius: 3, duration: 5, slow: 0.5, dps: 34, towerMul: 0.25 } },
  { id: 'cantique', name: 'Cantique de Guerre', cost: 2, type: 'spell', rarity: 'rare', blurb: 'Les cloches sonnent : vos troupes dans la zone marchent et frappent 40 % plus vite.',
    spell: { kind: 'zone', effect: 'rage', radius: 4, duration: 6, rage: 1.4 } },
  { id: 'courroux', name: 'Courroux de l’Évêque', cost: 6, type: 'spell', rarity: 'epique', blurb: 'Trois éclairs sur les cibles les plus robustes de la zone. Étourdit.',
    spell: { kind: 'smite', radius: 3.6, dmg: 480, strikes: 3, stun: 0.6, towerMul: 0.35 } },
  { id: 'macabre', name: 'Danse Macabre', cost: 5, type: 'spell', rarity: 'epique', blurb: 'La mort fait sortir ses danseurs de terre, n’importe où sur la page, 8 s durant.',
    spell: { kind: 'zone', effect: 'summon', radius: 3, duration: 8.4, every: 0.7, unit: 'squelette' } },
  { id: 'copiste', name: 'Le Copiste', cost: 0, type: 'spell', rarity: 'epique', copy: true, blurb: 'Recopie votre dernière carte jouée, pour une goutte de plus.' },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

export const TOWERS = {
  princess: { hp: 1100, dmg: 36, hit: 0.8, range: 7.5, hw: 1.5, hh: 1.5 },
  king: { hp: 2000, dmg: 46, hit: 1.0, range: 7.2, hw: 2, hh: 2 },
};

export const DEFAULT_DECK = ['lapin', 'moines', 'souris', 'goupil', 'diablotins', 'baliste', 'feu', 'fleches'];

// Valeur d'un soldat, utilisée par l'IA pour estimer les menaces et les échanges.
export function unitValue(unitId) {
  const u = UNITS[unitId];
  const dps = u.hit ? u.dmg / u.hit : 0;
  return (u.hp + dps * 8) / 450;
}

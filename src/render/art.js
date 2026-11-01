// Les personnages sur le terrain, redessinés en chemins SVG dans l'esprit du jeu : grosse tête, traits ronds, couleurs vives.
// Repère : pieds en (0, 0), y vers le haut en négatif, regard vers la droite. Hauteur type : 100.
// Une pièce = [chemin, couleur, épaisseur du trait (3 par défaut, 0 pour aucun), couleur du trait (contour sombre par défaut)].

export const INK = '#1d1a2b';
export const PIGMENT = {
  gold: '#f7c531', goldLight: '#ffe67d', goldDark: '#b5801a',
  blue: '#2f7fe8', blueDark: '#154a9e', blueLight: '#7fc0ff',
  red: '#e8403a', redDark: '#8e1d22', redLight: '#ff8d7f',
  elixir: '#d93ee0', elixirLight: '#f58cf0',
  bone: '#f1ecdc', stone: '#a6adb8', stoneDark: '#6c7480', stoneLight: '#d1d6dc',
  wood: '#a06a33', woodDark: '#6b4220', woodLight: '#c99455',
  steel: '#b9c5d3', steelDark: '#6d7a8a', iron: '#3b4154', ironDark: '#23273a',
  skin: '#f3c598', skinDark: '#d99a68', goblin: '#8ccb3f', goblinDark: '#5a9a22',
  hair: '#6a3d1c', orange: '#f08a24', purple: '#7a3bb5', purpleDark: '#47207a', pink: '#ee5da8',
  ghost: '#2d3550', white: '#fff',
};

export const TEAMS = [
  { main: PIGMENT.blue, dark: PIGMENT.blueDark, light: PIGMENT.blueLight },
  { main: PIGMENT.red, dark: PIGMENT.redDark, light: PIGMENT.redLight },
];

const P = PIGMENT;
export const circ = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
export const ell = (x, y, rx, ry) => `M${x - rx} ${y}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`;
export const box = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}Z`;

const BOOT = 'M-7-16h13v10c4 0 8 2 8 6h-21Z';

function legPair(path, fill, xa, xb, hip = -14) {
  return [
    { pivot: [xa, hip], shift: xa, parts: [[path, fill]] },
    { pivot: [xb, hip], shift: xb, parts: [[path, fill]] },
  ];
}

const eyes = (color = INK) => [
  [ell(4, -62, 5.5, 6.5), P.white, 2],
  [ell(17, -62, 5, 6), P.white, 2],
  [circ(6, -61, 2.8), color, 0],
  [circ(19, -61, 2.6), color, 0],
];
const head = (skin) => [[ell(2, -60, 27, 26), skin], ['M-16-74c6-5 13-6 19-5', 'none', 3, 'rgba(255,255,255,.45)']];
const smile = ['M4-46c5 4 11 4 15-1', null, 2.5];

// Silhouette à grosse tête : corps, jambes, tête et bras porteur d'arme.
function chibi({ size = 1.4, skin = P.skin, torso, boots = P.woodDark, top = [], face, weapon = [], hand = skin, belt }) {
  return {
    size,
    legs: legPair(BOOT, boots, -9, 9),
    body: [
      ['M-22-10C-24-30-18-42 0-42C18-42 24-30 22-10Z', torso],
      ...(belt ? [['M-22-20H22V-13H-22Z', belt, 2.5]] : []),
      ...head(skin),
      ...(face || [...eyes(), smile]),
      ...top,
    ],
    arm: { pivot: [14, -30], parts: [...weapon, ['M10-34L26-26L22-18L6-26Z', torso, 2.5], [circ(26, -22, 6.5), hand]] },
  };
}

const sword = (len = 46, blade = P.steel) => [[`M24-26L${24 + len * 0.55}-${26 + len}l6 3L30-20Z`, blade], ['M16-34L36-18', P.gold, 5]];
const dome = (fill) => ['M-26-62C-28-96 32-96 30-62C14-70-10-70-26-62Z', fill];
const bow = [['M34-72C54-50 54-14 34 6', null, 4.5, P.woodDark], ['M34-72L34 6', null, 1.2], ['M26-30H52', P.bone, 2.5]];

const FIGURES = {
  skeleton: () => ({
    size: 1,
    legs: legPair('M-3-16h6v12h7v4h-13Z', P.bone, -8, 8),
    body: [
      ['M-11-40h22M-12-32h24M-11-24h22', null, 5, P.bone],
      ['M-2-44V-14', null, 5, P.bone],
      ['M-22-66C-22-94 28-94 28-66C28-54 22-48 16-44V-38H-8V-44C-16-48-22-54-22-66Z', P.bone],
      [circ(-3, -64, 7.5), INK, 0],
      [circ(15, -64, 7.5), INK, 0],
      ['M3-52l4-7l4 7Z', INK, 0],
      ['M-3-42v-5M6-42v-5M14-42v-5', null, 2],
    ],
    arm: { pivot: [12, -34], parts: [['M18-36L44-68l4 3L24-30Z', P.steel, 2.5], ['M12-34L24-30', null, 5, P.bone]] },
  }),
  goblin: () => chibi({
    size: 1.1, skin: P.goblin, torso: P.blue, boots: P.goblinDark, hand: P.goblin, weapon: sword(26),
    top: [['M-22-66L-48-78L-24-50Z', P.goblin], ['M26-66L52-78L28-50Z', P.goblin]],
    face: [...eyes(), ['M2-44c8 5 16 3 20-3L4-48Z', P.white, 2]],
  }),
  'spear-goblin': () => chibi({
    size: 1.1, skin: P.goblin, torso: P.woodLight, boots: P.goblinDark, hand: P.goblin,
    weapon: [['M26-20L52-92', null, 4, P.woodDark], ['M52-92l-7 10l9 4Z', P.steel, 2]],
    top: [['M-26-72C-12-82 18-82 30-72V-66H-26Z', P.blue], ['M-22-66L-46-78L-24-50Z', P.goblin], ['M26-66L50-78L28-50Z', P.goblin]],
  }),
  bomber: () => ({
    ...FIGURES.skeleton(),
    size: 1.1,
    body: [...FIGURES.skeleton().body, dome(P.blue), [circ(2, -82, 8), P.goldLight], [circ(16, -82, 8), P.goldLight]],
    arm: { pivot: [12, -34], parts: [[circ(30, -40, 15), P.iron], ['M34-52c4-6 8-6 12-8', null, 3, P.orange], ['M12-34L24-36', null, 5, P.bone]] },
  }),
  knight: () => chibi({
    size: 1.45, torso: P.steel, belt: P.woodDark, boots: P.steelDark, weapon: sword(52),
    top: [dome(P.steel), ['M-2-90V-104M2-104c8 0 14 4 16 8', null, 4, P.gold], ['M2-48c-6-2-12-1-16 3c8-1 14 1 16 3c2-2 10-4 18-3c-4-4-11-5-18-3Z', P.goldDark, 2]],
    face: eyes(),
  }),
  archer: () => chibi({
    size: 1.35, torso: P.blue, belt: P.woodDark, boots: P.woodDark, weapon: bow,
    top: [['M-26-58C-34-92 34-98 30-68C18-82-8-82-18-62C-18-48-24-38-30-34C-34-42-30-50-26-58Z', P.pink]],
  }),
  minion: () => ({
    size: 1.1,
    flyer: true,
    legs: [
      { wing: true, pivot: [-14, -48], parts: [['M-14-48C-34-74-58-72-60-52C-48-56-44-48-34-48C-30-40-20-38-14-40Z', '#4a7fd6']] },
      { wing: true, pivot: [14, -48], parts: [['M14-48C34-74 58-72 60-52C48-56 44-48 34-48C30-40 20-38 14-40Z', '#4a7fd6']] },
    ],
    body: [
      ['M-16-14C-22-30-14-44 0-44C14-44 22-30 16-14C10-2-10-2-16-14Z', '#5f96e8'],
      [ell(0, -56, 22, 20), '#5f96e8'],
      ['M-16-70L-22-88L-6-74ZM16-70L22-88L6-74Z', '#2f5cae'],
      ['M-12-60l9 4M12-60l-9 4', null, 3],
      [circ(-7, -54, 2.5), P.white, 0],
      [circ(7, -54, 2.5), P.white, 0],
      ['M-7-44c4 3 10 3 14 0', null, 2.5],
    ],
  }),
  barbarian: () => chibi({
    size: 1.4, torso: P.skinDark, belt: P.woodDark, weapon: sword(44),
    top: [['M-27-66C-30-96 32-98 30-66L22-70C8-78-8-78-18-70Z', P.gold], ['M-2-40c-14-2-18-10-12-14c6 2 10 2 14 0c6 2 12 2 18 0c4 6-2 14-20 14Z', P.gold]],
    face: [...eyes(), ['M6-42h12v-6H6Z', P.white, 2]],
  }),
  musketeer: () => chibi({
    size: 1.4, torso: P.iron, belt: P.gold,
    weapon: [['M16-30H66v5H16Z', P.woodDark, 2.5], ['M60-30H72', null, 3]],
    top: [['M-28-68C-28-96 32-96 30-68H-28Z', P.steelDark], ['M-34-68H36', null, 5], ['M-26-66C-34-52-30-40-22-34C-20-46-20-56-18-64Z', P.purple]],
  }),
  valkyrie: () => chibi({
    size: 1.45, torso: P.blue, belt: P.woodDark,
    weapon: [['M26-22L46-70', null, 5, P.woodDark], ['M36-82C58-82 66-68 62-56L46-68L38-60C34-68 34-76 36-82Z', P.steel]],
    top: [['M-26-58C-34-98 40-102 30-68C20-80-4-82-16-70C-16-54-22-42-30-34C-32-42-28-50-26-58Z', P.orange], ['M-30-66C-24-86 28-90 32-72', null, 4, P.gold]],
  }),
  'hog-rider': () => ({
    size: 1.75,
    legs: [
      { pivot: [-20, -18], shift: -20, parts: [['M-5-20h10V0H-5Z', '#d98c7a']] },
      { pivot: [20, -18], shift: 20, parts: [['M-5-20h10V0H-5Z', '#d98c7a']] },
    ],
    body: [
      ['M-36-16C-42-44-14-48 12-46C32-46 44-34 38-14C24-6-22-6-36-16Z', '#ef9d8a'],
      [ell(38, -28, 16, 14), '#ef9d8a'],
      [ell(49, -24, 7, 6), '#d9796b', 2],
      [circ(40, -34, 2.8), INK, 0],
      ['M46-18l-3-9', null, 3, P.white],
      ['M-12-44C-16-60-10-68 2-68C14-68 18-58 14-44Z', P.skinDark],
      [ell(2, -82, 18, 17), P.skin],
      ['M-16-86C-16-104 22-104 20-86C10-92-6-92-16-86Z', P.hair],
      ['M-8-74c4 10 18 10 22 0c-2-2-4-3-6-2c-4 2-6 2-10 0c-2-1-4 0-6 2Z', P.hair, 2],
      [circ(8, -84, 2.5), INK, 0],
    ],
    arm: { pivot: [14, -58], parts: [['M18-58L36-82', null, 6, P.woodDark], ['M28-92h16v14H28Z', P.steelDark]] },
  }),
  'mini-pekka': () => ({
    size: 1.25,
    legs: legPair('M-5-14h10v10c4 0 7 2 7 4H-7Z', P.ironDark, -10, 10),
    body: [
      ['M-20-10C-22-24-16-32 0-32C16-32 22-24 20-10Z', P.iron],
      ['M-26-54C-26-84 30-84 28-54C28-34 14-28 0-28C-14-28-26-34-26-54Z', '#556095'],
      ['M-6-74C-14-90-14-96-10-102C-6-92 0-84 4-76ZM8-76C14-86 20-94 24-98C26-90 22-80 16-72Z', P.ironDark],
      [ell(4, -56, 14, 8), '#a5e6ff', 2],
      [circ(4, -56, 3), P.blueLight, 0],
    ],
    arm: { pivot: [18, -32], parts: [['M24-30L58-64l6 6L30-24Z', P.steel], [circ(24, -28, 7), P.iron]] },
  }),
  giant: () => chibi({
    size: 2.3, torso: P.woodLight, belt: P.woodDark,
    weapon: [],
    top: [['M-26-64C-30-92 34-94 30-64C20-72 8-76-2-74C-10-74-18-70-26-64Z', P.orange], ['M-8-40h24l-4 8H-4Z', P.orange, 2]],
    hand: P.skin,
  }),
  wizard: () => chibi({
    size: 1.45, torso: P.blueDark, belt: P.gold,
    weapon: [[circ(38, -46, 11), P.orange], [circ(38, -46, 6), P.goldLight, 0]],
    top: [['M-30-54C-34-92 2-112 14-104C28-96 34-74 30-58C18-80-10-82-18-62C-22-54-26-52-30-54Z', P.blueDark], ['M4-46c-2 12 2 18 6 22c6-4 10-12 8-22Z', '#8a6a4b', 2]],
  }),
  'baby-dragon': () => ({
    size: 1.6,
    flyer: true,
    legs: [
      { wing: true, pivot: [-12, -46], parts: [['M-12-46C-30-76-60-74-62-50C-50-54-46-46-36-46C-32-38-20-36-12-38Z', '#5fbf5a']] },
      { wing: true, pivot: [12, -46], parts: [['M12-46C30-76 60-74 62-50C50-54 46-46 36-46C32-38 20-36 12-38Z', '#5fbf5a']] },
    ],
    body: [
      ['M-18-8C-26-30-16-46 0-46C16-46 26-30 18-8C10 0-10 0-18-8Z', '#79d86c'],
      ['M-10-10C-12-26-6-32 2-32C10-32 12-24 10-10Z', '#f4e6a0', 2],
      [ell(2, -62, 26, 22), '#79d86c'],
      ['M-12-80l4-12l6 9ZM6-82l6-12l5 11Z', '#f4e6a0'],
      [ell(4, -64, 6, 7), P.white, 2],
      [ell(18, -64, 5, 6), P.white, 2],
      [circ(6, -63, 3), INK, 0],
      [circ(19, -63, 2.7), INK, 0],
      ['M6-50c6 5 14 5 20-1c-6-3-14-3-20 1Z', '#b5392e', 2],
    ],
  }),
  witch: () => chibi({
    size: 1.45, torso: P.purpleDark, belt: P.pink, boots: P.purpleDark, skin: '#e4c9c9',
    weapon: [['M26-20L34-82', null, 4, P.iron], [circ(35, -86, 8), P.elixirLight, 2]],
    top: [['M-30-44C-38-92-6-106 14-100C34-94 34-76 30-60C18-82-10-80-18-58C-20-50-24-44-30-44Z', P.purple]],
    face: [[ell(4, -62, 5.5, 4), P.pink, 0], [ell(17, -62, 5, 4), P.pink, 0], ['M6-46c4 2 8 2 12 0', null, 2.5]],
  }),
  prince: () => ({
    size: 1.9,
    legs: legPair('M-5-22h10V0H-5Z', '#c9a67c', -22, 22, -24),
    body: [
      ['M-38-22C-42-48-12-52 14-50C36-50 48-38 42-20C26-12-24-12-38-22Z', '#c9a67c'],
      ['M-30-46C-20-54 20-56 34-46L30-26H-26Z', P.red, 2.5],
      ['M38-40C46-58 56-60 62-54C64-44 56-34 44-30Z', '#c9a67c'],
      ['M-12-48C-14-62-8-70 4-70C16-70 20-60 16-48Z', P.gold],
      [ell(4, -84, 19, 18), P.skin],
      ['M-16-84C-16-110 24-110 24-84V-78H16V-90H-8V-78H-16Z', P.gold],
      ['M2-106l6-14l6 12', P.red, 2],
      [box(0, -90, 3, 16), P.goldDark, 0],
      [box(10, -90, 3, 16), P.goldDark, 0],
    ],
    arm: { pivot: [12, -60], parts: [['M14-62L74-72l1 5L16-54Z', P.steel], [circ(14, -58, 7), P.gold]] },
  }),
  balloon: () => ({
    size: 2.1,
    flyer: true,
    body: [
      [ell(0, -66, 42, 42), P.red],
      ['M-14-106C-28-78-28-48-12-26M14-106C28-78 28-48 12-26M0-108V-24', null, 3, P.redDark],
      ['M-30-90c8-8 16-10 22-10', null, 4, 'rgba(255,255,255,.5)'],
      ['M-16-26L-10-8M16-26L10-8', null, 3],
      ['M-14-8H14L10 10H-10Z', P.wood],
      [circ(2, -12, 7), P.bone],
      [circ(-6, 8, 7), P.iron],
      [circ(8, 8, 7), P.iron],
    ],
  }),
  'giant-skeleton': () => ({
    size: 2.4,
    legs: legPair('M-4-20h8v14h9v6H-7Z', P.bone, -11, 11, -18),
    body: [
      ['M-16-44h32M-18-34h36M-16-24h32', null, 6, P.bone],
      ['M-2-48V-16', null, 6, P.bone],
      ['M-26-68C-26-104 34-104 34-68C34-54 26-48 20-44V-38H-12V-44C-20-48-26-54-26-68Z', P.bone],
      ['M-30-62C-36-104 42-112 38-64C28-84-20-90-30-62Z', P.ghost],
      [circ(-3, -66, 8), INK, 0],
      [circ(17, -66, 8), INK, 0],
      ['M4-52l4-7l4 7Z', INK, 0],
    ],
    arm: { pivot: [14, -36], parts: [['M14-36L30-26', null, 6, P.bone], [circ(38, -24, 15), P.iron], ['M42-36c4-6 8-6 12-8', null, 3, P.orange]] },
  }),
  pekka: () => ({
    size: 2.15,
    legs: legPair('M-8-20h16V-6c6 0 10 2 10 6h-26Z', P.ironDark, -13, 13, -18),
    body: [
      ['M-28-14C-30-40-20-52 0-52C20-52 30-40 28-14Z', P.iron],
      ['M-14-20C-14-36-6-40 0-40C6-40 14-36 14-20Z', '#4f587e', 2.5],
      ['M-26-66C-26-96 30-96 28-66C28-48 14-42 0-42C-14-42-26-48-26-66Z', P.iron],
      ['M-18-82C-34-96-40-110-34-118C-26-108-16-100-6-92ZM18-84C32-96 40-110 36-118C28-108 18-100 8-92Z', P.ironDark],
      ['M-10-68l14 5l14-5l-3 10H-7Z', P.ironDark, 2],
      [ell(-2, -66, 3.5, 2.5), P.elixirLight, 0],
      [ell(13, -66, 3.5, 2.5), P.elixirLight, 0],
    ],
    arm: { pivot: [22, -44], parts: [['M28-42L72-94l8 7L38-34Z', P.steel], ['M24-48L44-30', null, 6, P.ironDark], [circ(26, -40, 9), P.iron]] },
  }),
  golem: () => ({
    size: 2.7,
    legs: legPair('M-11-20H11V0H-11Z', '#a18878', -16, 16, -18),
    body: [
      ['M-36-16C-42-60-24-74 0-74C24-74 42-60 36-16Z', '#b49a88'],
      ['M-24-52C-20-60-8-62-2-58M10-34C16-38 24-36 26-30M-16-24L-6-30', null, 3, '#7d6656'],
      [circ(-40, -46, 15), '#a18878'],
      [circ(40, -46, 15), '#a18878'],
      [circ(-42, -22, 13), '#b49a88'],
      [circ(42, -22, 13), '#b49a88'],
      ['M-14-64h30v22h-30Z', '#8d7565'],
      [ell(-5, -54, 4.5, 3), P.elixirLight, 0],
      [ell(9, -54, 4.5, 3), P.elixirLight, 0],
    ],
  }),
  golemite: () => ({
    size: 1.35,
    legs: legPair('M-9-16H9V0H-9Z', '#a18878', -11, 11),
    body: [
      ['M-28-12C-32-48-18-58 0-58C18-58 32-48 28-12Z', '#b49a88'],
      [ell(-6, -40, 4, 3), P.elixirLight, 0],
      [ell(10, -40, 4, 3), P.elixirLight, 0],
      ['M-12-24c8 4 20 4 28 0', null, 3, '#7d6656'],
    ],
  }),
  'mega-knight': () => ({
    size: 2.4,
    legs: legPair('M-9-20H9V-6c6 0 10 2 10 6H-11Z', P.iron, -14, 14, -18),
    body: [
      ['M-30-14C-34-42-22-54 0-54C22-54 34-42 30-14Z', '#8c95ad'],
      ['M-30-26H30V-16H-30Z', P.woodDark, 2.5],
      ['M-8-27h16v12H-8Z', P.gold, 2.5],
      ['M-12-44c6 4 18 4 24 0v12h-24Z', P.blue, 2],
      ['M-26-68C-30-104 34-104 30-68C30-52 16-46 2-46C-12-46-26-52-26-68Z', P.iron],
      ['M-22-70H26V-62H-22Z', '#141625', 0],
      ['M2-100C10-122 30-118 28-104', null, 6, P.blue],
      ['M-44-48L-34-58L-28-46L-38-38Z', P.iron],
      [circ(-38, -28, 15), P.iron],
      ['M-54-28l6-3v6ZM-38-46l3 6h-6ZM-38-10l3-6h-6Z', P.steelDark, 2],
    ],
    arm: { pivot: [26, -42], parts: [[circ(52, -30, 17), P.iron], ['M68-30l8-3v6ZM52-48l3 7h-6ZM52-12l3-7h-6Z', P.steelDark, 2], ['M26-44L44-36', null, 7, '#8c95ad']] },
  }),
  cannon: () => ({
    size: 1.9,
    body: [
      ['M-40-6L-34-30H34L40-6L34 4H-34Z', P.woodLight],
      ['M-34-18H34', null, 3, P.woodDark],
      [circ(-20, -6, 9), P.woodDark],
      [circ(20, -6, 9), P.woodDark],
    ],
    arm: { pivot: [0, -36], parts: [['M-24-48L26-70L36-44L-14-20Z', P.iron], ['M18-74L30-78L42-44L30-40Z', P.blueDark], [circ(-8, -36, 16), P.steelDark]] },
  }),
  tesla: () => ({
    size: 2,
    body: [
      ['M-30 0L-20-30H20L30 0Z', P.woodLight],
      ['M-14-30L-8-70H8L14-30Z', P.steel],
      ['M-24-20H24', null, 3, P.woodDark],
      ['M-18-34H18V-26H-18Z', P.blue, 2.5],
      [circ(0, -80, 13), P.blueLight],
      ['M0-94V-108M-14-80H-26M14-80H26', null, 3, P.blueLight],
    ],
  }),
  mortar: () => ({
    size: 1.9,
    body: [
      ['M-38 0L-28-22H28L38 0Z', P.woodLight],
      [circ(-22, -4, 8), P.orange],
      [circ(22, -4, 8), P.orange],
    ],
    arm: { pivot: [0, -28], parts: [['M-24-22C-28-50-22-68-18-72H24C28-66 28-44 22-20Z', P.iron], ['M-20-66H26V-54H-20Z', P.blue, 2.5], [ell(3, -72, 21, 7), P.ironDark]] },
  }),
  tombstone: () => ({
    size: 1.9,
    body: [
      [ell(0, -2, 38, 12), '#6a7f5c'],
      ['M-26-4V-54C-26-82 26-82 26-54V-4Z', P.stone],
      ['M-16-56H16M-16-44H16M-16-32H8', null, 3, P.stoneDark],
      ['M-30 8C-28-8-16-14-10-12L-4 4Z', P.bone, 2.5],
      ['M30 8C28-8 18-12 12-10L4 6Z', P.bone, 2.5],
    ],
  }),
  'bomb-tower': () => ({
    size: 2.1,
    body: [
      ['M-34 0L-28-46H28L34 0Z', P.woodLight],
      ['M-30-16H30M-28-32H28M-12 0V-16M10-16V-32', null, 3, P.woodDark],
      ['M-36-46H36V-56H-36Z', P.woodDark],
    ],
    arm: { pivot: [0, -56], parts: [['M-26-58L18-74L24-64L-20-48Z', P.wood], [circ(24, -82, 17), P.iron], ['M30-96c4-6 8-6 12-8', null, 3, P.orange]] },
  }),
  'inferno-tower': () => ({
    size: 2.3,
    body: [
      ['M-30 0L-18-44H18L30 0Z', P.iron],
      ['M-22-14H22M-20-30H20', null, 3, P.ironDark],
      ['M-26-44H26L18-58H-18Z', P.steelDark],
      ['M-6-58L-14-82H14L6-58Z', P.woodDark],
      [circ(0, -92, 15), P.orange],
      [circ(0, -92, 8), P.goldLight, 0],
      ['M-16-100L-26-114M16-100L26-114', null, 4, P.iron],
    ],
  }),
  'goblin-hut': () => ({
    size: 2.1,
    body: [
      ['M-38 0V-44H38V0Z', P.wood],
      ['M-46-38L0-88L46-38Z', '#c9a34f'],
      ['M-30-44L-12-70M-10-40L6-76M14-42L24-66', null, 2.5, P.goldDark],
      ['M-14 0V-28C-14-38 14-38 14-28V0Z', P.woodDark],
      ['M-48 0L-34-22M48 0L34-22', null, 5, P.goblinDark],
    ],
  }),
  'elixir-collector': () => ({
    size: 2.1,
    body: [
      ['M-34 0V-12H34V0Z', P.wood],
      ['M-22-12V-66H22V-12Z', P.elixir],
      ['M-14-60V-20', null, 5, P.elixirLight],
      ['M-30-66H30V-78H-30Z', P.steelDark],
      ['M-30-12H30V-22H-30Z', P.steelDark],
      ['M-16-78C-14-94 14-94 16-78Z', P.blue],
      [circ(-36, -38, 11), P.wood],
    ],
  }),
  'barbarian-hut': () => ({
    size: 2.2,
    body: [
      ['M-40 0V-48H40V0Z', P.woodLight],
      ['M-48-44L-30-80H34L48-44Z', '#3f79b8'],
      ['M-40-30H40M-40-14H40', null, 3, P.woodDark],
      ['M-16 0V-32H16V0Z', P.woodDark],
      [circ(28, -18, 12), P.woodDark],
    ],
  }),
  'x-bow': () => ({
    size: 2.2,
    body: [
      ['M-30 0L-18-28H18L30 0Z', P.stone],
      ['M-8-28V-46H8V-28Z', P.woodDark],
    ],
    arm: {
      pivot: [0, -50],
      parts: [
        ['M-44-40C-20-66 20-66 44-40L38-34C16-54-16-54-38-34Z', P.woodDark],
        ['M-6-40L-4-82H4L6-40Z', P.wood],
        ['M0-96L-8-80H8Z', P.steel],
        ['M-42-38L0-62L42-38', null, 2, P.bone],
      ],
    },
  }),
  'gs-bomb': () => ({
    size: 1.5,
    body: [[circ(0, -28, 26), P.iron], ['M10-52c5-8 10-8 16-10', null, 4, P.orange], ['M-14-40c3-5 7-7 11-8', null, 4, 'rgba(255,255,255,.4)']],
  }),
};

export function figure(id, team = 0) {
  const make = FIGURES[id];
  if (!make) throw new Error(`Figure inconnue : ${id}`);
  return make(TEAMS[team]);
}

const blocks = 'M-44-20H-12M12-20H44M-48-42H-22M4-42H48M-44-64H-10M16-64H46M-28 0V-20M26 0V-20M-8-20V-42M30-20V-42M-30-42V-64M6-42V-64';
const ladder = 'M-10 0V-58M10 0V-58M-10-10H10M-10-22H10M-10-34H10M-10-46H10';

// Tours : `ruin` est la version tombée.
export const TOWER_ART = {
  princess: (T) => ({
    body: [
      ['M-54 0L-48-76H48L54 0Z', P.stoneLight],
      [blocks, null, 2, P.stoneDark],
      [ladder, P.woodLight, 3, P.woodDark],
      ['M-58-72H58V-92H-58Z', T.main],
      ['M-58-92H58', null, 5, T.dark],
      ['M-58-92V-108H-40V-98H-20V-108H0V-98H20V-108H40V-98H58V-108V-92Z', P.stone],
      ['M-46-72V-52M46-72V-52', null, 7, T.dark],
    ],
  }),
  king: (T) => ({
    body: [
      ['M-74 0L-68-82H68L74 0Z', P.stoneLight],
      [blocks, null, 2, P.stoneDark],
      ['M-18 0V-30C-18-44 18-44 18-30V0Z', P.woodDark],
      ['M-84-78H84V-100H-84Z', T.main],
      ['M-84-100H84', null, 6, T.dark],
      ['M-84-100V-120H-60V-108H-30V-120H0V-108H30V-120H60V-108H84V-120V-100Z', P.stone],
      ['M-76-78V-48M76-78V-48', null, 10, T.dark],
      ['M-12-90l6-6l6 6l6-6l6 6v6h-24Z', P.gold, 2],
    ],
  }),
  ruin: () => ({
    body: [
      ['M-60 0L-54-30L-34-20L-22-46L-4-26L14-52L30-24L46-38L60 0Z', P.stoneDark],
      ['M-40-8L-24-22L-6-8M10-10L26-28L40-8', null, 2.5],
      [ell(-38, 2, 12, 5), P.stone],
      [ell(30, 3, 14, 5), P.stone],
      [ell(0, 4, 9, 4), P.stoneLight],
    ],
  }),
};

// Trace une liste de pièces sur un contexte 2D, sans transformation.
export function drawParts(ctx, parts) {
  for (const [path, fill, lw = 3, stroke = INK] of parts) {
    const p = new Path2D(path);
    if (fill && fill !== 'none') {
      ctx.fillStyle = fill;
      ctx.fill(p);
    }
    if (lw > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke(p);
    }
  }
}

export function drawFigureStill(ctx, fig) {
  for (const leg of fig.legs || []) {
    ctx.save();
    if (leg.shift) ctx.translate(leg.shift, 0);
    drawParts(ctx, leg.parts);
    ctx.restore();
  }
  drawParts(ctx, fig.body);
  if (fig.arm) drawParts(ctx, fig.arm.parts);
}

// Toutes les figures du jeu, tracées à la main en chemins SVG : aucun fichier image.
// Repère : pieds en (0, 0), y vers le haut en négatif, regard vers la droite. Hauteur type : 100.
// Une pièce = [chemin, pigment, épaisseur du trait (3 par défaut, 0 pour aucun), couleur du trait (encre par défaut)].

export const INK = '#1b1410';
export const PIGMENT = {
  gold: '#e8b923', goldLight: '#ffe27a', goldDark: '#9a6a10',
  lapis: '#2347c4', lapisDark: '#142a78', lapisLight: '#5f82ea',
  vermilion: '#d6341e', vermilionDark: '#7d1a12', vermilionLight: '#f4765a',
  malachite: '#1f7a55', malachiteDark: '#0f4d3a', malachiteLight: '#3fa578',
  purple: '#4c1248', purpleDark: '#2c0a2c', purpleLight: '#7b2a70',
  bone: '#f3e9cf', stone: '#a79f8f', stoneDark: '#6f6858', stoneLight: '#cfc7b3',
  wood: '#8a5a2b', woodDark: '#5a3817', fur: '#f5efe2', pink: '#eb9aa0', steel: '#b9c3cf', steelDark: '#74808e',
  fox: '#d96f1f', bear: '#7c4f2c', mouse: '#a7a39c', habit: '#6d4a2c', soot: '#2a2530', swine: '#efa7a2',
};

export const TEAMS = [
  { main: PIGMENT.lapis, dark: PIGMENT.lapisDark, light: PIGMENT.lapisLight },
  { main: PIGMENT.vermilion, dark: PIGMENT.vermilionDark, light: PIGMENT.vermilionLight },
];

const P = PIGMENT;
export const circ = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
export const ell = (x, y, rx, ry) => `M${x - rx} ${y}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`;
export const box = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}Z`;

function legPair(path, fill, xa, xb, hip = -14) {
  return [
    { pivot: [xa, hip], shift: xa, parts: [[path, fill]] },
    { pivot: [xb, hip], shift: xb, parts: [[path, fill]] },
  ];
}

const FIGURES = {
  lapin: (T) => ({
    size: 1.75,
    legs: legPair('M-5-16h10v12c3 0 8 1 8 4h-18Z', P.steel, -8, 7),
    body: [
      [circ(-24, -24, 8), P.fur],
      ['M-4-70C-16-100-12-118-4-116C6-112 6-88 4-70Z', P.fur],
      ['M-3-76C-9-96-8-108-4-108C1-105 1-90 0-76Z', P.pink, 0],
      ['M8-70C10-96 20-108 28-104C34-98 22-82 16-68Z', P.fur],
      ['M-22-12C-24-34-16-48 0-48C16-48 24-34 22-12Z', T.main],
      ['M-3-42h6v9h9v6h-9v13h-6v-13h-9v-6h9Z', P.gold, 2],
      ['M-20-62C-20-82 22-84 24-62C26-46 12-40 2-40C-12-40-20-48-20-62Z', P.fur],
      ['M-21-66C-18-84 22-86 25-66L20-62L-16-62Z', P.steel],
      [circ(2, -78, 3), P.gold, 2],
      [circ(12, -56, 3.8), INK, 0],
      ['M22-52l6 3l-7 3Z', P.pink, 2],
    ],
    arm: {
      pivot: [8, -32],
      parts: [
        ['M20-40L52-86L58-82L26-36Z', P.steel],
        ['M14-44L32-30L28-25L10-40Z', P.gold],
        [circ(14, -32, 7), P.fur],
      ],
    },
  }),
  moine: (T) => ({
    size: 1.45,
    legs: legPair('M-5-14h10v10c3 0 7 1 7 4h-17Z', P.woodDark, -7, 7),
    body: [
      ['M-24-8C-24-40-16-54 0-54C16-54 24-40 24-8Z', P.habit],
      ['M-8-54h16L10-12L-10-12Z', T.main],
      ['M-22-24H22', null, 3.5],
      ['M-18-68C-18-86 18-86 18-68C18-54 8-48 0-48C-8-48-18-54-18-68Z', '#efc9a0'],
      ['M-18-68C-16-78-8-84 0-84C8-84 16-78 18-68C10-74-10-74-18-68Z', P.woodDark],
      [ell(0, -76, 8, 4), '#efc9a0', 2],
      [circ(9, -64, 3), INK, 0],
      ['M2-55c4 2 8 2 11-1', null, 2.5],
    ],
    arm: {
      pivot: [8, -36],
      parts: [
        ['M30-72C50-52 50-20 30 0', null, 4.5],
        ['M30-72L30 0', null, 1.5],
        ['M12-36L44-36', P.bone, 3],
        ['M44-36l-7-4v8Z', P.steel, 2],
        [circ(14, -36, 6), '#efc9a0'],
      ],
    },
  }),
  escargot: (T) => ({
    size: 2.6,
    body: [
      ['M-44 0C-44-14-30-16-14-16L34-18C44-22 44-40 46-52L54-52C58-36 60-10 44 0Z', '#b3a65f'],
      ['M46-52L40-72', null, 3.5],
      ['M54-52L60-72', null, 3.5],
      [circ(40, -74, 5), P.bone],
      [circ(61, -74, 5), P.bone],
      [circ(41, -74, 2.2), INK, 0],
      [circ(62, -74, 2.2), INK, 0],
      ['M-40-16C-48-52-18-74 8-68C30-62 38-38 30-18Z', T.main],
      ['M-26-20C-32-44-12-58 6-54C22-48 26-32 18-20Z', T.dark, 2.5],
      ['M-12-22C-16-36-4-44 6-40C14-36 14-28 8-22Z', T.main, 2.5],
      ['M-22-62v-28h6v6h6v-6h7v6h6v-6h7v6h6v-6h6v30Z', P.stoneLight],
      [box(-11, -74, 8, 12), INK, 0],
      ['M-3-90V-114l18 7l-18 7', T.light, 2.5],
    ],
    arm: { pivot: [40, -30], parts: [['M34-14L64-36l5 5L42-6Z', P.gold], [circ(68, -36, 7), P.steel]] },
  }),
  souris: (T) => ({
    size: 1.1,
    legs: legPair('M-5-12h9v8c4 0 7 1 7 4h-16Z', P.pink, -8, 8, -12),
    body: [
      ['M-22-14C-44-12-46-30-58-30', null, 3.5],
      ['M-24-8C-26-36-12-48 2-48C18-48 24-32 22-8Z', P.mouse],
      ['M-14-14C-14-30-4-36 6-36C14-36 18-26 16-14Z', T.main, 2.5],
      [circ(-6, -64, 14), P.mouse],
      [circ(-6, -64, 8), P.pink, 0],
      ['M-14-50C-8-72 28-68 38-48C24-34-8-32-14-50Z', P.mouse],
      [circ(14, -54, 4.2), INK, 0],
      [circ(38, -48, 3.4), P.pink, 2],
      ['M-10-68C-4-76 8-76 14-68Z', T.main, 2.5],
    ],
    arm: { pivot: [10, -26], parts: [['M12-30L72-34L12-24Z', P.steel, 2.5], [circ(12, -27, 6), P.mouse]] },
  }),
  goupil: (T) => ({
    size: 1.5,
    legs: legPair('M-5-14h10v10c3 0 7 1 7 4h-17Z', P.soot, -7, 8),
    body: [
      ['M-18-22C-48-20-56-44-46-58C-38-46-30-44-16-36Z', P.fox],
      ['M-46-58C-44-48-40-46-36-44C-40-54-44-56-46-58Z', P.fur, 2],
      ['M-20-12C-22-34-14-50 0-50C14-50 20-34 20-12Z', T.main],
      ['M-20-14H20', null, 2.5],
      ['M-16-66L-14-94L0-78L14-94L18-66C18-50 30-50 38-46C26-34 2-34-6-42C-14-50-16-56-16-66Z', P.fox],
      ['M8-52C16-50 28-50 38-46C26-36 8-36 2-42Z', P.fur, 2],
      [circ(38, -46, 3.5), INK, 0],
      ['M4-64l8-3l-2 6Z', INK, 0],
    ],
    arm: { pivot: [8, -34], parts: [['M18-40L46-52L48-46L22-32Z', P.steel], [box(13, -43, 6, 16), P.woodDark, 2], [circ(14, -34, 6), P.fox]] },
  }),
  licorne: (T) => ({
    size: 2.2,
    legs: [
      { pivot: [-26, -36], at: -26, parts: [['M-32-40h11L-22-4c4 0 7 1 8 4h-19Z', P.fur]] },
      { pivot: [24, -36], at: 24, parts: [['M18-40h11L29-4c4 0 7 1 8 4h-19Z', P.fur]] },
    ],
    body: [
      ['M-38-54C-62-58-70-30-58-14C-56-30-50-40-36-40Z', T.main],
      ['M-40-30C-44-56-22-62 0-62C20-62 36-58 38-34C40-22 22-20-2-20C-22-20-38-18-40-30Z', P.fur],
      ['M-22-62h30l4 24H-26Z', T.main, 2.5],
      ['M-18-46h24v4h-24Z', P.gold, 0],
    ],
    arm: {
      pivot: [28, -56],
      parts: [
        ['M20-56C22-74 28-86 40-90C56-92 66-80 72-68C74-60 66-56 56-58C50-60 46-58 44-48C40-40 26-42 20-56Z', P.fur],
        ['M50-90L70-124L58-86Z', P.gold],
        ['M36-92C26-84 20-72 18-54C12-66 14-84 28-94Z', T.main],
        [circ(54, -74, 3.8), INK, 0],
        ['M58-90l-8-14l-3 13Z', P.fur, 2.5],
      ],
    },
  }),
  ours: (T) => ({
    size: 2.15,
    legs: legPair('M-10-20h20V-4c3 0 7 1 7 4h-27Z', P.bear, -14, 12, -20),
    body: [
      ['M-32-14C-36-54-18-74 2-74C24-74 36-52 32-14Z', P.bear],
      ['M-18-16C-18-44-8-54 4-54C16-54 22-42 20-16Z', '#b98a5b', 2.5],
      [box(-31, -29, 62, 9), T.main],
      [circ(-14, -102, 10), P.bear],
      [circ(20, -102, 10), P.bear],
      ['M-24-86C-24-110 28-110 30-86C32-70 18-62 4-62C-12-62-24-70-24-86Z', P.bear],
      ['M-24-88C-22-112 30-112 30-88L28-78C14-74-10-74-22-78Z', T.dark],
      [circ(-4, -86, 4), P.goldLight, 2],
      [circ(16, -86, 4), P.goldLight, 2],
      ['M18-72C28-72 36-68 34-62C30-58 18-58 12-62Z', '#b98a5b', 2.5],
      [circ(33, -67, 3), INK, 0],
    ],
    arm: {
      pivot: [22, -56],
      parts: [
        ['M24-52L54-116L60-112L32-50Z', P.woodDark],
        ['M46-120C66-132 88-120 88-98C76-104 66-102 56-96Z', P.steel],
        ['M50-120C38-126 28-122 24-114C34-112 42-108 46-104Z', P.steelDark],
        [circ(26, -52, 10), P.bear],
      ],
    },
  }),
  grylle: (T) => ({
    size: 2.0,
    legs: [
      { pivot: [-14, -30], at: -14, parts: [['M-20-34h10L-10-6c4 0 10 2 12 6h-22Z', '#d9a066']] },
      { pivot: [14, -30], at: 14, parts: [['M8-34h10L18-6c4 0 10 2 12 6h-22Z', '#d9a066']] },
    ],
    body: [
      ['M-36-66C-36-100 36-100 38-66C38-36 18-26 0-26C-20-26-36-36-36-66Z', '#efc089'],
      ['M-34-78C-30-100 32-100 36-78C22-90-20-90-34-78Z', T.main],
      ['M2-98l-6-22l18 12Z', P.gold, 2.5],
      [circ(-8, -68, 9), P.bone],
      [circ(20, -68, 9), P.bone],
      [circ(-4, -67, 4), INK, 0],
      [circ(24, -67, 4), INK, 0],
      ['M-22-48C-10-34 22-34 32-48C22-44-10-44-22-48Z', '#8a1f1a'],
      ['M-14-46l4 6l4-5l5 6l4-6l5 6l4-6l5 4l2-6Z', P.bone, 1.5],
      ['M4-64l6 10h-8Z', '#e0a26c', 2],
    ],
    arm: { pivot: [34, -60], parts: [['M36-56C50-46 52-30 44-24', null, 6], [circ(44, -24, 6), '#efc089']] },
  }),
  chat: (T) => ({
    size: 1.65,
    legs: legPair('M-5-12h10v8c3 0 6 1 6 4h-16Z', P.soot, -7, 7, -12),
    body: [
      ['M-18-14C-40-20-40-40-34-54', null, 5.5],
      ['M-24-6C-24-40-14-52 0-52C14-52 24-40 24-6Z', T.main],
      ['M-24-12C-10-18 10-18 24-12V-6H-24Z', P.gold, 2],
      ['M-18-62L-20-84L-6-74H6L20-84L18-62C18-48 8-42 0-42C-8-42-18-48-18-62Z', P.soot],
      [circ(-3, -62, 3.6), P.goldLight, 2],
      [circ(10, -62, 3.6), P.goldLight, 2],
      ['M-30-74C-10-70 10-70 30-74C20-82 12-84 10-86L-2-126L-16-84C-22-82-26-78-30-74Z', T.dark],
      [circ(-2, -100, 3), P.gold, 2],
      [circ(5, -84, 2.5), P.gold, 1.5],
      ['M16-52l18-3M16-48l18 1', null, 1.5],
    ],
    arm: {
      pivot: [10, -34],
      parts: [
        [circ(36, -46, 10), P.malachiteLight],
        ['M32-58h8v6h-8Z', P.bone, 2],
        ['M30-45c6 3 8 3 12 0', null, 1.5],
        ['M10-34L30-42', P.soot, 6],
      ],
    },
  }),
  abbesse: (T) => ({
    size: 1.7,
    body: [
      [circ(0, -76, 25), P.goldLight, 2.5],
      ['M-26 0C-26-36-18-56 0-56C18-56 26-36 26 0Z', '#efe4c8'],
      ['M-12-56h24l6 56h-36Z', T.main],
      ['M-3-42h6v8h9v6h-9v18h-6v-18h-9v-6h9Z', P.gold, 2],
      ['M-20-60C-22-90 22-90 20-60C20-48 8-46 0-46C-8-46-20-48-20-60Z', P.soot],
      ['M-12-64C-12-78 14-78 14-64C14-56 8-50 1-50C-6-50-12-56-12-64Z', '#efc9a0'],
      [circ(8, -64, 2.8), INK, 0],
      ['M3-56c3 1 6 1 8 0', null, 2],
    ],
    arm: {
      pivot: [20, -34],
      parts: [
        ['M34-6L34-92', null, 5],
        ['M34-92C34-112 54-112 54-96C54-88 44-86 42-92', null, 5],
        [circ(34, -38, 6), '#efc9a0'],
      ],
    },
  }),
  squelette: (T) => ({
    size: 1.2,
    legs: legPair('M-2-16h4v13c3 0 7 1 7 3h-13Z', P.bone, -7, 7, -16),
    body: [
      ['M0-46V-16', null, 5],
      ['M-12-40H12M-10-32H10M-8-24H8', null, 3],
      ['M-12-18C-6-14 6-14 12-18', null, 4],
      ['M-12-46C-6-50 6-50 12-46L6-38H-6Z', T.main, 2.5],
      ['M-16-66C-16-88 18-88 18-66C18-56 12-52 10-46H-8C-10-52-16-56-16-66Z', P.bone],
      [circ(-3, -66, 5), INK, 0],
      [circ(10, -66, 5), INK, 0],
      ['M-3-48v-5M3-48v-5', null, 2],
    ],
    arm: { pivot: [8, -42], parts: [['M8-42L24-30', null, 4], ['M24-30L34-62', null, 4.5], [circ(35, -64, 4), P.bone, 2]] },
  }),
  cochon: (T) => ({
    size: 1.6,
    legs: [
      { pivot: [-18, -14], at: -18, parts: [['M-23-16h10V0h-10Z', P.swine]] },
      { pivot: [16, -14], at: 16, parts: [['M11-16h10V0h-10Z', P.swine]] },
    ],
    body: [
      ['M-34-30c-8-2-10-10-5-12c3 2 2 6 6 6', null, 2.5],
      ['M-34-26C-34-48-14-52 4-52C24-52 36-44 36-26C36-12 18-10 0-10C-20-10-34-10-34-26Z', P.swine],
      ['M-26-46H16V-82H-26Z', P.wood],
      ['M-26-58H16M-26-72H16', null, 4],
      [circ(-5, -65, 7), T.main, 2.5],
      ['M16-84C18-92 24-94 30-92', null, 2.5],
      [circ(32, -93, 3.5), P.goldLight, 1.5],
      ['M18-44C22-58 44-58 46-38C46-26 28-22 20-30Z', P.swine],
      ['M26-56l-8-11l18 6Z', P.swine],
      [circ(36, -46, 3.4), INK, 0],
      [ell(47, -36, 6, 7), '#d97f7c'],
      [circ(46, -38, 1.4), INK, 0],
      [circ(49, -34, 1.4), INK, 0],
    ],
  }),
  gargouille: (T) => ({
    size: 3.2,
    legs: legPair('M-10-16h20V-4c4 0 8 1 8 4h-28Z', P.stoneDark, -18, 18, -16),
    body: [
      ['M-30-52C-62-64-72-92-64-112C-56-96-46-92-40-92C-44-82-40-76-30-74Z', P.stoneDark],
      ['M-40-14C-46-56-26-76 2-76C30-76 44-54 38-14Z', P.stone],
      ['M-26-16C-26-44-14-56 2-56C18-56 26-44 24-16', null, 2.5],
      ['M-8-40l10-8l8 6M-16-26l8-6M16-26l8 4', null, 2],
      [box(-39, -43, 76, 10), T.main],
      ['M-22-90L-30-112L-10-98ZM22-92L30-114L10-100Z', P.stoneDark],
      ['M-24-78C-26-104 28-106 30-80C30-68 40-64 42-54C24-46-2-46-14-56C-20-62-24-68-24-78Z', P.stone],
      [circ(6, -82, 5), P.vermilionLight, 2],
      [circ(22, -80, 3.5), P.vermilionLight, 2],
      ['M4-56l4-8l4 7l5-8l4 7l5-7l5 6', P.bone, 2],
    ],
    arm: { pivot: [30, -60], parts: [['M28-66L58-36L44-24L18-50Z', P.stone], [circ(54, -28, 13), P.stoneDark]] },
  }),
  gargouillon: (T) => ({
    size: 1.35,
    legs: legPair('M-6-14h11v10c3 0 6 1 6 4h-17Z', P.stoneDark, -9, 9),
    body: [
      ['M-16-34C-34-44-38-64-32-72C-26-62-20-60-14-60Z', P.stoneDark],
      ['M-22-12C-24-38-12-48 2-48C18-48 24-36 22-12Z', P.stone],
      [box(-23, -28, 46, 7), T.main],
      ['M-18-54C-22-74-14-76-12-88L0-74L14-88C14-78 22-72 22-58C22-46 34-44 34-36C18-30-10-34-18-54Z', P.stone],
      [circ(8, -58, 4), P.vermilionLight, 2],
    ],
    arm: { pivot: [14, -32], parts: [['M14-34L36-22L30-14L10-28Z', P.stone]] },
  }),
  diablotin: (T) => ({
    size: 1.25,
    flyer: true,
    legs: [
      { pivot: [-10, -44], at: -10, wing: true, parts: [['M-10-44C-34-74-58-70-66-62C-54-56-56-46-52-40C-44-46-40-38-36-30C-30-36-20-40-10-36Z', T.dark]] },
      { pivot: [10, -44], at: 10, wing: true, parts: [['M10-44C34-74 58-70 66-62C54-56 56-46 52-40C44-46 40-38 36-30C30-36 20-40 10-36Z', T.main]] },
    ],
    body: [
      ['M-12-22C-28-14-30-4-22 0', null, 3],
      ['M-16-28C-18-50-6-54 2-54C12-54 18-46 16-26C14-18-14-18-16-28Z', P.purpleLight],
      ['M-14-60L-20-80L-4-70L8-70L22-80L16-60C16-50 8-46 2-46C-6-46-14-50-14-60Z', P.purpleLight],
      [circ(-1, -60, 3.5), P.goldLight, 2],
      [circ(10, -60, 3.5), P.goldLight, 2],
      ['M-3-50c4 3 8 3 12 0', null, 2],
    ],
  }),
  wyverne: (T) => ({
    size: 2.1,
    flyer: true,
    legs: [
      { pivot: [-8, -52], at: -8, wing: true, parts: [['M-8-52C-34-98-70-96-78-84C-62-78-64-62-58-54C-48-62-42-50-36-42C-28-50-18-52-8-42Z', T.dark]] },
      { pivot: [6, -52], at: 6, wing: true, parts: [['M6-52C26-100 58-100 68-88C52-82 54-66 48-58C40-66 34-54 28-46C22-54 14-52 6-42Z', T.main]] },
    ],
    body: [
      ['M-22-38C-44-34-60-20-74-34C-70-20-68-16-76-10C-52-6-30-14-16-24Z', P.gold],
      ['M-26-34C-30-52-12-60 6-58C22-56 26-40 20-26C12-16-20-16-26-34Z', P.gold],
      ['M-14-24C-10-40 8-42 14-30C8-22-8-20-14-24Z', P.goldLight, 2.5],
      ['M6-52C10-72 18-82 30-86C48-90 62-80 66-68C68-60 56-56 46-60C36-62 30-58 24-40Z', P.gold],
      ['M28-86L18-102L40-90Z', P.goldDark],
      [circ(46, -74, 3.8), INK, 0],
      ['M50-62c4 2 10 2 15-2', null, 2.5],
    ],
  }),
  chouette: (T) => ({
    size: 1.55,
    flyer: true,
    legs: [
      { pivot: [-18, -50], at: -18, wing: true, parts: [['M-18-54C-40-62-58-52-62-36C-50-36-48-28-44-24C-36-30-28-26-18-30Z', P.woodDark]] },
      { pivot: [18, -50], at: 18, wing: true, parts: [['M18-54C40-62 58-52 62-36C50-36 48-28 44-24C36-30 28-26 18-30Z', P.wood]] },
    ],
    body: [
      ['M-22-30C-26-60-16-72 0-72C16-72 26-60 22-30C18-14-18-14-22-30Z', P.wood],
      ['M-12-24C-14-44-6-50 0-50C6-50 14-44 12-24C8-16-8-16-12-24Z', P.bone, 2.5],
      ['M-8-40l4 4l4-4l4 4l4-4M-8-30l4 4l4-4l4 4l4-4', null, 1.5],
      [circ(-9, -60, 9), P.bone],
      [circ(9, -60, 9), P.bone],
      [circ(-8, -60, 4.5), INK, 0],
      [circ(10, -60, 4.5), INK, 0],
      ['M-3-54h6l-3 7Z', P.gold, 2],
      ['M-24-74L0-84L24-74L0-66Z', T.main],
      ['M12-70V-58', null, 2],
      [circ(12, -56, 2.6), P.gold, 1.5],
    ],
  }),
  cigogne: (T) => ({
    size: 2.2,
    flyer: true,
    legs: [
      { pivot: [-14, -60], at: -14, wing: true, parts: [['M-14-62C-40-92-68-90-80-78C-66-72-68-60-60-54C-50-58-46-48-38-44C-30-50-22-52-14-46Z', P.soot]] },
      { pivot: [10, -60], at: 10, wing: true, parts: [['M10-62C30-96 56-96 70-84C56-78 58-66 50-60C42-64 36-54 30-50C24-56 16-54 10-48Z', P.fur]] },
    ],
    body: [
      ['M-44-48L-70-44L-46-36Z', P.fur],
      ['M-46-46C-46-64-16-68 6-64C26-60 28-44 14-36C-6-28-46-30-46-46Z', P.fur],
      ['M18-54C30-66 30-80 34-90C40-100 54-100 58-90C60-80 50-82 44-78C40-68 38-54 24-42Z', P.fur],
      [circ(46, -90, 3), INK, 0],
      ['M56-96L94-84L56-84Z', P.vermilion, 2.5],
      ['M-16-30L-22-6M4-30L-2-6', null, 4, P.vermilion],
      ['M-30-8C-30-22 8-22 8-8C8 8-30 8-30-8Z', P.woodDark],
      [box(-28, -18, 34, 7), T.main],
      ['M-22-20C-26-30-18-34-14-42C-10-32-2-32-6-20Z', '#f08a24', 2],
    ],
  }),
  baliste: (T) => ({
    size: 2.2,
    body: [
      ['M-40 0L-22-30H22L40 0H26L14-16H-14L-26 0Z', P.wood],
      [circ(-30, -2, 8), P.woodDark],
      [circ(30, -2, 8), P.woodDark],
      ['M-8-30V-74', null, 4],
      ['M-8-74L-8-98l20 7l-20 7', T.main, 2.5],
    ],
    arm: {
      pivot: [0, -36],
      parts: [
        ['M-42-38H44', null, 8, P.woodDark],
        ['M26-64C42-54 42-22 26-12', null, 5],
        ['M26-64L-22-38L26-12', null, 1.5],
        ['M-22-38H50', P.steel, 3.5],
        ['M50-38l-9-5v10Z', P.steel, 2],
      ],
    },
  }),
  beffroi: (T) => ({
    size: 3.2,
    body: [
      ['M-30 0L-24-64H24L30 0Z', P.wood],
      ['M-28-20H28M-26-42H26', null, 3],
      ['M-28 0L26-20M28 0L-26-20M-26-20L24-42M26-20L-24-42', null, 2],
      ['M-30-64H30V-96H-30Z', P.stoneLight],
      [box(-16, -90, 10, 18), INK, 0],
      [box(6, -90, 10, 18), INK, 0],
      ['M-36-94L0-126L36-94Z', T.main],
      ['M-3-126V-146', null, 3.5],
      ['M-3-146L-3-136L14-141Z', P.gold, 2],
      [ell(0, -71, 7, 5), P.gold, 2],
    ],
    arm: { pivot: [-11, -80], parts: [['M-11-80L8-86', null, 3], ['M6-90l8 4l-7 3Z', P.steel, 1.5]] },
  }),
  terrier: (T) => ({
    size: 2.2,
    body: [
      ['M-50 0C-52-40-24-62 2-62C30-62 54-38 50 0Z', '#7b5a31'],
      ['M-30-30l6-5M18-44l7 3M30-14l6-4M-38-10l6 3M6-22l7 2', null, 2.5],
      ['M-22 0C-22-30 22-30 22 0Z', P.soot],
      ['M-22 0C-22-30 22-30 22 0', null, 5],
      ['M-30-50V-90', null, 3.5],
      ['M-30-90L-4-82L-30-72Z', T.main, 2.5],
      [ell(-8, -6, 3, 2.4), P.goldLight, 1.2],
      [ell(8, -6, 3, 2.4), P.goldLight, 1.2],
    ],
  }),
};

export function figure(id, team) {
  const make = FIGURES[id];
  if (!make) throw new Error(`Figure inconnue : ${id}`);
  return make(TEAMS[team]);
}

// Tours : `ruin` est la version tombée.
export const TOWER_ART = {
  princess: (T) => ({
    body: [
      ['M-58 0L-52-98H52L58 0Z', P.stoneLight],
      ['M-54-22H56M-52-46H54M-50-70H52M-20-22V-46M18-46V-70M-30-70V-98M26-22V0', null, 2.5],
      ['M-60-96V-128H-44V-114H-28V-128H-10V-114H8V-128H26V-114H44V-128H60V-96Z', P.stone],
      ['M-16 0V-24C-16-40 16-40 16-24V0Z', P.woodDark],
      ['M0-128V-178', null, 4.5],
      ['M0-178L44-164L0-148Z', T.main],
      [circ(14, -163, 5), P.gold, 2],
    ],
  }),
  king: (T) => ({
    body: [
      ['M-78 0V-92H78V0Z', P.stoneLight],
      ['M-78-26H78M-78-58H78M-44-26V-58M30-26V-58M-20 0V-26M52 0V-26', null, 2.5],
      ['M-94 0V-120H-50V0Z', P.stone],
      ['M50 0V-120H94V0Z', P.stone],
      ['M-100-118V-146H-88V-132H-78V-146H-66V-132H-56V-146H-44V-118Z', P.stoneDark],
      ['M44-118V-146H56V-132H66V-146H78V-132H88V-146H100V-118Z', P.stoneDark],
      ['M-100-146L-72-188L-44-146Z', T.main],
      ['M44-146L72-188L100-146Z', T.main],
      ['M-72-188V-204M72-188V-204', null, 3],
      [circ(-72, -206, 4), P.gold, 2],
      [circ(72, -206, 4), P.gold, 2],
      ['M-26 0V-36C-26-60 26-60 26-36V0Z', P.woodDark],
      ['M-26-36C-26-60 26-60 26-36', null, 5],
      ['M0-54V0', null, 2.5],
      ['M-50-92H50V-108H-50Z', T.main],
      ['M-28-100h6v-6h6v6h6v-6h6v6h6v-6h6v6h6v-6h6v6h6', null, 2],
    ],
  }),
  ruin: () => ({
    body: [
      ['M-60 0L-52-34L-34-22L-22-52L-4-30L14-60L30-26L46-42L60 0Z', P.stoneDark],
      ['M-40-8L-24-24L-6-8M10-10L26-30L40-8', null, 2.5],
      [ell(-38, 2, 12, 5), P.stone],
      [ell(30, 3, 14, 5), P.stone],
      [ell(0, 4, 9, 4), P.stoneLight],
    ],
  }),
};

// Icônes de sort, dessinées dans un carré de 100 centré sur (0, -50).
export const SPELL_ICONS = {
  feu: () => [
    ['M-24-36C-30-62-18-76-6-88C-6-74 2-72 6-90C20-74 34-58 22-34Z', '#f08a24'],
    ['M-12-36C-16-52-8-60-2-68C0-58 8-56 10-66C18-54 20-44 12-34Z', P.goldLight, 2],
    ['M-30-34H30C34-14 24 0 0 0C-24 0-34-14-30-34Z', P.stoneDark],
    ['M-30-26H30', null, 2.5],
    [circ(0, -14, 7), P.gold, 2.5],
  ],
  fleches: () => [
    ['M-30-92L-16-32', null, 5],
    ['M-22-22l-5-16l14 4Z', P.steel, 2.5],
    ['M-36-98l6 6l6-8', P.vermilion, 2],
    ['M4-98L12-20', null, 5],
    ['M13-6l-8-16l15 0Z', P.steel, 2.5],
    ['M-3-104l7 6l7-7', P.vermilion, 2],
    ['M36-90L28-34', null, 5],
    ['M26-22l-6-14l14 1Z', P.steel, 2.5],
    ['M29-96l7 6l8-5', P.vermilion, 2],
  ],
  encre: () => [
    ['M-42-14C-44-30-22-34-6-30C14-40 44-30 42-14C40-2 16 2 0 0C-16 2-40 2-42-14Z', '#111635'],
    ['M-26-20c6-4 14-4 20-2', P.lapisLight, 2],
    ['M-2-96L30-64L12-44L-20-76Z', P.bone],
    ['M-20-76L-30-86L-12-104L-2-96Z', P.woodDark],
    ['M12-44C6-34 2-28 0-22', null, 6],
  ],
  cantique: () => [
    ['M0-98C-24-98-28-74-30-48C-32-34-40-28-42-20H42C40-28 32-34 30-48C28-74 24-98 0-98Z', P.gold],
    ['M-34-30H34', null, 3],
    ['M-20-66C-18-78-10-84-4-84', P.goldLight, 3],
    [circ(0, -10, 9), P.goldDark],
    ['M-60-74c-8 10-8 22 0 32M60-74c8 10 8 22 0 32', null, 4],
  ],
  courroux: () => [
    ['M-32-46L-24-92L0-104L24-92L32-46Z', P.bone],
    ['M-3-100h6v20h12v6h-12v28h-6v-28h-12v-6h12Z', P.gold, 2],
    ['M-32-46H32V-36H-32Z', P.vermilion],
    ['M8-36L-14-8H0L-12 12L20-20H6L18-36Z', P.goldLight],
  ],
  macabre: () => [
    ['M-26-66C-26-102 26-102 26-66C26-54 18-48 14-40H-14C-18-48-26-54-26-66Z', P.bone],
    [circ(-10, -66, 8), INK, 0],
    [circ(10, -66, 8), INK, 0],
    ['M-3-52h6l-3-7Z', INK, 0],
    ['M-8-40v-7M0-40v-7M8-40v-7', null, 2.5],
    ['M-38-24L38 0M38-24L-38 0', null, 10],
    ['M-38-24L38 0M38-24L-38 0', null, 5, P.bone],
  ],
  copiste: () => [
    ['M-38-90H18V0H-38Z', P.bone],
    ['M-28-76H8M-28-64H8M-28-52H8M-28-40H-2', null, 2.5],
    ['M-16-98H40V-8H26', null, 3],
    ['M44-104C20-92 6-66 0-34C10-44 14-44 22-50C14-50 12-54 12-54C22-56 26-62 30-68C22-66 22-70 22-70C32-76 42-88 44-104Z', P.gold],
    ['M0-34L-6-20', null, 3],
  ],
};

// Trace une liste de pièces sur un contexte 2D, sans transformation.
export function drawParts(ctx, parts) {
  for (const [path, fill, lw = 3, stroke = INK] of parts) {
    const p = new Path2D(path);
    if (fill) {
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

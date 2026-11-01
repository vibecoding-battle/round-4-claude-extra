// Les folios de la campagne : chaque adversaire a son deck, son niveau de jeu et ses répliques.

export const STARTER_CARDS = ['lapin', 'moines', 'souris', 'goupil', 'squelettes', 'diablotins', 'chouette', 'cochon', 'baliste', 'feu', 'fleches', 'encre'];

export const CHAPTERS = [
  {
    id: 'begnin', numeral: 'I', name: 'Frère Bégnin', title: 'Copiste distrait', figure: 'moine', level: 'novice', inkRate: 1,
    deck: ['moines', 'lapin', 'souris', 'squelettes', 'goupil', 'baliste', 'fleches', 'chouette'],
    unlocks: ['licorne', 'cantique'],
    taunts: { start: ['Pardon, c’est ici la bibliothèque ?'], hit: ['Oh ! Mon beau chapiteau !'], score: ['Tiens ? J’ai réussi ?'], lose: ['Je recopierai cent fois : je ne gagne pas.'], win: ['Amen, et bonne lecture.'] },
  },
  {
    id: 'goupille', numeral: 'II', name: 'Dame Goupille', title: 'Voleuse de plumes', figure: 'goupil', level: 'novice', inkRate: 1,
    deck: ['goupil', 'souris', 'cochon', 'diablotins', 'lapin', 'moines', 'encre', 'feu'],
    unlocks: ['ours', 'beffroi'],
    taunts: { start: ['Jolies tours. Je les prends.'], hit: ['Ce n’était qu’un emprunt !'], score: ['Ceci aussi, je le garde.'], lose: ['Je reviendrai pour l’encrier.'], win: ['Merci pour la plume.'] },
  },
  {
    id: 'sansonnet', numeral: 'III', name: 'Sansonnet le Fol', title: 'Bouffon du chapitre', figure: 'grylle', level: 'moyen', inkRate: 1,
    deck: ['grylle', 'souris', 'squelettes', 'diablotins', 'cochon', 'terrier', 'fleches', 'cantique'],
    unlocks: ['grylle', 'abbesse'],
    taunts: { start: ['Qui veut voir une tête sur deux pattes ?'], hit: ['Aïe ! Mon meilleur grelot !'], score: ['Ha ! Elle était bonne, celle-là !'], lose: ['Fin du spectacle. Lancez des choux.'], win: ['Rideau ! On rit, on rit !'] },
  },
  {
    id: 'severe', numeral: 'IV', name: 'Sœur Sévère', title: 'Abbesse de la correction', figure: 'abbesse', level: 'moyen', inkRate: 1,
    deck: ['abbesse', 'lapin', 'moines', 'ours', 'beffroi', 'chouette', 'fleches', 'encre'],
    unlocks: ['wyverne', 'terrier'],
    taunts: { start: ['Tenez-vous droit. Je note.'], hit: ['Ceci figurera au registre.'], score: ['Une faute de plus, mon enfant.'], lose: ['Cette page sera pardonnée. Pas vous.'], win: ['À genoux. Recopiez.'] },
  },
  {
    id: 'renart', numeral: 'V', name: 'Maître Renart', title: 'Plaideur sans scrupule', figure: 'chat', level: 'fort', inkRate: 1,
    deck: ['chat', 'goupil', 'licorne', 'lapin', 'chouette', 'baliste', 'feu', 'encre'],
    unlocks: ['chat', 'escargot'],
    taunts: { start: ['Je plaide coupable : de votre défaite.'], hit: ['Objection !'], score: ['La cour appréciera.'], lose: ['Je ferai appel.'], win: ['Affaire classée.'] },
  },
  {
    id: 'prieur', numeral: 'VI', name: 'Le Prieur Limace', title: 'Maître des sièges lents', figure: 'escargot', level: 'fort', inkRate: 1,
    deck: ['escargot', 'moines', 'wyverne', 'abbesse', 'souris', 'beffroi', 'fleches', 'cantique'],
    unlocks: ['cigogne', 'macabre'],
    taunts: { start: ['Rien ne presse. Vous êtes déjà perdu.'], hit: ['Ma coquille en a vu d’autres.'], score: ['Lentement. Sûrement.'], lose: ['Trop vite. Vous allez trop vite.'], win: ['Je vous avais dit : rien ne presse.'] },
  },
  {
    id: 'eveque', numeral: 'VII', name: 'L’Évêque Courroucé', title: 'Foudre du diocèse', figure: 'ours', level: 'expert', inkRate: 1,
    deck: ['ours', 'cigogne', 'grylle', 'abbesse', 'wyverne', 'squelettes', 'courroux', 'fleches'],
    unlocks: ['courroux', 'copiste'],
    taunts: { start: ['Vous êtes excommunié de cette page.'], hit: ['Blasphème !'], score: ['Le ciel a tranché.'], lose: ['Ce n’est qu’une épreuve de plus.'], win: ['Requiescat.'] },
  },
  {
    id: 'mort', numeral: 'VIII', name: 'La Camarde', title: 'Maîtresse de la danse', figure: 'squelette', level: 'expert', inkRate: 1.15,
    deck: ['gargouille', 'macabre', 'squelettes', 'wyverne', 'chat', 'baliste', 'feu', 'courroux'],
    unlocks: ['gargouille'],
    note: 'Sa plume ne sèche jamais : son encre remonte 15 % plus vite.',
    taunts: { start: ['Tout le monde finit par danser.'], hit: ['Cela chatouille.'], score: ['Un pas de plus vers moi.'], lose: ['Je repasserai. Je repasse toujours.'], win: ['Prenez ma main.'] },
  },
];

export const SKIRMISH_DECKS = [
  ['lapin', 'moines', 'souris', 'baliste', 'feu', 'fleches', 'diablotins', 'goupil'],
  ['escargot', 'moines', 'wyverne', 'squelettes', 'feu', 'encre', 'chouette', 'goupil'],
  ['grylle', 'chat', 'souris', 'beffroi', 'fleches', 'lapin', 'chouette', 'encre'],
  ['ours', 'abbesse', 'cigogne', 'cochon', 'squelettes', 'fleches', 'diablotins', 'cantique'],
  ['gargouille', 'moines', 'wyverne', 'terrier', 'courroux', 'goupil', 'squelettes', 'feu'],
];

export const RANKS = [
  [0, 'Écolier'], [120, 'Clerc'], [300, 'Copiste'], [550, 'Rubricateur'], [850, 'Enlumineur'], [1200, 'Maître d’atelier'], [1700, 'Gardien du Codex'],
];

export function rankFor(seals) {
  let name = RANKS[0][1];
  for (const [min, label] of RANKS) if (seals >= min) name = label;
  return name;
}

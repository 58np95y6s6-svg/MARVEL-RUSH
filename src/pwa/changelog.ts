// Notes de version affichées dans « Quoi de neuf » après une mise à jour.
// Ajouter une entrée EN TÊTE de liste à chaque mise à jour qui change quelque chose pour les joueurs.
// L'id doit être unique et croissant (date, puis lettre si plusieurs le même jour).

export interface ReleaseNote {
  id: string;          // ex. '2026-10-09a'
  title: string;       // ex. 'Installation sur l’écran d’accueil'
  date: string;        // affichée telle quelle
  items: string[];     // une phrase courte par nouveauté
}

export const CHANGELOG: ReleaseNote[] = [
  {
    id: '2026-10-18a',
    title: 'Extension DC Comics',
    date: '18 octobre 2026',
    items: [
      'Nouveau Pack DC, aux mêmes prix, taux et garantie que les packs Marvel et Disney.',
      '15 héros DC : Batman, Superman, Wonder Woman, Green Lantern, Flash, Aquaman, Cyborg, Supergirl, Shazam, Martian Manhunter, Robin, Batgirl, Catwoman, Harley Quinn et Green Arrow, chacun avec sa compétence, ses talents et ses 5 passifs d’éveil.',
      'Nouvelles équipes : Justice League, Trinité, Bat-famille, Lanternes et cosmiques, Sirènes de Gotham, et deux équipes entre univers, Les Riches (Iron Man et Batman) et Les Archers (Œil de faucon, Green Arrow et Rebelle).',
      'Cinq nouveaux méchants : le Joker, Lex Luthor, Bane, Sinestro et Black Adam, avec leurs lieutenants et leurs sbires (clowns, robots LexCorp, mercenaires, Corps Sinestro, soldats de Kahndaq).',
      'Darkseid, boss final de l’extension : Rayons Oméga, Boom Tube et Équation d’Anti-Vie.',
      'Nouvelles maps : Gotham City la nuit, la Batcave, Metropolis, Themyscira, Atlantis et Oa, et six arènes de boss dont Apokolips.',
      '30 nouveaux niveaux : chapitres 7 (Gotham), 8 (Metropolis et Themyscira) et 9 (Apokolips), en Solo et en Coop, ouverts après Thanos.',
      'Modes infinis prolongés : les boss DC rejoignent la rotation, Darkseid arrive à la vague 100, et deux coffres « Cosmique » attendent aux vagues 75 et 100.',
      'Nouvelle option de rotation des boss en mode infini : tous les univers, Marvel et Disney, ou DC seul.',
    ],
  },
  {
    id: '2026-10-09b',
    title: 'Installation simplifiée',
    date: '9 octobre 2026',
    items: [
      'Une page explique comment installer l’app sur l’écran d’accueil.',
      'L’app installée demande le code d’accès une seule fois.',
      'Nouvelle icône « Marvel Rush » sur l’écran d’accueil.',
      'Une fenêtre prévient quand une nouvelle version est disponible.',
    ],
  },
];

export const LATEST = CHANGELOG[0]!;

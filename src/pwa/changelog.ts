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
    id: '2026-10-10b2',
    title: 'Nouveaux jetons',
    date: '10 octobre 2026',
    items: [
      'Plus de cadre rond : chaque héros est posé directement dans la forme de son niveau.',
      'Chaque héros a sa propre couleur de forme, pour le reconnaître d’un coup d’œil.',
      'Un fin liseré intérieur rappelle la rareté (bleu, violet, or).',
    ],
  },
  {
    id: '2026-10-10b',
    title: 'Niveaux de fusion façon Rush Royale',
    date: '10 octobre 2026',
    items: [
      'La forme du jeton donne le niveau de fusion : le nombre d’angles = le niveau.',
      'Rond, amande, triangle, losange, pentagone, hexagone, heptagone (niveau 7).',
      'À chaque fusion, la forme gagne ses angles un à un.',
    ],
  },
  {
    id: '2026-10-10a',
    title: 'Premier combat jouable',
    date: '10 octobre 2026',
    items: [
      'Solo Infini sur les Toits de New York avec le deck Marvel de départ.',
      'Invoque, fais glisser une unité sur sa jumelle pour la fusionner, améliore ton deck en partie.',
      'Lieutenant toutes les 5 vagues, gros boss toutes les 10, avec annonce, barre de vie et arène.',
      'Touche une unité pour lire sa compétence ; le jeu ralentit le temps de la lire.',
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

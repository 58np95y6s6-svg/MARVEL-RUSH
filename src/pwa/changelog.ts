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

// Boss et sbires (§4.4 du prompt, design/game-design.md). Valeurs lues par le moteur.
//
// power.params : paramètres du pouvoir (nombre d'unités visées, durées en s…).
// minion.params : multiplicateurs du sbire par rapport à un ennemi normal de la vague
//   speedMul, hpMul, armor (0..1), shieldHits, packSize (sbires par apparition),
//   flying (1 = insensible aux ralentissements et aux déplacements forcés),
//   arrivalStun / arrivalStunUnits (étourdissement des unités quand il atteint la fin du chemin).
// Boss : `hpMul` (× 25 PV d'un ennemi normal), `speed` (cases par seconde).

import type { BossDef, BossId } from './types';

export const BOSS_LIST: BossDef[] = [
  {
    id: 'jafar', name: 'Jafar & Iago',
    power: {
      name: 'Hypnose', interval: 6,
      description: '1 à 2 unités cessent d’attaquer pendant 4 s.',
      params: { minUnits: 1, maxUnits: 2, duration: 4 },
    },
    minion: { name: 'Cobras', description: 'Rapides, ils se faufilent.', params: { speedMul: 2.2, hpMul: 0.6, packSize: 1 } },
    arenaMapId: 'arene-jafar',
  },
  {
    id: 'cruella', name: 'Cruella',
    power: {
      name: 'Vol de manteau', interval: 6,
      description: 'Une unité perd 1 rang.',
      params: { units: 1, rankLoss: 1 },
    },
    minion: { name: 'Hommes de main', description: 'Résistants, ils arrivent en groupe.', params: { speedMul: 0.8, hpMul: 1.8, packSize: 3 } },
    arenaMapId: 'arene-cruella',
  },
  {
    id: 'ursula', name: 'Ursula',
    power: {
      name: 'Contrat', interval: 6,
      description: 'Échange la position de 2 unités, ce qui casse les combos d’adjacence.',
      params: { units: 2 },
    },
    minion: { name: 'Murènes', description: 'Elles avancent en duo.', params: { speedMul: 1.3, hpMul: 0.9, packSize: 2 } },
    arenaMapId: 'arene-ursula',
  },
  {
    id: 'malefique', name: 'Maléfique',
    power: {
      name: 'Sommeil maudit', interval: 6,
      description: 'Endort une ligne entière d’unités pendant 3 s.',
      params: { duration: 3 },
    },
    minion: { name: 'Gardes gobelins', description: 'Armure élevée.', params: { speedMul: 0.9, hpMul: 1.2, armor: 0.5, packSize: 1 } },
    arenaMapId: 'arene-malefique',
  },
  {
    id: 'galactus', name: 'Galactus',
    power: {
      name: 'Dévoreur', interval: 6,
      description: 'Détruit une unité aléatoire de rang 3 ou moins.',
      params: { maxRank: 3, units: 1 },
    },
    minion: { name: 'Drones cosmiques', description: 'Ils volent et ignorent les ralentissements et les déplacements forcés.', params: { speedMul: 1.2, hpMul: 1, flying: 1, packSize: 1 } },
    arenaMapId: 'arene-galactus',
  },
  {
    id: 'bouffon', name: 'Bouffon Vert',
    power: {
      name: 'Bombes citrouilles', interval: 6,
      description: 'Étourdit 3 unités pendant 2 s.',
      params: { units: 3, duration: 2 },
    },
    minion: { name: 'Citrouilles volantes', description: 'Elles explosent à l’arrivée et étourdissent 2 unités.', params: { speedMul: 1.4, hpMul: 0.8, flying: 1, packSize: 1, arrivalStun: 1, arrivalStunUnits: 2 } },
    arenaMapId: 'arene-bouffon',
  },
  {
    id: 'thanos', name: 'Thanos',
    power: {
      name: 'Gant de l’infini', interval: 8,
      description: 'Toutes les 8 s, le pouvoir d’une Pierre au hasard. À 30 % de PV, une fois, Claquement de doigts : 3 unités perdent la moitié de leurs rangs.',
      params: {
        hpMul: 2,
        powerUnits: 3, powerDuration: 2,          // Puissance : étourdit 3 unités 2 s
        spaceUnits: 2,                            // Espace : échange 2 unités
        realityUnits: 1,                          // Réalité : transforme 1 unité
        soulManaSteal: 0.2,                       // Âme : vole 20 % du mana
        timeHeal: 0.05,                           // Temps : soigne 5 % des PV max
        mindUnits: 2, mindDuration: 4,            // Esprit : hypnotise 2 unités 4 s
        snapThreshold: 0.3, snapUnits: 3, snapDelay: 1, // Claquement de doigts
      },
    },
    minion: { name: 'Outriders', description: 'Très rapides, ils arrivent en meute.', params: { speedMul: 2.5, hpMul: 0.5, packSize: 4 } },
    arenaMapId: 'arene-thanos',
  },
];

export const BOSSES: Record<BossId, BossDef> = Object.fromEntries(BOSS_LIST.map((b) => [b.id, b])) as Record<BossId, BossDef>;

/** Les 6 boss en rotation (Thanos est hors rotation). */
export const ROTATING_BOSSES: BossId[] = ['jafar', 'cruella', 'ursula', 'malefique', 'galactus', 'bouffon'];

/** Statistiques communes des boss. */
export const BOSS_STATS = {
  hpMul: 25,          // PV = 25 × PV d'un ennemi normal de la vague
  speed: 0.5,         // cases par seconde (un normal va à 2)
  rageAfter: 45,      // secondes avant la rage
  rageSpeedMul: 2,
  mana: 100,
};

export type StoneId = 'puissance' | 'espace' | 'realite' | 'ame' | 'temps' | 'esprit';

export interface StoneDef {
  id: StoneId;
  /** Nom affiché, utilisé tel quel dans l'événement bossPower.name. */
  name: string;
  color: string;
  description: string;
}

/** Pierres du Gant de l'infini (Thanos), dans l'ordre du tirage. */
export const THANOS_STONES: StoneDef[] = [
  { id: 'puissance', name: 'Pierre du Pouvoir', color: '#9b59e6', description: 'Étourdit 3 unités pendant 2 s.' },
  { id: 'espace', name: 'Pierre de l’Espace', color: '#3c8bf0', description: 'Échange 2 unités.' },
  { id: 'realite', name: 'Pierre de la Réalité', color: '#e8413b', description: 'Transforme une unité en une autre unité du deck, au même rang.' },
  { id: 'ame', name: 'Pierre de l’Âme', color: '#f2a93b', description: 'Vole 20 % du mana.' },
  { id: 'temps', name: 'Pierre du Temps', color: '#3fbf6a', description: 'Soigne Thanos de 5 %.' },
  { id: 'esprit', name: 'Pierre de l’Esprit', color: '#f6c64a', description: 'Hypnotise 2 unités pendant 4 s.' },
];

/** Nom de l'événement bossPower du Claquement de doigts (émis deux fois : annonce sans case, puis effet). */
export const SNAP_NAME = 'Claquement de doigts';

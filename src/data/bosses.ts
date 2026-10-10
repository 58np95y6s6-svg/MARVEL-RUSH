// Boss et sbires (§4.4 du prompt, design/game-design.md). Valeurs lues par le moteur.
//
// power.params : paramètres du pouvoir (nombre d'unités visées, durées en s…).
// minion.params : multiplicateurs du sbire par rapport à un ennemi normal de la vague
//   speedMul, hpMul, armor (0..1), shieldHits, packSize (sbires par apparition),
//   flying (1 = insensible aux ralentissements et aux déplacements forcés),
//   arrivalStun / arrivalStunUnits (étourdissement des unités quand il atteint la fin du chemin).
// Boss : `hpMul` (× 25 PV d'un ennemi normal), `speed` (cases par seconde).

import type { BossDef, BossId, BossPool } from './types';

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
  // ───────────── Extension Pixar ─────────────
  {
    id: 'syndrome', name: 'Syndrome',
    power: {
      name: 'Rayon à point zéro', interval: 6,
      description: 'Syndrome fige 2 unités dans son rayon pendant 3 s. Son Omnidroïde l’accompagne : il encaisse 15 % des dégâts.',
      params: { units: 2, duration: 3, bossArmor: 0.15 },
    },
    minion: { name: 'Robots de Syndrome', description: 'Blindés (armure 30 %), en duo.', params: { speedMul: 1, hpMul: 1.2, armor: 0.3, packSize: 2 } },
    arenaMapId: 'arene-syndrome',
  },
  {
    id: 'randall', name: 'Randall',
    power: {
      name: 'Camouflage', interval: 6,
      description: 'Randall se fond dans le décor : 2 unités le perdent de vue et cessent d’attaquer 3 s, et il se soigne de 3 %.',
      params: { units: 2, duration: 3, heal: 0.03 },
    },
    minion: { name: 'Monstres de Monstropolis', description: 'Rapides, en trio.', params: { speedMul: 1.6, hpMul: 0.6, packSize: 3 } },
    arenaMapId: 'arene-randall',
  },
  {
    id: 'lotso', name: 'Lotso',
    power: {
      name: 'Tri des jouets', interval: 6,
      description: 'Lotso jette à la benne l’unité de plus bas rang (rang 2 ou moins), et une autre unité perd 1 rang.',
      params: { maxRank: 2, rankLoss: 1 },
    },
    minion: { name: 'Jouets de Sunnyside', description: 'Ils arrivent en bande de 3, protégés par un bouclier (1 coup).', params: { speedMul: 1, hpMul: 0.8, shieldHits: 1, packSize: 3 } },
    arenaMapId: 'arene-lotso',
  },
  {
    id: 'hopper', name: 'Le Borgne',
    power: {
      name: 'Nuée de sauterelles', interval: 6,
      description: 'Le Borgne appelle 3 sauterelles près de lui et étourdit 1 unité 2 s.',
      params: { callCount: 3, units: 1, duration: 2 },
    },
    minion: { name: 'Sauterelles', description: 'Elles volent vite, en essaim de 3.', params: { speedMul: 1.7, hpMul: 0.5, flying: 1, packSize: 3 } },
    arenaMapId: 'arene-hopper',
  },
  {
    id: 'muntz', name: 'Charles Muntz',
    power: {
      name: 'Dirigeable', interval: 6,
      description: 'En alternance : les chiens de Muntz (2 chiens surgissent près de lui) ou le canon du dirigeable (une colonne d’unités étourdie 1,5 s).',
      params: { callCount: 2, duration: 1.5 },
    },
    minion: { name: 'Chiens de Muntz', description: 'Très rapides, en meute de 3.', params: { speedMul: 2, hpMul: 0.55, packSize: 3 } },
    arenaMapId: 'arene-muntz',
  },
  {
    id: 'zurg', name: 'l’Empereur Zurg',
    power: {
      name: 'Pistolet à ions', interval: 8,
      description: 'Toutes les 8 s, en alternance : Pistolet à ions (2 unités étourdies 1,5 s, dont une perd 1 rang) ou Robots de Zurg (3 robots surgissent près de lui). À 30 % de PV, une fois, « Je suis ton père » : 4 unités échangent leurs cases et tout le plateau est hypnotisé 1,5 s.',
      params: {
        hpMul: 1,
        ionUnits: 2, ionRankLoss: 1, ionRankUnits: 1, ionStun: 1.5,
        callCount: 3,
        fatherThreshold: 0.3, fatherSwaps: 2, fatherDuration: 1.5,
      },
    },
    minion: { name: 'Robots de Zurg', description: 'Robots d’assaut, en trio, avec un bouclier (1 coup).', params: { speedMul: 1.1, hpMul: 0.8, shieldHits: 1, packSize: 3 } },
    arenaMapId: 'arene-zurg',
  },
];

export const BOSSES: Record<BossId, BossDef> = Object.fromEntries(BOSS_LIST.map((b) => [b.id, b])) as Record<BossId, BossDef>;

/**
 * Gros boss en rotation, par option de rotation (campagne et modes infinis). Thanos (vague 50) est hors
 * rotation ; l'Empereur Zurg, boss final de l'extension Pixar, est dans la rotation.
 */
export const BOSS_POOLS: Record<BossPool, BossId[]> = {
  'marvel-disney': ['jafar', 'cruella', 'ursula', 'malefique', 'galactus', 'bouffon'],
  pixar: ['syndrome', 'randall', 'lotso', 'hopper', 'muntz', 'zurg'],
  tous: ['jafar', 'cruella', 'ursula', 'malefique', 'galactus', 'bouffon', 'syndrome', 'randall', 'lotso', 'hopper', 'muntz', 'zurg'],
};

/** Rotation par défaut (« Tous les univers »). */
export const ROTATING_BOSSES: BossId[] = BOSS_POOLS.tous;

/** Libellés des options de rotation. */
export const BOSS_POOL_LABELS: Record<BossPool, string> = {
  tous: 'Tous les univers',
  'marvel-disney': 'Marvel et Disney',
  pixar: 'Pixar seul',
};

/**
 * Petits boss (§4.4) : le lieutenant du prochain gros boss, un de ses sbires en version géante
 * (taille ×2), avec une version affaiblie du pouvoir de son maître toutes les 10 s.
 * `params` remplace les paramètres du pouvoir du maître (mêmes clés).
 */
export interface LieutenantDef {
  name: string;
  power: { name: string; description: string; interval: number; params: Record<string, number> };
}

export const LIEUTENANTS: Record<BossId, LieutenantDef> = {
  jafar: { name: 'Cobra géant', power: { name: 'Hypnose', description: 'Hypnotise 1 unité pendant 2 s.', interval: 10, params: { minUnits: 1, maxUnits: 1, duration: 2 } } },
  cruella: { name: 'Homme de main géant', power: { name: 'Vol de manteau', description: 'Une unité de rang 3 ou plus perd 1 rang.', interval: 10, params: { units: 1, rankLoss: 1, minRank: 3 } } },
  ursula: { name: 'Murène géante', power: { name: 'Contrat', description: 'Échange la position de 2 unités.', interval: 10, params: { units: 2 } } },
  malefique: { name: 'Garde gobelin géant', power: { name: 'Sommeil maudit', description: 'Endort 2 unités pendant 2 s.', interval: 10, params: { units: 2, duration: 2 } } },
  galactus: { name: 'Drone cosmique géant', power: { name: 'Dévoreur', description: 'Détruit une unité de rang 1.', interval: 10, params: { maxRank: 1, units: 1 } } },
  bouffon: { name: 'Citrouille géante', power: { name: 'Bombes citrouilles', description: 'Étourdit 1 unité pendant 2 s.', interval: 10, params: { units: 1, duration: 2 } } },
  thanos: {
    name: 'Outrider géant',
    power: {
      name: 'Gant de l’infini', description: 'Le pouvoir affaibli d’une Pierre au hasard.', interval: 10,
      params: { powerUnits: 1, powerDuration: 1, spaceUnits: 2, realityUnits: 1, soulManaSteal: 0.1, timeHeal: 0.02, mindUnits: 1, mindDuration: 2 },
    },
  },
  // ───────────── Extension Pixar ─────────────
  syndrome: { name: 'Robot de Syndrome géant', power: { name: 'Rayon à point zéro', description: 'Fige 1 unité pendant 2 s.', interval: 10, params: { units: 1, duration: 2 } } },
  randall: { name: 'Monstre géant', power: { name: 'Camouflage', description: '1 unité cesse d’attaquer 2 s.', interval: 10, params: { units: 1, duration: 2, heal: 0 } } },
  lotso: { name: 'Gros Bébé', power: { name: 'Tri des jouets', description: 'Une unité de rang 3 ou plus perd 1 rang.', interval: 10, params: { maxRank: 0, rankLoss: 1 } } },
  hopper: { name: 'Sauterelle géante', power: { name: 'Nuée de sauterelles', description: '2 sauterelles en renfort.', interval: 10, params: { callCount: 2, units: 0, duration: 0 } } },
  muntz: { name: 'Alpha, le chien géant', power: { name: 'Dirigeable', description: 'En alternance : 2 chiens, ou 1 unité étourdie 1,5 s.', interval: 10, params: { callCount: 2, duration: 1.5, units: 1 } } },
  zurg: {
    name: 'Robot de Zurg géant',
    power: { name: 'Pistolet à ions', description: 'En alternance : 1 unité étourdie 1,5 s, ou 2 robots en renfort.', interval: 10, params: { ionUnits: 1, ionRankLoss: 0, ionStun: 1.5, callCount: 2 } },
  },
};

/** Statistiques communes des boss. */
export const BOSS_STATS = {
  smallHpMul: 12,     // petit boss : PV = 12 × PV d'un ennemi normal de la vague
  scriptedMiniHpMul: 8, // script.miniBoss (campagne, niveaux 5) : PV ×8
  hpMul: 25,          // gros boss : PV = 25 × PV d'un ennemi normal de la vague
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

/** Noms des événements bossPower des méchants Pixar. */
export const ION_NAME = 'Pistolet à ions';
export const ZURG_ROBOTS_NAME = 'Robots de Zurg';
export const FATHER_NAME = 'Je suis ton père';
export const DOGS_NAME = 'Les chiens de Muntz';
export const AIRSHIP_NAME = 'Canon du dirigeable';

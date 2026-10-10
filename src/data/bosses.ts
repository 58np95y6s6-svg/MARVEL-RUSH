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
  // ───────────── Extension Transformers (Decepticons) ─────────────
  {
    id: 'starscream', name: 'Starscream',
    power: {
      name: 'Missiles en piqué', interval: 6,
      description: 'Starscream pique sur le plateau : 2 unités sont étourdies 2,5 s.',
      params: { units: 2, duration: 2.5 },
    },
    minion: { name: 'Seekers', description: 'Ils volent vite, en duo, insensibles aux ralentissements.', params: { speedMul: 1.5, hpMul: 0.7, flying: 1, packSize: 2 } },
    arenaMapId: 'arene-starscream',
  },
  {
    id: 'soundwave', name: 'Soundwave',
    power: {
      name: 'Brouillage', interval: 6,
      description: '3 unités sont brouillées 5 s : elles perdent leurs améliorations en partie et ne peuvent plus se transformer.',
      params: { units: 3, duration: 5 },
    },
    minion: { name: 'Insecticons', description: 'Petits et rapides, ils arrivent en essaim de 4.', params: { speedMul: 1.6, hpMul: 0.45, packSize: 4 } },
    arenaMapId: 'arene-soundwave',
  },
  {
    id: 'shockwave', name: 'Shockwave',
    power: {
      name: 'Rayon de Kaon', interval: 6,
      description: 'Le rayon de Shockwave transforme une unité en une autre unité du deck pendant 6 s.',
      params: { units: 1, duration: 6 },
    },
    minion: { name: 'Drones Vehicons', description: 'Blindés (armure 35 %), en duo.', params: { speedMul: 1, hpMul: 1.2, armor: 0.35, packSize: 2 } },
    arenaMapId: 'arene-shockwave',
  },
  {
    id: 'devastator', name: 'Devastator',
    power: {
      name: 'Poing de Devastator', interval: 6,
      description: 'Le géant écrase une colonne entière d’unités, étourdies 2 s. Formé de 6 Constructicons, il se reforme une fois, à 40 % de ses PV.',
      params: { duration: 2, reformHp: 0.4, hpMul: 1.1 },
    },
    minion: { name: 'Constructicons', description: 'Lents, massifs et blindés (armure 30 %).', params: { speedMul: 0.75, hpMul: 1.8, armor: 0.3, packSize: 1 } },
    arenaMapId: 'arene-devastator',
  },
  {
    id: 'blitzwing', name: 'Blitzwing',
    power: {
      name: 'Glace et feu', interval: 6,
      description: 'En alternance : Blizzard (une ligne d’unités gelée 2 s) ou Canon de feu (2 unités perdent 40 % de leurs dégâts pendant 5 s).',
      params: { duration: 2, fireUnits: 2, scorch: 0.4, scorchDuration: 5 },
    },
    minion: { name: 'Sweeps', description: 'Ils volent en duo, protégés par un bouclier (1 coup).', params: { speedMul: 1.3, hpMul: 0.8, flying: 1, shieldHits: 1, packSize: 2 } },
    arenaMapId: 'arene-blitzwing',
  },
  {
    id: 'megatron', name: 'Megatron',
    power: {
      name: 'Canon à fusion', interval: 8,
      description: 'Toutes les 8 s, en alternance : Canon à fusion (2 unités perdent 1 rang et sont étourdies 1,5 s) ou « Decepticons, attaquez ! » (3 Vehicons surgissent près de lui). À 30 % de PV, une fois, Tyrannie : tous les Autobots repassent en robot, étourdis 2 s, et 2 unités perdent 1 rang.',
      params: {
        hpMul: 2,
        cannonUnits: 2, cannonRankLoss: 1, cannonStun: 1.5,
        callCount: 3,
        tyrannyThreshold: 0.3, tyrannyStun: 2, tyrannyUnits: 2, tyrannyRankLoss: 1,
      },
    },
    minion: { name: 'Vehicons', description: 'Soldats Decepticons, en trio, avec un bouclier (1 coup).', params: { speedMul: 1.15, hpMul: 0.8, shieldHits: 1, packSize: 3 } },
    arenaMapId: 'arene-megatron',
  },
  {
    id: 'unicron', name: 'Unicron',
    power: {
      name: 'Dévoreur de mondes', interval: 8,
      description: 'Boss cosmique (modes infinis, vague 150). Toutes les 8 s, en alternance : Dévoreur (détruit une unité de rang 4 ou moins) ou Chaos (échange 2 paires d’unités). À 50 % de PV, une fois, Faim cosmique : il se soigne de 10 % et 3 unités perdent 1 rang.',
      params: { hpMul: 3, devourMaxRank: 4, chaosPairs: 2, hungerThreshold: 0.5, hungerHeal: 0.1, hungerUnits: 3 },
    },
    minion: { name: 'Fragments d’Unicron', description: 'Massifs et blindés (armure 40 %).', params: { speedMul: 0.8, hpMul: 2, armor: 0.4, packSize: 1 } },
    arenaMapId: 'arene-unicron',
  },
];

export const BOSSES: Record<BossId, BossDef> = Object.fromEntries(BOSS_LIST.map((b) => [b.id, b])) as Record<BossId, BossDef>;

/**
 * Gros boss en rotation, par option de rotation (campagne et modes infinis). Thanos (vague 50) et
 * Unicron (vague 150, boss cosmique des modes infinis) sont hors rotation ; Megatron, boss final de
 * l'extension Transformers, est dans la rotation.
 */
export const BOSS_POOLS: Record<BossPool, BossId[]> = {
  'marvel-disney': ['jafar', 'cruella', 'ursula', 'malefique', 'galactus', 'bouffon'],
  transformers: ['starscream', 'soundwave', 'shockwave', 'devastator', 'blitzwing', 'megatron'],
  tous: ['jafar', 'cruella', 'ursula', 'malefique', 'galactus', 'bouffon', 'starscream', 'soundwave', 'shockwave', 'devastator', 'blitzwing', 'megatron'],
};

/** Rotation par défaut (« Tous les univers »). */
export const ROTATING_BOSSES: BossId[] = BOSS_POOLS.tous;

/** Libellés des options de rotation. */
export const BOSS_POOL_LABELS: Record<BossPool, string> = {
  tous: 'Tous les univers',
  'marvel-disney': 'Marvel et Disney',
  transformers: 'Transformers seul',
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
  // ───────────── Extension Transformers ─────────────
  starscream: { name: 'Seeker géant', power: { name: 'Missiles en piqué', description: 'Étourdit 1 unité pendant 1,5 s.', interval: 10, params: { units: 1, duration: 1.5 } } },
  soundwave: { name: 'Insecticon géant', power: { name: 'Brouillage', description: 'Brouille 1 unité pendant 3 s.', interval: 10, params: { units: 1, duration: 3 } } },
  shockwave: { name: 'Drone Vehicon géant', power: { name: 'Rayon de Kaon', description: 'Transforme 1 unité pendant 4 s.', interval: 10, params: { units: 1, duration: 4 } } },
  devastator: { name: 'Constructicon géant', power: { name: 'Poing de Devastator', description: 'Étourdit 2 unités d’une même colonne pendant 1,5 s.', interval: 10, params: { units: 2, duration: 1.5 } } },
  blitzwing: { name: 'Sweep géant', power: { name: 'Glace et feu', description: 'En alternance : gèle 1 unité 1,5 s, ou 1 unité perd 25 % de ses dégâts 3 s.', interval: 10, params: { units: 1, duration: 1.5, fireUnits: 1, scorch: 0.25, scorchDuration: 3 } } },
  megatron: {
    name: 'Vehicon d’élite géant',
    power: {
      name: 'Canon à fusion', description: 'En alternance : 1 unité étourdie 1,5 s, ou 2 Vehicons en renfort.', interval: 10,
      params: { cannonUnits: 1, cannonRankLoss: 0, cannonStun: 1.5, callCount: 2 },
    },
  },
  unicron: { name: 'Fragment d’Unicron géant', power: { name: 'Chaos', description: 'Échange 2 unités.', interval: 10, params: { devourMaxRank: 0, chaosPairs: 1 } } },
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

/** Noms des événements bossPower des Decepticons (Megatron, Unicron, Devastator, Blitzwing). */
export const FUSION_CANNON_NAME = 'Canon à fusion';
export const DECEPTICON_CALL_NAME = 'Decepticons, attaquez !';
export const TYRANNY_NAME = 'Tyrannie';
export const DEVOUR_NAME = 'Dévoreur de mondes';
export const CHAOS_NAME = 'Chaos';
export const HUNGER_NAME = 'Faim cosmique';
export const REFORM_NAME = 'Reformation';
export const BLIZZARD_NAME = 'Blizzard';
export const FIRE_CANNON_NAME = 'Canon de feu';

// Boss et sbires (§4.4 du prompt, design/game-design.md, extension DC). Valeurs lues par le moteur.
//
// power.params : paramètres du pouvoir (nombre d'unités visées, durées en s…).
// minion.params : multiplicateurs du sbire par rapport à un ennemi normal de la vague
//   speedMul, hpMul, armor (0..1), shieldHits, packSize (sbires par apparition),
//   flying (1 = insensible aux ralentissements et aux déplacements forcés),
//   arrivalStun / arrivalStunUnits (étourdissement des unités quand il atteint la fin du chemin).
// Boss : `hpMul` (× 25 PV d'un ennemi normal), `bossArmor` (armure du boss, 0..1), `speed` (cases par seconde).

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

  // ───────────── Extension DC Comics ─────────────
  {
    id: 'joker', name: 'Le Joker',
    power: {
      name: 'Rire du Joker', interval: 6,
      description: 'Échange les rangs de 2 unités de rangs différents : la plus forte devient la plus faible.',
      params: { units: 2 },
    },
    minion: { name: 'Hommes de main clowns', description: 'En bande de 3, protégés par des ballons qui absorbent 2 coups.', params: { speedMul: 1.1, hpMul: 0.7, shieldHits: 2, packSize: 3 } },
    arenaMapId: 'arene-joker',
  },
  {
    id: 'luthor', name: 'Lex Luthor',
    power: {
      name: 'Rayon de kryptonite', interval: 6,
      description: 'L’unité de plus haut rang perd 50 % de ses dégâts pendant 6 s. Armure de guerre : Luthor ignore 30 % des dégâts.',
      params: { units: 1, weaken: 0.5, duration: 6, highest: 1, bossArmor: 0.3 },
    },
    minion: { name: 'Robots LexCorp', description: 'Lents et blindés (armure 40 %).', params: { speedMul: 0.8, hpMul: 1.4, armor: 0.4, packSize: 1 } },
    arenaMapId: 'arene-luthor',
  },
  {
    id: 'bane', name: 'Bane',
    power: {
      name: 'Brise-échine', interval: 6,
      description: 'L’unité de plus haut rang perd 2 rangs. Une fois, à 50 % de PV, Venin : Bane se soigne de 15 % et accélère de 30 %.',
      params: { rankLoss: 2, minRank: 2, venomThreshold: 0.5, venomHeal: 0.15, venomSpeedMul: 1.3 },
    },
    minion: { name: 'Mercenaires', description: 'Résistants et protégés (armure 20 %), en duo.', params: { speedMul: 1, hpMul: 1.5, armor: 0.2, packSize: 2 } },
    arenaMapId: 'arene-bane',
  },
  {
    id: 'sinestro', name: 'Sinestro',
    power: {
      name: 'Cage de la peur', interval: 6,
      description: 'Une construction jaune emprisonne une colonne entière d’unités pendant 3 s.',
      params: { duration: 3 },
    },
    minion: { name: 'Corps Sinestro', description: 'Ils volent en duo, protégés par un bouclier jaune (1 coup).', params: { speedMul: 1.3, hpMul: 0.8, flying: 1, shieldHits: 1, packSize: 2 } },
    arenaMapId: 'arene-sinestro',
  },
  {
    id: 'blackadam', name: 'Black Adam',
    power: {
      name: 'Foudre de Kahndaq', interval: 6,
      description: 'La foudre frappe une unité (étourdie 3 s) et rebondit sur ses voisines (étourdies 1,5 s).',
      params: { duration: 3, chainDuration: 1.5 },
    },
    minion: { name: 'Soldats de Kahndaq', description: 'Rapides, en duo, avec un bouclier (1 coup).', params: { speedMul: 1.2, hpMul: 1.1, shieldHits: 1, packSize: 2 } },
    arenaMapId: 'arene-blackadam',
  },
  {
    id: 'darkseid', name: 'Darkseid',
    power: {
      name: 'Puissance d’Apokolips', interval: 8,
      description: 'Toutes les 8 s, en alternance : Rayons Oméga (2 unités perdent 1 rang et sont étourdies 2 s) ou Boom Tube (4 Parademons surgissent près de lui). À 30 % de PV, une fois, Équation d’Anti-Vie : 3 unités perdent 1 rang et tout le plateau est hypnotisé 2 s.',
      params: {
        hpMul: 2,
        omegaUnits: 2, omegaRankLoss: 1, omegaStun: 2,  // Rayons Oméga
        boomTubeCount: 4,                               // Boom Tube : Parademons appelés
        antiLifeThreshold: 0.3, antiLifeUnits: 3, antiLifeRankLoss: 1, antiLifeDuration: 2, antiLifeDelay: 1,
      },
    },
    minion: { name: 'Parademons', description: 'Ils volent très vite, en meute de 3.', params: { speedMul: 1.8, hpMul: 0.6, flying: 1, packSize: 3 } },
    arenaMapId: 'arene-darkseid',
  },
];

export const BOSSES: Record<BossId, BossDef> = Object.fromEntries(BOSS_LIST.map((b) => [b.id, b])) as Record<BossId, BossDef>;

/**
 * Gros boss en rotation, par option de rotation des modes infinis (§4.4 et extension DC).
 * Thanos et Darkseid, boss finaux, sont hors rotation.
 */
export const BOSS_POOLS: Record<BossPool, BossId[]> = {
  'marvel-disney': ['jafar', 'cruella', 'ursula', 'malefique', 'galactus', 'bouffon'],
  dc: ['joker', 'luthor', 'bane', 'sinestro', 'blackadam'],
  tous: ['jafar', 'cruella', 'ursula', 'malefique', 'galactus', 'bouffon', 'joker', 'luthor', 'bane', 'sinestro', 'blackadam'],
};

/** Rotation par défaut (« Tous les univers ») : les 11 gros boss. */
export const ROTATING_BOSSES: BossId[] = BOSS_POOLS.tous;

/** Boss finaux, hors rotation : Thanos (Marvel) et Darkseid (DC). */
export const FINAL_BOSSES: BossId[] = ['thanos', 'darkseid'];

/** Libellés des options de rotation (écran Infini). */
export const BOSS_POOL_LABELS: Record<BossPool, string> = {
  tous: 'Tous les univers',
  'marvel-disney': 'Marvel et Disney',
  dc: 'DC seul',
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
  // ───────────── Extension DC Comics ─────────────
  joker: { name: 'Clown géant', power: { name: 'Rire du Joker', description: 'Échange les rangs de 2 unités qui ont au plus 2 rangs d’écart.', interval: 10, params: { units: 2, maxRankGap: 2 } } },
  luthor: { name: 'Robot LexCorp géant', power: { name: 'Rayon de kryptonite', description: 'Une unité au hasard perd 30 % de ses dégâts pendant 4 s.', interval: 10, params: { units: 1, weaken: 0.3, duration: 4 } } },
  bane: { name: 'Mercenaire géant', power: { name: 'Brise-échine', description: 'L’unité de plus haut rang perd 1 rang, si elle est au moins au rang 4.', interval: 10, params: { rankLoss: 1, minRank: 4 } } },
  sinestro: { name: 'Soldat Sinestro géant', power: { name: 'Cage de la peur', description: 'Emprisonne 2 unités d’une même colonne pendant 2 s.', interval: 10, params: { units: 2, duration: 2 } } },
  blackadam: { name: 'Soldat de Kahndaq géant', power: { name: 'Foudre de Kahndaq', description: 'La foudre étourdit 1 unité pendant 2 s, sans rebond.', interval: 10, params: { duration: 2, chainDuration: 0 } } },
  darkseid: {
    name: 'Parademon géant',
    power: {
      name: 'Puissance d’Apokolips', description: 'En alternance : Rayon Oméga (1 unité étourdie 2 s) ou Boom Tube (2 Parademons).', interval: 10,
      params: { omegaUnits: 1, omegaRankLoss: 0, omegaStun: 2, boomTubeCount: 2 },
    },
  },
};

/** Statistiques communes des boss. */
export const BOSS_STATS = {
  /** Mini-boss (lieutenant) : PV ×5 d'un monstre commun de la vague (Rush Royale, page Monsters). */
  smallHpMul: 5,
  scriptedMiniHpMul: 8, // script.miniBoss (campagne, niveaux 5) : PV ×8 (valeur Marvel Rush)
  /** Mini-boss : « un peu plus lent » qu'un monstre commun (Rush Royale ; ×0,8 comme le gros monstre). */
  smallSpeedMul: 0.8,
  /** Mini-boss : mana ×5 d'un monstre commun (Rush Royale). */
  smallMana: 5,
  hpMul: 25,          // gros boss : PV = 25 × PV d'un ennemi normal de la vague (valeur Marvel Rush)
  speed: 0.5,         // gros boss : cases par seconde (un normal va à 2 ; valeur Marvel Rush)
  rageAfter: 45,      // secondes avant la rage
  rageSpeedMul: 2,
  mana: 100,
  /** Vies retirées à la porte par un boss ou un mini-boss (Rush Royale : 2, contre 1 pour un monstre commun). */
  gateLives: 2,
};

/**
 * Coop (§5.2) : un boss (ou mini-boss) par branche, chacun du côté de son joueur ; il fait tout le chemin (sa
 * branche puis le tronc commun) et ses pouvoirs visent le plateau de son côté. PV de chaque boss = part `hpShare`
 * des PV d'un boss Solo de la même vague ; plus lents qu'en Solo pour laisser une vraie fenêtre de tir.
 */
export const COOP_BOSS = {
  hpShare: 0.65,
  /** Coop Niveaux, boss imposé du niveau (script.endOnBossKill) : part des PV de chaque boss (les deux à abattre). */
  levelHpShare: 1.4,
  /** Gros boss : cases par seconde (Solo : 0,5). */
  speed: 0.35,
  /** Mini-boss : × vitesse d'un monstre commun (Solo : 0,8). */
  smallSpeedMul: 0.7,
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

/** Noms des événements bossPower de Darkseid. L'Équation d'Anti-Vie est émise deux fois, comme le Claquement. */
export const OMEGA_NAME = 'Rayons Oméga';
export const BOOM_TUBE_NAME = 'Boom Tube';
export const ANTI_LIFE_NAME = 'Équation d’Anti-Vie';
/** Nom de l'événement bossPower du Venin de Bane (sans case). */
export const VENOM_NAME = 'Venin';

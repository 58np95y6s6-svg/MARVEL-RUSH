// Contrat partagé : interface entre le moteur (simulation pure) et le reste du jeu
// (rendu, réseau, tutoriel, campagne). Le moteur ne touche jamais au DOM.
// Toute modification passe par le chef de projet (voir docs/journal.md).

import type { BossId, BossPool, EnemyKind, UnitId } from '../data/types';

export const TICKS_PER_SECOND = 20;
export const GRID_COLS = 5;
export const GRID_ROWS = 3;
export const GRID_SIZE = GRID_COLS * GRID_ROWS; // 15 cases, index = row * GRID_COLS + col
export const MAX_RANK = 7;

/** Pas de Duel (choix du joueur) : Solo, Coop à deux (niveaux ou infini) et tutoriel. */
export type GameMode = 'solo' | 'coop' | 'tutoriel';
export type PlayerId = 'p1' | 'p2';
/**
 * Branche du chemin où se trouve un ennemi.
 * Solo : 'a' seulement. Coop : 'a' longe le plateau de p1, 'b' celui de p2, puis les deux
 * branches se rejoignent dans le tronc commun 'tronc' qui mène au château.
 */
export type LaneId = 'a' | 'b' | 'tronc';

export interface PlayerSetup {
  id: PlayerId;
  deck: UnitId[];                          // 5 unités différentes
  levels: Partial<Record<UnitId, number>>; // niveau de collection 1..10
  talents: Partial<Record<UnitId, ('a' | 'b')[]>>; // choix par palier
  /** Éveil 0..10 par unité (§6.6) : attaque +6 % et vitesse d'attaque +4 % par étoile, passifs à ★2/4/6/8/10. */
  awakening?: Partial<Record<UnitId, number>>;
}

export interface GameConfig {
  mode: GameMode;
  seed: number;
  mapId: string;
  players: PlayerSetup[];                 // 1 joueur (solo, tutoriel) ou 2
  /** Niveaux (Solo ou Coop) : nombre de vagues à tenir pour gagner. Absent = mode infini. */
  targetWaves?: number;
  /**
   * Rythme des boss : petit boss toutes les 5 vagues, gros boss toutes les 10, Thanos à la 50 (§4.3)
   * et, avec l'extension DC, Darkseid à la 100 (modes infinis ; `darkseid` absent = 100, 0 = jamais).
   */
  bossRhythm?: { small: number; big: number; thanos: number; darkseid?: number };
  /**
   * Rotation des gros boss en mode infini (extension DC) : 'tous' (par défaut, 11 boss ; Thanos aux
   * vagues 50, 150… et Darkseid aux vagues 100, 200…), 'marvel-disney' (6 boss, Thanos à chaque palier
   * final, pas de Darkseid) ou 'dc' (5 boss, Darkseid à chaque palier final, pas de Thanos).
   */
  bossPool?: BossPool;
  /** Compte à rebours avant la 1re vague (s) : on peut déjà invoquer et fusionner. Absent = 0. */
  prepTime?: number;
  /** Modificateurs de map actifs (§7 bis), lus par le moteur. */
  mapModifiers?: Record<string, number>;
  /** Tutoriel et niveaux scénarisés : invocations imposées, ennemis affaiblis, etc. */
  script?: {
    forcedSummons?: UnitId[];   // les N premières invocations donnent ces unités, dans l'ordre
    enemyHpMultiplier?: number;
    startMana?: number;
    noLifeLoss?: boolean;
    bossAtWave?: number;
    bossId?: BossId;
    /** Campagne, niveaux 5 : un sbire géant du boss du chapitre (PV ×8, taille ×2) remplace le boss. */
    miniBoss?: BossId;
    /** Ordre imposé des gros boss (campagne). Absent = rotation aléatoire sans répétition. */
    bossOrder?: BossId[];
    /** Gros boss exclus de la rotation (ex. Thanos hors des premiers chapitres). */
    excludeBosses?: BossId[];
    /** Niveaux de boss : la partie est gagnée dès que le boss imposé est vaincu. */
    endOnBossKill?: boolean;
    paused?: boolean;           // le tutoriel peut figer la simulation
  };
}

export interface UnitInstance {
  uid: number;
  unit: UnitId;
  rank: number;               // 1..MAX_RANK
  cooldown: number;           // secondes avant la prochaine attaque
  status: {
    stunnedFor?: number; sleepingFor?: number; hypnotizedFor?: number; transformedInto?: UnitId; transformFor?: number;
    /** Archétype Copieur : l'unité est la copie d'une autre (multiplicateur de dégâts, ex. 0.75) faite par `copyOf`. */
    copyMul?: number;
    copyOf?: UnitId;
  };
  counters: Record<string, number>; // compteurs propres aux compétences (coups, cumuls…)
}

export interface PlayerState {
  id: PlayerId;
  mana: number;
  summonCost: number;
  grid: (UnitInstance | null)[];             // longueur GRID_SIZE
  powerUps: Partial<Record<UnitId, number>>; // amélioration en partie 0..5
  deck: UnitId[];
  giftUsedThisWave: boolean;
  /** Rendement du mana (« Mana + ») : 0..5, +20 % de mana par élimination et par vague à chaque niveau. */
  manaLevel?: number;
}

export interface EnemyInstance {
  uid: number;
  kind: EnemyKind;
  lane: LaneId;
  distance: number;           // distance parcourue sur le chemin, en cases
  speed: number;              // cases par seconde
  hp: number;
  maxHp: number;
  armor: number;              // 0..1
  shieldHits: number;
  effects: { slow?: number; slowFor?: number; stunFor?: number; burn?: number; burnFor?: number; marked?: number; markedFor?: number; armorBreak?: number };
  bossId?: BossId;            // présent si c'est un boss
  minionOf?: BossId;          // présent si c'est un sbire
  giant?: boolean;            // lieutenant ou sbire géant : dessiné en taille ×2
}

export interface LaneState {
  id: LaneId;
  length: number;             // longueur de la branche, en cases (fournie par la map)
}

export type GamePhase = 'vague' | 'boss' | 'pause' | 'fin';

export interface EngineState {
  tick: number;
  time: number;               // secondes écoulées
  wave: number;               // commence à 1
  waveTimeLeft: number;
  phase: GamePhase;
  players: PlayerState[];
  lanes: LaneState[];
  lives: number;              // vies (partagées en Coop)
  enemies: EnemyInstance[];
  /** Prochain gros boss et nombre de vagues avant lui (bandeau « 1 vague avant le boss X »). */
  upcomingBoss?: { boss: BossId; inWaves: number };
  bossRageIn?: number;        // secondes avant la rage du boss en cours
  /** Compte à rebours de début de partie (s) ; absent ou 0 = la partie a commencé. */
  countdown?: number;
  result?: { outcome: 'victoire' | 'defaite'; winner?: PlayerId; wave: number };
}

export type Command =
  | { type: 'summon'; player: PlayerId }
  | { type: 'merge'; player: PlayerId; from: number; to: number }
  /** Archétype Copieur (ex. Loki) : l'unité `from` devient une copie de l'alliée `to` de même rang. */
  | { type: 'copy'; player: PlayerId; from: number; to: number }
  /** Archétype Booster de fusion (ex. Coco) : l'unité `from` disparaît, l'alliée `to` (même rang) gagne 1 rang. */
  | { type: 'promote'; player: PlayerId; from: number; to: number }
  /** Archétype Échangeur (ex. Vanellope) : l'unité `from` et l'alliée `to` (même rang) échangent leurs cases. */
  | { type: 'swap'; player: PlayerId; from: number; to: number }
  | { type: 'powerup'; player: PlayerId; unit: UnitId }
  /** Rendement du mana : +1 niveau (coûts MANA_UPGRADE_COSTS). */
  | { type: 'manaUpgrade'; player: PlayerId }
  | { type: 'gift'; player: PlayerId; slot: number }
  | { type: 'pause'; paused: boolean };

export type EngineEvent =
  | { type: 'waveStart'; wave: number }
  | { type: 'summon'; player: PlayerId; slot: number; unit: UnitId; rank: number }
  | { type: 'merge'; player: PlayerId; from: number; to: number; unit: UnitId; rank: number }
  | { type: 'copy'; player: PlayerId; from: number; to: number; unit: UnitId; rank: number }
  | { type: 'promote'; player: PlayerId; from: number; to: number; unit: UnitId; rank: number }
  | { type: 'swap'; player: PlayerId; from: number; to: number; unit: UnitId; rank: number }
  /**
   * Mana gagné hors élimination ordinaire : archétypes (sacrifice, copie, échange) ou victoire sur un boss.
   * `slot` = case d'où part le gain (-1 pour un boss : `enemy` = boss vaincu).
   */
  | { type: 'mana'; player: PlayerId; slot: number; amount: number; reason: 'sacrifice' | 'copie' | 'echange' | 'promotion' | 'boss'; enemy?: number }
  | { type: 'powerup'; player: PlayerId; unit: UnitId; level: number }
  | { type: 'manaUpgrade'; player: PlayerId; level: number }
  | { type: 'attack'; player: PlayerId; slot: number; unit: UnitId; targets: number[]; fx: string }
  | { type: 'hit'; enemy: number; damage: number; crit: boolean }
  | { type: 'ability'; player: PlayerId; slot: number; unit: UnitId; name: string; targets: number[] }
  | { type: 'kill'; enemy: number; player: PlayerId; mana: number }
  | { type: 'enemySpawn'; enemy: number; kind: EnemyKind; lane: LaneId }
  | { type: 'bossSpawn'; enemy: number; boss: BossId; lane: LaneId }
  | { type: 'bossPower'; boss: BossId; player: PlayerId; slots: number[]; name: string }
  | { type: 'bossRage'; boss: BossId }
  | { type: 'lifeLost'; lives: number }
  | { type: 'miniBossSpawn'; enemy: number; boss: BossId }
  /** Palier franchi (tous les 10, plus les paliers de src/data/milestones.ts comme la 75) ; `chest` : coffre du palier s'il y en a un. */
  | { type: 'milestone'; wave: number; chest?: string }
  | { type: 'gift'; from: PlayerId; to: PlayerId; slot: number; unit: UnitId; rank: number }
  | { type: 'rejected'; command: Command['type']; reason: string }
  | { type: 'gameOver'; outcome: 'victoire' | 'defaite'; winner?: PlayerId; wave: number };

export interface Engine {
  readonly config: GameConfig;
  readonly state: EngineState;
  /** Avance la simulation d'un tick (1 / TICKS_PER_SECOND s). */
  tick(): void;
  /** Applique une commande au prochain tick. Les commandes invalides produisent un événement 'rejected'. */
  apply(command: Command): void;
  /** Renvoie et vide les événements produits depuis le dernier appel. */
  drainEvents(): EngineEvent[];
  /** Sérialise l'état complet (sauvegarde à chaque vague, instantané réseau, reprise). */
  serialize(): string;
}

/** Implémentée dans src/engine/index.ts par l'agent moteur. */
export type CreateEngine = (config: GameConfig, saved?: string) => Engine;

// Contrat partagé : interface entre le moteur (simulation pure) et le reste du jeu
// (rendu, réseau, tutoriel, campagne). Le moteur ne touche jamais au DOM.
// Toute modification passe par le chef de projet (voir docs/journal.md).

import type { BossId, EnemyKind, UnitId } from '../data/types';

export const TICKS_PER_SECOND = 20;
export const GRID_COLS = 5;
export const GRID_ROWS = 3;
export const GRID_SIZE = GRID_COLS * GRID_ROWS; // 15 cases, index = row * GRID_COLS + col
export const MAX_RANK = 7;

export type GameMode = 'solo' | 'coop' | 'duel' | 'tutoriel';
export type PlayerId = 'p1' | 'p2';
/** Un chemin d'ennemis. Solo et coop : un seul ('a'). Duel : un par joueur ('a' pour p1, 'b' pour p2). */
export type LaneId = 'a' | 'b';

export interface PlayerSetup {
  id: PlayerId;
  deck: UnitId[];                          // 5 unités différentes
  levels: Partial<Record<UnitId, number>>; // niveau de collection 1..10
  talents: Partial<Record<UnitId, ('a' | 'b')[]>>; // choix par palier
}

export interface GameConfig {
  mode: GameMode;
  seed: number;
  mapId: string;
  players: PlayerSetup[];                 // 1 joueur (solo, tutoriel) ou 2
  /** Campagne : nombre de vagues à tenir pour gagner. Absent = survie infinie / duel. */
  targetWaves?: number;
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
    paused?: boolean;           // le tutoriel peut figer la simulation
  };
}

export interface UnitInstance {
  uid: number;
  unit: UnitId;
  rank: number;               // 1..MAX_RANK
  cooldown: number;           // secondes avant la prochaine attaque
  status: { stunnedFor?: number; sleepingFor?: number; hypnotizedFor?: number; transformedInto?: UnitId; transformFor?: number };
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
}

export interface LaneState {
  id: LaneId;
  length: number;             // longueur du chemin, en cases (fournie par la map)
  lives: number;
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
  enemies: EnemyInstance[];
  bossRageIn?: number;        // secondes avant la rage du boss en cours
  result?: { outcome: 'victoire' | 'defaite'; winner?: PlayerId; wave: number };
}

export type Command =
  | { type: 'summon'; player: PlayerId }
  | { type: 'merge'; player: PlayerId; from: number; to: number }
  | { type: 'powerup'; player: PlayerId; unit: UnitId }
  | { type: 'gift'; player: PlayerId; slot: number }
  | { type: 'pause'; paused: boolean };

export type EngineEvent =
  | { type: 'waveStart'; wave: number }
  | { type: 'summon'; player: PlayerId; slot: number; unit: UnitId; rank: number }
  | { type: 'merge'; player: PlayerId; from: number; to: number; unit: UnitId; rank: number }
  | { type: 'powerup'; player: PlayerId; unit: UnitId; level: number }
  | { type: 'attack'; player: PlayerId; slot: number; unit: UnitId; targets: number[]; fx: string }
  | { type: 'hit'; enemy: number; damage: number; crit: boolean }
  | { type: 'ability'; player: PlayerId; slot: number; unit: UnitId; name: string; targets: number[] }
  | { type: 'kill'; enemy: number; player: PlayerId; mana: number }
  | { type: 'enemySpawn'; enemy: number; kind: EnemyKind; lane: LaneId }
  | { type: 'bossSpawn'; enemy: number; boss: BossId; lane: LaneId }
  | { type: 'bossPower'; boss: BossId; player: PlayerId; slots: number[]; name: string }
  | { type: 'bossRage'; boss: BossId }
  | { type: 'lifeLost'; lane: LaneId; lives: number }
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

// Types internes du moteur : ils prolongent les types du contrat (src/engine/types.ts)
// avec les champs dont la simulation a besoin. Tout est sérialisable en JSON.

import type { BossId, TeamBonusDef, UnitId } from '../data/types';
import type {
  Command, EngineEvent, EngineState, EnemyInstance, GameConfig, LaneId, PlayerState, UnitInstance,
} from './types';
import { mulberry32 } from './rng';

export const DT = 0.05; // 1 / TICKS_PER_SECOND
export const EPS = 1e-9;
export const START_MANA = 100;
export const SUMMON_COST_START = 10;
export const SUMMON_COST_STEP = 10;
export const POWERUP_COSTS = [100, 200, 400, 700]; // passer au niveau 2, 3, 4, 5
export const POWERUP_MAX = 5;
export const POWERUP_DAMAGE = 0.15;
export const LEVEL_DAMAGE = 0.1;
export const DEFAULT_PATH_LENGTH = 30;
export const DEFAULT_COOP_LENGTHS = { a: 18, b: 18, tronc: 14 };
export const START_LIVES = 3;

export type SimUnit = UnitInstance;

export interface EnemyExtra {
  gone?: number;          // retiré du chemin (tué, arrivé, absorbé par le boss)
  flying?: number;        // insensible aux ralentissements et déplacements forcés
  webStacks?: number;
  burnBy?: number;        // index du joueur qui a posé la brûlure
  bleed?: number; bleedFor?: number; bleedBy?: number;
  poison?: number; poisonFor?: number; poisonBy?: number;
  knockFor?: number;      // recule (illusion de Loki)
  arrivalStun?: number; arrivalStunUnits?: number;
  // Boss
  powerIn?: number;
  rageIn?: number;
  enraged?: number;
  snapped?: number;
  snapIn?: number;
  owner?: number;         // index du joueur dont le plateau borde la branche (Coop)
  from?: 'a' | 'b';       // branche d'origine (Coop), pour revenir en arrière depuis le tronc
  lieutenant?: number;    // petit boss : sbire géant du prochain gros boss
  mini?: number;          // petit boss (sbire géant) : compte comme un boss pour les vies, la rage et la fin de vague
  master?: BossId;        // petit boss : boss dont il utilise une version affaiblie du pouvoir
}

export interface SimEnemy extends EnemyInstance {
  x: EnemyExtra;
  /** Sbire géant (script.miniBoss) : le rendu le dessine en taille ×2. */
  giant?: boolean;
}

export interface LostUnit {
  slot: number;
  uid: number;
  unit: UnitId;
  rank: number;           // rang avant la perte
  destroyed: boolean;     // détruite (sinon rétrogradée)
}

export interface SimPlayer extends PlayerState {
  grid: (SimUnit | null)[];
  summons: number;        // nombre d'invocations (pour script.forcedSummons)
  extraRestores: number;  // résurrections bonus de la map (Royaume des morts)
}

export interface SimState extends EngineState {
  players: SimPlayer[];
  enemies: SimEnemy[];
  rng: number;
  spawnRng: number;
  nextUid: number;
  spawnTimer: number;
  spawnCount: number;
  waveElapsed: number;
  pendingBoss: BossId | null;
  bossOrder: BossId[];
  bossIdx: number;
  paused: boolean;
  prevPhase: EngineState['phase'];
  awaitingVictory: boolean;
  queue: Command[];
}

/** Bonus d'équipe agrégés pour une unité. */
export interface TeamAgg {
  damage: number;
  attackSpeed: number;
  critChance: number;
  critMul: number;
  cooldownReduction: number;
  controlDuration: number;
  doubleAttackChance: number;
}

export interface PlayerInfo {
  idx: number;
  teams: TeamBonusDef[];
  team: Partial<Record<UnitId, TeamAgg>>;
  markSlow: number;
  chainIllusionChance: number;
  illusionDuration: number;
  manaPerWave: number;
  params: Partial<Record<UnitId, Record<string, number>>>;
  levels: Partial<Record<UnitId, number>>;
  awakening: Partial<Record<UnitId, number>>;
  talents: Partial<Record<UnitId, ('a' | 'b')[]>>;
}

export interface Ctx {
  cfg: GameConfig;
  st: SimState;
  ev: EngineEvent[];
  laneLen: Record<LaneId, number>;
  coop: boolean;
  mods: Record<string, number>;
  info: PlayerInfo[];
}

export const NO_TEAM: TeamAgg = {
  damage: 0, attackSpeed: 0, critChance: 0, critMul: 2, cooldownReduction: 0, controlDuration: 0, doubleAttackChance: 0,
};

// ───────────── Aléatoire ─────────────

export function rand(ctx: Ctx): number {
  const [v, s] = mulberry32(ctx.st.rng);
  ctx.st.rng = s;
  return v;
}

export function spawnRand(ctx: Ctx): number {
  const [v, s] = mulberry32(ctx.st.spawnRng);
  ctx.st.spawnRng = s;
  return v;
}

export function randInt(ctx: Ctx, n: number): number {
  return Math.min(n - 1, Math.floor(rand(ctx) * n));
}

export function pick<T>(ctx: Ctx, arr: readonly T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[randInt(ctx, arr.length)];
}

/** Tire k éléments distincts (ordre aléatoire). */
export function pickMany<T>(ctx: Ctx, arr: readonly T[], k: number): T[] {
  const pool = arr.slice();
  const out: T[] = [];
  while (out.length < k && pool.length > 0) {
    const i = randInt(ctx, pool.length);
    out.push(pool[i] as T);
    pool.splice(i, 1);
  }
  return out;
}

export function emit(ctx: Ctx, e: EngineEvent): void {
  ctx.ev.push(e);
}

export function newUid(ctx: Ctx): number {
  return ctx.st.nextUid++;
}

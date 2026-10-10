// Outils de mise en scène pour les tests, le tutoriel et les pages de développement :
// poser une unité ou un ennemi précis, figer les apparitions. Ne pas utiliser en partie normale.

import type { BossId, EnemyKind, UnitId } from '../data/types';
import { BOSS_STATS } from '../data/bosses';
import type { Engine, LaneId } from './types';
import type { Ctx, SimEnemy, SimState, SimUnit } from './internal';
import { initUnitCounters } from './abilities';

function ctxOf(engine: Engine): Ctx {
  const ctx = (engine as Engine & { _ctx?: Ctx })._ctx;
  if (!ctx) throw new Error('Moteur inconnu.');
  return ctx;
}

export function simState(engine: Engine): SimState {
  return ctxOf(engine).st;
}

/** Pose une unité sur une case (remplace ce qui s'y trouve). */
export function debugPlace(engine: Engine, player: number, slot: number, unit: UnitId, rank = 1): SimUnit {
  const ctx = ctxOf(engine);
  const u: SimUnit = { uid: ctx.st.nextUid++, unit, rank, cooldown: 0, status: {}, counters: {} };
  initUnitCounters(ctx, player, u);
  ctx.st.players[player]!.grid[slot] = u;
  return u;
}

export interface DebugEnemy {
  kind?: EnemyKind;
  hp?: number;
  lane?: LaneId;
  distance?: number;
  speed?: number;
  armor?: number;
  shieldHits?: number;
  bossId?: BossId;
  /** Petit boss (lieutenant) de ce boss. */
  lieutenantOf?: BossId;
  minionOf?: BossId;
  flying?: boolean;
}

/** Ajoute un ennemi sur le chemin. Les boss ont leur pouvoir prêt au prochain tick. */
export function debugSpawn(engine: Engine, d: DebugEnemy = {}): SimEnemy {
  const ctx = ctxOf(engine);
  const hp = d.hp ?? 100;
  const e: SimEnemy = {
    uid: ctx.st.nextUid++, kind: d.kind ?? (d.minionOf || d.lieutenantOf ? 'sbire' : 'normal'), lane: d.lane ?? 'a',
    distance: d.distance ?? 0, speed: d.speed ?? 0, hp, maxHp: hp, armor: d.armor ?? 0, shieldHits: d.shieldHits ?? 0,
    effects: {}, x: {},
  };
  if (d.flying) e.x.flying = 1;
  if (d.minionOf) e.minionOf = d.minionOf;
  if (d.bossId) {
    e.bossId = d.bossId;
    e.x.powerIn = 0.05;
    e.x.rageIn = BOSS_STATS.rageAfter;
  }
  if (d.lieutenantOf) {
    e.minionOf = d.lieutenantOf;
    e.giant = true;
    e.x.mini = 1;
    e.x.master = d.lieutenantOf;
    e.x.lieutenant = 1;
    e.x.powerIn = 0.05;
    e.x.rageIn = BOSS_STATS.rageAfter;
  }
  ctx.st.enemies.push(e);
  return e;
}

/** Fige les apparitions et le minuteur de vague (les ennemis posés à la main restent seuls). */
export function debugQuiet(engine: Engine): void {
  const st = ctxOf(engine).st;
  st.waveTimeLeft = 1e6;
  st.spawnTimer = 1e6;
  st.enemies = [];
}

/** Impose la Pierre du prochain Gant de l'infini ('puissance', 'espace', 'realite', 'ame', 'temps', 'esprit'). */
export function debugStone(engine: Engine, stone: string | undefined): void {
  ctxOf(engine).debugStone = stone;
}

/** Ignore les portées d'attaque (tests isolés des compétences). */
export function debugNoRange(engine: Engine, on = true): void {
  ctxOf(engine).debugNoRange = on;
}

/** Avance de n secondes. */
export function runSeconds(engine: Engine, seconds: number): void {
  const n = Math.round(seconds * 20);
  for (let i = 0; i < n; i++) engine.tick();
}

/** Tests : retire la chance de critique par défaut (5 %, Rush Royale) pour des dégâts exacts. */
export function debugNoCrit(engine: Engine, on = true): void {
  ctxOf(engine).debugNoCrit = on;
}

import { createEngine } from '../../src/engine';
import { debugQuiet, simState } from '../../src/engine/debug';
import type { Engine, EngineEvent, GameConfig, PlayerSetup } from '../../src/engine/types';
import type { UnitId } from '../../src/data/types';

export const MARVEL: UnitId[] = ['spiderman', 'hawkeye', 'falcon', 'cmarvel', 'widow'];

export function setup(deck: UnitId[] = MARVEL, extra: Partial<PlayerSetup> = {}, id: 'p1' | 'p2' = 'p1'): PlayerSetup {
  return { id, deck, levels: {}, talents: {}, ...extra };
}

export function solo(deck: UnitId[] = MARVEL, cfg: Partial<GameConfig> = {}, extra: Partial<PlayerSetup> = {}): Engine {
  return createEngine({ mode: 'solo', seed: 7, mapId: 'test', players: [setup(deck, extra)], ...cfg });
}

export function coop(cfg: Partial<GameConfig> = {}, d1: UnitId[] = MARVEL, d2: UnitId[] = MARVEL): Engine {
  return createEngine({ mode: 'coop', seed: 7, mapId: 'test', players: [setup(d1), setup(d2, {}, 'p2')], ...cfg });
}

/** Moteur figé : aucun ennemi n'apparaît, le minuteur de vague ne tourne pas. */
export function quiet(deck: UnitId[] = MARVEL, cfg: Partial<GameConfig> = {}, extra: Partial<PlayerSetup> = {}): Engine {
  const e = cfg.mode === 'coop' ? coop(cfg, deck, deck) : solo(deck, cfg, extra);
  debugQuiet(e);
  e.drainEvents();
  return e;
}

export function step(e: Engine, n = 1): EngineEvent[] {
  const out: EngineEvent[] = [];
  for (let i = 0; i < n; i++) {
    e.tick();
    out.push(...e.drainEvents());
  }
  return out;
}

export function ofType<T extends EngineEvent['type']>(ev: EngineEvent[], t: T): Extract<EngineEvent, { type: T }>[] {
  return ev.filter((x): x is Extract<EngineEvent, { type: T }> => x.type === t);
}

export { simState };

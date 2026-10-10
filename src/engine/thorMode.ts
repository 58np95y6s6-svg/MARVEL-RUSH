// Lecture seule, pour le rendu : état visuel de l'Inquisiteur (Thor) sur une case du plateau.
// Reprend exactement la règle de `unitActive` (combat.ts) à partir de l'état public du moteur,
// sans rien modifier ni allouer à chaque appel (paramètres résolus mis en cache par configuration).
import { UNITS } from '../data/units';
import type { UnitId } from '../data/types';
import { ACTIVE_COUNTS } from './combat';
import { EPS } from './internal';
import { resolveUnitParams } from './talents';
import type { EngineState, GameConfig, UnitInstance } from './types';

export type ThorKnight = 'lumiere' | 'tenebres' | null;

export interface ThorMode {
  /** Mode actif : 1, 3, 5 ou 7 exemplaires, ou forcé par un talent. */
  active: boolean;
  /** Forme de chevalier (talent de palier 1) : tous les Thor en lumière, le seul Chevalier des ténèbres en ténèbres. */
  knight: ThorKnight;
}

const cache = new WeakMap<GameConfig, Map<string, Record<string, number>>>();

function paramsOf(config: GameConfig, player: number, unit: UnitId): Record<string, number> {
  let m = cache.get(config);
  if (!m) { m = new Map(); cache.set(config, m); }
  const key = player + ':' + unit;
  let p = m.get(key);
  if (!p) {
    const ps = config.players[player];
    p = resolveUnitParams(unit, UNITS[unit].ability.params, ps?.levels[unit] ?? 1, ps?.talents[unit], ps?.awakening?.[unit] ?? 0);
    m.set(key, p);
  }
  return p;
}

const idOf = (u: UnitInstance): UnitId => u.status.transformedInto ?? u.unit;

/**
 * Mode de l'Inquisiteur sur la case `slot` du joueur d'indice `player`, ou `null` si la case ne porte
 * pas d'Inquisiteur. `out` évite toute allocation quand on l'appelle à chaque image.
 */
export function thorMode(state: EngineState, config: GameConfig, player: number, slot: number, out: ThorMode = { active: false, knight: null }): ThorMode | null {
  const grid = state.players[player]?.grid;
  const u = grid?.[slot];
  if (!grid || !u) return null;
  const id = idOf(u);
  const prm = paramsOf(config, player, id);
  if (!prm['activeCounts']) return null;
  let n = 0;
  for (const x of grid) if (x && idOf(x) === id) n++;
  const dark = (u.counters['dark'] ?? 0) > 0;
  out.active = dark || (u.counters['activeFor'] ?? 0) > EPS || ACTIVE_COUNTS.includes(n);
  out.knight = prm['darkKnight'] ? (dark ? 'tenebres' : null) : prm['mergeActiveDuration'] ? 'lumiere' : null;
  return out;
}

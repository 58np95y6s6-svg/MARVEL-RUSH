// Point d'entrée du moteur de simulation (contrat : src/engine/types.ts).
export { createEngine, bossWaveKind, type BossWaveKind } from './engine';
export { registerMaps, MAP_MODIFIER_KEYS, type MapLengths } from './maps';
export { setTalentCatalog, setAwakeningCatalog, resolveUnitParams } from './talents';
export { mulberry32 } from './rng';
export * from './types';
export * as debug from './debug';
export { RANK_ATTACK_SPEED, RANK_DAMAGE } from './combat';
export {
  boardGeometry, coveredSpans, rangeClass, rangeLabel, unitRange, RANGE_LONG, RANGE_MEDIUM, RANGE_SHORT,
  type BoardGeometry, type RangeClass,
} from './geometry';

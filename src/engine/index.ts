// Point d'entrée du moteur de simulation (contrat : src/engine/types.ts).
export { createEngine, bossWaveKind, finalBossAt, type BossWaveKind } from './engine';
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
export { BOSS_KILL_REWARD, dropAction, formationLength, formationPartners, growthBonus, KILL_MANA, SACRIFICE_MANA, type DropAction } from './archetypes';
export {
  MANA_UPGRADE_BONUS, MANA_UPGRADE_COSTS, MANA_UPGRADE_MAX, POWERUP_ATTACK_SPEED, POWERUP_COSTS, POWERUP_DAMAGE, POWERUP_MAX, START_MANA,
} from './internal';

// Point d'entrée du moteur de simulation (contrat : src/engine/types.ts).
export { createEngine, bossWaveKind, type BossWaveKind } from './engine';
export { registerMaps, type MapLengths } from './maps';
export { setTalentCatalog, setAwakeningCatalog, resolveUnitParams } from './talents';
export { mulberry32 } from './rng';
export * from './types';
export * as debug from './debug';

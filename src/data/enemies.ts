// Ennemis (§4.3 du prompt). Multiplicateurs appliqués à un ennemi normal de la vague.

import type { EnemyKind } from './types';

export interface EnemyKindDef {
  kind: EnemyKind;
  name: string;
  speedMul: number;
  hpMul: number;
  armor: number;       // 0..1, part des dégâts absorbée
  shieldHits: number;  // coups absorbés entièrement
  mana: number;        // mana donné au joueur qui l'élimine
}

export const ENEMIES: Record<EnemyKind, EnemyKindDef> = {
  normal: { kind: 'normal', name: 'Normal', speedMul: 1, hpMul: 1, armor: 0, shieldHits: 0, mana: 10 },
  rapide: { kind: 'rapide', name: 'Rapide', speedMul: 2, hpMul: 0.5, armor: 0, shieldHits: 0, mana: 10 },
  gros: { kind: 'gros', name: 'Gros', speedMul: 0.6, hpMul: 3, armor: 0, shieldHits: 0, mana: 30 },
  blinde: { kind: 'blinde', name: 'Blindé', speedMul: 1, hpMul: 1, armor: 0.3, shieldHits: 0, mana: 10 },
  bouclier: { kind: 'bouclier', name: 'Bouclier', speedMul: 1, hpMul: 1, armor: 0, shieldHits: 5, mana: 10 },
  // Les sbires prennent les multiplicateurs de leur boss (src/data/bosses.ts, minion.params).
  sbire: { kind: 'sbire', name: 'Sbire', speedMul: 1, hpMul: 1, armor: 0, shieldHits: 0, mana: 10 },
};

/** Règles des vagues (§4.3). */
export const WAVE_RULES = {
  duration: 30,          // secondes de vague
  baseHp: 100,           // PV d'un ennemi normal en vague 1
  hpGrowth: 1.18,        // PV = baseHp × hpGrowth^(vague-1)
  baseSpeed: 2,          // cases par seconde d'un ennemi normal
  /** Rythme des boss (§4.3), remplaçable par GameConfig.bossRhythm. */
  smallBossEvery: 5,     // petit boss (lieutenant) : vagues 5, 15, 25…
  bigBossEvery: 10,      // gros boss : vagues 10, 20, 30…
  thanosEvery: 50,       // modes infinis : Thanos à la 50, puis toutes les 50
  darkseidEvery: 100,    // extension DC, modes infinis : Darkseid à la 100, puis toutes les 100 (prioritaire sur Thanos)
  minionWavesBefore: 2,  // les sbires du prochain gros boss arrivent dans les 2 vagues d'avant
  milestoneEvery: 10,    // événement « milestone » tous les 10 vagues franchies
  /** Intervalle entre deux apparitions : max(min, start − step × (vague − 1)). */
  spawnIntervalStart: 1.8,
  spawnIntervalStep: 0.06,
  spawnIntervalMin: 0.6,
  minionEvery: 3,        // dans ces vagues, une apparition sur 3 est un groupe de sbires
};

/**
 * Composition d'une vague : poids de chaque type selon la vague.
 * Les types se débloquent progressivement, comme dans Rush Royale.
 */
export function spawnWeights(wave: number): [EnemyKind, number][] {
  const w: [EnemyKind, number][] = [['normal', 10]];
  if (wave >= 2) w.push(['rapide', 3]);
  if (wave >= 4) w.push(['gros', 2]);
  if (wave >= 5) w.push(['blinde', 2]);
  if (wave >= 7) w.push(['bouclier', 2]);
  return w;
}

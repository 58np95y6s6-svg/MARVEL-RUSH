// Ennemis et vagues : modèle de la Coop de Rush Royale (docs/rush-royale-donnees.md §2).
// Multiplicateurs appliqués à un ennemi normal de la vague.
//
// Ce que Rush Royale publie (confiance A) et que l'on reprend tel quel :
// - 10 monstres par vague ; la vague suivante commence quand le terrain est nettoyé ;
// - les PV montent à chaque nouveau monstre, et le taux de croissance augmente toutes les 10 vagues ;
// - rapide : PV ×0,5, vitesse ×2 ; gros : PV ×5, un peu plus lent, mana ×5, 2 vies à la porte ;
// - mana par élimination : +10 toutes les 10 vagues, plafonné à 50 ;
// - mini-boss toutes les 5 vagues (avec des monstres communs), boss toutes les 10 ; après la vague 60,
//   boss aux vagues paires et mini-boss aux vagues impaires.
// Rush Royale ne publie pas les PV absolus ni les taux de croissance : `baseHp`, `hpGrowth` et
// `hpGrowthStep` sont nos valeurs (confiance C), réglées au simulateur (docs/equilibrage.md).

import type { EnemyKind } from './types';

export interface EnemyKindDef {
  kind: EnemyKind;
  name: string;
  speedMul: number;
  hpMul: number;
  armor: number;       // 0..1, part des dégâts absorbée
  shieldHits: number;  // coups absorbés entièrement
  /** Mana donné au joueur qui l'élimine, en multiple du mana d'élimination de la vague (killMana). */
  mana: number;
  /** Vies retirées s'il atteint la porte (Rush Royale : 2 pour un gros). */
  lives: number;
}

export const ENEMIES: Record<EnemyKind, EnemyKindDef> = {
  normal: { kind: 'normal', name: 'Normal', speedMul: 1, hpMul: 1, armor: 0, shieldHits: 0, mana: 1, lives: 1 },
  rapide: { kind: 'rapide', name: 'Rapide', speedMul: 2, hpMul: 0.5, armor: 0, shieldHits: 0, mana: 1, lives: 1 },
  gros: { kind: 'gros', name: 'Gros', speedMul: 0.8, hpMul: 5, armor: 0, shieldHits: 0, mana: 5, lives: 2 },
  // Propres à Marvel Rush (des niveaux de campagne s'en servent) : plus rares.
  blinde: { kind: 'blinde', name: 'Blindé', speedMul: 1, hpMul: 1, armor: 0.3, shieldHits: 0, mana: 1, lives: 1 },
  bouclier: { kind: 'bouclier', name: 'Bouclier', speedMul: 1, hpMul: 1, armor: 0, shieldHits: 5, mana: 1, lives: 1 },
  // Les sbires prennent les multiplicateurs de leur boss (src/data/bosses.ts, minion.params).
  sbire: { kind: 'sbire', name: 'Sbire', speedMul: 1, hpMul: 1, armor: 0, shieldHits: 0, mana: 1, lives: 1 },
};

/** Règles des vagues. */
export const WAVE_RULES = {
  /** Rush Royale (Coop) : 10 monstres par vague (× script.enemyCountMultiplier). */
  monstersPerWave: 10,
  /** PV d'un ennemi normal au début de la vague 1 (valeur Marvel Rush, Rush Royale ne la publie pas). */
  baseHp: 200,
  /**
   * Croissance des PV par vague dans le 1er bloc de 10 vagues (remplaçable par script.waveHpGrowth) ;
   * le taux (croissance − 1) augmente de `hpGrowthStep` (en part du taux de départ) à chaque bloc de 10 vagues.
   * La croissance d'une vague est répartie sur ses monstres : chaque nouveau monstre est un peu plus solide.
   */
  hpGrowth: 1.17,
  hpGrowthStep: 0.25,
  /** Mana d'élimination : 10, +10 toutes les 10 vagues, 50 au plus (Rush Royale, Coop). */
  killManaBase: 10,
  killManaStep: 10,
  killManaMax: 50,
  baseSpeed: 2,          // cases par seconde d'un ennemi normal
  /** Rythme des boss, remplaçable par GameConfig.bossRhythm. */
  smallBossEvery: 5,     // mini-boss (lieutenant) : vagues 5, 15, 25…
  bigBossEvery: 10,      // gros boss : vagues 10, 20, 30…
  thanosEvery: 50,       // modes infinis : Thanos à la 50, puis toutes les 50
  /** Modes infinis, Rush Royale : après cette vague, boss aux vagues paires et mini-boss aux impaires. */
  alternateAfter: 60,
  minionWavesBefore: 2,  // les sbires du prochain gros boss arrivent dans les 2 vagues d'avant
  milestoneEvery: 10,    // événement « milestone » tous les 10 vagues franchies
  /** Intervalle entre deux apparitions : max(min, start − step × (vague − 1)). */
  spawnIntervalStart: 2.6,
  spawnIntervalStep: 0.1,
  spawnIntervalMin: 0.6,
  minionEvery: 3,        // dans ces vagues, une apparition sur 3 est un groupe de sbires
};

/** Croissance des PV pendant la vague `wave` (bloc de 10 vagues : le taux monte à chaque bloc). */
export function waveGrowth(wave: number, growth: number = WAVE_RULES.hpGrowth): number {
  const block = Math.floor(Math.max(0, wave - 1) / 10);
  return 1 + (growth - 1) * (1 + WAVE_RULES.hpGrowthStep * block);
}

/** PV d'un ennemi normal au début de la vague `wave` (avant le multiplicateur de script). */
export function waveHp(wave: number, growth: number = WAVE_RULES.hpGrowth): number {
  let hp = WAVE_RULES.baseHp;
  for (let w = 1; w < wave; w++) hp *= waveGrowth(w, growth);
  return hp;
}

/** PV du monstre numéro `index` (0..count−1) de la vague : ils montent à chaque nouveau monstre. */
export function monsterHp(wave: number, index: number, count: number, growth: number = WAVE_RULES.hpGrowth): number {
  const f = count > 0 ? Math.min(1, Math.max(0, index) / count) : 0;
  return waveHp(wave, growth) * Math.pow(waveGrowth(wave, growth), f);
}

/** Mana d'élimination d'un ennemi normal à la vague `wave`. */
export function killMana(wave: number): number {
  const { killManaBase: a, killManaStep: s, killManaMax: m } = WAVE_RULES;
  return Math.min(m, a + s * Math.floor(Math.max(0, wave - 1) / 10));
}

/** Nombre de monstres d'une vague (`countMul` = script.enemyCountMultiplier). */
export function monstersInWave(countMul = 1): number {
  return Math.max(1, Math.round(WAVE_RULES.monstersPerWave * countMul));
}

/**
 * Composition d'une vague : poids de chaque type selon la vague.
 * Les types se débloquent progressivement, comme dans Rush Royale.
 */
export function spawnWeights(wave: number): [EnemyKind, number][] {
  const w: [EnemyKind, number][] = [['normal', 10]];
  if (wave >= 2) w.push(['rapide', 3]);
  if (wave >= 4) w.push(['gros', 1]);
  if (wave >= 6) w.push(['blinde', 1]);
  if (wave >= 8) w.push(['bouclier', 1]);
  return w;
}

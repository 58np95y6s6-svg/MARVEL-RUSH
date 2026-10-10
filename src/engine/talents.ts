// Point d'entrée des talents (§5.1) : fusionne les talents choisis avec les paramètres de
// compétence de base d'une unité. Les définitions viennent de src/data/talents.ts.
//
// Convention (voir l'en-tête de src/data/talents.ts) :
// - `xAdd` : ajouté au paramètre `x` (0 s'il n'existe pas) ;
// - `xMul` : multiplie le paramètre `x` s'il existe ; sinon la clé `xMul` est conservée telle
//   quelle et cumulée par multiplication (damageMul, attackSpeedMul, bossDamageMul…) ;
// - sans suffixe : valeur directe (nouvelle mécanique).
//
// Clés génériques gérées par le moteur : damageMul, attackSpeedMul, bossDamageMul, armorPierce,
// auraDiagonal, auraDamage, auraAttackSpeed, burnPerSecond/burnDuration, stunDuration
// (+ stunEveryAttacks), slow/slowDuration sur les tirs, immuneBossControl,
// bossEffectDurationFactor. Les autres clés de nouvelles mécaniques sont conservées dans les
// paramètres résolus et pourront être lues par le moteur au fil de l'équilibrage.

import type { AwakeningPassiveDef, TalentDef, UnitId } from '../data/types';
import { TALENTS, TALENT_TIER_LEVELS } from '../data/talents';
import { AWAKENINGS } from '../data/awakenings';

let catalog: readonly TalentDef[] = TALENTS;

/** Remplace le catalogue de talents (tests, équilibrage). */
export function setTalentCatalog(defs: readonly TalentDef[]): void {
  catalog = defs;
}

/** Talents actifs : palier débloqué par le niveau de collection et option choisie. */
export function activeTalents(unit: UnitId, level: number, choices: readonly ('a' | 'b')[] | undefined): TalentDef[] {
  if (!choices) return [];
  const out: TalentDef[] = [];
  ([1, 2, 3] as const).forEach((tier, i) => {
    const option = choices[i];
    if (!option || level < TALENT_TIER_LEVELS[tier]) return;
    const def = catalog.find((t) => t.unit === unit && t.tier === tier && t.option === option);
    if (def) out.push(def);
  });
  return out;
}

export function applyTalentParams(base: Record<string, number>, talents: readonly { params: Record<string, number> }[]): Record<string, number> {
  const p: Record<string, number> = { ...base };
  for (const t of talents) {
    for (const [key, v] of Object.entries(t.params)) {
      if (key.endsWith('Add') && key.length > 3) {
        const k = key.slice(0, -3);
        p[k] = (p[k] ?? 0) + v;
      } else if (key.endsWith('Mul') && key.length > 3 && key.slice(0, -3) in base) {
        const k = key.slice(0, -3);
        p[k] = (p[k] ?? 1) * v;
      } else if (key.endsWith('Mul')) {
        p[key] = (p[key] ?? 1) * v;
      } else {
        p[key] = v;
      }
    }
  }
  return p;
}

// ───────────── Éveils (§6.6) ─────────────
// Gains cumulés par étoile : +6 % de dégâts et +4 % de vitesse d'attaque (appliqués dans combat.ts).
// Passifs débloqués à ★2/4/6/8/10, lus dans src/data/awakenings.ts (remplaçables par
// setAwakeningCatalog). Leurs params suivent la même convention que les talents.

export const AWAKENING_DAMAGE = 0.06;
export const AWAKENING_ATTACK_SPEED = 0.04;
export const AWAKENING_MAX = 10;

let awakeningCatalog: readonly AwakeningPassiveDef[] = AWAKENINGS;

/** Remplace le catalogue des passifs d'éveil (tests, équilibrage). */
export function setAwakeningCatalog(defs: readonly AwakeningPassiveDef[]): void {
  awakeningCatalog = defs;
}

export function activeAwakeningPassives(unit: UnitId, stars: number): AwakeningPassiveDef[] {
  return awakeningCatalog.filter((d) => d.unit === unit && d.star <= stars).sort((a, b) => a.star - b.star);
}

export function resolveUnitParams(
  unit: UnitId, base: Record<string, number>, level: number, choices: readonly ('a' | 'b')[] | undefined, stars = 0,
): Record<string, number> {
  const withTalents = applyTalentParams(base, activeTalents(unit, level, choices));
  return applyLevelParams(applyTalentParams(withTalents, activeAwakeningPassives(unit, stars)), level);
}

/**
 * Tableaux par niveau de Rush Royale : une clé `xPerLevel` ajoute `valeur × (niveau − 1)` au paramètre `x`
 * (niveau de collection 1 = niveau de carte 7 de Rush Royale). Appliqué après les talents et les éveils.
 */
export function applyLevelParams(p: Record<string, number>, level: number): Record<string, number> {
  const steps = Math.max(0, Math.round(level) - 1);
  if (steps === 0) return p;
  const out = { ...p };
  for (const [key, v] of Object.entries(p)) {
    if (!key.endsWith('PerLevel') || key.length <= 8) continue;
    const k = key.slice(0, -8);
    out[k] = (out[k] ?? 0) + v * steps;
  }
  return out;
}

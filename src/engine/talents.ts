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
// bossEffectDurationMul. Les autres clés de nouvelles mécaniques sont conservées dans les
// paramètres résolus et pourront être lues par le moteur au fil de l'équilibrage.

import type { TalentDef, UnitId } from '../data/types';
import { TALENTS, TALENT_TIER_LEVELS } from '../data/talents';

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

export function applyTalentParams(base: Record<string, number>, talents: readonly TalentDef[]): Record<string, number> {
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

export function resolveUnitParams(
  unit: UnitId, base: Record<string, number>, level: number, choices: readonly ('a' | 'b')[] | undefined,
): Record<string, number> {
  return applyTalentParams(base, activeTalents(unit, level, choices));
}

// Archétypes de stratégie (docs/roadmap.md, « Règle pour chaque extension ») : mécaniques
// génériques pilotées par les clés de `ability.params`. Une extension n'a qu'à poser ces clés sur
// ses héros, le moteur fait le reste.
//
//   Sacrifice → mana      sacrificeMana      multiplicateur de SACRIFICE_MANA (1 = barème standard)
//   Copieur               copyDamageMul      dégâts gardés par la copie (0.75 = −25 %)
//                         copyRankBonus, copyReady, copyMana  (talents et éveils)
//   Booster de fusion     promoteAlly        1 = glissée sur une alliée de même rang, la fait monter d'un rang
//   Croissance            growthPerSecond, growthPerKill : points de croissance (counters.growth) ;
//                         bonus de dégâts = growthScale × points^growthExponent (rendements décroissants,
//                         sans plafond ; défaut 1 et 1 = linéaire) ; growthKeepOnMerge : part du bonus
//                         gardée par l'unité issue d'une fusion
//   Mana par élimination  manaPerKill        multiplicateur de KILL_MANA ; bossKillMana en plus sur un boss
//   Boost de vitesse      auraAttackSpeed    aura de cadence aux voisines (combat.ts, aurasAt)
//   Échangeur             swapAlly           1 = glissée sur une alliée de même rang, elles échangent leurs cases ;
//                         boost/boostDuration/boostDamage : bonus aux nouvelles voisines après l'échange,
//                         swapBoostPartner, swapMana (talents et éveils)
//
//   Formation             formationDamagePerAlly (+x par autre unité identique alignée et contiguë),
//                         formationMax (longueur comptée au plus), formationSplashAt / formationSplash
//                         (ligne complète : éclaboussure autour de la cible, rayon 1,5)
//
// Récompense de boss (tous les joueurs, × rendement du mana) : BOSS_KILL_REWARD × coût d'invocation actuel.

import type { UnitId } from '../data/types';
import { UNITS } from '../data/units';
import { GRID_COLS, GRID_ROWS, MAX_RANK, type UnitInstance } from './types';
import { emit, type Ctx, type SimEnemy, type SimUnit } from './internal';
import { effectiveId, manaYield, neighbors, unitParams } from './combat';

/** Mana rendu par une unité Sacrifice fusionnée ou détruite, par rang (1..7). */
export const SACRIFICE_MANA = [10, 25, 45, 70, 100, 140, 190] as const;
/** Mana bonus d'un ennemi touché par une unité « mana par élimination », par rang de l'unité (1..7). */
export const KILL_MANA = [1, 2, 3, 4, 5, 6, 8] as const;

const byRank = (table: readonly number[], rank: number): number =>
  table[Math.max(0, Math.min(table.length - 1, rank - 1))]!;

export type DropAction = 'merge' | 'copy' | 'promote' | 'swap';

/** Mana d'une victoire sur un boss, en nombre d'invocations au coût actuel du joueur. */
export const BOSS_KILL_REWARD = { lieutenant: 2.5, boss: 5.5, thanos: 8 } as const;

/**
 * Effet d'un glisser de l'unité `a` sur l'alliée `b` (interface et bot) : fusion (même unité, même
 * rang), copie (copieur sur une autre unité de même rang) ou promotion (booster sur une autre unité
 * de même rang, sous le rang 7). null si rien n'est possible. Le moteur refait les vérifications.
 */
export function dropAction(a: UnitInstance | null | undefined, b: UnitInstance | null | undefined): DropAction | null {
  if (!a || !b || a === b || a.rank !== b.rank) return null;
  if (a.unit === b.unit) return a.rank < MAX_RANK ? 'merge' : null;
  const prm = UNITS[a.unit].ability.params;
  if ((prm.copyDamageMul ?? 0) > 0) return 'copy';
  if (prm.promoteAlly && b.rank < MAX_RANK) return 'promote';
  if (prm.swapAlly) return 'swap';
  return null;
}

/** Sacrifice → mana : l'unité est consommée (fusion, booster) ou détruite (pouvoir de boss). */
export function sacrifice(ctx: Ctx, player: number, slot: number, u: SimUnit): number {
  const prm = unitParams(ctx, player, effectiveId(u));
  if (!prm.sacrificeMana) return 0;
  const amount = Math.round(byRank(SACRIFICE_MANA, u.rank) * prm.sacrificeMana);
  if (amount <= 0) return 0;
  const p = ctx.st.players[player]!;
  p.mana += amount;
  emit(ctx, { type: 'mana', player: p.id, slot, amount, reason: 'sacrifice' });
  return amount;
}

/** Bonus de dégâts (fraction) correspondant à des points de croissance, selon la courbe de l'unité. */
export function growthBonus(prm: Record<string, number>, points: number): number {
  if (points <= 0) return 0;
  return (prm.growthScale ?? 1) * Math.pow(points, prm.growthExponent ?? 1);
}

/** Points de croissance qui donnent `bonus` sur la courbe de l'unité (inverse de growthBonus). */
export function growthPoints(prm: Record<string, number>, bonus: number): number {
  if (bonus <= 0) return 0;
  return Math.pow(bonus / (prm.growthScale ?? 1), 1 / (prm.growthExponent ?? 1));
}

/**
 * Croissance gardée par l'unité issue d'une fusion : une part (growthKeepOnMerge) du plus fort bonus des
 * deux unités fusionnées, convertie en points sur la courbe de la nouvelle unité `into`.
 */
export function inheritedGrowth(ctx: Ctx, player: number, a: SimUnit, b: SimUnit, into: UnitId): number {
  let best = 0;
  for (const u of [a, b]) {
    const g = u.counters.growth ?? 0;
    if (g <= 0) continue;
    const prm = unitParams(ctx, player, effectiveId(u));
    best = Math.max(best, growthBonus(prm, g) * (prm.growthKeepOnMerge ?? 0));
  }
  return growthPoints(unitParams(ctx, player, into), best);
}

/** Croissance par seconde (appelée à chaque tick). */
export function growOverTime(ctx: Ctx, player: number, u: SimUnit, dt: number): void {
  const per = unitParams(ctx, player, effectiveId(u)).growthPerSecond;
  if (per) u.counters.growth = (u.counters.growth ?? 0) + per * dt;
}

/** Croissance par élimination. */
export function growOnKill(ctx: Ctx, player: number, u: SimUnit): void {
  const per = unitParams(ctx, player, effectiveId(u)).growthPerKill;
  if (per) u.counters.growth = (u.counters.growth ?? 0) + per;
}

/** Mana par élimination : marque l'ennemi touché ; le mana est versé à sa mort, quel que soit le tueur. */
export function tagForMana(ctx: Ctx, player: number, u: SimUnit, e: SimEnemy): void {
  const prm = unitParams(ctx, player, effectiveId(u));
  if (!prm.manaPerKill) return;
  let amount = byRank(KILL_MANA, u.rank) * prm.manaPerKill;
  if (e.bossId || e.x.mini) amount += prm.bossKillMana ?? 0;
  amount = Math.round(amount);
  if (amount > (e.x.manaTag ?? 0)) {
    e.x.manaTag = amount;
    e.x.manaTagBy = player;
  }
}

/** Copieur : `u` devient une copie de `model` (même rang, compétence complète, dégâts réduits). */
export function makeCopy(ctx: Ctx, player: number, u: SimUnit, model: SimUnit, init: (u: SimUnit) => void): void {
  const prm = unitParams(ctx, player, u.unit);
  const from: UnitId = u.unit;
  const mul = Math.min(1, prm.copyDamageMul ?? 0.75);
  const s = u.status;
  u.unit = model.unit;
  u.rank = Math.min(MAX_RANK, model.rank + Math.max(0, Math.round(prm.copyRankBonus ?? 0)));
  delete s.transformedInto;
  delete s.transformFor;
  s.copyMul = mul;
  s.copyOf = from;
  init(u);
  if (prm.copyReady && u.counters.cd !== undefined) u.counters.cd = 0;
  if (prm.copyMana) {
    const p = ctx.st.players[player]!;
    p.mana += prm.copyMana;
    emit(ctx, { type: 'mana', player: p.id, slot: ctx.st.players[player]!.grid.indexOf(u), amount: prm.copyMana, reason: 'copie' });
  }
}

/** Échangeur : `u` (case `from`) et l'alliée de la case `to` échangent leurs cases ; bonus aux nouvelles voisines. */
export function swapCells(ctx: Ctx, player: number, from: number, to: number): void {
  const p = ctx.st.players[player]!;
  const u = p.grid[from]!, other = p.grid[to]!;
  p.grid[from] = other;
  p.grid[to] = u;
  const prm = unitParams(ctx, player, effectiveId(u));
  if (prm.boost) {
    const boosted = neighbors(to, !!prm.auraDiagonal).map((j) => p.grid[j]).filter((n): n is SimUnit => !!n && n !== u);
    if (prm.swapBoostPartner && !boosted.includes(other)) boosted.push(other);
    for (const n of boosted) {
      n.counters.boost = prm.boost;
      n.counters.boostFor = prm.boostDuration ?? 5;
      n.counters.boostDamage = prm.boostDamage ?? 0;
    }
  }
  if (prm.swapMana) {
    p.mana += prm.swapMana;
    emit(ctx, { type: 'mana', player: p.id, slot: to, amount: prm.swapMana, reason: 'echange' });
  }
}

/** Victoire sur un boss : grosse récompense de mana pour chaque joueur (Coop : chacun la reçoit en entier). */
export function bossReward(ctx: Ctx, e: SimEnemy): void {
  if (!e.bossId && !e.x.mini) return;
  const factor = e.bossId === 'thanos' ? BOSS_KILL_REWARD.thanos : e.bossId ? BOSS_KILL_REWARD.boss : BOSS_KILL_REWARD.lieutenant;
  for (const p of ctx.st.players) {
    const amount = Math.round(factor * p.summonCost * manaYield(p));
    p.mana += amount;
    emit(ctx, { type: 'mana', player: p.id, slot: -1, amount, reason: 'boss', enemy: e.uid });
  }
}

/**
 * Formation : longueur de la plus longue ligne contiguë (rangée ou colonne) de la même unité qui passe
 * par `slot` (une copie, qui n'est plus l'unité d'origine, ne compte pas). 1 = seule.
 */
export function formationLength(grid: readonly (UnitInstance | null)[], slot: number): number {
  const u = grid[slot];
  if (!u) return 0;
  const col = slot % GRID_COLS, row = Math.floor(slot / GRID_COLS);
  const same = (c: number, r: number) => c >= 0 && c < GRID_COLS && r >= 0 && r < GRID_ROWS && grid[r * GRID_COLS + c]?.unit === u.unit;
  let h = 1, v = 1;
  for (let c = col - 1; same(c, row); c--) h++;
  for (let c = col + 1; same(c, row); c++) h++;
  for (let r = row - 1; same(col, r); r--) v++;
  for (let r = row + 1; same(col, r); r++) v++;
  return Math.max(h, v);
}

/** Cases des partenaires de formation de `slot` (même unité, alignées et contiguës), pour l'appui long. */
export function formationPartners(grid: readonly (UnitInstance | null)[], slot: number): number[] {
  const u = grid[slot];
  if (!u || !(UNITS[u.unit].ability.params.formationDamagePerAlly ?? 0)) return [];
  const out: number[] = [];
  const col = slot % GRID_COLS, row = Math.floor(slot / GRID_COLS);
  const same = (c: number, r: number) => c >= 0 && c < GRID_COLS && r >= 0 && r < GRID_ROWS && grid[r * GRID_COLS + c]?.unit === u.unit;
  for (const [dc, dr] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
    for (let c = col + dc, r = row + dr; same(c, r); c += dc, r += dr) out.push(r * GRID_COLS + c);
  }
  return out;
}

/** Bonus de dégâts de formation de l'unité posée sur `slot` (0 sans formation). */
export function formationBonus(ctx: Ctx, player: number, slot: number, u: SimUnit): number {
  const prm = unitParams(ctx, player, effectiveId(u));
  if (!prm.formationDamagePerAlly || u.unit !== effectiveId(u)) return 0;
  const len = Math.min(formationLength(ctx.st.players[player]!.grid, slot), Math.max(1, prm.formationMax ?? 3));
  return prm.formationDamagePerAlly * (len - 1);
}

/** Formation complète : l'attaque devient une attaque de zone. */
export function formationSplash(ctx: Ctx, player: number, slot: number, u: SimUnit): number {
  const prm = unitParams(ctx, player, effectiveId(u));
  if (!prm.formationSplash) return 0;
  return formationLength(ctx.st.players[player]!.grid, slot) >= (prm.formationSplashAt ?? 3) ? prm.formationSplash : 0;
}

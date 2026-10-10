// Extension Transformers : la transformation (mécanique propre de l'extension) et les profils Rush Royale
// des 15 Autobots (docs/rush-royale-mapping.md, « Extension Transformers »).
//
// Transformation (clés génériques de `ability.params`, une extension peut les poser sur n'importe quel héros) :
//   transformEvery   secondes entre deux transformations automatiques (0 / absent = pas de transformation)
//   robotSpeed, robotDamage       multiplicateurs de cadence et de dégâts en mode robot (vise le plus de PV)
//   vehicleSpeed, vehicleDamage   multiplicateurs en mode véhicule (vise le plus avancé)
// Compteurs d'unité : `vehicle` (1 = véhicule), `transformIn` (s avant la prochaine), `transformLock`
// (s pendant lesquelles un appui est ignoré), `jamFor` (Brouillage de Soundwave : ni améliorations en
// partie ni transformation), `scorch` / `scorchFor` (Canon de feu de Blitzwing : dégâts réduits),
// `tyrantFor` (Tyrannie de Megatron : transformation bloquée).

import type { Targeting, UnitId } from '../data/types';
import { DT, EPS, emit, pick, rand, type Ctx, type SimEnemy, type SimUnit } from './internal';
import {
  applyBurn, applySlow, applyStun, baseDamage, bestBy, controlMul, effectiveId, isAlive, isDisabled, nearest,
  neighbors, progress, pushBack, selectTarget, unitHit, unitParams, within,
} from './combat';

/** Délai minimal entre deux transformations demandées d'un appui (s). */
export const TRANSFORM_LOCK = 0.5;

export const isTransformer = (prm: Record<string, number>): boolean => (prm.transformEvery ?? 0) > 0;
export const inVehicle = (u: { counters: Record<string, number> }): boolean => (u.counters.vehicle ?? 0) > 0;
export const jammed = (u: { counters: Record<string, number> }): boolean => (u.counters.jamFor ?? 0) > EPS;

/** Compteurs de départ d'un Autobot : mode robot, prochaine transformation dans `transformEvery` s. */
export function tfInit(prm: Record<string, number>, u: SimUnit): void {
  if (!isTransformer(prm)) return;
  u.counters.vehicle = 0;
  u.counters.transformIn = prm.transformEvery!;
}

/** Multiplicateur de cadence du mode (1 hors transformation). */
export function tfSpeedMul(prm: Record<string, number>, u: SimUnit): number {
  if (!isTransformer(prm)) return 1;
  return inVehicle(u) ? prm.vehicleSpeed ?? 1 : prm.robotSpeed ?? 1;
}

/** Multiplicateur de dégâts du mode, et malus du Canon de feu (Blitzwing). */
export function tfDamageMul(prm: Record<string, number>, u: SimUnit): number {
  let m = 1;
  if (isTransformer(prm)) m *= inVehicle(u) ? prm.vehicleDamage ?? 1 : prm.robotDamage ?? 1;
  if ((u.counters.scorchFor ?? 0) > EPS) m *= 1 - Math.min(0.9, u.counters.scorch ?? 0);
  return m;
}

/** Ciblage du mode : robot = le plus de PV, véhicule = le plus avancé (Arcee en moto : le plus rapide). */
export function tfTargeting(prm: Record<string, number>, u: SimUnit): Targeting | 'rapide' | null {
  if (!isTransformer(prm)) return null;
  if (!inVehicle(u)) return 'fort';
  return effectiveId(u) === 'arcee' ? 'rapide' : 'premier';
}

export function chooseTfTarget(ctx: Ctx, prm: Record<string, number>, u: SimUnit, pool: SimEnemy[]): SimEnemy | undefined | null {
  const t = tfTargeting(prm, u);
  if (!t) return null;
  if (t === 'rapide') return bestBy(pool, (e) => e.speed * (1 - ((e.effects.slowFor ?? 0) > EPS ? e.effects.slow ?? 0 : 0)) * 1000 + progress(ctx, e) * 1e-3);
  if (effectiveId(u) === 'sideswipe' && !inVehicle(u)) return selectTarget(ctx, pool, 'aleatoire');
  return selectTarget(ctx, pool, t);
}

/** L'unité peut-elle se transformer maintenant ? */
export function canTransform(ctx: Ctx, player: number, u: SimUnit): boolean {
  const prm = unitParams(ctx, player, effectiveId(u));
  return isTransformer(prm) && !jammed(u) && (u.counters.tyrantFor ?? 0) <= EPS && !isDisabled(u);
}

/** Transformation : robot ↔ véhicule ; la prochaine transformation automatique repart de zéro. */
export function transformUnit(ctx: Ctx, player: number, slot: number, u: SimUnit, to?: 0 | 1): void {
  const id = effectiveId(u);
  const prm = unitParams(ctx, player, id);
  const next = to ?? (inVehicle(u) ? 0 : 1);
  u.counters.vehicle = next;
  u.counters.transformIn = prm.transformEvery ?? 8;
  u.counters.transformLock = TRANSFORM_LOCK;
  // Le nouveau mode recommence ses compteurs propres (rampe d'Arcee et d'Elita, coups de Mirage).
  u.counters.ramp = 0;
  emit(ctx, {
    type: 'ability', player: ctx.st.players[player]!.id, slot, unit: id,
    name: next ? TRANSFORM_VEHICLE : TRANSFORM_ROBOT, targets: [],
  });
}

export const TRANSFORM_VEHICLE = 'Transformation : véhicule';
export const TRANSFORM_ROBOT = 'Transformation : robot';

/** Minuteries de la transformation et des effets de Decepticons (appelée à chaque tick). */
export function tfTick(ctx: Ctx, player: number, slot: number, u: SimUnit): void {
  const c = u.counters;
  for (const k of ['transformLock', 'jamFor', 'scorchFor', 'tyrantFor', 'enchantFor', 'shieldTick'] as const) {
    if ((c[k] ?? 0) > 0) c[k] = Math.max(0, (c[k] ?? 0) - DT);
  }
  const prm = unitParams(ctx, player, effectiveId(u));
  if (!isTransformer(prm) || c.transformIn === undefined) return;
  if (jammed(u) || (c.tyrantFor ?? 0) > EPS) return;
  c.transformIn -= DT;
  if (c.transformIn <= EPS && !isDisabled(u)) transformUnit(ctx, player, slot, u);
}

const notBoss = (e: SimEnemy) => !e.bossId && !e.x.mini;

function abilityEv(ctx: Ctx, player: number, slot: number, unit: UnitId, name: string, targets: SimEnemy[]): void {
  emit(ctx, { type: 'ability', player: ctx.st.players[player]!.id, slot, unit, name, targets: targets.map((e) => e.uid) });
}

function fxEv(ctx: Ctx, player: number, slot: number, unit: UnitId, targets: SimEnemy[], fx: string): void {
  emit(ctx, { type: 'attack', player: ctx.st.players[player]!.id, slot, unit, targets: targets.map((e) => e.uid), fx });
}

/**
 * Compétences à recharge des Autobots (même contrat que timedAbility d'abilities.ts) : false = pas pu
 * partir (on réessaie au tick suivant), true = partie, null = pas un Autobot à compétence.
 */
export function tfTimedAbility(ctx: Ctx, player: number, slot: number, u: SimUnit, all: SimEnemy[], enemies: SimEnemy[]): boolean | null {
  const id = effectiveId(u);
  const prm = unitParams(ctx, player, id);
  const grid = ctx.st.players[player]!.grid;
  switch (id) {
    case 'optimus': {
      // Banshee : cri de ralliement, tous les ennemis à portée.
      if (enemies.length === 0) return false;
      const dmg = baseDamage(ctx, player, slot, u) * (prm.rallyDamage ?? 1.5);
      const zone = enemies.filter(isAlive);
      for (const e of zone) unitHit(ctx, player, u, e, dmg, { noOnHit: true });
      fxEv(ctx, player, slot, id, zone, 'optimus:ralliement');
      abilityEv(ctx, player, slot, id, 'Cri de ralliement', zone);
      return true;
    }
    case 'ratchet': {
      // Mode robot : répare les voisines (libérées des effets de boss).
      if (inVehicle(u)) return true;
      let fixed = 0;
      for (const j of neighbors(slot, false)) {
        const n = grid[j];
        if (!n) continue;
        const s = n.status;
        if (s.stunnedFor || s.sleepingFor || s.hypnotizedFor || n.counters.jamFor || n.counters.scorchFor) fixed++;
        delete s.stunnedFor; delete s.sleepingFor; delete s.hypnotizedFor;
        n.counters.jamFor = 0; n.counters.scorchFor = 0;
      }
      if (fixed) abilityEv(ctx, player, slot, id, 'Réparation', []);
      return true;
    }
    case 'wheeljack': {
      // Corsaire : en voiture de course, mine sous l'ennemi de tête.
      if (!inVehicle(u)) return true;
      const lead = bestBy(enemies, (e) => progress(ctx, e));
      if (!lead) return false;
      const zone = [lead, ...within(ctx, all, lead, prm.mineRadius ?? 1)].filter(isAlive);
      const dmg = baseDamage(ctx, player, slot, u) * (prm.mineDamage ?? 2);
      for (const e of zone) unitHit(ctx, player, u, e, dmg, { noOnHit: true });
      fxEv(ctx, player, slot, id, zone, 'wheeljack:mine');
      abilityEv(ctx, player, slot, id, 'Mine', zone);
      return true;
    }
    case 'ultramagnus': {
      // Épées enchantées : bouclier d'équipe en mode robot (voisines insensibles aux pouvoirs de boss).
      if (inVehicle(u)) return true;
      const d = prm.teamShield ?? 4;
      u.counters.immuneFor = Math.max(u.counters.immuneFor ?? 0, d);
      for (const j of neighbors(slot, !!prm.auraDiagonal)) {
        const n = grid[j];
        if (n) n.counters.immuneFor = Math.max(n.counters.immuneFor ?? 0, d);
      }
      abilityEv(ctx, player, slot, id, 'Bouclier d’équipe', []);
      return true;
    }
    default:
      return null;
  }
}

type Hit = (e: SimEnemy, d: number, o?: { crit?: boolean; shieldBreak?: boolean; noOnHit?: boolean }) => number;
type Splash = (center: SimEnemy, d: number, radius: number) => SimEnemy[];

/** Attaque de base d'un Autobot selon son mode ; null = pas un Autobot. */
export function tfAttack(
  ctx: Ctx, player: number, slot: number, u: SimUnit, id: UnitId, target: SimEnemy, enemies: SimEnemy[], pool: SimEnemy[],
  dmg: number, hit: Hit, splash: Splash,
): { targets: SimEnemy[]; fx: string } | null {
  const prm = unitParams(ctx, player, id);
  const ctrl = controlMul(ctx, player, id);
  const veh = inVehicle(u);
  const c = u.counters;
  switch (id) {
    case 'optimus': {
      hit(target, dmg);
      if (veh) {
        if (isAlive(target) && prm.chargePush) pushBack(ctx, target, prm.chargePush);
        return { targets: [target], fx: 'optimus:charge' };
      }
      const around = splash(target, dmg * (prm.shockSplash ?? 0.6), prm.shockRadius ?? 1.2);
      return { targets: [target, ...around], fx: 'optimus:hache' };
    }
    case 'bumblebee': {
      if (!veh) { hit(target, dmg); return { targets: [target], fx: 'bumblebee:canon' }; }
      // Mage de foudre : les 3 premiers à 100, 70 et 30 %.
      const shares = [1, 0.7, 0.3].slice(0, Math.max(1, Math.round(prm.burstShares ?? 3)));
      const order = pool.filter(isAlive).sort((a, b) => progress(ctx, b) - progress(ctx, a) || a.uid - b.uid);
      const list = [target, ...order.filter((e) => e !== target)].slice(0, shares.length);
      list.forEach((e, i) => hit(e, dmg * shares[i]!, i ? { noOnHit: true } : undefined));
      return { targets: list, fx: 'bumblebee:rafale' };
    }
    case 'ironhide': {
      if (veh) {
        hit(target, dmg);
        const around = splash(target, dmg * (prm.vanSplash ?? 0.5), prm.vanRadius ?? 1.1);
        return { targets: [target, ...around], fx: 'ironhide:fourgon' };
      }
      // Chasseur de démons : autant de cibles que le rang.
      const n = Math.min(Math.round(prm.targetsMax ?? 4), Math.max(1, Math.round((prm.targetsPerRank ?? 1) * u.rank)));
      const others = pool.filter((e) => isAlive(e) && e !== target).sort((a, b) => b.hp - a.hp || a.uid - b.uid).slice(0, n - 1);
      hit(target, dmg);
      for (const e of others) hit(e, dmg, { noOnHit: true });
      return { targets: [target, ...others], fx: 'ironhide:canons' };
    }
    case 'ratchet': {
      hit(target, dmg);
      return { targets: [target], fx: veh ? 'ratchet:sirene' : 'ratchet:cle' };
    }
    case 'jazz': {
      hit(target, dmg);
      if (!veh && isAlive(target) && rand(ctx) < (prm.blindChance ?? 0)) {
        applyStun(target, (prm.blindDuration ?? 0.6) * ctrl);
        return { targets: [target], fx: 'jazz:projecteur' };
      }
      return { targets: [target], fx: veh ? 'jazz:notes' : 'jazz:tir' };
    }
    case 'arcee': {
      // Cristallomancien (rampe dans `dmg`) ; lames : chance de critique en robot.
      if (!veh && rand(ctx) < (prm.bladeCritChance ?? 0)) {
        hit(target, dmg * (prm.bladeCritMul ?? 2), { crit: true });
        return { targets: [target], fx: 'arcee:lames' };
      }
      hit(target, dmg);
      return { targets: [target], fx: veh ? 'arcee:moto' : 'arcee:lames' };
    }
    case 'grimlock': {
      hit(target, dmg);
      if (!veh) return { targets: [target], fx: 'grimlock:epee' };
      const around = splash(target, dmg * (prm.breathSplash ?? 0.6), prm.breathRadius ?? 1.2);
      for (const e of [target, ...around]) if (isAlive(e)) applyBurn(e, dmg * (prm.breathBurn ?? 0.2), 3, player);
      return { targets: [target, ...around], fx: 'grimlock:feu' };
    }
    case 'wheeljack': {
      if (veh) { hit(target, dmg); return { targets: [target], fx: 'wheeljack:course' }; }
      // Grenade expérimentale : un effet au hasard.
      const k = Math.min(3, Math.floor(rand(ctx) * 4));
      hit(target, k === 3 ? dmg * 2 : dmg);
      if (isAlive(target)) {
        if (k === 0) applyStun(target, 1 * ctrl);
        else if (k === 1) applySlow(ctx, target, 0.4, 2 * ctrl);
        else if (k === 2) applyBurn(target, dmg * 0.3, 3, player);
      }
      return { targets: [target], fx: 'wheeljack:grenade' };
    }
    case 'hotrod': {
      if (!veh) {
        hit(target, dmg);
        const second = isAlive(target) ? target : selectTarget(ctx, pool.filter(isAlive), 'fort');
        if (second && prm.doubleShot) hit(second, dmg, { noOnHit: true });
        return { targets: second && second !== target ? [target, second] : [target], fx: 'hotrod:double' };
      }
      hit(target, dmg);
      const zone = [target, ...within(ctx, enemies, target, prm.trailRadius ?? 1)].filter(isAlive);
      for (const e of zone) applyBurn(e, dmg * (prm.trailBurn ?? 0.3), prm.trailDuration ?? 3, player);
      return { targets: zone, fx: 'hotrod:flammes' };
    }
    case 'elita': {
      hit(target, dmg);
      if (veh && isAlive(target)) {
        const e = target.effects;
        const active = (e.markedFor ?? 0) > EPS;
        e.marked = Math.max(active ? e.marked ?? 0 : 0, prm.markValue ?? 0.15);
        e.markedFor = Math.max(active ? e.markedFor ?? 0 : 0, prm.markDuration ?? 4);
        return { targets: [target], fx: 'elita:marque' };
      }
      return { targets: [target], fx: 'elita:precision' };
    }
    case 'bulkhead': {
      hit(target, dmg);
      if (veh) {
        const around = splash(target, dmg * (prm.crushSplash ?? 0.4), 1);
        return { targets: [target, ...around], fx: 'bulkhead:ecrasement' };
      }
      if (isAlive(target) && rand(ctx) < (prm.wreckStunChance ?? 0)) applyStun(target, (prm.wreckStun ?? 0.8) * ctrl);
      return { targets: [target], fx: 'bulkhead:boulet' };
    }
    case 'sideswipe': {
      if (!veh) {
        hit(target, dmg);
        const around = splash(target, dmg * (prm.bladeSplash ?? 0.4), 1);
        return { targets: [target, ...around], fx: 'sideswipe:lames' };
      }
      // Traverse : la cible et les ennemis juste derrière elle sur le chemin.
      const behind = nearest(ctx, enemies.filter((e) => isAlive(e) && progress(ctx, e) < progress(ctx, target)), target,
        Math.max(0, Math.round(prm.pierceTargets ?? 2)), new Set([target.uid]));
      hit(target, dmg);
      for (const e of behind) hit(e, dmg * (prm.pierceShare ?? 0.6), { noOnHit: true });
      return { targets: [target, ...behind], fx: 'sideswipe:traversee' };
    }
    case 'prowl': {
      hit(target, dmg);
      if (veh && isAlive(target)) applySlow(ctx, target, prm.sirenSlow ?? 0.25, (prm.sirenDuration ?? 2) * ctrl);
      return { targets: [target], fx: veh ? 'prowl:sirene' : 'prowl:analyse' };
    }
    case 'mirage': {
      if (!veh) {
        const every = Math.max(1, Math.round(prm.stealthEvery ?? 3));
        if ((c.attacks ?? 0) % every === 0) {
          hit(target, dmg * (prm.stealthCritMul ?? 2.5), { crit: true });
          return { targets: [target], fx: 'mirage:invisible' };
        }
        hit(target, dmg);
        return { targets: [target], fx: 'mirage:tir' };
      }
      hit(target, dmg);
      if (isAlive(target) && notBoss(target) && !target.x.flying && rand(ctx) < (prm.decoyChance ?? 0)) {
        target.x.knockFor = Math.max(target.x.knockFor ?? 0, (prm.decoyDuration ?? 1) * ctrl);
        return { targets: [target], fx: 'mirage:leurre' };
      }
      return { targets: [target], fx: 'mirage:tir' };
    }
    case 'ultramagnus': {
      hit(target, dmg);
      return { targets: [target], fx: veh ? 'ultramagnus:porte-voitures' : 'ultramagnus:marteau' };
    }
    default:
      return null;
  }
}

/** Fusion d'un Autobot : Ratchet (Sorcière) enchante une alliée au hasard. */
export function tfOnMerge(ctx: Ctx, player: number, fused: UnitId, merged: SimUnit): void {
  const prm = unitParams(ctx, player, fused);
  if (!prm.mergeEnchant) return;
  const grid = ctx.st.players[player]!.grid;
  const ally = pick(ctx, grid.filter((x): x is SimUnit => !!x && x !== merged));
  if (!ally) return;
  ally.counters.enchant = prm.mergeEnchant;
  ally.counters.enchantFor = prm.mergeEnchantDuration ?? 10;
  emit(ctx, { type: 'ability', player: ctx.st.players[player]!.id, slot: grid.indexOf(merged), unit: fused, name: 'Enchantement', targets: [] });
}

/** Bonus de dégâts de l'enchantement de Ratchet (0 sans). */
export function enchantBonus(u: SimUnit): number {
  return (u.counters.enchantFor ?? 0) > EPS ? u.counters.enchant ?? 0 : 0;
}

/**
 * Auras des Autobots qui dépendent du mode : `auraVehicleOnly` / `auraRobotOnly` coupent l'aura dans
 * l'autre mode. Renvoie false si l'aura de `n` ne s'applique pas maintenant.
 */
export function auraActive(prm: Record<string, number>, n: SimUnit): boolean {
  if (prm.auraVehicleOnly && !inVehicle(n)) return false;
  if (prm.auraRobotOnly && inVehicle(n)) return false;
  return true;
}

/** Porte-voitures d'Ultra Magnus : toute la ligne de l'unité gagne des dégâts. */
export function rowBonus(ctx: Ctx, player: number, slot: number, cols: number): number {
  const grid = ctx.st.players[player]!.grid;
  const row = Math.floor(slot / cols);
  let best = 0;
  for (let c = 0; c < cols; c++) {
    const j = row * cols + c;
    const n = grid[j];
    if (!n || j === slot || !inVehicle(n)) continue;
    const prm = unitParams(ctx, player, effectiveId(n));
    if (prm.rowDamage) best = Math.max(best, prm.rowDamage);
  }
  return best;
}

/** Tyrannie de Megatron : tous les Autobots repassent en robot et ne peuvent plus se transformer un moment. */
export function forceRobot(ctx: Ctx, player: number, lock: number): number[] {
  const grid = ctx.st.players[player]!.grid;
  const out: number[] = [];
  grid.forEach((u, i) => {
    if (!u) return;
    const prm = unitParams(ctx, player, effectiveId(u));
    if (!isTransformer(prm)) return;
    if (inVehicle(u)) transformUnit(ctx, player, i, u, 0);
    u.counters.tyrantFor = Math.max(u.counters.tyrantFor ?? 0, lock);
    out.push(i);
  });
  return out;
}


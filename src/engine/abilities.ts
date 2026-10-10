// Attaques et compétences des 43 unités (28 + 15 de l'extension DC), sur les profils Rush Royale
// (docs/rush-royale-mapping.md). Une fonction par tick et par joueur : timers, compétences à recharge,
// archétypes DC (archetypes.ts), attaques de base (le rang de fusion divise l'intervalle d'attaque,
// règle de Rush Royale : plusieurs coups par tick si besoin).

import type { UnitId } from '../data/types';
import { UNITS } from '../data/units';
import { GRID_SIZE, MAX_RANK } from './types';
import {
  DT, EPS, emit, pick, pickMany, rand, randInt, type Ctx, type SimEnemy, type SimUnit,
} from './internal';
import {
  aliveAll, applyBurn, applySlow, applyStun, attackSpeedOf, baseDamage, bestBy, controlMul, cooldownRate, countOnBoard,
  effectiveDef, effectiveId, inquisitorActive, isAlive, isDisabled, killEnemy, laneLength, nearest, neighbors, pushBack,
  progress, segmentOf, selectTarget, sendToStart, teamFor, topBy, unitHit, unitParams, within,
} from './combat';
import { enemyGridPos, inReach, unitRange } from './geometry';
import { formationSplash, growOverTime } from './archetypes';

/** Recharge de la compétence périodique selon le rang (`abilityCooldownPerRank`, Stase). */
export function abilityCd(prm: Record<string, number>, rank: number): number {
  const cd = (prm.abilityCooldown ?? 0) + (prm.abilityCooldownPerRank ?? 0) * (rank - 1);
  return Math.max(0.5, cd);
}

export function initUnitCounters(ctx: Ctx, player: number, u: SimUnit): void {
  const prm = unitParams(ctx, player, effectiveId(u));
  u.counters = {};
  if (prm.abilityCooldown) u.counters.cd = abilityCd(prm, u.rank);
  // Chaudron magique (Nemo) : une potion à l'arrivée sur le plateau.
  if (prm.potionDamage) u.counters.potion = 1;
  // Minotaure (Hulk) : mode Berserker à l'apparition (talent).
  if (prm.berserkDuration) u.counters.berserkFor = prm.berserkDuration;
  if (prm.chargeStart) u.counters.charges = prm.chargeStart;
}

function dec(v: number | undefined, by = DT): number | undefined {
  if (v === undefined || v <= 0) return v;
  return Math.max(0, v - by);
}

function tickTimers(ctx: Ctx, player: number, u: SimUnit): void {
  const s = u.status;
  s.stunnedFor = dec(s.stunnedFor);
  s.sleepingFor = dec(s.sleepingFor);
  s.hypnotizedFor = dec(s.hypnotizedFor);
  if (s.stunnedFor === 0) delete s.stunnedFor;
  if (s.sleepingFor === 0) delete s.sleepingFor;
  if (s.hypnotizedFor === 0) delete s.hypnotizedFor;
  if (s.transformedInto) {
    s.transformFor = dec(s.transformFor);
    if (!s.transformFor || s.transformFor <= EPS) {
      delete s.transformedInto;
      delete s.transformFor;
      const prm = unitParams(ctx, player, u.unit);
      if (prm.abilityCooldown) u.counters.cd = abilityCd(prm, u.rank);
    }
  }
  const c = u.counters;
  for (const k of ['binaryFor', 'hasteFor', 'boostFor', 'restoredFor', 'immuneFor', 'powerFor', 'weakenFor', 'hurricaneFor', 'buffFor', 'killManaFor', 'berserkFor', 'rockfallFor'] as const) {
    if ((c[k] ?? 0) > 0) c[k] = Math.max(0, (c[k] ?? 0) - DT);
  }
  const rate = cooldownRate(ctx, player, effectiveId(u));
  if (c.cd !== undefined && c.cd > 0) c.cd = Math.max(0, c.cd - DT * rate);
  growOverTime(ctx, player, u, DT);
}

/** Talent de Raiponce (Meule) : retire les effets de boss des unités voisines. */
function cleanse(ctx: Ctx, player: number): void {
  const grid = ctx.st.players[player]!.grid;
  for (let i = 0; i < GRID_SIZE; i++) {
    const r = grid[i];
    if (!r) continue;
    const prm = unitParams(ctx, player, effectiveId(r));
    if (!prm.cleanseNeighbors) continue;
    for (const j of neighbors(i, !!prm.auraDiagonal)) {
      const n = grid[j];
      if (!n) continue;
      delete n.status.stunnedFor;
      delete n.status.sleepingFor;
      delete n.status.hypnotizedFor;
    }
  }
}

/** Plus de 3 coups par tick n'ont pas de sens visuel : au-delà, la cadence est plafonnée (60 coups/s). */
const MAX_ATTACKS_PER_TICK = 3;

export function updateUnits(ctx: Ctx, player: number): void {
  const p = ctx.st.players[player]!;
  cleanse(ctx, player);
  const units = p.grid.filter((u): u is SimUnit => !!u);
  for (const u of units) {
    const slot = p.grid.indexOf(u);
    if (slot < 0) continue; // détruite pendant ce tick
    tickTimers(ctx, player, u);
    const id = effectiveId(u);
    const def = effectiveDef(u);
    if ((u.counters.rockfallFor ?? 0) > EPS) rockfall(ctx, player, slot, u);
    if (u.counters.potion) { delete u.counters.potion; potion(ctx, player, slot, u); }
    const disabled = isDisabled(u);
    let enemies = aliveAll(ctx);
    if (!disabled && (u.counters.cd ?? 1) <= EPS) {
      const res = timedAbility(ctx, player, slot, u, enemies, inRange(ctx, player, slot, u, enemies));
      if (res !== false) {
        u.counters.cd = abilityCd(unitParams(ctx, player, id), u.rank) + (typeof res === 'number' ? res : 0);
        enemies = aliveAll(ctx);
      }
    }
    // Soutiens « sans cible » de Rush Royale (Statue, Bannière, Meule) : pas d'attaque.
    if (def.damage <= 0) continue;
    // Le reste négatif de la recharge permet plusieurs coups dans un tick (cadences élevées des rangs hauts).
    u.cooldown -= DT * attackSpeedOf(ctx, player, slot, u);
    if (disabled || enemies.length === 0) { u.cooldown = Math.max(0, u.cooldown); continue; }
    u.cooldown = Math.max(-def.attackInterval * MAX_ATTACKS_PER_TICK, u.cooldown);
    if (u.cooldown > EPS) continue;
    for (let n = 0; n < MAX_ATTACKS_PER_TICK && u.cooldown <= EPS; n++) {
      const pool = inRange(ctx, player, slot, u, enemies);
      // Aucun ennemi dans la zone : l'attaque reste prête (pas de coup dans le vide).
      if (pool.length === 0) { u.cooldown = Math.max(0, u.cooldown); break; }
      performAttack(ctx, player, slot, u, enemies, pool);
      const team = teamFor(ctx, player, id);
      if (team.doubleAttackChance > 0 && rand(ctx) < team.doubleAttackChance) {
        const again = aliveAll(ctx);
        const againPool = inRange(ctx, player, slot, u, again);
        if (againPool.length > 0) performAttack(ctx, player, slot, u, again, againPool);
      }
      u.cooldown += def.attackInterval;
      enemies = aliveAll(ctx);
      if (enemies.length === 0) { u.cooldown = Math.max(0, u.cooldown); break; }
    }
  }
}

// ───────────── Effets de plateau (fusion, arrivée) ─────────────

/**
 * Tesla (Iron Man) : une fusion ou une montée de rang sur la case `slot` charge les Iron Man voisins
 * (charges au plus = rang × chargeMax).
 */
export function onRankUp(ctx: Ctx, player: number, slot: number): void {
  const grid = ctx.st.players[player]!.grid;
  for (const j of neighbors(slot, false)) {
    const n = grid[j];
    if (!n) continue;
    const prm = unitParams(ctx, player, effectiveId(n));
    if (!prm.chargeDamage) continue;
    const max = Math.max(1, (prm.chargeMax ?? 1) * n.rank);
    const before = n.counters.charges ?? 0;
    n.counters.charges = Math.min(max, before + 1);
    if (n.counters.charges >= max && before < max) abilityEvent(ctx, player, j, effectiveId(n), 'Surcharge Arc', []);
  }
}

/** Minotaure (Hulk) : deux Hulk fusionnés lancent un Éboulement depuis la case de la fusion. */
export function startRockfall(ctx: Ctx, player: number, merged: SimUnit): void {
  const prm = unitParams(ctx, player, 'hulk');
  merged.counters.rockfallFor = prm.rockfallDuration ?? 4;
  merged.counters.rockfallTick = 0;
}

function rockfall(ctx: Ctx, player: number, slot: number, u: SimUnit): void {
  const c = u.counters;
  c.rockfallTick = (c.rockfallTick ?? 0) + DT;
  if (c.rockfallTick < 1 - EPS) return;
  c.rockfallTick -= 1;
  const prm = unitParams(ctx, player, 'hulk');
  const range = unitRange(UNITS.hulk);
  const zone = aliveAll(ctx).filter((e) => ctx.debugNoRange
    || inReach(slot, range, enemyGridPos(ctx.geo, player, e.lane, e.distance, laneLength(ctx, e.lane))));
  for (const e of zone) {
    const lost = e.maxHp - e.hp;
    if (lost > 0) unitHit(ctx, player, u, e, lost * (prm.rockfallLostHp ?? 0.05), { noOnHit: true });
  }
  if (zone.length) abilityEvent(ctx, player, slot, 'hulk', 'Éboulement', zone);
}

/** Chaudron magique (Nemo) : une potion au hasard quand il arrive sur le plateau. */
function potion(ctx: Ctx, player: number, slot: number, u: SimUnit): void {
  const prm = unitParams(ctx, player, effectiveId(u));
  const p = ctx.st.players[player]!;
  const brews = 1 + (rand(ctx) < (prm.potionTwice ?? 0) ? 1 : 0);
  for (let b = 0; b < brews; b++) {
    const kind = Math.min(3, Math.floor(rand(ctx) * 4));
    const enemies = inRange(ctx, player, slot, u, aliveAll(ctx));
    let targets: SimEnemy[] = [];
    if (kind === 0) {
      const allies = p.grid.filter((x): x is SimUnit => !!x && x !== u);
      const ally = pick(ctx, allies);
      if (ally) {
        ally.counters.buff = prm.potionBuff ?? 0.25;
        ally.counters.buffFor = prm.potionBuffDuration ?? 15;
      }
    } else if (kind === 1) {
      targets = pickMany(ctx, enemies, Math.max(1, Math.round(prm.potionTargets ?? 3)));
      const d = baseDamage(ctx, player, slot, u) * (prm.potionDamage ?? 3);
      for (const e of targets) unitHit(ctx, player, u, e, d, { noOnHit: true });
    } else if (kind === 2) {
      u.counters.killMana = prm.potionKillMana ?? 0.5;
      u.counters.killManaFor = prm.potionKillManaDuration ?? 10;
    } else {
      targets = enemies;
      for (const e of targets) applySlow(ctx, e, prm.potionSlow ?? 0.5, (prm.potionSlowDuration ?? 3) * controlMul(ctx, player, effectiveId(u)));
    }
    if (prm.potionRankUp && rand(ctx) < prm.potionRankUp) {
      const up = pick(ctx, p.grid.filter((x): x is SimUnit => !!x && x !== u && x.rank < MAX_RANK));
      if (up) { up.rank += 1; onRankUp(ctx, player, p.grid.indexOf(up)); }
    }
    abilityEvent(ctx, player, slot, effectiveId(u), POTIONS[kind]!, targets);
  }
}

const POTIONS = ['Potion de force', 'Potion explosive', 'Potion de mana', 'Potion de lenteur'];

// ───────────── Compétences à recharge ─────────────

function abilityEvent(ctx: Ctx, player: number, slot: number, unit: UnitId, name: string, targets: SimEnemy[] | number[]): void {
  emit(ctx, {
    type: 'ability', player: ctx.st.players[player]!.id, slot, unit, name,
    targets: targets.map((t) => (typeof t === 'number' ? t : t.uid)),
  });
}

const displaceable = (e: SimEnemy) => !e.bossId && !e.x.mini && !e.x.flying;
const notBoss = (e: SimEnemy) => !e.bossId && !e.x.mini;

/**
 * Déclenche la compétence à recharge. Renvoie false si elle n'a pas pu partir (on réessaie au
 * tick suivant), true sinon, ou un nombre de secondes ajouté à la recharge (Ouragan de Vaïana).
 */
function timedAbility(ctx: Ctx, player: number, slot: number, u: SimUnit, all: SimEnemy[], enemies: SimEnemy[]): boolean | number {
  const id = effectiveId(u);
  const prm = unitParams(ctx, player, id);
  const ctrl = controlMul(ctx, player, id);
  const scale = UNITS[id].damage > 0 ? baseDamage(ctx, player, slot, u) / UNITS[id].damage : 1;
  switch (id) {
    case 'spiderman': {
      // Trappeur : filets lancés sur des ennemis au hasard de la zone.
      const centers = pickMany(ctx, enemies, Math.max(1, Math.round(prm.nets ?? 2)));
      if (centers.length === 0) return false;
      const hit = new Set<SimEnemy>();
      for (const c of centers) for (const e of [c, ...within(ctx, all, c, prm.netRadius ?? 1)]) hit.add(e);
      const targets = [...hit].filter(isAlive);
      emit(ctx, { type: 'attack', player: ctx.st.players[player]!.id, slot, unit: id, targets: targets.map((e) => e.uid), fx: 'spiderman:toile' });
      for (const e of targets) {
        unitHit(ctx, player, u, e, (prm.netDamage ?? 0) * scale, { noOnHit: true });
        if (!isAlive(e)) continue;
        applySlow(ctx, e, prm.netSlow ?? 0.3, (prm.netDuration ?? 5) * ctrl);
        e.x.netStacks = Math.min(Math.max(1, Math.round(prm.netMaxStacks ?? 3)), ((e.x.netFor ?? 0) > EPS ? e.x.netStacks ?? 0 : 0) + 1);
        e.x.netFor = (prm.netDuration ?? 5) * ctrl;
        e.x.netVuln = Math.max(e.x.netVuln ?? 0, prm.netVuln ?? 0.1);
        if (prm.netStun) applyStun(e, prm.netStun * ctrl);
      }
      abilityEvent(ctx, player, slot, id, 'Toiles', targets);
      return true;
    }
    case 'hulk': {
      // Minotaure : Séisme autour de l'ennemi de tête (pas pendant le Berserker « vitesse »).
      if (prm.berserkSpeed && (u.counters.berserkFor ?? 0) > EPS) return true;
      const lead = bestBy(enemies, (e) => progress(ctx, e));
      if (!lead) return false;
      const zone = [lead, ...within(ctx, all, lead, prm.quakeRadius ?? 1.5)].filter(isAlive);
      const berserk = (u.counters.berserkFor ?? 0) > EPS ? 1 + (prm.berserkQuake ?? 0) : 1;
      const dps = baseDamage(ctx, player, slot, u) * (prm.quakeDps ?? 1) * berserk;
      emit(ctx, { type: 'attack', player: ctx.st.players[player]!.id, slot, unit: id, targets: zone.map((e) => e.uid), fx: 'hulk:smash' });
      for (const e of zone) {
        applySlow(ctx, e, prm.quakeSlow ?? 0.3, (prm.quakeDuration ?? 3) * ctrl);
        if (prm.quakeStun) applyStun(e, prm.quakeStun * ctrl);
        e.x.bleed = Math.max((e.x.bleedFor ?? 0) > EPS ? e.x.bleed ?? 0 : 0, dps);
        e.x.bleedFor = prm.quakeDuration ?? 3;
        e.x.bleedBy = player;
      }
      abilityEvent(ctx, player, slot, id, 'Séisme', zone);
      return true;
    }
    case 'thor': {
      // Talent « Marteau de la foi » (Inquisitrice de Rush Royale) : coup lourd qui étourdit.
      if (!prm.hammerDamage) return true;
      const lead = bestBy(enemies, (e) => progress(ctx, e));
      if (!lead) return false;
      const zone = [lead, ...within(ctx, all, lead, 1)].filter(isAlive);
      emit(ctx, { type: 'attack', player: ctx.st.players[player]!.id, slot, unit: id, targets: zone.map((e) => e.uid), fx: 'thor:chaine' });
      for (const e of zone) {
        unitHit(ctx, player, u, e, baseDamage(ctx, player, slot, u) * prm.hammerDamage, { noOnHit: true });
        if (isAlive(e)) applyStun(e, (prm.hammerStun ?? 1) * ctrl);
      }
      abilityEvent(ctx, player, slot, id, 'Marteau de la foi', zone);
      return true;
    }
    case 'moana': {
      // Archer du vent : Ouragan ; la recharge repart à la fin de l'Ouragan.
      const d = (prm.hurricaneDuration ?? 3.6) + (prm.hurricaneDurationPerRank ?? 0) * (u.rank - 1);
      u.counters.hurricaneFor = d;
      abilityEvent(ctx, player, slot, id, 'Ouragan', []);
      return d;
    }
    case 'maui': {
      // Borée : alterne les phases (faucon : cadence ; requin : cadence et critiques).
      const shark = u.counters.form ? 0 : 1;
      u.counters.form = shark;
      emit(ctx, { type: 'ability', player: ctx.st.players[player]!.id, slot, unit: 'maui', name: shark ? 'Métamorphose : requin' : 'Métamorphose : faucon', targets: [] });
      return true;
    }
    case 'ariel': {
      // Stase : sphères qui figent les ennemis autour d'un ennemi au hasard (sauf boss).
      const n = Math.max(1, Math.round(prm.stasisTargets ?? 1));
      const centers = pickMany(ctx, enemies, n);
      if (centers.length === 0) return false;
      const hit = new Set<SimEnemy>();
      for (const c of centers) for (const e of [c, ...within(ctx, all, c, prm.stasisRadius ?? 1)]) hit.add(e);
      const targets = [...hit].filter(isAlive);
      const dur = (prm.stasisDuration ?? 2.5) * ctrl;
      for (const e of targets) {
        if (notBoss(e)) applyStun(e, dur);
        else if (prm.stasisBossSlow) applySlow(ctx, e, prm.stasisBossSlow, dur);
        if (prm.stasisDamage) unitHit(ctx, player, u, e, baseDamage(ctx, player, slot, u) * prm.stasisDamage, { noOnHit: true });
      }
      abilityEvent(ctx, player, slot, id, 'Chant de sirène', targets);
      return true;
    }
    case 'nemo': {
      // Chaudron magique : du mana à intervalle régulier.
      const p = ctx.st.players[player]!;
      p.mana += Math.round((prm.manaPerRank ?? 5) * u.rank);
      abilityEvent(ctx, player, slot, id, 'Mémoire de poisson', []);
      return true;
    }
    default:
      return dcTimedAbility(ctx, player, slot, u, enemies);
  }
}

/** Expose un ennemi : +x de dégâts subis (garde la marque la plus forte et la plus longue). */
function expose(e: SimEnemy, value: number, duration: number): void {
  const active = (e.effects.markedFor ?? 0) > EPS;
  e.effects.marked = Math.max(active ? e.effects.marked ?? 0 : 0, value);
  e.effects.markedFor = Math.max(active ? e.effects.markedFor ?? 0 : 0, duration);
}

/** Événement d'attaque pour l'effet visuel d'une compétence (comme l'Uni-Beam). */
function fxEvent(ctx: Ctx, player: number, slot: number, unit: UnitId, targets: SimEnemy[], fx: string): void {
  emit(ctx, { type: 'attack', player: ctx.st.players[player]!.id, slot, unit, targets: targets.map((e) => e.uid), fx });
}

const isBossLike = (e: SimEnemy) => !!e.bossId || !!e.x.mini;

/** Compétences à recharge des héros DC (même contrat que timedAbility). */
function dcTimedAbility(ctx: Ctx, player: number, slot: number, u: SimUnit, enemies: SimEnemy[]): boolean | number {
  const id = effectiveId(u);
  const prm = unitParams(ctx, player, id);
  const ctrl = controlMul(ctx, player, id);
  const n = (v: number | undefined, d: number) => Math.max(1, Math.round(v ?? d));
  switch (id) {
    case 'batman': {
      const lead = bestBy(enemies, (e) => progress(ctx, e));
      if (!lead) return false;
      const zone = prm.smokeGlobal ? enemies.slice() : [lead, ...within(ctx, enemies, lead, prm.smokeRadius ?? 2)];
      const dur = prm.smokeDuration ?? 3;
      for (const e of zone) {
        applySlow(ctx, e, prm.smokeSlow ?? 0.4, dur * ctrl);
        expose(e, prm.smokeMark ?? 0.2, dur);
        if (prm.smokeStun) applyStun(e, prm.smokeStun * ctrl);
      }
      fxEvent(ctx, player, slot, id, zone, 'batman:fumigene');
      abilityEvent(ctx, player, slot, id, 'Bombe fumigène', zone);
      return true;
    }
    case 'superman': {
      const targets = topBy(enemies, (e) => progress(ctx, e), n(prm.breathTargets, 4));
      if (targets.length === 0) return false;
      const dmg = baseDamage(ctx, player, slot, u) * (prm.breathDamage ?? 0);
      for (const e of targets) {
        if (isBossLike(e)) {
          applySlow(ctx, e, prm.breathBossSlow ?? 0.3, (prm.breathBossSlowDuration ?? 3) * ctrl);
        } else {
          applyStun(e, (prm.freezeDuration ?? 1.5) * ctrl);
          if (dmg > 0) unitHit(ctx, player, u, e, dmg, { noOnHit: true });
        }
      }
      fxEvent(ctx, player, slot, id, targets, 'superman:souffle');
      abilityEvent(ctx, player, slot, id, 'Souffle glacial', targets);
      return true;
    }
    case 'wonderwoman': {
      const targets = topBy(enemies, (e) => progress(ctx, e), n(prm.lassoTargets, 1));
      if (targets.length === 0) return false;
      for (const e of targets) {
        if (isBossLike(e)) expose(e, prm.lassoBossMark ?? 0.3, prm.lassoMarkDuration ?? 4);
        else applyStun(e, (prm.lassoStop ?? 1.5) * ctrl);
      }
      fxEvent(ctx, player, slot, id, targets, 'wonderwoman:lasso');
      abilityEvent(ctx, player, slot, id, 'Lasso de vérité', targets);
      return true;
    }
    case 'greenlantern': {
      if (enemies.length === 0) return false;
      const kinds = prm.constructAll ? [0, 1, 2] : [(u.counters.construct ?? 0) % 3];
      if (!prm.constructAll) u.counters.construct = (kinds[0]! + 1) % 3;
      const dmg = baseDamage(ctx, player, slot, u);
      for (const k of kinds) {
        const live = enemies.filter(isAlive);
        if (live.length === 0) break;
        if (k === 0) {
          const seg = segmentOf(ctx, bestBy(live, (e) => progress(ctx, e))!);
          const line = live.filter((e) => segmentOf(ctx, e) === seg);
          for (const e of line) applyStun(e, (prm.wallDuration ?? 1.5) * ctrl);
          fxEvent(ctx, player, slot, id, line, 'greenlantern:mur');
          abilityEvent(ctx, player, slot, id, 'Construction : mur', line);
        } else if (k === 1) {
          const strong = bestBy(live, (e) => e.hp)!;
          unitHit(ctx, player, u, strong, dmg * (prm.hammerDamage ?? 3), { noOnHit: true });
          if (isAlive(strong)) applyStun(strong, (prm.hammerStun ?? 1) * ctrl);
          fxEvent(ctx, player, slot, id, [strong], 'greenlantern:marteau');
          abilityEvent(ctx, player, slot, id, 'Construction : marteau', [strong]);
        } else {
          const shot: SimEnemy[] = [];
          for (let i = 0; i < n(prm.gatlingShots, 8); i++) {
            const t = pick(ctx, enemies.filter(isAlive));
            if (!t) break;
            unitHit(ctx, player, u, t, dmg * (prm.gatlingDamage ?? 0.6), { noOnHit: true });
            shot.push(t);
          }
          fxEvent(ctx, player, slot, id, shot, 'greenlantern:mitrailleuse');
          abilityEvent(ctx, player, slot, id, 'Construction : mitrailleuse', shot);
        }
      }
      return true;
    }
    case 'flash': {
      if (enemies.length === 0) return false;
      const dmg = baseDamage(ctx, player, slot, u) * (prm.lapDamage ?? 3);
      let touched: SimEnemy[] = [];
      for (let l = 0; l < n(prm.lapCount, 1); l++) {
        const live = enemies.filter(isAlive);
        for (const e of live) unitHit(ctx, player, u, e, dmg, { noOnHit: true });
        if (l === 0) touched = live;
      }
      fxEvent(ctx, player, slot, id, touched, 'flash:tour');
      abilityEvent(ctx, player, slot, id, 'Tour du chemin', touched);
      return true;
    }
    case 'aquaman': {
      const targets = topBy(enemies.filter((e) => !isBossLike(e)), (e) => progress(ctx, e), n(prm.krakenTargets, 2));
      if (targets.length === 0) return false;
      const dmg = baseDamage(ctx, player, slot, u) * (prm.krakenDamage ?? 1.5);
      for (const e of targets) {
        unitHit(ctx, player, u, e, dmg, { noOnHit: true });
        if (isAlive(e)) applyStun(e, (prm.krakenStop ?? 2) * ctrl);
      }
      fxEvent(ctx, player, slot, id, targets, 'aquaman:kraken');
      abilityEvent(ctx, player, slot, id, 'Kraken', targets);
      return true;
    }
    case 'cyborg': {
      if (enemies.length === 0) return false;
      const grid = ctx.st.players[player]!.grid;
      for (const a of grid) {
        if (!a) continue;
        const active = (a.counters.hasteFor ?? 0) > EPS;
        a.counters.haste = Math.max(active ? a.counters.haste ?? 0 : 0, prm.haste ?? 0.2);
        a.counters.hasteFor = Math.max(active ? a.counters.hasteFor ?? 0 : 0, prm.hasteDuration ?? 4);
        if (prm.surgeCooldown && a !== u && (a.counters.cd ?? 0) > 0) a.counters.cd = a.counters.cd! * (1 - prm.surgeCooldown);
      }
      abilityEvent(ctx, player, slot, id, 'Surcharge système', []);
      return true;
    }
    case 'shazam': {
      if (enemies.length === 0) return false;
      const bolts = pickMany(ctx, enemies, n(prm.boltTargets, 3));
      const dmg = baseDamage(ctx, player, slot, u) * (prm.boltDamage ?? 2);
      for (const e of bolts) unitHit(ctx, player, u, e, dmg, { noOnHit: true });
      u.counters.powerFor = prm.powerDuration ?? 6;
      fxEvent(ctx, player, slot, id, bolts, 'shazam:foudre');
      abilityEvent(ctx, player, slot, id, 'SHAZAM !', bolts);
      return true;
    }
    case 'martian': {
      const pool = enemies.filter((e) => !isBossLike(e) && (prm.telepathyFlying || !e.x.flying));
      const targets = topBy(pool, (e) => progress(ctx, e), n(prm.telepathyTargets, 2));
      if (targets.length === 0) return false;
      const dmg = baseDamage(ctx, player, slot, u) * (prm.telepathyDamage ?? 0);
      for (const e of targets) {
        if (dmg > 0) unitHit(ctx, player, u, e, dmg, { noOnHit: true });
        if (isAlive(e)) e.x.knockFor = Math.max(e.x.knockFor ?? 0, (prm.confuseDuration ?? 2) * ctrl);
      }
      abilityEvent(ctx, player, slot, id, 'Télépathie', targets);
      return true;
    }
    case 'batgirl': {
      const targets = topBy(enemies, (e) => e.hp, n(prm.hackTargets, 1));
      if (targets.length === 0) return false;
      for (const e of targets) {
        if (prm.hackShield) e.shieldHits = 0;
        e.effects.armorBreak = Math.max(e.effects.armorBreak ?? 0, prm.hackArmor ?? 0.3);
        if (prm.hackMark) expose(e, prm.hackMark, 4);
      }
      abilityEvent(ctx, player, slot, id, 'Piratage d’Oracle', targets);
      return true;
    }
    case 'greenarrow': {
      const targets = topBy(enemies, (e) => progress(ctx, e), n(prm.volleyArrows, 5));
      if (targets.length === 0) return false;
      const dmg = baseDamage(ctx, player, slot, u) * (prm.volleyDamage ?? 0.8);
      for (const e of targets) {
        unitHit(ctx, player, u, e, dmg, { noOnHit: true });
        if (prm.volleySplash) {
          for (const x of within(ctx, enemies, e, 1.5)) if (isAlive(x)) unitHit(ctx, player, u, x, dmg * prm.volleySplash, { noOnHit: true });
        }
      }
      fxEvent(ctx, player, slot, id, targets, 'greenarrow:salve');
      abilityEvent(ctx, player, slot, id, 'Salve de flèches', targets);
      return true;
    }
    default:
      return true;
  }
}

// ───────────── Attaques de base ─────────────

/**
 * Ennemis dans la zone de touche de l'unité posée sur `slot` (§4.1, « Portées d'attaque »).
 * La cible principale d'une attaque ou d'une compétence est toujours choisie dans cette liste ;
 * les effets secondaires (éclaboussures, rebonds, chaînes) suivent leurs propres règles, sur tout le chemin.
 */
export function inRange(ctx: Ctx, player: number, slot: number, u: SimUnit, enemies: SimEnemy[]): SimEnemy[] {
  const range = unitRange(effectiveDef(u));
  if (!Number.isFinite(range) || ctx.debugNoRange) return enemies;
  const out: SimEnemy[] = [];
  for (const e of enemies) {
    if (inReach(slot, range, enemyGridPos(ctx.geo, player, e.lane, e.distance, laneLength(ctx, e.lane)))) out.push(e);
  }
  return out;
}

/** Cible de l'attaque : ciblage de l'unité, avec les règles propres à certains profils Rush Royale. */
function chooseTarget(ctx: Ctx, player: number, u: SimUnit, pool: SimEnemy[]): SimEnemy | undefined {
  const def = effectiveDef(u);
  const prm = unitParams(ctx, player, def.id);
  // Pyrotechnicien (Mulan) : en nombre impair, cible au hasard.
  if (prm.oddSplash && countOnBoard(ctx, player, def.id) % 2 === 1) return selectTarget(ctx, pool, 'aleatoire');
  // Chimiste (Nick & Judy) : le premier ennemi qui n'est pas encore fiché.
  if (prm.vulnPerRank) {
    const fresh = pool.filter((e) => !(e.x.vuln ?? 0));
    return selectTarget(ctx, fresh.length ? fresh : pool, 'premier');
  }
  // Chasseur (Rebelle), talent : garde sa cible, en change tous les N tirs.
  if (prm.retargetEvery && u.counters.lastTarget !== undefined) {
    const keep = pool.find((e) => e.uid === u.counters.lastTarget);
    if (keep && (u.counters.sameShots ?? 0) < prm.retargetEvery) return keep;
  }
  return selectTarget(ctx, pool, def.targeting);
}

function performAttack(ctx: Ctx, player: number, slot: number, u: SimUnit, enemies: SimEnemy[], pool: SimEnemy[]): void {
  const def = effectiveDef(u);
  const id = def.id;
  const target = chooseTarget(ctx, player, u, pool);
  if (!target) return;
  const prm = unitParams(ctx, player, id);
  const c = u.counters;
  const fresh = c.lastTarget !== target.uid;
  // Croissance par coup (Inquisitrice) et rampe (talent du Minotaure) : remises à zéro au changement de cible.
  if (fresh) {
    if (prm.growthResetOnRetarget) c.growth = (c.growth ?? 0) * (prm.growthKeepOnRetarget ?? 0);
    c.ramp = 0;
    c.sameShots = 0;
  }
  c.sameShots = (c.sameShots ?? 0) + 1;
  const at = ctx.ev.length;
  c.attacks = (c.attacks ?? 0) + 1;
  const { targets, fx } = attackOf(ctx, player, slot, u, id, target, enemies, pool, fresh);
  c.lastTarget = target.uid;
  if (prm.growthPerHit) c.growth = (c.growth ?? 0) + prm.growthPerHit;
  if (prm.rampPerHit) c.ramp = Math.min(prm.rampMax ?? 4, (c.ramp ?? 0) + prm.rampPerHit);
  ctx.ev.splice(at, 0, {
    type: 'attack', player: ctx.st.players[player]!.id, slot, unit: id,
    targets: targets.map((e) => e.uid), fx,
  });
}

function attackOf(
  ctx: Ctx, player: number, slot: number, u: SimUnit, id: UnitId, target: SimEnemy, enemies: SimEnemy[], pool: SimEnemy[], fresh: boolean,
): { targets: SimEnemy[]; fx: string } {
  const prm = unitParams(ctx, player, id);
  const ctrl = controlMul(ctx, player, id);
  const c = u.counters;
  let dmg = baseDamage(ctx, player, slot, u);
  if ((c.buffFor ?? 0) > EPS) dmg *= 1 + (c.buff ?? 0);               // potion de force (Nemo)
  if (c.ramp) dmg *= 1 + c.ramp;                                         // talent Fureur (Hulk)
  if (prm.batPctHp) dmg += target.hp * prm.batPctHp;                    // talent Chauves-souris (Tiana)
  const hit = (e: SimEnemy, d: number, o?: { crit?: boolean; shieldBreak?: boolean; noOnHit?: boolean }) => unitHit(ctx, player, u, e, d, o);
  const splash = (center: SimEnemy, d: number, radius: number) => {
    const around = within(ctx, enemies, center, radius).filter(isAlive);
    for (const e of around) hit(e, d, { noOnHit: true });
    return around;
  };

  switch (id) {
    case 'ironman': {
      // Tesla : chargé (charges = plafond), le tir frappe aussi 4 ennemis de plus à 50 %.
      const max = Math.max(1, (prm.chargeMax ?? 1) * u.rank);
      hit(target, dmg);
      if ((c.charges ?? 0) >= max) {
        const more = nearest(ctx, enemies.filter(isAlive), target, Math.max(0, Math.round(prm.chargedExtraTargets ?? 4)), new Set([target.uid]));
        for (const e of more) hit(e, dmg * (prm.chargedSplash ?? 0.5));
        return { targets: [target, ...more], fx: 'ironman:unibeam' };
      }
      return { targets: [target], fx: 'ironman:repulseur' };
    }
    case 'hulk': {
      hit(target, dmg);
      // Berserker « vitesse » (talent) : zone égale aux dégâts du Séisme.
      if (prm.berserkSpeed && (c.berserkFor ?? 0) > EPS) {
        const around = splash(target, dmg * (prm.quakeDps ?? 1), prm.quakeRadius ?? 1.5);
        return { targets: [target, ...around], fx: 'hulk:smash' };
      }
      return { targets: [target], fx: 'hulk:coup' };
    }
    case 'thor': {
      // Thunderer : 1 rebond de plus par rang.
      const n = 1 + Math.round((prm.chainPerRank ?? 1) * u.rank) + Math.round(prm.chainExtra ?? 0) + (ctx.mods.chainBounces ?? 0);
      const chain = [target];
      const seen = new Set([target.uid]);
      let cur = target;
      while (chain.length < n) {
        const next = nearest(ctx, enemies.filter(isAlive), cur, 1, seen)[0];
        if (!next) break;
        chain.push(next);
        seen.add(next.uid);
        cur = next;
      }
      const info = ctx.info[player]!;
      chain.forEach((e, i) => {
        hit(e, i === 0 ? dmg : dmg * (prm.chainDamage ?? 1));
        if (i > 0 && prm.chainStun && isAlive(e)) applyStun(e, prm.chainStun * ctrl);
        if (isAlive(e) && info.chainIllusionChance > 0 && rand(ctx) < info.chainIllusionChance && displaceable(e)) {
          e.x.knockFor = info.illusionDuration;
        }
      });
      return { targets: chain, fx: 'thor:chaine' };
    }
    case 'strange': {
      // Mage du portail : chance de renvoyer la cible au début du chemin, de moins en moins sur la même.
      hit(target, dmg);
      if (isAlive(target) && displaceable(target)) {
        const chance = (prm.teleportChance ?? 0.05) * Math.pow(prm.teleportDecay ?? 0.5, target.x.teleports ?? 0);
        if (rand(ctx) < chance) {
          sendToStart(target);
          delete target.x.knockFor;
          target.x.teleports = (target.x.teleports ?? 0) + 1;
          if (prm.portalDamage) hit(target, dmg * prm.portalDamage, { noOnHit: true });
          if (prm.teleportSlow && isAlive(target)) applySlow(ctx, target, prm.teleportSlow, 3 * ctrl);
          abilityEvent(ctx, player, slot, id, 'Portail', [target]);
        }
      }
      return { targets: [target], fx: 'strange:magie' };
    }
    case 'venom': {
      // Inquisitrice : la croissance par coup est dans `dmg` ; active (1, 4, 7, 10 exemplaires) : zone.
      hit(target, dmg);
      if (prm.executeThreshold && isAlive(target) && !target.bossId && !target.x.mini && target.hp / target.maxHp < prm.executeThreshold) {
        killEnemy(ctx, target, player, u);
        abilityEvent(ctx, player, slot, id, 'Dévorer', [target]);
      }
      if (prm.activeCounts && inquisitorActive(ctx, player, id)) {
        const around = splash(target, dmg * (prm.activeSplash ?? 0.5), prm.activeSplashRadius ?? 1.5);
        return { targets: [target, ...around], fx: 'venom:devorer' };
      }
      return { targets: [target], fx: 'venom:griffes' };
    }
    case 'cmarvel': {
      // Mage de feu : explosion autour de la cible.
      hit(target, dmg);
      const around = splash(target, dmg * (prm.splash ?? 0.78), prm.splashRadius ?? 1.2);
      return { targets: [target, ...around], fx: 'cmarvel:rafale' };
    }
    case 'loki': {
      hit(target, dmg);
      const zone = formationSplash(ctx, player, slot, u);
      if (zone > 0) splash(target, dmg * zone, 1.5);
      return { targets: [target], fx: 'loki:dague' };
    }
    case 'bucky': {
      // Voleur : bonus aléatoire jusqu'aux dégâts critiques.
      const bonus = rand(ctx) * Math.max(0, (prm.rogueCritMul ?? 3) - 1);
      const crit = bonus >= 1;
      hit(target, dmg * (1 + bonus), { crit });
      return { targets: [target], fx: crit ? 'bucky:critique' : 'bucky:tir' };
    }
    case 'hawkeye': {
      // Archer ; talents de Rush Royale : flèches empoisonnées (2 cibles au hasard) ou explosives.
      hit(target, dmg);
      if (prm.poisonArrowChance && rand(ctx) < prm.poisonArrowChance) {
        const extra = pickMany(ctx, enemies.filter((e) => isAlive(e) && e !== target), 2);
        for (const e of extra) hit(e, dmg);
        return { targets: [target, ...extra], fx: 'hawkeye:glace' };
      }
      if (prm.explosiveArrowChance && rand(ctx) < prm.explosiveArrowChance) {
        const center = pick(ctx, enemies.filter(isAlive));
        if (center) {
          hit(center, dmg, { noOnHit: true });
          const around = splash(center, dmg, 1.5);
          return { targets: [target, center, ...around], fx: 'hawkeye:explosive' };
        }
      }
      return { targets: [target], fx: 'hawkeye:electrique' };
    }
    case 'widow': {
      hit(target, dmg);
      return { targets: [target], fx: 'widow:tir' };
    }
    case 'shangchi': {
      hit(target, dmg);
      return { targets: [target], fx: (prm.aloneAttackSpeed && !hasNeighborTwin(ctx, player, slot, id)) ? 'shangchi:anneaux' : 'shangchi:combo' };
    }
    case 'maui': {
      // Borée, phase 2 (requin) : critiques, talents de double flèche et de pluie de flèches.
      if (c.form) {
        const crit = rand(ctx) < (prm.sharkCritChance ?? 0);
        hit(target, crit ? dmg * (prm.sharkCritMul ?? 2) : dmg, { crit });
        const out = [target];
        if (prm.sharkDoubleArrow && rand(ctx) < prm.sharkDoubleArrow) {
          const other = pick(ctx, enemies.filter((e) => isAlive(e) && e !== target));
          if (other) { hit(other, dmg); if (isAlive(other)) applySlow(ctx, other, 0.3, 2 * ctrl); out.push(other); }
        }
        if (prm.sharkRain && rand(ctx) < prm.sharkRain) {
          const rain = pickMany(ctx, enemies.filter(isAlive), 3);
          for (const e of rain) hit(e, dmg * 2 * (prm.sharkCritMul ?? 2), { crit: true, noOnHit: true });
          out.push(...rain);
        }
        return { targets: out, fx: 'maui:requin' };
      }
      hit(target, dmg);
      return { targets: [target], fx: 'maui:faucon' };
    }
    case 'mulan': {
      // Pyrotechnicien : zone en nombre impair (rayon qui grandit avec le rang).
      hit(target, dmg);
      if (prm.oddSplash && countOnBoard(ctx, player, id) % 2 === 1) {
        const r = (prm.oddRadius ?? 0.8) + (prm.oddRadiusPerRank ?? 0.1) * u.rank;
        const around = splash(target, dmg * prm.oddSplash, r);
        return { targets: [target, ...around], fx: 'mulan:avalanche' };
      }
      return { targets: [target], fx: 'mulan:souffle' };
    }
    case 'merida': {
      // Chasseur : premier tir renforcé sur chaque nouvelle cible.
      let d = dmg * (1 + (c.trophies ?? 0) * (prm.bossTrophy ?? 0));
      let crit = false;
      if (fresh) {
        let bonus = (prm.firstShotBonus ?? 2.1) + (prm.firstShotBonusPerRank ?? 0) * (u.rank - 1);
        if (prm.firstShotExtraChance && rand(ctx) < prm.firstShotExtraChance) bonus += prm.firstShotExtra ?? 1.5;
        d *= 1 + bonus;
        crit = true;
      }
      if (prm.critFromRank && u.rank >= prm.critFromRank && rand(ctx) < (prm.critChanceBonus ?? 0.1)) { d *= 2; crit = true; }
      const wasBoss = !!(target.bossId || target.x.mini);
      hit(target, d, { crit });
      if (wasBoss && !isAlive(target) && prm.bossTrophy) c.trophies = (c.trophies ?? 0) + 1;
      const out = [target];
      if (prm.splashFromRank && u.rank >= prm.splashFromRank) out.push(...splash(target, d * (prm.rankSplash ?? 0.5), 1.2));
      if (prm.acornChance && rand(ctx) < prm.acornChance) {
        const e = pick(ctx, enemies.filter(isAlive));
        if (e) { hit(e, dmg, { noOnHit: true }); out.push(e); }
      }
      return { targets: out, fx: 'merida:tir-parfait' };
    }
    case 'ariel': {
      hit(target, dmg);
      return { targets: [target], fx: 'ariel:bulles' };
    }
    case 'foxhound': {
      const n = Math.max(1, Math.round(prm.hits ?? 2));
      hit(target, dmg);
      const out = [target];
      for (let k = 1; k < n; k++) {
        if (isAlive(target)) { hit(target, dmg * (1 + (prm.secondHitBonus ?? 0.5))); continue; }
        const next = selectTarget(ctx, pool.filter(isAlive), 'premier');
        if (next) { hit(next, dmg); out.push(next); }
      }
      return { targets: out, fx: 'foxhound:double' };
    }
    case 'nickjudy': {
      // Chimiste : la cible subit plus de dégâts jusqu'à sa mort.
      hit(target, dmg);
      if (isAlive(target)) target.x.vuln = Math.max(target.x.vuln ?? 0, (prm.vulnPerRank ?? 0.05) * u.rank);
      return { targets: [target], fx: 'nickjudy:carotte' };
    }
    case 'buzzwoody': {
      hit(target, dmg);
      return { targets: [target], fx: 'buzzwoody:laser' };
    }
    case 'vanralph': {
      hit(target, dmg);
      return { targets: [target], fx: 'vanralph:poing' };
    }
    case 'spiderman': {
      hit(target, dmg);
      return { targets: [target], fx: 'spiderman:toile' };
    }
    case 'nemo': {
      hit(target, dmg);
      return { targets: [target], fx: 'nemo:ralenti' };
    }
    // ───────────── Extension DC ─────────────
    case 'batman': {
      if ((c.attacks ?? 0) % Math.max(1, Math.round(prm.batarangEvery ?? 3)) === 0) {
        const n = Math.max(1, Math.round(prm.batarangTargets ?? 3));
        const list = [target, ...nearest(ctx, enemies.filter(isAlive), target, n - 1, new Set([target.uid]))];
        for (const e of list) hit(e, dmg * (prm.batarangDamage ?? 0.8));
        abilityEvent(ctx, player, slot, id, 'Batarangs', list);
        return { targets: list, fx: 'batman:batarangs' };
      }
      hit(target, dmg);
      return { targets: [target], fx: 'batman:batarang' };
    }
    case 'wonderwoman': {
      hit(target, dmg);
      const around = splash(target, dmg * (prm.splash ?? 0.3), prm.splashRadius ?? 1);
      return { targets: [target, ...around], fx: 'wonderwoman:epee' };
    }
    case 'flash': {
      const list: SimEnemy[] = [];
      let t: SimEnemy | undefined = target;
      for (let i = 0; i < Math.max(1, Math.round(prm.hitsPerAttack ?? 3)); i++) {
        if (!t || !isAlive(t)) t = selectTarget(ctx, enemies.filter(isAlive), 'premier');
        if (!t) break;
        hit(t, dmg);
        if (!list.includes(t)) list.push(t);
      }
      return { targets: list, fx: 'flash:eclair' };
    }
    case 'aquaman': {
      const p0 = progress(ctx, target);
      hit(target, dmg);
      const behind = enemies
        .filter((e) => e !== target && isAlive(e) && progress(ctx, e) <= p0)
        .sort((a, b) => progress(ctx, b) - progress(ctx, a) || a.uid - b.uid)
        .slice(0, Math.max(1, Math.round(prm.pierceTargets ?? 1)));
      for (const e of behind) hit(e, dmg * (prm.pierce ?? 0.5), { noOnHit: true });
      return { targets: [target, ...behind], fx: 'aquaman:trident' };
    }
    case 'cyborg': {
      hit(target, dmg);
      if (isAlive(target) && prm.armorBreak) target.effects.armorBreak = Math.max(target.effects.armorBreak ?? 0, prm.armorBreak);
      return { targets: [target], fx: 'cyborg:canon-sonique' };
    }
    case 'supergirl': {
      // Croissance (archétype) : déjà comprise dans `dmg` (baseDamage, growthBonus).
      const max = Math.max(1, Math.round(prm.maxCharges ?? 8));
      const d = dmg;
      hit(target, d);
      if ((c.solar ?? 0) >= max) {
        const seg = segmentOf(ctx, target);
        const zone = enemies.filter((e) => isAlive(e) && (prm.flareGlobal || segmentOf(ctx, e) === seg));
        for (const e of zone) {
          hit(e, d * (prm.flareDamage ?? 4), { noOnHit: true });
          if (prm.flareStun && isAlive(e)) applyStun(e, prm.flareStun * ctrl);
        }
        c.solar = 0;
        abilityEvent(ctx, player, slot, id, 'Éruption solaire', zone);
        return { targets: [target, ...zone.filter((e) => e !== target)], fx: 'supergirl:eruption' };
      }
      return { targets: [target], fx: 'supergirl:poing' };
    }
    case 'shazam': {
      if ((c.powerFor ?? 0) <= EPS) {
        hit(target, dmg);
        return { targets: [target], fx: 'shazam:coup' };
      }
      const d = dmg * (prm.powerMul ?? 2);
      hit(target, d);
      const chain = nearest(ctx, enemies.filter(isAlive), target, Math.max(0, Math.round(prm.powerChain ?? 2)), new Set([target.uid]));
      for (const e of chain) hit(e, d * (prm.powerChainDamage ?? 0.6), { noOnHit: true });
      return { targets: [target, ...chain], fx: 'shazam:foudre' };
    }
    case 'robin': {
      const grid = ctx.st.players[player]!.grid;
      const mentor = !!prm.mentorAlways || neighbors(slot, true).some((j) => {
        const nb = grid[j];
        return !!nb && (effectiveId(nb) === 'batman' || effectiveId(nb) === 'batgirl');
      });
      const d = mentor ? dmg * (1 + (prm.mentorBonus ?? 0.2)) : dmg;
      if ((c.attacks ?? 0) % Math.max(1, Math.round(prm.sweepEvery ?? 3)) === 0) {
        const n = Math.max(1, Math.round(prm.sweepTargets ?? 2));
        const list = [target, ...nearest(ctx, enemies.filter(isAlive), target, n - 1, new Set([target.uid]))];
        for (const e of list) hit(e, d);
        return { targets: list, fx: 'robin:balayage' };
      }
      hit(target, d);
      return { targets: [target], fx: 'robin:baton' };
    }
    case 'catwoman': {
      // Mana par élimination (archétype) : la marque est posée par unitHit (tagForMana).
      hit(target, dmg);
      if ((c.attacks ?? 0) % Math.max(1, Math.round(prm.whipEvery ?? 5)) === 0 && isAlive(target)) {
        applySlow(ctx, target, prm.whipSlow ?? 0.3, (prm.whipDuration ?? 2) * ctrl);
      }
      return { targets: [target], fx: 'catwoman:fouet' };
    }
    case 'harley': {
      const names = ['maillet', 'confettis', 'tarte', 'oups'];
      const effects: number[] = [];
      for (let i = 0; i < Math.max(1, Math.round(prm.effectsPerHit ?? 1)); i++) {
        const k = randInt(ctx, 4);
        effects.push(k === 3 && prm.noOops ? 0 : k);
      }
      let d = dmg;
      if (effects.includes(0)) d *= prm.malletMul ?? 2.5;
      if (effects.includes(3)) d *= prm.oopsMul ?? 0.5;
      hit(target, d);
      const targets = [target];
      for (const k of new Set(effects)) {
        if (k === 0 && isAlive(target)) pushBack(ctx, target, prm.malletKnockback ?? 1);
        if (k === 1) targets.push(...splash(target, d * (prm.confettiSplash ?? 0.6), prm.splashRadius ?? 1.5));
        if (k === 2 && isAlive(target)) applyStun(target, (prm.pieStun ?? 1) * ctrl);
      }
      return { targets, fx: `harley:${names[effects[0]!]}` };
    }
    case 'greenlantern': {
      hit(target, dmg);
      // Formation (archétype) : 3 Green Lantern alignés, le rayon de l'anneau devient une attaque de zone.
      const zone = formationSplash(ctx, player, slot, u);
      const around = zone > 0 ? splash(target, dmg * zone, 1.5) : [];
      return { targets: [target, ...around], fx: 'greenlantern:anneau' };
    }
    case 'greenarrow': {
      hit(target, dmg);
      if ((c.attacks ?? 0) % Math.max(1, Math.round(prm.netEvery ?? 4)) === 0 && isAlive(target)) {
        applyStun(target, (prm.netDuration ?? 1) * ctrl);
        return { targets: [target], fx: 'greenarrow:filet' };
      }
      return { targets: [target], fx: 'greenarrow:fleche' };
    }
    default: {
      // falcon, moana, tiana, coco, superman (brûlure générique), martian, batgirl… : coup simple.
      hit(target, dmg);
      return { targets: [target], fx: `${id}:${BASE_FX[id] ?? 'tir'}` };
    }
  }
}

function hasNeighborTwin(ctx: Ctx, player: number, slot: number, unit: UnitId): boolean {
  const grid = ctx.st.players[player]!.grid;
  return neighbors(slot, false).some((j) => { const n = grid[j]; return !!n && effectiveId(n) === unit; });
}

const BASE_FX: Partial<Record<UnitId, string>> = {
  ironman: 'repulseur', strange: 'magie', falcon: 'tir-aerien', moana: 'rame', pocahontas: 'feuilles',
  tiana: 'luciole', coco: 'notes', rapunzel: 'poele', cap: 'bouclier', loki: 'dague',
  superman: 'vision-thermique', greenlantern: 'anneau', martian: 'rayon', batgirl: 'coup',
};

/** Début de vague : remise à zéro des compétences « une fois par vague ». Renvoie le mana gagné. */
export function onWaveStart(ctx: Ctx, player: number): number {
  const p = ctx.st.players[player]!;
  for (let i = 0; i < GRID_SIZE; i++) {
    const u = p.grid[i];
    if (!u) continue;
    u.counters.restores = 0;
  }
  return 0;
}

export { UNITS, applyBurn };

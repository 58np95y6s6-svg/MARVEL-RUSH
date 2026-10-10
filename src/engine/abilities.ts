// Attaques et compétences des 73 unités (28 + 15 de l'extension DC + 15 Autobots, src/engine/transformers.ts,
// + 15 Pixar, src/engine/pixar.ts), sur les profils Rush Royale (docs/rush-royale-mapping.md). Une fonction par
// tick et par joueur : timers, compétences à recharge, archétypes DC (archetypes.ts), attaques de base (le rang
// de fusion divise l'intervalle d'attaque, règle de Rush Royale : plusieurs coups par tick si besoin).

import type { UnitId } from '../data/types';
import { UNITS } from '../data/units';
import { GRID_SIZE, MAX_RANK } from './types';
import {
  DT, EPS, emit, pick, pickMany, rand, randInt, type Ctx, type SimEnemy, type SimUnit,
} from './internal';
import {
  aliveAll, applyBurn, applySlow, applyStun, attackSpeedOf, baseDamage, bestBy, controlMul, cooldownRate, countOnBoard,
  effectiveDef, effectiveId, isAlive, isDisabled, killEnemy, laneLength, nearest, neighbors, pushBack,
  progress, segmentOf, selectTarget, sendToStart, teamFor, topBy, unitActive, unitHit, unitParams, within,
} from './combat';
import { enemyGridPos, inReach, unitRange } from './geometry';
import { formationLength, formationSplash, growOverTime } from './archetypes';
import { chooseTfTarget, inVehicle, isTransformer, tfAttack, tfInit, tfTick, tfTimedAbility } from './transformers';
import { pxAttack, pxTick, pxTimedAbility, pxWaveMana } from './pixar';

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
  // Extension Transformers : un Autobot arrive en mode robot.
  tfInit(prm, u);
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
  for (const k of ['binaryFor', 'hasteFor', 'boostFor', 'restoredFor', 'immuneFor', 'powerFor', 'weakenFor', 'hurricaneFor', 'buffFor', 'killManaFor', 'berserkFor', 'rockfallFor', 'rageFor', 'activeFor'] as const) {
    if ((c[k] ?? 0) > 0) c[k] = Math.max(0, (c[k] ?? 0) - DT);
  }
  const rate = cooldownRate(ctx, player, effectiveId(u));
  if (c.cd !== undefined && c.cd > 0) c.cd = Math.max(0, c.cd - DT * rate);
  growOverTime(ctx, player, u, DT);
}

/**
 * Talents de l'Inquisiteur (Thor) qui vivent sur le plateau :
 * - Chevalier des ténèbres (`darkKnight`) : le plus ancien exemplaire est toujours actif et, toutes les
 *   `darkStealEvery` s, prend 1 rang à l'autre exemplaire du plus haut rang (rang 7 au plus) ;
 * - Bouclier de foi (`shieldEvery`) : toutes les N s, insensible aux pouvoirs de boss pendant `shieldDuration` s.
 */
function knightTalents(ctx: Ctx, player: number): void {
  const p = ctx.st.players[player]!;
  const seen = new Set<UnitId>();
  for (const u of p.grid) {
    if (!u) continue;
    const id = effectiveId(u);
    const prm = unitParams(ctx, player, id);
    if (prm.shieldEvery) {
      const c = u.counters;
      c.shieldIn = (c.shieldIn ?? prm.shieldEvery) - DT;
      if (c.shieldIn <= EPS) { c.shieldIn = prm.shieldEvery; c.immuneFor = Math.max(c.immuneFor ?? 0, prm.shieldDuration ?? 5); }
    }
    if (!prm.darkKnight || seen.has(id)) continue;
    seen.add(id);
    const mine = p.grid.filter((x): x is SimUnit => !!x && effectiveId(x) === id);
    const dark = mine.reduce((a, b) => (b.uid < a.uid ? b : a));
    for (const x of mine) x.counters.dark = x === dark ? 1 : 0;
    const c = dark.counters;
    c.darkIn = (c.darkIn ?? prm.darkStealEvery ?? 25) - DT;
    if (c.darkIn > EPS) continue;
    c.darkIn = prm.darkStealEvery ?? 25;
    const victim = mine.filter((x) => x !== dark && x.rank >= 2).sort((a, b) => b.rank - a.rank || a.uid - b.uid)[0];
    if (!victim || dark.rank >= MAX_RANK) continue;
    victim.rank -= 1;
    dark.rank += 1;
    abilityEvent(ctx, player, p.grid.indexOf(dark), id, 'Chevalier des ténèbres', []);
  }
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
  knightTalents(ctx, player);
  const units = p.grid.filter((u): u is SimUnit => !!u);
  for (const u of units) {
    const slot = p.grid.indexOf(u);
    if (slot < 0) continue; // détruite pendant ce tick
    tickTimers(ctx, player, u);
    tfTick(ctx, player, slot, u);
    pxTick(u);
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
  // Génie (Cyborg) : chaque fusion du plateau charge son Boom Tube.
  for (const n of grid) {
    if (!n) continue;
    const max = unitParams(ctx, player, effectiveId(n)).vortexMax;
    if (max) n.counters.vortex = Math.min(max, (n.counters.vortex ?? 0) + 1);
  }
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
      // Talent ultime « Marteau de foi » (Inquisiteur, niveau 15 de Rush Royale) : coup lourd qui étourdit.
      if (!prm.hammerDamage) return true;
      const lead = bestBy(enemies, (e) => progress(ctx, e));
      if (!lead) return false;
      const zone = [lead, ...within(ctx, all, lead, 1)].filter(isAlive);
      emit(ctx, { type: 'attack', player: ctx.st.players[player]!.id, slot, unit: id, targets: zone.map((e) => e.uid), fx: 'thor:marteau-foi' });
      for (const e of zone) {
        unitHit(ctx, player, u, e, baseDamage(ctx, player, slot, u) * prm.hammerDamage, { noOnHit: true });
        if (isAlive(e)) applyStun(e, (prm.hammerStun ?? 1) * ctrl);
      }
      abilityEvent(ctx, player, slot, id, 'Marteau de foi', zone);
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
      // Extensions : Pixar (src/engine/pixar.ts), Transformers (src/engine/transformers.ts), puis DC.
      return pxTimedAbility(ctx, player, slot, u, all, enemies) ?? tfTimedAbility(ctx, player, slot, u, all, enemies) ?? dcTimedAbility(ctx, player, slot, u, enemies);
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

/** Compétences à recharge des héros DC, profils Rush Royale (même contrat que timedAbility). */
function dcTimedAbility(ctx: Ctx, player: number, slot: number, u: SimUnit, enemies: SimEnemy[]): boolean | number {
  const id = effectiveId(u);
  const prm = unitParams(ctx, player, id);
  const ctrl = controlMul(ctx, player, id);
  switch (id) {
    case 'superman': {
      // Givre : blizzard sur tout le chemin, ralentissement selon le rang, cumulable.
      const all = aliveAll(ctx);
      if (all.length === 0) return false;
      const max = Math.max(1, Math.round(prm.blizzardStacks ?? 3));
      const dur = (prm.blizzardDuration ?? 4) * ctrl;
      for (const e of all) {
        const active = (e.effects.slowFor ?? 0) > EPS && (e.x.frostStacks ?? 0) > 0;
        e.x.frostStacks = Math.min(max, (active ? e.x.frostStacks ?? 0 : 0) + 1);
        applySlow(ctx, e, (prm.blizzardSlowPerRank ?? 0.04) * u.rank * e.x.frostStacks, dur);
        if (prm.blizzardDamage) unitHit(ctx, player, u, e, baseDamage(ctx, player, slot, u) * prm.blizzardDamage, { noOnHit: true });
      }
      fxEvent(ctx, player, slot, id, all, 'superman:souffle');
      abilityEvent(ctx, player, slot, id, 'Souffle glacial', all);
      return true;
    }
    case 'wonderwoman': {
      // Moine : Fureur sans mana, limitée dans le temps ; les Wonder Woman reliées entrent en Fureur ensemble.
      if (enemies.length === 0) return false;
      const grid = ctx.st.players[player]!.grid;
      const group = prm.powerShared ? [slot, ...formationPartnersOf(ctx, player, slot)] : [slot];
      for (const j of group) {
        const w = grid[j];
        if (!w) continue;
        w.counters.powerFor = prm.powerDuration ?? 5;
        if (w !== u) w.counters.cd = Math.max(w.counters.cd ?? 0, abilityCd(prm, w.rank));
      }
      abilityEvent(ctx, player, slot, id, 'Fureur amazone', []);
      return true;
    }
    case 'flash': {
      // Cogneur : rage quand le chemin est encombré (10 % par ennemi au-delà de 7, chaque seconde).
      if ((u.counters.rageFor ?? 0) > EPS) return true;
      const n = aliveAll(ctx).length - Math.round(prm.rageFrom ?? 8) + 1;
      if (n <= 0 || rand(ctx) >= (prm.rageChancePerEnemy ?? 0.1) * n) return true;
      u.counters.rageFor = prm.rageDuration ?? 5;
      abilityEvent(ctx, player, slot, id, 'Rage', []);
      return true;
    }
    case 'supergirl': {
      // Barde : à la fin du mode Musique, +20 % de vitesse d'attaque pendant 10 s.
      u.counters.haste = Math.max((u.counters.hasteFor ?? 0) > EPS ? u.counters.haste ?? 0 : 0, prm.haste ?? 0.2);
      u.counters.hasteFor = prm.hasteDuration ?? 10;
      if (prm.flareDamage) {
        const lead = bestBy(enemies, (e) => progress(ctx, e));
        if (lead) {
          const zone = [lead, ...within(ctx, aliveAll(ctx), lead, 1.5)].filter(isAlive);
          for (const e of zone) unitHit(ctx, player, u, e, baseDamage(ctx, player, slot, u) * prm.flareDamage, { noOnHit: true });
          fxEvent(ctx, player, slot, id, zone, 'supergirl:eruption');
        }
      }
      abilityEvent(ctx, player, slot, id, 'Éruption solaire', []);
      return true;
    }
    case 'shazam': {
      // Météore : la foudre tombe sur un ennemi au hasard, zone et étourdissement (sauf boss).
      const center = pick(ctx, enemies);
      if (!center) return false;
      const all = aliveAll(ctx);
      const n = Math.max(1, Math.round(prm.meteors ?? 1));
      const centers = [center, ...pickMany(ctx, enemies.filter((e) => e !== center), n - 1)];
      const hitSet = new Set<SimEnemy>();
      for (const c of centers) for (const e of [c, ...within(ctx, all, c, prm.meteorRadius ?? 1)]) hitSet.add(e);
      const zone = [...hitSet].filter(isAlive);
      const dmg = baseDamage(ctx, player, slot, u) * (prm.meteorDamage ?? 3);
      for (const e of zone) {
        unitHit(ctx, player, u, e, dmg, { noOnHit: true });
        if (isAlive(e) && notBoss(e)) applyStun(e, (prm.meteorStun ?? 1) * ctrl);
      }
      fxEvent(ctx, player, slot, id, zone, 'shazam:foudre');
      abilityEvent(ctx, player, slot, id, 'SHAZAM !', zone);
      return true;
    }
    default:
      return true;
  }
}

/** Partenaires reliés d'une unité (même unité, cases voisines), pour les compétences partagées. */
function formationPartnersOf(ctx: Ctx, player: number, slot: number): number[] {
  const grid = ctx.st.players[player]!.grid;
  const u = grid[slot];
  if (!u) return [];
  const seen = new Set([slot]);
  const todo = [slot];
  while (todo.length) {
    const s = todo.pop()!;
    for (const j of neighbors(s, false)) {
      if (seen.has(j) || grid[j]?.unit !== u.unit) continue;
      seen.add(j);
      todo.push(j);
    }
  }
  seen.delete(slot);
  return [...seen];
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
  // Pyrotechnicien (Ironhide) : en nombre impair, cible au hasard (avant le ciblage du mode).
  if (prm.oddSplash && countOnBoard(ctx, player, def.id) % 2 === 1) return selectTarget(ctx, pool, 'aleatoire');
  // Transformation (Autobots) : robot = le plus de PV, véhicule = le plus avancé.
  const tf = chooseTfTarget(ctx, prm, u, pool);
  if (tf !== null) return tf;
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
  // Croissance par coup et rampe (Inquisiteur, talent du Minotaure) : remises à zéro au changement de cible.
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
  if (prm.rampPerHit && !(isTransformer(prm) && inVehicle(u))) {
    // Purification (talent de Thor) : la rampe monte plus vite en mode actif.
    const k = prm.activeRampMul && unitActive(ctx, player, u) ? prm.activeRampMul : 1;
    c.ramp = Math.min(prm.rampMax ?? 4, (c.ramp ?? 0) + prm.rampPerHit * k);
  }
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
  const unramped = dmg;
  if (c.ramp) dmg *= 1 + c.ramp;                                         // Inquisiteur (Thor), talent Fureur (Hulk)
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
      // Inquisiteur : la rampe des coups consécutifs est dans `dmg` (cible principale) ; zone autour de la
      // cible à 50 % des dégâts de base, 100 % en mode actif (1, 3, 5 ou 7 Thor, ou talent).
      const active = unitActive(ctx, player, u);
      let crit = false;
      if (prm.unityCritChance && countOnBoard(ctx, player, id) >= (prm.unityCritAt ?? 7) && rand(ctx) < prm.unityCritChance) {
        crit = true;
        dmg *= prm.unityCritMul ?? 2;
      }
      hit(target, dmg, { crit });
      const share = active ? prm.activeAreaDamage ?? 1 : prm.areaDamage ?? 0.5;
      const radius = (prm.areaRadius ?? 1.2) + 0.3 * (ctx.mods.chainBounces ?? 0);
      const around = share > 0 ? splash(target, unramped * share, radius) : [];
      const info = ctx.info[player]!;
      for (const e of [target, ...around]) {
        if (!isAlive(e)) continue;
        if (prm.chainStun && e !== target) applyStun(e, prm.chainStun * ctrl);
        // Équipe avec Loki : l'illusion fait reculer l'ennemi.
        if (info.chainIllusionChance > 0 && rand(ctx) < info.chainIllusionChance && displaceable(e)) e.x.knockFor = info.illusionDuration;
      }
      return { targets: [target, ...around], fx: active ? 'thor:foudre' : 'thor:marteau' };
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
      // Zélote : la croissance (mana en réserve) est dans `dmg`. Talent Dévorer : exécute sous un seuil de PV.
      hit(target, dmg);
      if (prm.executeThreshold && isAlive(target) && !target.bossId && !target.x.mini && target.hp / target.maxHp < prm.executeThreshold) {
        killEnemy(ctx, target, player, u);
        abilityEvent(ctx, player, slot, id, 'Dévorer', [target]);
        return { targets: [target], fx: 'venom:devorer' };
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
      // Bourreau : achève sous un seuil de PV (réduit de moitié contre les boss et les mini-boss).
      hit(target, dmg);
      if (isAlive(target)) {
        const th = (prm.executeThreshold ?? 0.2) * (target.bossId || target.x.mini ? prm.executeBossFactor ?? 0.5 : 1);
        if (target.hp / target.maxHp < th) {
          killEnemy(ctx, target, player, u);
          abilityEvent(ctx, player, slot, id, 'Bras bionique', [target]);
          return { targets: [target], fx: 'bucky:critique' };
        }
      }
      return { targets: [target], fx: 'bucky:tir' };
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
      // Tonnerre : éclair en chaîne sur la cible et les ennemis qui la suivent (autant que le rang), qui étourdit un instant.
      hit(target, dmg);
      const n = Math.max(1, Math.round((prm.thunderTargetsPerRank ?? 1) * u.rank + (prm.thunderTargetsAdd ?? 0)));
      const behind = enemies.filter((e) => isAlive(e) && e !== target && progress(ctx, e) <= progress(ctx, target))
        .sort((a, b) => progress(ctx, b) - progress(ctx, a)).slice(0, n - 1);
      const chain = [target, ...behind].filter(isAlive);
      for (const e of chain) {
        hit(e, dmg * (prm.thunderDamage ?? 0.5), { noOnHit: e !== target });
        if (isAlive(e) && notBoss(e) && prm.thunderDaze) applyStun(e, prm.thunderDaze * ctrl);
      }
      return { targets: [target, ...behind], fx: chain.length > 1 ? 'shangchi:anneaux' : 'shangchi:combo' };
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
      // Danse-lames : la cadence (seule) et le bonus des danseuses sont dans attackSpeedOf / baseDamage.
      hit(target, dmg);
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
      // Voleur : bonus aléatoire jusqu'aux dégâts critiques.
      const bonus = rand(ctx) * Math.max(0, (prm.rogueCritMul ?? 3) - 1);
      hit(target, dmg * (1 + bonus), { crit: bonus >= 1 });
      return { targets: [target], fx: 'foxhound:double' };
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
      // Catapulte : zone autour du premier ennemi, étourdissement (un même ennemi : pas avant webRestun s).
      hit(target, dmg);
      const around = splash(target, dmg * (prm.webSplash ?? 1), prm.webRadius ?? 1);
      const now = ctx.st.time;
      for (const e of [target, ...around]) {
        if (!isAlive(e) || !notBoss(e) || (e.x.webAt !== undefined && now - e.x.webAt < (prm.webRestun ?? 9) - EPS)) continue;
        if (applyStun(e, (prm.webStun ?? 1) * ctrl)) e.x.webAt = now;
      }
      return { targets: [target, ...around], fx: 'spiderman:toile' };
    }
    case 'nemo': {
      hit(target, dmg);
      return { targets: [target], fx: 'nemo:ralenti' };
    }
    // ───────────── Extension DC (profils Rush Royale) ─────────────
    case 'batman': {
      // Chasseur de démons : frappe autant de premiers ennemis que son rang (4 au plus).
      const n = Math.max(1, Math.min(Math.round(prm.targetsMax ?? 4), Math.round((prm.targetsPerRank ?? 1) * u.rank)));
      const firsts = [target, ...pool.filter((e) => isAlive(e) && e !== target).sort((a, b) => progress(ctx, b) - progress(ctx, a))].slice(0, n);
      for (const e of firsts) hit(e, dmg, { noOnHit: e !== target });
      return { targets: firsts, fx: firsts.length > 1 ? 'batman:batarangs' : 'batman:batarang' };
    }
    case 'wonderwoman': {
      // Moine : en Fureur, chaque coup éclabousse.
      hit(target, dmg);
      if ((c.powerFor ?? 0) > EPS && prm.powerSplash) {
        const around = splash(target, dmg * prm.powerSplash, prm.powerSplashRadius ?? 1);
        return { targets: [target, ...around], fx: 'wonderwoman:epee' };
      }
      return { targets: [target], fx: 'wonderwoman:epee' };
    }
    case 'greenlantern': {
      // Cultiste : une cible de plus par Green Lantern relié ; groupe complet : dégâts doublés.
      const len = formationLength(ctx.st.players[player]!.grid, slot);
      const d = len >= (prm.formationDoubleAt ?? 5) ? dmg * (prm.formationDoubleMul ?? 2) : dmg;
      const extra = Math.min(Math.round(prm.formationTargetsMax ?? 3), Math.round((prm.formationTargetsPerAlly ?? 1) * (len - 1)));
      const more = extra > 0 ? nearest(ctx, enemies.filter(isAlive), target, extra, new Set([target.uid])) : [];
      hit(target, d);
      for (const e of more) hit(e, d, { noOnHit: true });
      return { targets: [target, ...more], fx: 'greenlantern:anneau' };
    }
    case 'flash': {
      // Cogneur : en rage, coups de zone.
      hit(target, dmg);
      if ((c.rageFor ?? 0) > EPS && prm.rageSplash) {
        const around = splash(target, dmg * prm.rageSplash, 1);
        return { targets: [target, ...around], fx: 'flash:tour' };
      }
      return { targets: [target], fx: 'flash:eclair' };
    }
    case 'aquaman': {
      // Faucheuse : chance d'engloutir la cible (sauf boss et lieutenants).
      hit(target, dmg);
      if (isAlive(target) && !isBossLike(target) && rand(ctx) < (prm.reapChance ?? 0.054)) {
        killEnemy(ctx, target, player, u);
        abilityEvent(ctx, player, slot, id, 'Kraken', [target]);
        return { targets: [target], fx: 'aquaman:kraken' };
      }
      return { targets: [target], fx: 'aquaman:trident' };
    }
    case 'batgirl': {
      // Bombardier : explosion autour de la cible.
      hit(target, dmg);
      const around = splash(target, dmg * (prm.splash ?? 0.6), prm.splashRadius ?? 1);
      return { targets: [target, ...around], fx: 'batgirl:coup' };
    }
    case 'greenarrow': {
      // Mage de glace : chaque flèche ralentit un peu plus la cible.
      hit(target, dmg);
      if (isAlive(target)) {
        const active = (target.effects.slowFor ?? 0) > EPS && (target.x.coldSlow ?? 0) > 0;
        target.x.coldSlow = Math.min(prm.coldMaxSlow ?? 0.3, (active ? target.x.coldSlow ?? 0 : 0) + (prm.coldSlowPerHit ?? 0.06));
        applySlow(ctx, target, target.x.coldSlow, (prm.coldDuration ?? 2) * ctrl);
        return { targets: [target], fx: 'greenarrow:filet' };
      }
      return { targets: [target], fx: 'greenarrow:fleche' };
    }
    case 'cyborg': {
      hit(target, dmg);
      return { targets: [target], fx: 'cyborg:canon-sonique' };
    }
    case 'supergirl': {
      hit(target, dmg);
      return { targets: [target], fx: 'supergirl:poing' };
    }
    case 'shazam': {
      hit(target, dmg);
      return { targets: [target], fx: 'shazam:coup' };
    }
    case 'robin': {
      hit(target, dmg);
      return { targets: [target], fx: 'robin:baton' };
    }
    case 'catwoman': {
      // Mana par élimination (archétype) : la marque est posée par unitHit (tagForMana).
      hit(target, dmg);
      return { targets: [target], fx: 'catwoman:fouet' };
    }
    case 'harley': {
      hit(target, dmg);
      return { targets: [target], fx: 'harley:maillet' };
    }
    default: {
      // Extension Transformers : attaques des Autobots selon leur mode.
      const tf = tfAttack(ctx, player, slot, u, id, target, enemies, pool, dmg, hit, splash);
      if (tf) return tf;
      // Extension Pixar : attaques et coups de duo.
      const px = pxAttack(ctx, player, slot, u, id, target, enemies, dmg, hit, splash);
      if (px) return px;
      // falcon, moana, tiana, coco, superman, martian… : coup simple.
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
  superman: 'vision-thermique', martian: 'rayon',
};

/** Début de vague : remise à zéro des compétences « une fois par vague ». Renvoie le mana gagné. */
export function onWaveStart(ctx: Ctx, player: number): number {
  const p = ctx.st.players[player]!;
  for (let i = 0; i < GRID_SIZE; i++) {
    const u = p.grid[i];
    if (!u) continue;
    u.counters.restores = 0;
  }
  // Extension Pixar : la recette de Rémy.
  return pxWaveMana(ctx, player);
}

export { UNITS, applyBurn };

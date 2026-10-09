// Attaques et compétences des 28 unités (§4.5). Une fonction par tick et par joueur :
// timers, purification de Raiponce, transformations (Loki, Maui), compétences à recharge,
// attaques de base.

import type { UnitId } from '../data/types';
import { UNITS } from '../data/units';
import { GRID_SIZE } from './types';
import {
  DT, EPS, emit, pick, pickMany, rand, randInt, type Ctx, type SimEnemy, type SimUnit,
} from './internal';
import {
  aliveAll, applySlow, applyStun, attackSpeedOf, baseDamage, bestBy, controlMul, cooldownRate,
  effectiveDef, effectiveId, isAlive, isDisabled, killEnemy, nearest, neighbors, pushBack,
  progress, segmentOf, selectTarget, sendToStart, teamFor, topBy, unitHit, unitParams, within,
} from './combat';

export function initUnitCounters(ctx: Ctx, player: number, u: SimUnit): void {
  const prm = unitParams(ctx, player, effectiveId(u));
  u.counters = {};
  if (prm.abilityCooldown) u.counters.cd = prm.abilityCooldown;
  if (u.unit === 'loki') u.counters.lokiCd = unitParams(ctx, player, 'loki').abilityCooldown ?? 15;
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
      if (prm.abilityCooldown) u.counters.cd = prm.abilityCooldown;
    }
  }
  const c = u.counters;
  for (const k of ['binaryFor', 'hasteFor', 'boostFor', 'restoredFor', 'immuneFor'] as const) {
    if ((c[k] ?? 0) > 0) c[k] = Math.max(0, (c[k] ?? 0) - DT);
  }
  const rate = cooldownRate(ctx, player, effectiveId(u));
  if (c.cd !== undefined && c.cd > 0) c.cd = Math.max(0, c.cd - DT * rate);
  if (c.lokiCd !== undefined && c.lokiCd > 0) c.lokiCd = Math.max(0, c.lokiCd - DT * cooldownRate(ctx, player, 'loki'));
}

/** Raiponce retire les effets de boss des unités adjacentes (et diagonales avec le talent). */
function rapunzelCleanse(ctx: Ctx, player: number): void {
  const grid = ctx.st.players[player]!.grid;
  for (let i = 0; i < GRID_SIZE; i++) {
    const r = grid[i];
    if (!r || effectiveId(r) !== 'rapunzel') continue;
    const prm = unitParams(ctx, player, 'rapunzel');
    for (const j of neighbors(i, !!prm.auraDiagonal)) {
      const n = grid[j];
      if (!n) continue;
      delete n.status.stunnedFor;
      delete n.status.sleepingFor;
      delete n.status.hypnotizedFor;
    }
  }
}

export function updateUnits(ctx: Ctx, player: number): void {
  const p = ctx.st.players[player]!;
  rapunzelCleanse(ctx, player);
  const units = p.grid.filter((u): u is SimUnit => !!u);
  for (const u of units) {
    const slot = p.grid.indexOf(u);
    if (slot < 0) continue; // détruite pendant ce tick
    tickTimers(ctx, player, u);
    if (u.unit === 'loki') lokiTransform(ctx, player, slot, u);
    if (effectiveId(u) === 'maui') mauiForm(ctx, player, slot, u);
    const disabled = isDisabled(u);
    let enemies = aliveAll(ctx);
    let cur = slot;
    if (!disabled && (u.counters.cd ?? 1) <= EPS) {
      const res = timedAbility(ctx, player, slot, u, enemies);
      if (res !== false) {
        u.counters.cd = unitParams(ctx, player, effectiveId(u)).abilityCooldown ?? 0;
        if (typeof res === 'number') cur = res;
        enemies = aliveAll(ctx);
      }
    }
    u.cooldown = Math.max(0, u.cooldown - DT * attackSpeedOf(ctx, player, cur, u));
    if (disabled || u.cooldown > EPS || enemies.length === 0) continue;
    performAttack(ctx, player, cur, u, enemies);
    const team = teamFor(ctx, player, effectiveId(u));
    if (team.doubleAttackChance > 0 && rand(ctx) < team.doubleAttackChance) {
      const again = aliveAll(ctx);
      if (again.length > 0) performAttack(ctx, player, cur, u, again);
    }
    u.cooldown += effectiveDef(u).attackInterval;
  }
}

// ───────────── Transformations ─────────────

function lokiTransform(ctx: Ctx, player: number, slot: number, u: SimUnit): void {
  if (u.status.transformedInto || (u.counters.lokiCd ?? 0) > EPS || isDisabled(u)) return;
  const p = ctx.st.players[player]!;
  const options = p.deck.filter((d) => d !== 'loki');
  const into = pick(ctx, options);
  const prm = unitParams(ctx, player, 'loki');
  u.counters.lokiCd = prm.abilityCooldown ?? 15;
  if (!into) return;
  u.status.transformedInto = into;
  u.status.transformFor = prm.transformDuration ?? 10;
  const ip = unitParams(ctx, player, into);
  if (ip.abilityCooldown) u.counters.cd = ip.abilityCooldown;
  emit(ctx, { type: 'ability', player: p.id, slot, unit: 'loki', name: 'Illusion', targets: [] });
}

function mauiForm(ctx: Ctx, player: number, slot: number, u: SimUnit): void {
  if ((u.counters.cd ?? 0) > EPS) return;
  const prm = unitParams(ctx, player, 'maui');
  const shark = u.counters.form ? 0 : 1;
  u.counters.form = shark;
  u.counters.cd = shark ? prm.sharkDuration ?? 8 : prm.abilityCooldown ?? 8;
  const targets: number[] = [];
  if (prm.transformBlast) {
    const dmg = baseDamage(ctx, player, slot, u) * prm.transformBlast;
    for (const e of aliveAll(ctx)) { unitHit(ctx, player, u, e, dmg, { noOnHit: true }); targets.push(e.uid); }
  }
  emit(ctx, { type: 'ability', player: ctx.st.players[player]!.id, slot, unit: 'maui', name: shark ? 'Métamorphose : requin' : 'Métamorphose : faucon', targets });
}

// ───────────── Compétences à recharge ─────────────

function abilityEvent(ctx: Ctx, player: number, slot: number, unit: UnitId, name: string, targets: SimEnemy[] | number[]): void {
  emit(ctx, {
    type: 'ability', player: ctx.st.players[player]!.id, slot, unit, name,
    targets: targets.map((t) => (typeof t === 'number' ? t : t.uid)),
  });
}

const displaceable = (e: SimEnemy) => !e.bossId && !e.x.mini && !e.x.flying;

/**
 * Déclenche la compétence à recharge. Renvoie false si elle n'a pas pu partir (on réessaie au
 * tick suivant), true sinon, ou la nouvelle case si l'unité s'est déplacée (Vanellope).
 */
function timedAbility(ctx: Ctx, player: number, slot: number, u: SimUnit, enemies: SimEnemy[]): boolean | number {
  const id = effectiveId(u);
  const prm = unitParams(ctx, player, id);
  const ctrl = controlMul(ctx, player, id);
  switch (id) {
    case 'ironman': {
      const lead = bestBy(enemies, (e) => progress(ctx, e));
      if (!lead) return false;
      const seg = segmentOf(ctx, lead);
      const line = prm.beamAllLines ? enemies : enemies.filter((e) => segmentOf(ctx, e) === seg);
      const dmg = baseDamage(ctx, player, slot, u) * (prm.beamDamage ?? 2) * (1 + (ctx.mods.beamDamage ?? 0));
      emit(ctx, { type: 'attack', player: ctx.st.players[player]!.id, slot, unit: id, targets: line.map((e) => e.uid), fx: 'ironman:unibeam' });
      for (const e of line) {
        const d = e.bossId ? dmg * (prm.beamBossFactor ?? 1) : dmg;
        unitHit(ctx, player, u, e, d, { noOnHit: true });
      }
      abilityEvent(ctx, player, slot, id, 'Uni-Beam', line);
      return true;
    }
    case 'strange': {
      const targets = topBy(enemies.filter(displaceable), (e) => progress(ctx, e), Math.max(1, prm.portalTargets ?? 1));
      if (targets.length === 0) return false;
      for (const e of targets) {
        sendToStart(e);
        delete e.x.knockFor;
        if (prm.portalSlow) applySlow(ctx, e, prm.portalSlow, (prm.portalSlowDuration ?? 3) * ctrl);
        if (prm.portalDamagePctMaxHp) unitHit(ctx, player, u, e, e.maxHp * prm.portalDamagePctMaxHp, { noOnHit: true });
      }
      abilityEvent(ctx, player, slot, id, 'Portail', targets);
      return true;
    }
    case 'falcon': {
      const targets = topBy(enemies, (e) => e.hp, Math.max(1, prm.markTargets ?? 1));
      if (targets.length === 0) return false;
      const info = ctx.info[player]!;
      for (const e of targets) {
        e.effects.marked = (prm.markBonus ?? 0.25) * (e.bossId ? prm.markBossFactor ?? 1 : 1);
        e.effects.markedFor = prm.markDuration ?? 4;
        if (info.markSlow > 0) applySlow(ctx, e, info.markSlow, prm.markDuration ?? 4);
      }
      abilityEvent(ctx, player, slot, id, 'Drone Redwing', targets);
      return true;
    }
    case 'moana': {
      const targets = topBy(enemies.filter(displaceable), (e) => progress(ctx, e), Math.max(1, prm.pushTargets ?? 3));
      if (targets.length === 0) return false;
      for (const e of targets) {
        pushBack(ctx, e, prm.push ?? 1.5);
        if (prm.waveSlow) applySlow(ctx, e, prm.waveSlow, (prm.waveSlowDuration ?? 2) * ctrl);
      }
      if (prm.waveDamage) {
        const dmg = baseDamage(ctx, player, slot, u) * prm.waveDamage;
        for (const e of targets) unitHit(ctx, player, u, e, dmg, { noOnHit: true });
      }
      abilityEvent(ctx, player, slot, id, 'Appel de l’océan', targets);
      return true;
    }
    case 'ariel': {
      const targets = topBy(enemies.filter((e) => !e.bossId && !e.x.mini), (e) => progress(ctx, e), Math.max(1, prm.songTargets ?? 3));
      if (targets.length === 0) return false;
      for (const e of targets) applyStun(e, (prm.songDuration ?? 1.5) * ctrl);
      abilityEvent(ctx, player, slot, id, 'Chant de sirène', targets);
      return true;
    }
    case 'tiana': {
      const target = bestBy(enemies.filter(displaceable), (e) => progress(ctx, e));
      if (!target) return false;
      pushBack(ctx, target, prm.pull ?? 1);
      abilityEvent(ctx, player, slot, id, 'Langue de Naveen', [target]);
      return true;
    }
    case 'nickjudy': {
      const targets = topBy(enemies.filter((e) => !e.bossId && !e.x.mini), (e) => e.hp, Math.max(1, prm.stopTargets ?? 1));
      if (targets.length === 0) return false;
      for (const e of targets) applyStun(e, (prm.stopDuration ?? 2) * ctrl);
      abilityEvent(ctx, player, slot, id, 'Arrestation', targets);
      return true;
    }
    case 'buzzwoody': {
      const target = bestBy(enemies.filter(displaceable), (e) => progress(ctx, e));
      if (!target) return false;
      pushBack(ctx, target, prm.pull ?? 2);
      if (prm.pullStun) applyStun(target, prm.pullStun * ctrl);
      abilityEvent(ctx, player, slot, id, 'Lasso de Woody', [target]);
      return true;
    }
    case 'vanralph': {
      const grid = ctx.st.players[player]!.grid;
      const empties: number[] = [];
      for (let i = 0; i < GRID_SIZE; i++) if (!grid[i]) empties.push(i);
      const to = pick(ctx, empties);
      if (to === undefined) return true; // pas de case libre : la recharge repart
      grid[to] = u;
      grid[slot] = null;
      for (const j of neighbors(to, !!prm.auraDiagonal)) {
        const n = grid[j];
        if (!n) continue;
        n.counters.boost = prm.boost ?? 0.2;
        n.counters.boostFor = prm.boostDuration ?? 5;
        n.counters.boostDamage = prm.boostDamage ?? 0;
      }
      // Pour Glitch, `slot` est la nouvelle case et `targets` contient l'ancienne case.
      abilityEvent(ctx, player, to, id, 'Glitch', [slot]);
      return to;
    }
    default:
      return true;
  }
}

// ───────────── Attaques de base ─────────────

function performAttack(ctx: Ctx, player: number, slot: number, u: SimUnit, enemies: SimEnemy[]): void {
  const def = effectiveDef(u);
  const id = def.id;
  const target = selectTarget(ctx, enemies, def.targeting);
  if (!target) return;
  const at = ctx.ev.length;
  u.counters.attacks = (u.counters.attacks ?? 0) + 1;
  const { targets, fx } = attackOf(ctx, player, slot, u, id, target, enemies);
  ctx.ev.splice(at, 0, {
    type: 'attack', player: ctx.st.players[player]!.id, slot, unit: id,
    targets: targets.map((e) => e.uid), fx,
  });
}

function attackOf(
  ctx: Ctx, player: number, slot: number, u: SimUnit, id: UnitId, target: SimEnemy, enemies: SimEnemy[],
): { targets: SimEnemy[]; fx: string } {
  const prm = unitParams(ctx, player, id);
  const ctrl = controlMul(ctx, player, id);
  const dmg = baseDamage(ctx, player, slot, u);
  const c = u.counters;
  const hit = (e: SimEnemy, d: number, o?: { crit?: boolean; shieldBreak?: boolean; noOnHit?: boolean }) => unitHit(ctx, player, u, e, d, o);
  const splash = (center: SimEnemy, d: number, radius: number) => {
    const around = within(ctx, enemies, center, radius).filter(isAlive);
    for (const e of around) hit(e, d, { noOnHit: true });
    return around;
  };

  switch (id) {
    case 'spiderman': {
      hit(target, dmg);
      if (isAlive(target) && !target.x.flying) {
        const stacks = (target.x.webStacks ?? 0) + 1;
        const max = Math.max(1, Math.round(prm.maxStacks ?? 3));
        if (stacks >= max) {
          target.x.webStacks = 0;
          if (!applyStun(target, (prm.rootDuration ?? 1) * ctrl)) applySlow(ctx, target, max * (prm.slowPerStack ?? 0.1), (prm.slowDuration ?? 2) * ctrl);
          if (prm.rootSplashRadius) for (const e of within(ctx, enemies, target, prm.rootSplashRadius)) applyStun(e, (prm.rootDuration ?? 1) * ctrl);
          abilityEvent(ctx, player, slot, id, 'Toile collante', [target]);
        } else {
          target.x.webStacks = stacks;
          applySlow(ctx, target, stacks * (prm.slowPerStack ?? 0.1), (prm.slowDuration ?? 2) * ctrl);
        }
      }
      return { targets: [target], fx: 'spiderman:toile' };
    }
    case 'hulk': {
      const hits = (c.hits = (c.hits ?? 0) + 1);
      const rage = Math.min(prm.rageMax ?? 0.5, (hits - 1) * (prm.ragePerHit ?? 0.05));
      const d = dmg * (1 + rage);
      hit(target, d);
      const around = splash(target, d * (prm.splash ?? 0.4), prm.splashRadius ?? 1.5);
      const every = Math.max(1, Math.round(prm.smashEveryHits ?? 8));
      if (hits % every === 0) {
        const zone = [target, ...within(ctx, enemies, target, prm.smashRadius ?? 2)].filter(isAlive);
        for (const e of zone) {
          applyStun(e, (prm.smashStun ?? 1) * ctrl);
          if (prm.smashDamage) hit(e, d * prm.smashDamage, { noOnHit: true });
        }
        abilityEvent(ctx, player, slot, id, 'Hulk Smash', zone);
        return { targets: [target, ...around], fx: 'hulk:smash' };
      }
      return { targets: [target, ...around], fx: 'hulk:coup' };
    }
    case 'thor': {
      const n = Math.min(prm.chainMax ?? 5, (prm.chain ?? 3) + Math.floor((u.rank - 1) / Math.max(1, prm.chainPerRanks ?? 2)))
        + (ctx.mods.chainBounces ?? 0);
      const chain = [target];
      const seen = new Set([target.uid]);
      let cur = target;
      while (chain.length < n) {
        const next = nearest(ctx, enemies, cur, 1, seen)[0];
        if (!next) break;
        chain.push(next);
        seen.add(next.uid);
        cur = next;
      }
      const info = ctx.info[player]!;
      chain.forEach((e, i) => {
        let f = Math.max(0, 1 - (prm.falloff ?? 0.2) * i);
        if (e.bossId && prm.noFalloffOnBoss) f = 1;
        if (i === 0) f *= 1 + (prm.firstTargetBonus ?? 0);
        hit(e, dmg * f);
        if (isAlive(e) && info.chainIllusionChance > 0 && rand(ctx) < info.chainIllusionChance && displaceable(e)) {
          e.x.knockFor = info.illusionDuration;
        }
      });
      return { targets: chain, fx: 'thor:chaine' };
    }
    case 'venom': {
      const bonus = Math.min(prm.killStackMax ?? 0.4, (c.kills ?? 0) * (prm.killStack ?? 0.02));
      hit(target, dmg * (1 + bonus));
      const thr = target.bossId ? prm.bossExecuteThreshold ?? 0 : prm.executeThreshold ?? 0.15;
      if (isAlive(target) && target.hp / target.maxHp < thr) {
        killEnemy(ctx, target, player, u);
        if (prm.manaOnExecute) ctx.st.players[player]!.mana += prm.manaOnExecute;
        abilityEvent(ctx, player, slot, id, 'Dévorer', [target]);
        return { targets: [target], fx: 'venom:devorer' };
      }
      return { targets: [target], fx: 'venom:griffes' };
    }
    case 'cmarvel': {
      const binary = (c.binaryFor ?? 0) > EPS;
      hit(target, binary ? dmg * (prm.binaryMul ?? 2) : dmg);
      if (binary && prm.binarySplash) splash(target, dmg * (prm.binaryMul ?? 2) * prm.binarySplash, 1.5);
      if (!binary) {
        c.charge = (c.charge ?? 0) + 1;
        if (c.charge >= Math.max(1, Math.round(prm.chargeAttacks ?? 10))) {
          c.charge = 0;
          c.binaryFor = prm.binaryDuration ?? 5;
          abilityEvent(ctx, player, slot, id, 'Mode binaire', []);
        }
      }
      return { targets: [target], fx: binary ? 'cmarvel:binaire' : 'cmarvel:rafale' };
    }
    case 'cap': {
      const n = Math.max(1, Math.round(prm.bounces ?? 3));
      const list = [target, ...nearest(ctx, enemies, target, n - 1, new Set([target.uid]))];
      for (const e of list) hit(e, dmg);
      return { targets: list, fx: 'cap:bouclier' };
    }
    case 'loki': {
      hit(target, dmg);
      if (isAlive(target) && displaceable(target) && rand(ctx) < (prm.knockbackChance ?? 0.1)) {
        target.x.knockFor = (prm.knockbackDuration ?? 2) * ctrl;
        abilityEvent(ctx, player, slot, id, 'Illusion', [target]);
      }
      return { targets: [target], fx: 'loki:dague' };
    }
    case 'bucky': {
      const crit = (c.attacks ?? 0) % Math.max(1, Math.round(prm.critEvery ?? 4)) === 0;
      const d = crit ? dmg * (prm.critMul ?? 3) : dmg;
      hit(target, d, { crit });
      if (crit) {
        applyStun(target, (prm.critStun ?? 0.5) * ctrl);
        if (prm.critSplash) splash(target, d * prm.critSplash, 1.5);
        abilityEvent(ctx, player, slot, id, 'Bras bionique', [target]);
      }
      return { targets: [target], fx: crit ? 'bucky:critique' : 'bucky:tir' };
    }
    case 'hawkeye': {
      const arrow = (c.arrow ?? 0) % 3;
      c.arrow = arrow + 1;
      if (arrow === 0) {
        hit(target, dmg);
        const around = splash(target, dmg * (prm.explosiveSplash ?? 0.5), prm.splashRadius ?? 1.5);
        return { targets: [target, ...around], fx: 'hawkeye:explosive' };
      }
      if (arrow === 1) {
        hit(target, dmg);
        if (isAlive(target)) applySlow(ctx, target, prm.iceSlow ?? 0.25, (prm.iceDuration ?? 2) * ctrl);
        return { targets: [target], fx: 'hawkeye:glace' };
      }
      const n = Math.max(1, Math.round(prm.chain ?? 2)) + (ctx.mods.chainBounces ?? 0);
      const list = [target, ...nearest(ctx, enemies, target, n - 1, new Set([target.uid]))];
      for (const e of list) hit(e, dmg);
      return { targets: list, fx: 'hawkeye:electrique' };
    }
    case 'widow': {
      const hits = (c.hits = (c.hits ?? 0) + 1);
      hit(target, target.bossId ? dmg * (prm.bossMul ?? 2) : dmg);
      if (hits % Math.max(1, Math.round(prm.paralyzeEvery ?? 5)) === 0 && isAlive(target)) {
        if (applyStun(target, (prm.paralyzeDuration ?? 1) * ctrl)) {
          abilityEvent(ctx, player, slot, id, 'Morsure de la veuve', [target]);
        }
        return { targets: [target], fx: 'widow:morsure' };
      }
      return { targets: [target], fx: 'widow:tir' };
    }
    case 'shangchi': {
      const hits = (c.hits = (c.hits ?? 0) + 1);
      hit(target, dmg);
      if (hits % Math.max(1, Math.round(prm.ringsEveryHits ?? 10)) === 0) {
        const pool = enemies.filter(isAlive);
        const rings = pickMany(ctx, pool, Math.max(1, Math.round(prm.ringCount ?? 10)));
        const rd = dmg * (prm.ringDamage ?? 1) * (1 + (ctx.mods.comboDamage ?? 0));
        for (const e of rings) {
          hit(e, rd, { noOnHit: true });
          if (prm.ringStun && isAlive(e)) applyStun(e, prm.ringStun * ctrl);
        }
        abilityEvent(ctx, player, slot, id, 'Dix Anneaux', rings);
        return { targets: [target, ...rings], fx: 'shangchi:anneaux' };
      }
      return { targets: [target], fx: 'shangchi:combo' };
    }
    case 'maui': {
      if (c.form) {
        const d = dmg * (prm.sharkMul ?? 2.5);
        hit(target, d);
        const around = splash(target, d * (prm.sharkSplash ?? 0.5), prm.splashRadius ?? 1.5);
        return { targets: [target, ...around], fx: 'maui:requin' };
      }
      hit(target, dmg * (prm.hawkMul ?? 0.5));
      return { targets: [target], fx: 'maui:faucon' };
    }
    case 'mulan': {
      hit(target, dmg);
      const uses = c.avalanche ?? 0;
      const live = enemies.filter(isAlive);
      if (uses < (prm.avalancheUses ?? 1) && (live.length >= (prm.avalancheMinEnemies ?? 8) || live.some((e) => e.bossId))) {
        c.avalanche = uses + 1;
        const d = dmg * (prm.avalancheDamage ?? 3);
        for (const e of live) {
          hit(e, d, { noOnHit: true });
          if (prm.avalancheStun && isAlive(e)) applyStun(e, prm.avalancheStun * ctrl);
        }
        abilityEvent(ctx, player, slot, id, 'Avalanche', live);
        return { targets: live, fx: 'mulan:avalanche' };
      }
      return { targets: [target], fx: 'mulan:souffle' };
    }
    case 'merida': {
      hit(target, dmg * (prm.critMul ?? 2), { crit: true });
      return { targets: [target], fx: 'merida:tir-parfait' };
    }
    case 'ariel': {
      hit(target, dmg);
      if (isAlive(target)) {
        target.x.bleed = (prm.bleed ?? 0.05) * target.maxHp * (target.bossId ? prm.bleedBossFactor ?? 0.1 : 1);
        target.x.bleedFor = prm.bleedDuration ?? 2;
        target.x.bleedBy = player;
      }
      return { targets: [target], fx: 'ariel:bulles' };
    }
    case 'foxhound': {
      hit(target, dmg);
      if (isAlive(target)) {
        hit(target, dmg * (1 + (prm.secondHitBonus ?? 0.5)));
        return { targets: [target], fx: 'foxhound:double' };
      }
      const next = selectTarget(ctx, enemies.filter(isAlive), 'premier');
      if (next) hit(next, dmg);
      return { targets: next ? [target, next] : [target], fx: 'foxhound:double' };
    }
    case 'nemo': {
      const count = Math.max(1, Math.round(prm.effectsPerShot ?? 1));
      const effects: number[] = [];
      for (let i = 0; i < count; i++) effects.push(randInt(ctx, 4));
      const names = ['ralenti', 'double', 'poison', 'cadence'];
      const d = effects.includes(1) ? dmg * (prm.doubleDamageMul ?? 2) : dmg;
      hit(target, d);
      for (const fx of effects) {
        if (fx === 0 && isAlive(target)) applySlow(ctx, target, prm.slow ?? 0.2, (prm.slowDuration ?? 2) * ctrl);
        if (fx === 2 && isAlive(target)) {
          target.x.poison = d * (prm.poison ?? 0.3);
          target.x.poisonFor = prm.poisonDuration ?? 3;
          target.x.poisonBy = player;
        }
        if (fx === 3) {
          const grid = ctx.st.players[player]!.grid;
          const allies = grid.filter((x): x is SimUnit => !!x && x !== u);
          const ally = pick(ctx, allies);
          if (ally) {
            ally.counters.haste = prm.allyHaste ?? 0.2;
            ally.counters.hasteFor = prm.allyHasteDuration ?? 3;
          }
        }
      }
      return { targets: [target], fx: `nemo:${effects.map((e) => names[e]).join('+')}` };
    }
    case 'nickjudy': {
      hit(target, dmg);
      if (isAlive(target)) target.effects.armorBreak = Math.max(target.effects.armorBreak ?? 0, prm.armorBreak ?? 0.2);
      return { targets: [target], fx: 'nickjudy:carotte' };
    }
    case 'buzzwoody': {
      const seg = segmentOf(ctx, target);
      const line = enemies.filter((e) => isAlive(e) && segmentOf(ctx, e) === seg);
      const d = dmg * (1 + (ctx.mods.beamDamage ?? 0));
      for (const e of line) hit(e, d);
      return { targets: line, fx: 'buzzwoody:laser' };
    }
    case 'vanralph': {
      const d = target.armor > 0 ? dmg * (prm.armoredMul ?? 2) : dmg;
      const hadShield = target.shieldHits > 0;
      hit(target, d, { shieldBreak: true });
      if (prm.splash) splash(target, d * prm.splash, 1.5);
      return { targets: [target], fx: hadShield ? 'vanralph:brise-bouclier' : 'vanralph:poing' };
    }
    default: {
      // ironman, strange, falcon, moana, pocahontas, tiana, coco, rapunzel : coup simple.
      hit(target, dmg);
      return { targets: [target], fx: `${id}:${BASE_FX[id] ?? 'tir'}` };
    }
  }
}

const BASE_FX: Partial<Record<UnitId, string>> = {
  ironman: 'repulseur', strange: 'magie', falcon: 'tir-aerien', moana: 'rame', pocahontas: 'feuilles',
  tiana: 'luciole', coco: 'notes', rapunzel: 'poele',
};

/** Unités dont la compétence se déclenche au début de chaque vague. */
export function onWaveStart(ctx: Ctx, player: number): number {
  const p = ctx.st.players[player]!;
  let mana = 0;
  for (let i = 0; i < GRID_SIZE; i++) {
    const u = p.grid[i];
    if (!u) continue;
    u.counters.avalanche = 0;
    u.counters.restores = 0;
    if (effectiveId(u) === 'tiana') {
      const prm = unitParams(ctx, player, 'tiana');
      let m = (prm.waveMana ?? 10) + (prm.manaPerRank ?? 5) * (u.rank - 1);
      if (ctx.st.pendingBoss && prm.bossWaveManaFactor) m *= prm.bossWaveManaFactor;
      mana += m;
      emit(ctx, { type: 'ability', player: p.id, slot: i, unit: 'tiana', name: 'Restaurant', targets: [] });
    }
  }
  return mana;
}

export { UNITS };

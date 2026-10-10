// Extension Pixar : profils Rush Royale des 15 héros (docs/rush-royale-mapping.md, « Extension Pixar ») et
// mécanique propre de l'extension, le coup de duo.
//
// Coup de duo (clé générique `duoEvery`) : toutes les N attaques (compteur `attacks` de l'unité), le partenaire
// du duo (Bob, Martin, Russell, Tristesse, Linguini, EVE, Alberto, Pile-Poil, 22…) ajoute son propre coup,
// propre à chaque héros. L'effet visuel porte le suffixe « :duo ».

import type { UnitId } from '../data/types';
import { DT, EPS, emit, pick, pickMany, rand, randInt, type Ctx, type SimEnemy, type SimUnit } from './internal';
import {
  applySlow, applyStun, baseDamage, bestBy, controlMul, effectiveId, isAlive, progress, pushBack,
  segmentOf, unitHit, unitParams, within,
} from './combat';

const notBoss = (e: SimEnemy) => !e.bossId && !e.x.mini;
/** Le coup en cours est-il un coup de duo ? */
export function duoNow(prm: Record<string, number>, u: SimUnit): boolean {
  const every = Math.round(prm.duoEvery ?? 0);
  return every > 0 && (u.counters.attacks ?? 0) % every === 0;
}

function abilityEv(ctx: Ctx, player: number, slot: number, unit: UnitId, name: string, targets: SimEnemy[]): void {
  emit(ctx, { type: 'ability', player: ctx.st.players[player]!.id, slot, unit, name, targets: targets.map((e) => e.uid) });
}
function fxEv(ctx: Ctx, player: number, slot: number, unit: UnitId, targets: SimEnemy[], fx: string): void {
  emit(ctx, { type: 'attack', player: ctx.st.players[player]!.id, slot, unit, targets: targets.map((e) => e.uid), fx });
}

/** Minuteries propres à l'extension (appelée à chaque tick). */
export function pxTick(u: SimUnit): void {
  const c = u.counters;
  for (const k of ['memoryFor', 'growFor'] as const) if ((c[k] ?? 0) > 0) c[k] = Math.max(0, (c[k] ?? 0) - DT);
}

/** Bonus de dégâts des souvenirs dorés (Joie) et du sort de croissance (Ian & Barley). */
export function pxDamageBonus(u: SimUnit): number {
  let b = 0;
  if ((u.counters.memoryFor ?? 0) > EPS) b += u.counters.memory ?? 0;
  if ((u.counters.growFor ?? 0) > EPS) b += u.counters.grow ?? 0;
  return b;
}

/** Compétences à recharge (même contrat que timedAbility) ; null = pas un héros Pixar à compétence. */
export function pxTimedAbility(ctx: Ctx, player: number, slot: number, u: SimUnit, all: SimEnemy[], enemies: SimEnemy[]): boolean | null {
  const id = effectiveId(u);
  const prm = unitParams(ctx, player, id);
  const ctrl = controlMul(ctx, player, id);
  switch (id) {
    case 'mrincredible': {
      // Valkyrie : toute la ligne du chemin de l'ennemi de tête.
      const lead = bestBy(enemies, (e) => progress(ctx, e));
      if (!lead) return false;
      const seg = segmentOf(ctx, lead);
      const line = all.filter((e) => isAlive(e) && segmentOf(ctx, e) === seg);
      const dmg = baseDamage(ctx, player, slot, u) * (prm.lineDamage ?? 2.5);
      for (const e of line) {
        unitHit(ctx, player, u, e, dmg, { noOnHit: true });
        if (isAlive(e)) applyStun(e, (prm.lineStun ?? 1.2) * ctrl);
      }
      fxEv(ctx, player, slot, id, line, 'mrincredible:seisme');
      abilityEv(ctx, player, slot, id, 'Coup de poing sismique', line);
      return true;
    }
    case 'frozone': {
      // Alchimiste : flaque (ici, pont de glace) autour de l'ennemi de tête.
      const lead = bestBy(enemies, (e) => progress(ctx, e));
      if (!lead) return false;
      const zone = [lead, ...within(ctx, all, lead, prm.iceRadius ?? 1.2)].filter(isAlive);
      const dmg = baseDamage(ctx, player, slot, u) * (prm.iceDamage ?? 1.2);
      for (const e of zone) {
        unitHit(ctx, player, u, e, dmg, { noOnHit: true });
        if (isAlive(e)) applySlow(ctx, e, prm.iceSlow ?? 0.45, (prm.iceDuration ?? 3) * ctrl);
      }
      fxEv(ctx, player, slot, id, zone, 'frozone:pont');
      abilityEv(ctx, player, slot, id, 'Pont de glace', zone);
      return true;
    }
    case 'sullimike': {
      // Chaman : rugissement, les ennemis à portée reculent.
      if (enemies.length === 0) return false;
      const pushed = enemies.filter((e) => isAlive(e) && pushBack(ctx, e, prm.roarPush ?? 1));
      fxEv(ctx, player, slot, id, enemies, 'sullimike:rugissement');
      abilityEv(ctx, player, slot, id, 'Rugissement', pushed);
      return true;
    }
    case 'carlrussell': {
      // Invocateur (adaptation) : les ballons soulèvent un ennemi hors du chemin.
      const target = pick(ctx, enemies.filter((e) => notBoss(e) && !e.x.flying));
      if (!target) return false;
      applyStun(target, (prm.liftDuration ?? 2) * ctrl);
      fxEv(ctx, player, slot, id, [target], 'carlrussell:ballons');
      abilityEv(ctx, player, slot, id, 'Ballons', [target]);
      return true;
    }
    case 'ianbarley': {
      // Archimage : un sort au hasard.
      if (enemies.length === 0) return false;
      const k = randInt(ctx, 4);
      const base = baseDamage(ctx, player, slot, u);
      if (k === 0) {
        const c = pick(ctx, enemies)!;
        const zone = [c, ...within(ctx, all, c, 1)].filter(isAlive);
        for (const e of zone) unitHit(ctx, player, u, e, base * (prm.fireball ?? 3), { noOnHit: true });
        fxEv(ctx, player, slot, id, zone, 'ianbarley:feu');
        abilityEv(ctx, player, slot, id, 'Boule de feu', zone);
      } else if (k === 1) {
        for (const e of enemies) applyStun(e, (prm.freeze ?? 1.5) * ctrl);
        fxEv(ctx, player, slot, id, enemies, 'ianbarley:temps');
        abilityEv(ctx, player, slot, id, 'Arrêt du temps', enemies);
      } else if (k === 2) {
        const grid = ctx.st.players[player]!.grid;
        const ally = pick(ctx, grid.filter((x): x is SimUnit => !!x && x !== u));
        if (ally) { ally.counters.grow = prm.growBuff ?? 0.3; ally.counters.growFor = prm.growDuration ?? 8; }
        abilityEv(ctx, player, slot, id, 'Sort de croissance', []);
      } else {
        const ts = pickMany(ctx, enemies, Math.max(1, Math.round(prm.rayTargets ?? 3)));
        for (const e of ts) unitHit(ctx, player, u, e, base * (prm.rayDamage ?? 2), { noOnHit: true });
        fxEv(ctx, player, slot, id, ts, 'ianbarley:rayon');
        abilityEv(ctx, player, slot, id, 'Rayon arcanique', ts);
      }
      return true;
    }
    case 'joe': {
      // Nécromancien (adaptation) : la musique galvanise tout le plateau.
      const grid = ctx.st.players[player]!.grid;
      for (const n of grid) {
        if (!n) continue;
        n.counters.haste = Math.max((n.counters.hasteFor ?? 0) > EPS ? n.counters.haste ?? 0 : 0, prm.jazzHaste ?? 0.25);
        n.counters.hasteFor = Math.max(n.counters.hasteFor ?? 0, prm.jazzDuration ?? 5);
      }
      abilityEv(ctx, player, slot, id, 'Musique de l’âme', []);
      return true;
    }
    default:
      return null;
  }
}

type Hit = (e: SimEnemy, d: number, o?: { crit?: boolean; shieldBreak?: boolean; noOnHit?: boolean }) => number;
type Splash = (center: SimEnemy, d: number, radius: number) => SimEnemy[];

/** Attaque de base d'un héros Pixar ; null = pas un héros Pixar. */
export function pxAttack(
  ctx: Ctx, player: number, slot: number, u: SimUnit, id: UnitId, target: SimEnemy, enemies: SimEnemy[],
  dmg: number, hit: Hit, splash: Splash,
): { targets: SimEnemy[]; fx: string } | null {
  const prm = unitParams(ctx, player, id);
  const ctrl = controlMul(ctx, player, id);
  const duo = duoNow(prm, u);
  switch (id) {
    case 'mrincredible': {
      hit(target, dmg);
      return { targets: [target], fx: 'mrincredible:poing' };
    }
    case 'elastigirl': {
      const lead = bestBy(enemies.filter(isAlive), (e) => progress(ctx, e));
      const isLead = lead === target;
      hit(target, isLead ? dmg * (1 + (prm.leadBonus ?? 0.5)) : dmg);
      if (isAlive(target) && prm.leadSlow) applySlow(ctx, target, prm.leadSlow, 1 * ctrl);
      return { targets: [target], fx: 'elastigirl:bras' };
    }
    case 'frozone': {
      hit(target, dmg);
      return { targets: [target], fx: 'frozone:glace' };
    }
    case 'violetflash': {
      hit(target, dmg);
      if (!duo) return { targets: [target], fx: 'violetflash:coup' };
      for (let k = 0; k < Math.round(prm.dashHits ?? 2); k++) if (isAlive(target)) hit(target, dmg, { noOnHit: true });
      return { targets: [target], fx: 'violetflash:duo' };
    }
    case 'sullimike': {
      hit(target, dmg);
      return { targets: [target], fx: 'sullimike:griffe' };
    }
    case 'mcqueen': {
      hit(target, dmg);
      if (duo && isAlive(target) && notBoss(target) && !target.x.flying) {
        target.x.knockFor = Math.max(target.x.knockFor ?? 0, (prm.towDuration ?? 1) * ctrl);
        return { targets: [target], fx: 'mcqueen:duo' };
      }
      return { targets: [target], fx: 'mcqueen:turbo' };
    }
    case 'carlrussell': {
      hit(target, dmg);
      return { targets: [target], fx: 'carlrussell:canne' };
    }
    case 'joysadness': {
      // Empoisonneur : la tristesse empoisonne (dégâts sur la durée, plus forts avec le rang).
      hit(target, dmg);
      if (isAlive(target)) {
        const dps = dmg * (prm.poisonPerRank ?? 0.08) * u.rank;
        const x = target.x;
        x.poison = Math.max((x.poisonFor ?? 0) > EPS ? x.poison ?? 0 : 0, dps);
        x.poisonFor = prm.poisonDuration ?? 3;
        x.poisonBy = player;
      }
      if (duo) {
        if (rand(ctx) < 0.5) {
          const grid = ctx.st.players[player]!.grid;
          const ally = pick(ctx, grid.filter((x): x is SimUnit => !!x && x !== u));
          if (ally) { ally.counters.memory = prm.memoryBuff ?? 0.2; ally.counters.memoryFor = 5; }
          abilityEv(ctx, player, slot, id, 'Souvenir doré', []);
        } else if (isAlive(target)) {
          applySlow(ctx, target, prm.memorySlow ?? 0.4, 2 * ctrl);
          abilityEv(ctx, player, slot, id, 'Souvenir bleu', [target]);
        }
        return { targets: [target], fx: 'joysadness:duo' };
      }
      return { targets: [target], fx: 'joysadness:souvenir' };
    }
    case 'remy': {
      hit(target, dmg);
      if (!duo) return { targets: [target], fx: 'remy:louche' };
      const around = splash(target, dmg * (prm.potSplash ?? 0.6), 1);
      return { targets: [target, ...around], fx: 'remy:duo' };
    }
    case 'walleeve': {
      hit(target, dmg);
      if (!duo) return { targets: [target], fx: 'walleeve:cube' };
      const zone = [target, ...within(ctx, enemies, target, prm.eveRadius ?? 1.5)].filter(isAlive);
      for (const e of zone) hit(e, dmg * (prm.eveDamage ?? 1.5), { noOnHit: true });
      return { targets: zone, fx: 'walleeve:duo' };
    }
    case 'lucaalberto': {
      hit(target, dmg);
      if (duo && isAlive(target)) pushBack(ctx, target, prm.wavePush ?? 0.5);
      return { targets: [target], fx: duo ? 'lucaalberto:duo' : 'lucaalberto:vague' };
    }
    case 'mei': {
      hit(target, dmg);
      const around = splash(target, dmg * (prm.crushSplash ?? 0.5), 1);
      return { targets: [target, ...around], fx: 'mei:panda' };
    }
    case 'jessie': {
      hit(target, dmg);
      if (isAlive(target)) {
        const e = target.effects;
        const active = (e.markedFor ?? 0) > EPS;
        e.marked = Math.max(active ? e.marked ?? 0 : 0, prm.lassoMark ?? 0.1);
        e.markedFor = Math.max(active ? e.markedFor ?? 0 : 0, prm.lassoMarkDuration ?? 4);
        if (duo && notBoss(target) && !target.x.flying) {
          target.x.knockFor = Math.max(target.x.knockFor ?? 0, (prm.lassoPull ?? 1.5) * ctrl);
          return { targets: [target], fx: 'jessie:duo' };
        }
      }
      return { targets: [target], fx: 'jessie:lasso' };
    }
    case 'ianbarley': {
      hit(target, dmg);
      return { targets: [target], fx: 'ianbarley:baton' };
    }
    case 'joe': {
      if (duo) { hit(target, dmg * (prm.sparkMul ?? 2), { crit: true }); return { targets: [target], fx: 'joe:duo' }; }
      hit(target, dmg);
      return { targets: [target], fx: 'joe:notes' };
    }
    default:
      return null;
  }
}

/** Début de vague : la recette de Rémy (mana par rang). Renvoie le mana gagné. */
export function pxWaveMana(ctx: Ctx, player: number): number {
  let m = 0;
  for (const u of ctx.st.players[player]!.grid) {
    if (!u) continue;
    const prm = unitParams(ctx, player, effectiveId(u));
    if (prm.waveManaPerRank) m += prm.waveManaPerRank * u.rank;
  }
  return m;
}

/** Violette : après un échange, l'alliée échangée est protégée des pouvoirs de boss. */
export function pxAfterSwap(ctx: Ctx, player: number, mover: SimUnit, other: SimUnit): void {
  const prm = unitParams(ctx, player, effectiveId(mover));
  if (prm.swapShield) other.counters.immuneFor = Math.max(other.counters.immuneFor ?? 0, prm.swapShield);
}


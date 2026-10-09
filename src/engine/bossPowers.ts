// Pouvoirs des boss (§4.4) : 6 boss en rotation (toutes les 6 s) et Thanos (Gant de l'infini
// toutes les 8 s, Claquement de doigts à 30 % de PV). Remember Me (Coco) réagit ici.

import { BOSSES, BOSS_STATS, LIEUTENANTS, SNAP_NAME, THANOS_STONES } from '../data/bosses';
import type { BossId } from '../data/types';
import { GRID_COLS, GRID_SIZE } from './types';
import {
  DT, EPS, emit, pick, pickMany, randInt, type Ctx, type LostUnit, type SimEnemy, type SimUnit,
} from './internal';
import { effectiveId, unitParams } from './combat';
import { initUnitCounters } from './abilities';

/** Joueur visé par le pouvoir d'un boss : au hasard en Coop (les boss arrivent par le tronc). */
function targetPlayer(ctx: Ctx): number {
  if (ctx.st.players.length > 1) return randInt(ctx, ctx.st.players.length);
  return 0;
}

/** Cases des unités qui peuvent subir un pouvoir (Raiponce et Pascal y échappent). */
function candidates(ctx: Ctx, player: number, filter?: (u: SimUnit) => boolean): number[] {
  const grid = ctx.st.players[player]!.grid;
  const out: number[] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    const u = grid[i];
    if (!u || effectiveId(u) === 'rapunzel') continue;
    if ((u.counters.immuneFor ?? 0) > EPS) continue;
    if (unitParams(ctx, player, effectiveId(u)).immuneBossControl && !filter) continue;
    if (filter && !filter(u)) continue;
    out.push(i);
  }
  return out;
}

/** Durée d'un effet de boss (talent « Pascal camouflé » de Raiponce). */
function effectDuration(ctx: Ctx, player: number, base: number): number {
  const grid = ctx.st.players[player]!.grid;
  let mul = 1;
  for (const u of grid) {
    if (u && effectiveId(u) === 'rapunzel') {
      const f = unitParams(ctx, player, 'rapunzel').bossEffectDurationFactor;
      if (f !== undefined) mul = Math.min(mul, f);
    }
  }
  return base * mul;
}

type StatusKey = 'stunnedFor' | 'sleepingFor' | 'hypnotizedFor';

function disable(ctx: Ctx, player: number, slots: number[], key: StatusKey, duration: number): void {
  const grid = ctx.st.players[player]!.grid;
  const d = effectDuration(ctx, player, duration);
  for (const s of slots) {
    const u = grid[s];
    if (u) u.status[key] = Math.max(u.status[key] ?? 0, d);
  }
}

function swap(ctx: Ctx, player: number, slots: number[]): void {
  const grid = ctx.st.players[player]!.grid;
  const [a, b] = slots;
  if (a === undefined || b === undefined) return;
  const t = grid[a]!;
  grid[a] = grid[b]!;
  grid[b] = t;
}

function downgrade(ctx: Ctx, player: number, slot: number, newRank: number, lost: LostUnit[]): void {
  const u = ctx.st.players[player]!.grid[slot];
  if (!u || newRank >= u.rank) return;
  lost.push({ slot, uid: u.uid, unit: u.unit, rank: u.rank, destroyed: false });
  u.rank = Math.max(1, newRank);
}

function powerEvent(ctx: Ctx, boss: BossId, player: number, slots: number[], name: string): void {
  emit(ctx, { type: 'bossPower', boss, player: ctx.st.players[player]!.id, slots, name });
}

/** Pouvoir d'un gros boss, ou version affaiblie pour un petit boss (lieutenant). */
export function useBossPower(ctx: Ctx, boss: SimEnemy): void {
  const id = (boss.bossId ?? boss.x.master)!;
  const def = boss.bossId ? BOSSES[id] : LIEUTENANTS[id];
  const prm = def.power.params;
  const player = targetPlayer(ctx);
  const p = ctx.st.players[player]!;
  const lost: LostUnit[] = [];
  switch (id) {
    case 'jafar': {
      const k = (prm.minUnits ?? 1) + randInt(ctx, (prm.maxUnits ?? 2) - (prm.minUnits ?? 1) + 1);
      const slots = pickMany(ctx, candidates(ctx, player), k);
      disable(ctx, player, slots, 'hypnotizedFor', prm.duration ?? 4);
      powerEvent(ctx, id, player, slots, def.power.name);
      break;
    }
    case 'cruella': {
      const slots = pickMany(ctx, candidates(ctx, player, (u) => u.rank >= Math.max(2, prm.minRank ?? 2)), prm.units ?? 1);
      for (const s of slots) downgrade(ctx, player, s, p.grid[s]!.rank - (prm.rankLoss ?? 1), lost);
      powerEvent(ctx, id, player, slots, def.power.name);
      break;
    }
    case 'ursula': {
      const slots = pickMany(ctx, candidates(ctx, player, () => true), 2);
      if (slots.length === 2) swap(ctx, player, slots);
      powerEvent(ctx, id, player, slots.length === 2 ? slots : [], def.power.name);
      break;
    }
    case 'malefique': {
      const all = candidates(ctx, player);
      if (prm.units) {
        const slots = pickMany(ctx, all, prm.units);
        disable(ctx, player, slots, 'sleepingFor', prm.duration ?? 3);
        powerEvent(ctx, id, player, slots, def.power.name);
        break;
      }
      const rows = [...new Set(all.map((s) => Math.floor(s / GRID_COLS)))].sort((a, b) => a - b);
      const row = pick(ctx, rows);
      const slots = row === undefined ? [] : all.filter((s) => Math.floor(s / GRID_COLS) === row);
      disable(ctx, player, slots, 'sleepingFor', prm.duration ?? 3);
      powerEvent(ctx, id, player, slots, def.power.name);
      break;
    }
    case 'galactus': {
      const slots = pickMany(ctx, candidates(ctx, player, (u) => u.rank <= (prm.maxRank ?? 3)), prm.units ?? 1);
      for (const s of slots) {
        const u = p.grid[s]!;
        lost.push({ slot: s, uid: u.uid, unit: u.unit, rank: u.rank, destroyed: true });
        p.grid[s] = null;
      }
      powerEvent(ctx, id, player, slots, def.power.name);
      break;
    }
    case 'bouffon': {
      const slots = pickMany(ctx, candidates(ctx, player), prm.units ?? 3);
      disable(ctx, player, slots, 'stunnedFor', prm.duration ?? 2);
      powerEvent(ctx, id, player, slots, def.power.name);
      break;
    }
    case 'thanos': {
      const stone = THANOS_STONES.find((t) => t.id === ctx.debugStone) ?? THANOS_STONES[randInt(ctx, THANOS_STONES.length)]!;
      let slots: number[] = [];
      switch (stone.id) {
        case 'puissance':
          slots = pickMany(ctx, candidates(ctx, player), prm.powerUnits ?? 3);
          disable(ctx, player, slots, 'stunnedFor', prm.powerDuration ?? 2);
          break;
        case 'espace':
          slots = pickMany(ctx, candidates(ctx, player, () => true), prm.spaceUnits ?? 2);
          if (slots.length === 2) swap(ctx, player, slots); else slots = [];
          break;
        case 'realite': {
          slots = pickMany(ctx, candidates(ctx, player, () => true), prm.realityUnits ?? 1);
          for (const s of slots) {
            const u = p.grid[s]!;
            const into = pick(ctx, p.deck.filter((d) => d !== u.unit));
            if (!into) continue;
            u.unit = into;
            delete u.status.transformedInto;
            delete u.status.transformFor;
            initUnitCounters(ctx, player, u);
          }
          break;
        }
        case 'ame':
          p.mana -= Math.floor(p.mana * (prm.soulManaSteal ?? 0.2));
          break;
        case 'temps':
          boss.hp = Math.min(boss.maxHp, boss.hp + boss.maxHp * (prm.timeHeal ?? 0.05));
          break;
        case 'esprit':
          slots = pickMany(ctx, candidates(ctx, player), prm.mindUnits ?? 2);
          disable(ctx, player, slots, 'hypnotizedFor', prm.mindDuration ?? 4);
          break;
      }
      powerEvent(ctx, id, player, slots, stone.name);
      break;
    }
  }
  if (lost.length) rememberMe(ctx, player, lost);
}

/** Claquement de doigts : 3 unités perdent la moitié de leurs rangs (au moins 1 rang). */
function snap(ctx: Ctx): void {
  const prm = BOSSES.thanos.power.params;
  const player = targetPlayer(ctx);
  const grid = ctx.st.players[player]!.grid;
  const slots = pickMany(ctx, candidates(ctx, player, () => true), prm.snapUnits ?? 3);
  const lost: LostUnit[] = [];
  for (const s of slots) {
    const u = grid[s]!;
    downgrade(ctx, player, s, u.rank - Math.max(1, Math.floor(u.rank / 2)), lost);
  }
  powerEvent(ctx, 'thanos', player, slots, SNAP_NAME);
  if (lost.length) rememberMe(ctx, player, lost);
}

/** Remember Me : une Coco du plateau restaure une unité détruite ou rétrogradée par un boss. */
function rememberMe(ctx: Ctx, player: number, lost: LostUnit[]): void {
  const p = ctx.st.players[player]!;
  const pending = lost.slice();
  for (let i = 0; i < GRID_SIZE && pending.length > 0; i++) {
    const coco = p.grid[i];
    if (!coco || effectiveId(coco) !== 'coco') continue;
    const prm = unitParams(ctx, player, 'coco');
    let uses = coco.counters.restores ?? 0;
    while (pending.length > 0) {
      const bonus = uses >= (prm.restoreUses ?? 1);
      if (bonus && p.extraRestores <= 0) break;
      const l = pending.shift()!;
      let restored: SimUnit | undefined;
      if (l.destroyed) {
        let slot = p.grid[l.slot] ? -1 : l.slot;
        if (slot < 0) slot = p.grid.findIndex((g) => !g);
        if (slot < 0) continue;
        restored = { uid: ctx.st.nextUid++, unit: l.unit, rank: l.rank, cooldown: 0.3, status: {}, counters: {} };
        initUnitCounters(ctx, player, restored);
        p.grid[slot] = restored;
      } else {
        restored = p.grid.find((g) => g?.uid === l.uid) ?? undefined;
        if (!restored) continue;
        restored.rank = l.rank;
      }
      if (prm.restoredDamageBonus) {
        restored.counters.restoredBonus = prm.restoredDamageBonus;
        restored.counters.restoredFor = prm.restoredBonusDuration ?? 10;
      }
      if (prm.restoredImmunity) restored.counters.immuneFor = prm.restoredImmunity;
      if (bonus) p.extraRestores -= 1; else uses += 1;
      coco.counters.restores = uses;
      emit(ctx, { type: 'ability', player: p.id, slot: i, unit: 'coco', name: 'Remember Me', targets: [] });
    }
  }
}

/** Timers des boss : pouvoirs, rage, Claquement de doigts. */
export function updateBosses(ctx: Ctx): void {
  let rageIn: number | undefined;
  for (const e of ctx.st.enemies) {
    if (e.hp <= 0 || e.x.gone || (!e.bossId && !e.x.mini)) continue;
    // Rage
    if (!e.x.enraged) {
      e.x.rageIn = Math.max(0, (e.x.rageIn ?? BOSS_STATS.rageAfter) - DT);
      if (e.x.rageIn <= EPS) {
        e.x.enraged = 1;
        e.speed *= BOSS_STATS.rageSpeedMul;
        if (e.bossId) emit(ctx, { type: 'bossRage', boss: e.bossId });
      }
      rageIn = Math.min(rageIn ?? Infinity, e.x.rageIn);
    } else {
      rageIn = 0;
    }
    if (!e.bossId && !e.x.master) continue;
    const interval = e.bossId ? BOSSES[e.bossId].power.interval : LIEUTENANTS[e.x.master!].power.interval;
    // Claquement de doigts (Thanos)
    if (e.bossId === 'thanos') {
      const prm = BOSSES.thanos.power.params;
      if (!e.x.snapped && e.hp <= e.maxHp * (prm.snapThreshold ?? 0.3)) {
        e.x.snapped = 1;
        e.x.snapIn = prm.snapDelay ?? 1;
        // Annonce : fond blanc et silence (aucune case), l'effet suit après le délai.
        powerEvent(ctx, 'thanos', targetPlayer(ctx), [], SNAP_NAME);
      }
      if (e.x.snapIn !== undefined && e.x.snapIn > 0) {
        e.x.snapIn = Math.max(0, e.x.snapIn - DT);
        if (e.x.snapIn <= EPS) {
          e.x.snapIn = 0;
          snap(ctx);
        }
        continue; // le gant se tait pendant le claquement
      }
    }
    e.x.powerIn = (e.x.powerIn ?? interval) - DT;
    if (e.x.powerIn <= EPS) {
      e.x.powerIn = interval;
      useBossPower(ctx, e);
    }
  }
  ctx.st.bossRageIn = rageIn;
}

/** Citrouilles volantes : explosion à l'arrivée, qui étourdit des unités. */
export function pumpkinExplosion(ctx: Ctx, e: SimEnemy): void {
  if (!e.x.arrivalStun) return;
  const player = e.x.owner !== undefined && ctx.st.players[e.x.owner] ? e.x.owner : targetPlayer(ctx);
  const slots = pickMany(ctx, candidates(ctx, player), e.x.arrivalStunUnits ?? 2);
  disable(ctx, player, slots, 'stunnedFor', e.x.arrivalStun);
  powerEvent(ctx, 'bouffon', player, slots, 'Explosion de citrouille');
}


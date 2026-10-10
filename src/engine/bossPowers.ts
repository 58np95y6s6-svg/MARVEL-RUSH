// Pouvoirs des boss (§4.4) : 11 boss en rotation (toutes les 6 s, dont les 5 de l'extension DC),
// Thanos (Gant de l'infini toutes les 8 s, Claquement de doigts à 30 % de PV) et Darkseid (Rayons
// Oméga / Boom Tube toutes les 8 s, Équation d'Anti-Vie à 30 % de PV). Remember Me (Coco) réagit ici.

import {
  ANTI_LIFE_NAME, BLIZZARD_NAME, BOOM_TUBE_NAME, BOSSES, BOSS_STATS, CHAOS_NAME, DECEPTICON_CALL_NAME, DEVOUR_NAME,
  FIRE_CANNON_NAME, HUNGER_NAME, LIEUTENANTS, OMEGA_NAME, SNAP_NAME, THANOS_STONES, TYRANNY_NAME, VENOM_NAME,
} from '../data/bosses';
import { WAVE_RULES, waveHp } from '../data/enemies';
import type { BossId } from '../data/types';
import { GRID_COLS, GRID_SIZE } from './types';
import {
  DT, EPS, emit, pick, pickMany, randInt, type Ctx, type LostUnit, type SimEnemy, type SimUnit,
} from './internal';
import { effectiveId, unitParams } from './combat';
import { initUnitCounters } from './abilities';
import { forceRobot } from './transformers';
import { sacrifice } from './archetypes';

/** Joueur visé par le pouvoir d'un boss : au hasard en Coop (les boss arrivent par le tronc). */
function targetPlayer(ctx: Ctx): number {
  if (ctx.st.players.length > 1) return randInt(ctx, ctx.st.players.length);
  return 0;
}

/** Cases des unités qui peuvent subir un pouvoir (talent `immuneBossControl` : elles y échappent). */
function candidates(ctx: Ctx, player: number, filter?: (u: SimUnit) => boolean): number[] {
  const grid = ctx.st.players[player]!.grid;
  const out: number[] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    const u = grid[i];
    if (!u) continue;
    if ((u.counters.immuneFor ?? 0) > EPS) continue;
    // Martian Manhunter (Intangibilité) échappe à tous les pouvoirs de boss.
    if (unitParams(ctx, player, effectiveId(u)).intangible) continue;
    if (unitParams(ctx, player, effectiveId(u)).immuneBossControl) continue;
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
        sacrifice(ctx, player, s, u);
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
            delete u.status.copyMul;
            delete u.status.copyOf;
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
    // ───────────── Extension DC ─────────────
    case 'joker': {
      // Rire du Joker : échange les rangs de 2 unités de rangs différents (au plus maxRankGap d'écart).
      const all = candidates(ctx, player, () => true);
      const gap = prm.maxRankGap ?? Infinity;
      const pairs: [number, number][] = [];
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          const d = Math.abs(p.grid[all[i]!]!.rank - p.grid[all[j]!]!.rank);
          if (d > 0 && d <= gap) pairs.push([all[i]!, all[j]!]);
        }
      }
      const pair = pick(ctx, pairs);
      if (pair) {
        const [a, b] = pair.map((x) => p.grid[x]!) as [SimUnit, SimUnit];
        const [ra, rb] = [a.rank, b.rank];
        // La plus haute est « rétrogradée » (Coco peut la restaurer) ; la plus basse monte.
        if (ra > rb) downgrade(ctx, player, pair[0], rb, lost); else downgrade(ctx, player, pair[1], ra, lost);
        if (ra > rb) b.rank = ra; else a.rank = rb;
      }
      powerEvent(ctx, id, player, pair ? [pair[0], pair[1]] : [], def.power.name);
      break;
    }
    case 'luthor': {
      // Rayon de kryptonite : l'unité de plus haut rang (ou une au hasard pour le lieutenant) est affaiblie.
      const all = candidates(ctx, player, () => true);
      let slots: number[];
      if (prm.highest) {
        const top = Math.max(0, ...all.map((x) => p.grid[x]!.rank));
        slots = pickMany(ctx, all.filter((x) => p.grid[x]!.rank === top), prm.units ?? 1);
      } else {
        slots = pickMany(ctx, all, prm.units ?? 1);
      }
      const d = effectDuration(ctx, player, prm.duration ?? 6);
      for (const x of slots) {
        const u = p.grid[x]!;
        u.counters.weaken = Math.max((u.counters.weakenFor ?? 0) > EPS ? u.counters.weaken ?? 0 : 0, prm.weaken ?? 0.5);
        u.counters.weakenFor = Math.max(u.counters.weakenFor ?? 0, d);
      }
      powerEvent(ctx, id, player, slots, def.power.name);
      break;
    }
    case 'bane': {
      // Brise-échine : l'unité de plus haut rang perd des rangs.
      const all = candidates(ctx, player, (u) => u.rank >= Math.max(2, prm.minRank ?? 2));
      const top = Math.max(0, ...all.map((x) => p.grid[x]!.rank));
      const slots = pickMany(ctx, all.filter((x) => p.grid[x]!.rank === top), 1);
      for (const x of slots) downgrade(ctx, player, x, p.grid[x]!.rank - (prm.rankLoss ?? 2), lost);
      powerEvent(ctx, id, player, slots, def.power.name);
      break;
    }
    case 'sinestro': {
      // Cage de la peur : une colonne entière (ou `units` unités d'une colonne) emprisonnée.
      const all = candidates(ctx, player);
      const cols = [...new Set(all.map((x) => x % GRID_COLS))].sort((a, b) => a - b);
      const col = pick(ctx, cols);
      let slots = col === undefined ? [] : all.filter((x) => x % GRID_COLS === col);
      if (prm.units) slots = pickMany(ctx, slots, prm.units).sort((a, b) => a - b);
      disable(ctx, player, slots, 'stunnedFor', prm.duration ?? 3);
      powerEvent(ctx, id, player, slots, def.power.name);
      break;
    }
    case 'blackadam': {
      // Foudre de Kahndaq : une unité étourdie, la foudre rebondit sur ses voisines.
      const all = candidates(ctx, player);
      const main = pick(ctx, all);
      const slots: number[] = [];
      if (main !== undefined) {
        disable(ctx, player, [main], 'stunnedFor', prm.duration ?? 3);
        slots.push(main);
        if (prm.chainDuration) {
          const side = orthogonal(main).filter((x) => all.includes(x));
          disable(ctx, player, side, 'stunnedFor', prm.chainDuration);
          slots.push(...side);
        }
      }
      powerEvent(ctx, id, player, slots, def.power.name);
      break;
    }
    case 'darkseid': {
      const uses = boss.x.powerUses ?? 0;
      boss.x.powerUses = uses + 1;
      if (uses % 2 === 0) {
        // Rayons Oméga : des unités perdent un rang et sont étourdies.
        const slots = pickMany(ctx, candidates(ctx, player, () => true), prm.omegaUnits ?? 2);
        for (const x of slots) {
          if (prm.omegaRankLoss) downgrade(ctx, player, x, p.grid[x]!.rank - prm.omegaRankLoss, lost);
        }
        disable(ctx, player, slots.filter((x) => !unitParams(ctx, player, effectiveId(p.grid[x]!)).immuneBossControl), 'stunnedFor', prm.omegaStun ?? 2);
        powerEvent(ctx, id, player, slots, OMEGA_NAME);
      } else {
        boomTube(ctx, boss, prm.boomTubeCount ?? 4);
        powerEvent(ctx, id, player, [], BOOM_TUBE_NAME);
      }
      break;
    }
    // ───────────── Extension Transformers (Decepticons) ─────────────
    case 'starscream': {
      const slots = pickMany(ctx, candidates(ctx, player), prm.units ?? 2);
      disable(ctx, player, slots, 'stunnedFor', prm.duration ?? 2.5);
      powerEvent(ctx, id, player, slots, def.power.name);
      break;
    }
    case 'soundwave': {
      // Brouillage : ni améliorations en partie ni transformation pendant la durée.
      const slots = pickMany(ctx, candidates(ctx, player), prm.units ?? 3);
      const d = effectDuration(ctx, player, prm.duration ?? 5);
      for (const s of slots) { const u = p.grid[s]!; u.counters.jamFor = Math.max(u.counters.jamFor ?? 0, d); }
      powerEvent(ctx, id, player, slots, def.power.name);
      break;
    }
    case 'shockwave': {
      // Rayon de Kaon : l'unité devient une autre unité du deck un moment (même rang).
      const slots = pickMany(ctx, candidates(ctx, player, (u) => !u.status.transformedInto && p.deck.some((d) => d !== u.unit)), prm.units ?? 1);
      for (const s of slots) {
        const u = p.grid[s]!;
        const into = pick(ctx, p.deck.filter((d) => d !== u.unit));
        if (!into) continue;
        u.status.transformedInto = into;
        u.status.transformFor = effectDuration(ctx, player, prm.duration ?? 6);
      }
      powerEvent(ctx, id, player, slots, def.power.name);
      break;
    }
    case 'devastator': {
      // Poing : une colonne entière (lieutenant : `units` unités d'une même colonne).
      const all = candidates(ctx, player);
      const cols = [...new Set(all.map((s) => s % GRID_COLS))].sort((a, b) => a - b);
      const col = pick(ctx, cols);
      let slots = col === undefined ? [] : all.filter((s) => s % GRID_COLS === col);
      if (prm.units) slots = slots.slice(0, prm.units);
      disable(ctx, player, slots, 'stunnedFor', prm.duration ?? 2);
      powerEvent(ctx, id, player, slots, def.power.name);
      break;
    }
    case 'blitzwing': {
      // Glace et feu, en alternance.
      const fire = (boss.x.powerUses ?? 0) % 2 === 1;
      boss.x.powerUses = (boss.x.powerUses ?? 0) + 1;
      const all = candidates(ctx, player);
      if (!fire) {
        let slots: number[];
        if (prm.units) slots = pickMany(ctx, all, prm.units);
        else {
          const rows = [...new Set(all.map((s) => Math.floor(s / GRID_COLS)))].sort((a, b) => a - b);
          const row = pick(ctx, rows);
          slots = row === undefined ? [] : all.filter((s) => Math.floor(s / GRID_COLS) === row);
        }
        disable(ctx, player, slots, 'stunnedFor', prm.duration ?? 2);
        powerEvent(ctx, id, player, slots, BLIZZARD_NAME);
      } else {
        const slots = pickMany(ctx, all, prm.fireUnits ?? 2);
        const d = effectDuration(ctx, player, prm.scorchDuration ?? 5);
        for (const s of slots) { const u = p.grid[s]!; u.counters.scorch = prm.scorch ?? 0.4; u.counters.scorchFor = d; }
        powerEvent(ctx, id, player, slots, FIRE_CANNON_NAME);
      }
      break;
    }
    case 'megatron': {
      const call = (boss.x.powerUses ?? 0) % 2 === 1;
      boss.x.powerUses = (boss.x.powerUses ?? 0) + 1;
      if (!call) {
        const slots = pickMany(ctx, candidates(ctx, player), prm.cannonUnits ?? 2);
        for (const s of slots) if (prm.cannonRankLoss) downgrade(ctx, player, s, p.grid[s]!.rank - prm.cannonRankLoss, lost);
        disable(ctx, player, slots, 'stunnedFor', prm.cannonStun ?? 1.5);
        powerEvent(ctx, id, player, slots, def.power.name);
      } else {
        callMinions(ctx, boss, 'megatron', prm.callCount ?? 3);
        powerEvent(ctx, id, player, [], DECEPTICON_CALL_NAME);
      }
      break;
    }
    case 'unicron': {
      const chaos = (boss.x.powerUses ?? 0) % 2 === 1 || !prm.devourMaxRank;
      boss.x.powerUses = (boss.x.powerUses ?? 0) + 1;
      if (!chaos) {
        const slots = pickMany(ctx, candidates(ctx, player, (u) => u.rank <= (prm.devourMaxRank ?? 4)), 1);
        for (const s of slots) {
          const u = p.grid[s]!;
          lost.push({ slot: s, uid: u.uid, unit: u.unit, rank: u.rank, destroyed: true });
          sacrifice(ctx, player, s, u);
          p.grid[s] = null;
        }
        powerEvent(ctx, id, player, slots, DEVOUR_NAME);
      } else {
        const all = pickMany(ctx, candidates(ctx, player, () => true), 2 * Math.max(1, Math.round(prm.chaosPairs ?? 2)));
        for (let i = 0; i + 1 < all.length; i += 2) swap(ctx, player, [all[i]!, all[i + 1]!]);
        powerEvent(ctx, id, player, all.length >= 2 ? all.slice(0, all.length - (all.length % 2)) : [], CHAOS_NAME);
      }
      break;
    }
  }
  if (lost.length) rememberMe(ctx, player, lost);
}

/** Megatron (« Decepticons, attaquez ! ») : des sbires surgissent juste derrière le boss sur le chemin. */
function callMinions(ctx: Ctx, boss: SimEnemy, master: BossId, count: number): void {
  const prm = BOSSES[master].minion.params;
  const s = ctx.cfg.script;
  const hp = waveHp(Math.max(1, ctx.st.wave), s?.waveHpGrowth) * (s?.enemyHpMultiplier ?? 1) * (prm.hpMul ?? 1);
  for (let k = 0; k < Math.max(0, Math.round(count)); k++) {
    const e: SimEnemy = {
      uid: ctx.st.nextUid++, kind: 'sbire', lane: boss.lane, distance: Math.max(0, boss.distance - 0.4 * (k + 1)),
      speed: 2 * (prm.speedMul ?? 1), hp, maxHp: hp, armor: prm.armor ?? 0, shieldHits: prm.shieldHits ?? 0,
      effects: {}, minionOf: master, x: { flying: prm.flying ? 1 : undefined },
    };
    if (boss.x.from) e.x.from = boss.x.from;
    if (boss.x.owner !== undefined) e.x.owner = boss.x.owner;
    ctx.st.enemies.push(e);
    emit(ctx, { type: 'enemySpawn', enemy: e.uid, kind: 'sbire', lane: e.lane });
  }
}

/** Tyrannie (Megatron, 30 % de PV) : tous les Autobots repassent en robot, étourdis, et 2 unités perdent 1 rang. */
function tyranny(ctx: Ctx): void {
  const prm = BOSSES.megatron.power.params;
  const player = targetPlayer(ctx);
  const grid = ctx.st.players[player]!.grid;
  const autobots = forceRobot(ctx, player, 6);
  const slots = candidates(ctx, player).filter((s) => autobots.includes(s));
  disable(ctx, player, slots, 'stunnedFor', prm.tyrannyStun ?? 2);
  const lost: LostUnit[] = [];
  const top = candidates(ctx, player, () => true).sort((a, b) => grid[b]!.rank - grid[a]!.rank || a - b).slice(0, prm.tyrannyUnits ?? 2);
  for (const s of top) downgrade(ctx, player, s, grid[s]!.rank - (prm.tyrannyRankLoss ?? 1), lost);
  powerEvent(ctx, 'megatron', player, [...new Set([...slots, ...top])], TYRANNY_NAME);
  if (lost.length) rememberMe(ctx, player, lost);
}

/** Faim cosmique (Unicron, 50 % de PV) : il se soigne et 3 unités perdent 1 rang. */
function hunger(ctx: Ctx, boss: SimEnemy): void {
  const prm = BOSSES.unicron.power.params;
  const player = targetPlayer(ctx);
  const grid = ctx.st.players[player]!.grid;
  boss.hp = Math.min(boss.maxHp, boss.hp + boss.maxHp * (prm.hungerHeal ?? 0.1));
  const lost: LostUnit[] = [];
  const slots = pickMany(ctx, candidates(ctx, player, (u) => u.rank >= 2), prm.hungerUnits ?? 3);
  for (const s of slots) downgrade(ctx, player, s, grid[s]!.rank - 1, lost);
  powerEvent(ctx, 'unicron', player, slots, HUNGER_NAME);
  if (lost.length) rememberMe(ctx, player, lost);
}

/** Voisines orthogonales d'une case de la grille. */
function orthogonal(slot: number): number[] {
  const c = slot % GRID_COLS, r = Math.floor(slot / GRID_COLS);
  const out: number[] = [];
  for (const [dc, dr] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
    const nc = c + dc, nr = r + dr;
    if (nc >= 0 && nc < GRID_COLS && nr >= 0 && nr < GRID_SIZE / GRID_COLS) out.push(nr * GRID_COLS + nc);
  }
  return out;
}

/** Boom Tube (Darkseid) : des Parademons surgissent derrière lui sur le chemin. */
function boomTube(ctx: Ctx, boss: SimEnemy, count: number): void {
  const prm = BOSSES.darkseid.minion.params;
  const hp = WAVE_RULES.baseHp * Math.pow(WAVE_RULES.hpGrowth, Math.max(0, ctx.st.wave - 1))
    * (ctx.cfg.script?.enemyHpMultiplier ?? 1) * (prm.hpMul ?? 1);
  for (let k = 0; k < Math.max(0, Math.round(count)); k++) {
    const e: SimEnemy = {
      uid: ctx.st.nextUid++, kind: 'sbire', lane: boss.lane, distance: Math.max(0, boss.distance - 0.4 * (k + 1)),
      speed: WAVE_RULES.baseSpeed * (prm.speedMul ?? 1), hp, maxHp: hp, armor: prm.armor ?? 0, shieldHits: prm.shieldHits ?? 0,
      effects: {}, minionOf: 'darkseid', x: { flying: prm.flying ? 1 : undefined },
    };
    if (boss.x.from) e.x.from = boss.x.from;
    if (boss.x.owner !== undefined) e.x.owner = boss.x.owner;
    ctx.st.enemies.push(e);
    emit(ctx, { type: 'enemySpawn', enemy: e.uid, kind: 'sbire', lane: e.lane });
  }
}

/** Équation d'Anti-Vie (Darkseid) : les meilleures unités perdent un rang, tout le plateau est hypnotisé. */
function antiLife(ctx: Ctx): void {
  const prm = BOSSES.darkseid.power.params;
  const player = targetPlayer(ctx);
  const grid = ctx.st.players[player]!.grid;
  const all = candidates(ctx, player, () => true);
  const lost: LostUnit[] = [];
  const top = all.slice().sort((a, b) => grid[b]!.rank - grid[a]!.rank || a - b).slice(0, prm.antiLifeUnits ?? 3);
  for (const x of top) downgrade(ctx, player, x, grid[x]!.rank - (prm.antiLifeRankLoss ?? 1), lost);
  disable(ctx, player, all, 'hypnotizedFor', prm.antiLifeDuration ?? 2);
  powerEvent(ctx, 'darkseid', player, all, ANTI_LIFE_NAME);
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
      const bonus = uses >= (prm.restoreUses ?? 0); // talent de Coco ; sinon seulement le bonus de map
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
    // Venin (Bane) : une fois, sous le seuil de PV, il se soigne et accélère.
    if (e.bossId === 'bane' && !e.x.venom) {
      const prm = BOSSES.bane.power.params;
      if (e.hp <= e.maxHp * (prm.venomThreshold ?? 0.5)) {
        e.x.venom = 1;
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * (prm.venomHeal ?? 0.15));
        e.speed *= prm.venomSpeedMul ?? 1;
        powerEvent(ctx, 'bane', targetPlayer(ctx), [], VENOM_NAME);
      }
    }
    // Équation d'Anti-Vie (Darkseid) : annonce à 30 % de PV, effet après un délai.
    if (e.bossId === 'darkseid') {
      const prm = BOSSES.darkseid.power.params;
      if (!e.x.antiLife && e.hp <= e.maxHp * (prm.antiLifeThreshold ?? 0.3)) {
        e.x.antiLife = 1;
        e.x.antiLifeIn = prm.antiLifeDelay ?? 1;
        powerEvent(ctx, 'darkseid', targetPlayer(ctx), [], ANTI_LIFE_NAME);
      }
      if (e.x.antiLifeIn !== undefined && e.x.antiLifeIn > 0) {
        e.x.antiLifeIn = Math.max(0, e.x.antiLifeIn - DT);
        if (e.x.antiLifeIn <= EPS) {
          e.x.antiLifeIn = 0;
          antiLife(ctx);
        }
        continue; // les autres pouvoirs se taisent pendant l'Équation
      }
    }
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
    // Extension Transformers : Tyrannie de Megatron (30 %) et Faim cosmique d'Unicron (50 %), une fois.
    if (e.bossId === 'megatron' && !e.x.tyranny && e.hp <= e.maxHp * (BOSSES.megatron.power.params.tyrannyThreshold ?? 0.3)) {
      e.x.tyranny = 1;
      tyranny(ctx);
    }
    if (e.bossId === 'unicron' && !e.x.hunger && e.hp <= e.maxHp * (BOSSES.unicron.power.params.hungerThreshold ?? 0.5)) {
      e.x.hunger = 1;
      hunger(ctx, e);
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


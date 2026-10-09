import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine';
import { debugPlace, debugSpawn } from '../../src/engine/debug';
import { GRID_SIZE } from '../../src/engine/types';
import { MARVEL, ofType, quiet, setup, simState, solo, step } from './helpers';
import { UNITS } from '../../src/data/units';
import { RANK_ATTACK_SPEED, RANK_DAMAGE } from '../../src/engine/combat';

/** Dégâts de base de Captain Marvel (portée globale). */
const CM = UNITS.cmarvel.damage;

describe('invocation', () => {
  it('coûte 10 puis +10, pose une unité du deck au rang 1 sur une case vide', () => {
    const e = quiet();
    const p = e.state.players[0]!;
    expect(p.mana).toBe(100);
    const costs: number[] = [];
    for (let i = 0; i < 4; i++) {
      costs.push(p.summonCost);
      e.apply({ type: 'summon', player: 'p1' });
      const ev = ofType(step(e), 'summon');
      expect(ev).toHaveLength(1);
      expect(MARVEL).toContain(ev[0]!.unit);
      expect(ev[0]!.rank).toBe(1);
      expect(p.grid[ev[0]!.slot]?.unit).toBe(ev[0]!.unit);
    }
    expect(costs).toEqual([10, 20, 30, 40]);
    expect(p.mana).toBe(0);
    expect(p.grid.filter(Boolean)).toHaveLength(4);
  });

  it('refuse sans mana ou plateau plein, avec une raison en français', () => {
    const e = quiet(MARVEL, { script: { startMana: 5 } });
    e.apply({ type: 'summon', player: 'p1' });
    expect(ofType(step(e), 'rejected')[0]!.reason).toMatch(/mana/);
    const p = e.state.players[0]!;
    p.mana = 1e6;
    for (let i = 0; i < GRID_SIZE; i++) debugPlace(e, 0, i, 'widow');
    e.apply({ type: 'summon', player: 'p1' });
    expect(ofType(step(e), 'rejected')[0]!.reason).toMatch(/Plateau plein/);
  });

  it('respecte script.forcedSummons', () => {
    const e = quiet(MARVEL, { script: { forcedSummons: ['widow', 'widow', 'falcon'], startMana: 1000 } });
    for (let i = 0; i < 4; i++) e.apply({ type: 'summon', player: 'p1' });
    const units = ofType(step(e), 'summon').map((s) => s.unit);
    expect(units.slice(0, 3)).toEqual(['widow', 'widow', 'falcon']);
  });
});

describe('fusion', () => {
  it('même unité et même rang : unité aléatoire du deck au rang +1 sur la case de destination', () => {
    const e = quiet();
    debugPlace(e, 0, 0, 'hawkeye', 2);
    debugPlace(e, 0, 7, 'hawkeye', 2);
    e.apply({ type: 'merge', player: 'p1', from: 0, to: 7 });
    const m = ofType(step(e), 'merge')[0]!;
    expect(m).toMatchObject({ from: 0, to: 7, rank: 3 });
    const g = e.state.players[0]!.grid;
    expect(g[0]).toBeNull();
    expect(g[7]!.rank).toBe(3);
    expect(MARVEL).toContain(g[7]!.unit);
  });

  it('refuse une autre unité, un autre rang, la même case et le rang 7', () => {
    const e = quiet();
    debugPlace(e, 0, 0, 'hawkeye', 1);
    debugPlace(e, 0, 1, 'falcon', 1);
    debugPlace(e, 0, 2, 'hawkeye', 2);
    debugPlace(e, 0, 3, 'widow', 7);
    debugPlace(e, 0, 4, 'widow', 7);
    e.apply({ type: 'merge', player: 'p1', from: 0, to: 1 });
    e.apply({ type: 'merge', player: 'p1', from: 0, to: 2 });
    e.apply({ type: 'merge', player: 'p1', from: 0, to: 0 });
    e.apply({ type: 'merge', player: 'p1', from: 3, to: 4 });
    e.apply({ type: 'merge', player: 'p1', from: 5, to: 0 });
    const r = ofType(step(e), 'rejected').map((x) => x.reason);
    expect(r).toHaveLength(5);
    expect(r[0]).toMatch(/identiques/);
    expect(r[1]).toMatch(/même rang/);
    expect(r[3]).toMatch(/Rang maximal/);
    expect(ofType(step(e), 'merge')).toHaveLength(0);
  });
});

describe('améliorations en partie', () => {
  it('coûtent 100/200/400/700, montent jusqu’au niveau 5 et donnent +15 % de dégâts', () => {
    const e = quiet(MARVEL, { script: { startMana: 10000 } });
    const p = e.state.players[0]!;
    debugPlace(e, 0, 0, 'cmarvel', 1);
    const target = debugSpawn(e, { hp: 1e9 });
    const before = ofType(step(e, 1), 'hit')[0]!.damage;
    const spent: number[] = [];
    for (let i = 0; i < 5; i++) {
      const m = p.mana;
      e.apply({ type: 'powerup', player: 'p1', unit: 'cmarvel' });
      step(e);
      spent.push(m - p.mana);
    }
    expect(spent).toEqual([100, 200, 400, 700, 0]);
    expect(p.powerUps.cmarvel).toBe(5);
    e.state.players[0]!.grid[0]!.cooldown = 0;
    const after = ofType(step(e, 1), 'hit').find((h) => h.enemy === target.uid)!.damage;
    expect(after / before).toBeCloseTo(1.6, 5);
    e.apply({ type: 'powerup', player: 'p1', unit: 'ironman' });
    expect(ofType(step(e), 'rejected')[0]!.reason).toMatch(/deck/);
  });
});

describe('dégâts', () => {
  const firstHit = (deck = MARVEL, extra = {}, rank = 1) => {
    const e = quiet(deck, {}, extra);
    debugPlace(e, 0, 0, 'cmarvel', rank);
    debugSpawn(e, { hp: 1e9 });
    return ofType(step(e), 'hit')[0]!.damage;
  };
  it('dégâts selon le rang (+51 % par rang)', () => {
    expect(firstHit(MARVEL, {}, 1)).toBeCloseTo(CM);
    expect(firstHit(MARVEL, {}, 3)).toBeCloseTo(CM * (1 + 2 * RANK_DAMAGE));
  });
  it('le rang accélère les attaques (+12 % par rang) ; DPS du rang 7 ≈ 7 × rang 1', () => {
    const count = (rank: number) => {
      const e = quiet();
      debugPlace(e, 0, 0, 'cmarvel', rank);
      debugSpawn(e, { hp: 1e12 });
      return ofType(step(e, 20 * 60), 'attack').length;
    };
    const r1 = count(1), r3 = count(3);
    expect(r3).toBeGreaterThan(r1);
    expect(r3 / r1).toBeCloseTo(1 + 2 * RANK_ATTACK_SPEED, 1);
    expect((1 + 6 * RANK_ATTACK_SPEED) * (1 + 6 * RANK_DAMAGE)).toBeCloseTo(7, 0);
  });
  it('niveau de collection : +10 % par niveau', () => {
    expect(firstHit(MARVEL, { levels: { cmarvel: 4 } })).toBeCloseTo(CM * 1.3);
  });
  it('éveil : +6 % de dégâts et +4 % de vitesse par étoile', () => {
    expect(firstHit(MARVEL, { awakening: { cmarvel: 5 } })).toBeCloseTo(CM * 1.3);
    const count = (stars: number) => {
      const e = quiet(MARVEL, {}, { awakening: { cmarvel: stars } });
      debugPlace(e, 0, 0, 'cmarvel', 1);
      debugSpawn(e, { hp: 1e12 });
      return ofType(step(e, 20 * 60), 'attack').length;
    };
    const ratio = count(10) / count(0);
    expect(ratio).toBeGreaterThan(1.35);
    expect(ratio).toBeLessThan(1.45);
  });
  it('talents : palier actif au niveau 5 seulement', () => {
    // Captain Marvel, palier 1 option b : +15 % de dégâts.
    expect(firstHit(MARVEL, { levels: { cmarvel: 4 }, talents: { cmarvel: ['b'] } })).toBeCloseTo(CM * 1.3);
    expect(firstHit(MARVEL, { levels: { cmarvel: 5 }, talents: { cmarvel: ['b'] } })).toBeCloseTo(CM * 1.4 * 1.15);
  });
  it('armure et bouclier', () => {
    const e = quiet();
    debugPlace(e, 0, 0, 'cmarvel', 1);
    const b = debugSpawn(e, { hp: 1e9, armor: 0.3, shieldHits: 1 });
    expect(ofType(step(e), 'hit')[0]!.damage).toBe(0);
    expect(b.shieldHits).toBe(0);
    e.state.players[0]!.grid[0]!.cooldown = 0;
    expect(ofType(step(e), 'hit')[0]!.damage).toBeCloseTo(CM * 0.7);
  });
});

describe('mana par élimination', () => {
  it('10 pour un normal, 30 pour un gros, 100 pour un boss', () => {
    for (const [kind, boss, mana] of [['normal', undefined, 10], ['gros', undefined, 30], ['normal', 'jafar', 100]] as const) {
      const e = quiet();
      debugPlace(e, 0, 0, 'cmarvel', 7);
      debugSpawn(e, { hp: 1, kind, bossId: boss });
      const p = e.state.players[0]!;
      const m = p.mana;
      const k = ofType(step(e), 'kill');
      expect(k[0]).toMatchObject({ player: 'p1', mana });
      expect(p.mana - m).toBe(mana);
    }
  });
});

describe('pause et script', () => {
  it('script.paused fige la simulation mais accepte les commandes', () => {
    const e = createEngine({ mode: 'tutoriel', seed: 1, mapId: 'x', players: [setup()], script: { paused: true } });
    expect(e.state.phase).toBe('pause');
    e.apply({ type: 'summon', player: 'p1' });
    step(e, 10);
    expect(e.state.tick).toBe(0);
    expect(e.state.players[0]!.grid.filter(Boolean)).toHaveLength(1);
    e.apply({ type: 'pause', paused: false });
    step(e, 10);
    expect(e.state.phase).toBe('vague');
    expect(e.state.tick).toBe(10);
  });

  it('enemyHpMultiplier, startMana et noLifeLoss', () => {
    const e = solo(MARVEL, { script: { enemyHpMultiplier: 0.5, startMana: 300, noLifeLoss: true } });
    expect(e.state.players[0]!.mana).toBe(300);
    step(e, 1);
    expect(e.state.enemies[0]!.maxHp).toBeCloseTo(50);
    for (const en of simState(e).enemies) en.distance = 29.99;
    const ev = step(e, 5);
    expect(ofType(ev, 'lifeLost')).toHaveLength(0);
    expect(e.state.lives).toBe(3);
  });
});

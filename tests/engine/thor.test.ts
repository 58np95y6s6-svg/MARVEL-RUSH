// Thor = Inquisiteur de Rush Royale : talents (arbre des niveaux 9/11/13/15 → nos paliers 1/2/3 et ultime).
import { describe, expect, it } from 'vitest';
import { debugNoRange, debugPlace, debugQuiet, debugSpawn } from '../../src/engine/debug';
import { createEngine } from '../../src/engine';
import type { UnitId } from '../../src/data/types';
import { UNITS } from '../../src/data/units';
import { activeTalents } from '../../src/engine/talents';
import type { Engine } from '../../src/engine/types';
import { ofType, quiet, setup, simState, step } from './helpers';

const DECK: UnitId[] = ['thor', 'cmarvel', 'falcon', 'hawkeye', 'widow'];
const BIG = 1e9;
const D = UNITS.thor.damage;

function thor(talents: ('a' | 'b')[], level = 9): Engine {
  const e = quiet(DECK, {}, { levels: { thor: level }, talents: { thor: talents } });
  debugNoRange(e);
  return e;
}
const lv = (level: number) => D + 129 * (level - 1); // fiche de l'Inquisiteur : +129 par niveau

describe('Thor (Inquisiteur) : talents', () => {
  it('Chevalier de lumière : +6,5 % de dégâts par boss éliminé, et mode actif 10 s après une fusion', () => {
    const e = thor(['a']);
    debugPlace(e, 0, 7, 'thor');
    const boss = debugSpawn(e, { hp: 1, distance: 3, bossId: 'jafar' });
    void boss;
    step(e, 2);
    expect(simState(e).players[0]!.bossKills?.thor).toBe(1);
    debugSpawn(e, { hp: BIG, distance: 12 });
    const first = ofType(step(e, 30), 'hit')[0]!.damage;
    expect(first).toBeCloseTo(lv(9) * 1.065, 3);
    // 2 + 2 Thor : nombre pair (inactif) ; fusionner deux d'entre eux active tous les Thor pendant 10 s.
    const m = thor(['a']);
    debugPlace(m, 0, 0, 'thor');
    debugPlace(m, 0, 1, 'thor');
    m.apply({ type: 'merge', player: 'p1', from: 0, to: 1 });
    step(m);
    const merged = simState(m).players[0]!.grid[1]!;
    if (merged.unit === 'thor') expect(merged.counters.activeFor).toBeGreaterThan(9.9);
    const z = thor(['a']);
    const a = debugPlace(z, 0, 3, 'thor');
    debugPlace(z, 0, 0, 'thor');
    debugPlace(z, 0, 1, 'thor');
    debugPlace(z, 0, 2, 'thor');
    z.apply({ type: 'merge', player: 'p1', from: 0, to: 1 });
    step(z);
    expect(a.counters.activeFor).toBeGreaterThan(9.9);
  });

  it('Chevalier des ténèbres : le premier Thor est toujours actif ; toutes les 25 s, chaque autre Thor perd 1 rang et le compteur monte', () => {
    const e = thor(['b']);
    const dark = debugPlace(e, 0, 0, 'thor', 2);
    const a = debugPlace(e, 0, 1, 'thor', 3);
    const b = debugPlace(e, 0, 2, 'thor', 2);
    const c = debugPlace(e, 0, 3, 'thor', 1);
    step(e, 2);
    expect(dark.counters.dark).toBe(1);
    expect(a.counters.dark).toBe(0);
    expect(step(e, 20 * 20).some((x) => x.type === 'ability')).toBe(false);
    const ev = ofType(step(e, 20 * 5), 'ability').filter((x) => x.name === 'Chevalier des ténèbres');
    expect(ev).toHaveLength(1);
    expect(ev[0]!.slot).toBe(0);
    expect([...ev[0]!.targets].sort()).toEqual([1, 2, 3]);
    expect(dark.rank).toBe(2); // son propre rang ne bouge pas
    expect([a.rank, b.rank]).toEqual([2, 1]);
    const grid = simState(e).players[0]!.grid;
    expect(grid[3]).toBeNull(); // rang 1 : absorbé en entier
    expect(dark.counters.darkStacks).toBe(3);
    // 25 s plus tard : a (2 → 1) et b (1 → absorbé), +2.
    step(e, 20 * 25);
    expect(a.rank).toBe(1);
    expect(grid[2]).toBeNull();
    expect(dark.counters.darkStacks).toBe(5);
    // Seul sur le plateau : plus rien à drainer, le compteur reste.
    step(e, 20 * 50);
    expect(grid.filter(Boolean)).toHaveLength(1);
    expect(dark.counters.darkStacks).toBe(6);
    void c;
  });

  it('Chevalier des ténèbres : +6 % de dégâts par cumul, sans plafond ; actif même en nombre pair', () => {
    const hit = (stacks: number) => {
      const e = thor(['b']);
      const u = debugPlace(e, 0, 7, 'thor');
      step(e, 1);
      if (stacks) u.counters.darkStacks = stacks;
      debugSpawn(e, { hp: BIG, distance: 12 });
      return ofType(step(e, 20 * 2), 'hit')[0]!.damage;
    };
    expect(hit(50) / hit(0)).toBeCloseTo(1 + 0.06 * 50, 5);
    // Actif malgré un nombre pair : intervalle 0,6 s.
    const e = thor(['b']);
    debugPlace(e, 0, 0, 'thor', 3);
    const other = debugPlace(e, 0, 1, 'thor', 3);
    step(e, 2);
    debugSpawn(e, { hp: BIG, distance: 12 });
    other.cooldown = 1e9;
    const n = ofType(step(e, 20 * 6), 'attack').filter((a) => a.slot === 0).length;
    expect(n).toBeGreaterThanOrEqual(Math.floor((6 * 3) / 0.6) - 1); // rang 3 : 3 fois plus vite
  });

  it('Chevalier des ténèbres : compteur perdu à la fusion du chevalier, gardé à la sauvegarde', () => {
    const e = thor(['b']);
    debugPlace(e, 0, 0, 'thor', 2);
    debugPlace(e, 0, 1, 'thor', 2);
    debugPlace(e, 0, 2, 'thor', 3);
    step(e, 20 * 25 + 2);
    const grid = simState(e).players[0]!.grid;
    expect(grid[0]!.counters.darkStacks).toBe(2);
    const r = createEngine(e.config, e.serialize());
    const rg = simState(r).players[0]!.grid;
    expect(rg[0]!.counters.darkStacks).toBe(2);
    expect(rg[0]!.counters.darkIn).toBeCloseTo(grid[0]!.counters.darkIn!, 6);
    expect(r.serialize()).toBe(e.serialize());
    // Fusion du chevalier (rang 2) avec l'autre Thor de rang 2 : le compteur disparaît.
    e.apply({ type: 'merge', player: 'p1', from: 0, to: 2 });
    step(e);
    for (const u of grid) if (u) expect(u.counters.darkStacks ?? 0).toBe(0);
  });

  it('Chevalier des ténèbres en Coop : ne draine que son propre plateau', () => {
    const tal = { levels: { thor: 9 }, talents: { thor: ['b' as const] } };
    const e = createEngine({ mode: 'coop', seed: 7, mapId: 'test', players: [setup(DECK, tal), setup(DECK, tal, 'p2')] });
    debugQuiet(e);
    const dark = debugPlace(e, 0, 0, 'thor', 2);
    const mine = debugPlace(e, 0, 1, 'thor', 3);
    const p2dark = debugPlace(e, 1, 0, 'thor', 2);
    const p2 = debugPlace(e, 1, 1, 'thor', 3);
    step(e, 20 * 25 + 2);
    expect(mine.rank).toBe(2);
    expect(dark.counters.darkStacks).toBe(1);
    expect(p2.rank).toBe(2); // drainé par SON chevalier, pas par celui de p1
    expect(p2dark.counters.darkStacks).toBe(1);
    const solo1 = createEngine({ mode: 'coop', seed: 7, mapId: 'test', players: [setup(DECK, tal), setup(DECK, {}, 'p2')] });
    debugQuiet(solo1);
    debugPlace(solo1, 0, 0, 'thor', 2);
    const q = debugPlace(solo1, 1, 1, 'thor', 3);
    step(solo1, 20 * 25 + 2);
    expect(q.rank).toBe(3);
  });

  it('Purification : en mode actif, +30 % par coup consécutif', () => {
    const e = thor(['a', 'a']);
    debugPlace(e, 0, 7, 'thor');
    debugSpawn(e, { hp: BIG, distance: 12 });
    const h = ofType(step(e, 20 * 2), 'hit').map((x) => x.damage);
    expect(h[1]! / h[0]!).toBeCloseTo(1.3);
  });

  it('Bouclier de foi : toutes les 15 s, 5 s d’immunité aux pouvoirs de boss', () => {
    const e = thor(['a', 'b']);
    const u = debugPlace(e, 0, 7, 'thor');
    step(e, 20 * 15 + 2);
    expect(u.counters.immuneFor).toBeGreaterThan(4.5);
  });

  it('Ronin : limite d’augmentation 800 % ; Unité : +15 % à partir de 4 Thor', () => {
    const r = thor(['a', 'a', 'a']);
    const t = debugPlace(r, 0, 7, 'thor');
    debugSpawn(r, { hp: BIG, distance: 12 });
    step(r, 20 * 60);
    expect(t.counters.ramp).toBeCloseTo(8);
    const u = thor(['a', 'a', 'b']);
    for (const s of [0, 1, 2, 3]) debugPlace(u, 0, s, 'thor').cooldown = s ? 1e9 : 0;
    debugSpawn(u, { hp: BIG, distance: 12 });
    const first = ofType(step(u, 1), 'hit')[0]!.damage;
    expect([lv(9) * 1.15, lv(9) * 1.15 * 2.35].some((x) => Math.abs(x - first) < 1e-6)).toBe(true);
  });

  it('Marteau de foi : talent ultime, au niveau 10 une fois les 3 paliers choisis', () => {
    expect(activeTalents('thor', 9, ['a', 'a', 'a']).map((t) => t.name)).not.toContain('Marteau de foi');
    expect(activeTalents('thor', 10, ['a', 'a']).map((t) => t.name)).not.toContain('Marteau de foi');
    expect(activeTalents('thor', 10, ['a', 'b', 'b']).map((t) => t.name)).toContain('Marteau de foi');
    const e = thor(['a', 'a', 'a'], 10);
    debugPlace(e, 0, 7, 'thor');
    debugSpawn(e, { hp: BIG, distance: 12 });
    const ev = step(e, 20 * 9);
    expect(ofType(ev, 'ability').some((a) => a.name === 'Marteau de foi')).toBe(true);
    expect(ofType(ev, 'attack').some((a) => a.fx === 'thor:marteau-foi')).toBe(true);
  });
});

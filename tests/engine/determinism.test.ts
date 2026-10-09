import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine';
import { debugPlace, debugSpawn } from '../../src/engine/debug';
import type { Engine, GameConfig } from '../../src/engine/types';
import type { UnitId } from '../../src/data/types';
import { MARVEL, setup } from './helpers';

/** Bot déterministe : invoque, fusionne, améliore. */
function bot(e: Engine): void {
  for (const p of e.state.players) {
    if (p.grid.some((g) => !g) && p.mana >= p.summonCost) { e.apply({ type: 'summon', player: p.id }); continue; }
    for (let i = 0; i < 15; i++) {
      const a = p.grid[i];
      const j = p.grid.findIndex((b, k) => k > i && b && a && b.unit === a.unit && b.rank === a.rank && a.rank < 7);
      if (j > 0) { e.apply({ type: 'merge', player: p.id, from: i, to: j }); break; }
    }
    if (p.mana > 300) e.apply({ type: 'powerup', player: p.id, unit: p.deck[(e.state.tick / 20 | 0) % 5]! });
  }
}

function run(cfg: GameConfig, ticks: number, saveAt?: number): string {
  let e = createEngine(cfg);
  for (let t = 0; t < ticks; t++) {
    if (saveAt === t) e = createEngine(cfg, e.serialize());
    bot(e);
    e.tick();
    e.drainEvents();
  }
  return e.serialize();
}

const LEGEND: UnitId[] = ['thor', 'loki', 'mulan', 'coco', 'vanralph'];
const solo: GameConfig = { mode: 'solo', seed: 1234, mapId: 'x', players: [setup(MARVEL)] };
const duo: GameConfig = {
  mode: 'coop', seed: 99, mapId: 'x',
  players: [setup(LEGEND, { levels: { thor: 6 }, talents: { thor: ['a'] }, awakening: { loki: 3 } }), setup(['nemo', 'ariel', 'maui', 'moana', 'rapunzel'], {}, 'p2')],
};

describe('déterminisme et sauvegarde', () => {
  it('même graine ⇒ même état après 3 000 ticks', () => {
    expect(run(solo, 3000)).toBe(run(solo, 3000));
    expect(run(duo, 3000)).toBe(run(duo, 3000));
    expect(run({ ...solo, seed: 1235 }, 3000)).not.toBe(run(solo, 3000));
  });

  it('serialize puis createEngine(config, sauvegarde) : même avenir', () => {
    expect(run(solo, 3000, 1500)).toBe(run(solo, 3000));
    expect(run(duo, 3000, 1234)).toBe(run(duo, 3000));
  });

  it('la sauvegarde est un aller-retour exact', () => {
    const e = createEngine(duo);
    for (let i = 0; i < 700; i++) { bot(e); e.tick(); }
    const s = e.serialize();
    expect(createEngine(duo, s).serialize()).toBe(s);
  });

  it('15 unités × 2 joueurs et 120 ennemis : bien plus rapide que le temps réel', () => {
    const e = createEngine({ ...duo, seed: 5 });
    const decks = e.state.players.map((p) => p.deck);
    for (let pi = 0; pi < 2; pi++) for (let s = 0; s < 15; s++) debugPlace(e, pi, s, decks[pi]![s % 5]!, 1 + (s % 7));
    for (let i = 0; i < 120; i++) debugSpawn(e, { lane: (['a', 'b', 'tronc'] as const)[i % 3], distance: (i % 13), hp: 1e12, speed: 0 });
    const t0 = performance.now();
    for (let t = 0; t < 20 * 60; t++) { e.tick(); e.drainEvents(); }
    const ms = performance.now() - t0;
    // Une minute de jeu en bien moins d'une minute (marge large pour les machines de CI).
    expect(ms).toBeLessThan(15000);
    console.log(`1 min de jeu (30 unités, 120 ennemis) simulée en ${ms.toFixed(0)} ms`);
  });
});

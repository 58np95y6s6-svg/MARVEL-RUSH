import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine';
import { debugNoRange, debugPlace, debugSpawn, simState } from '../../src/engine/debug';
import type { Engine, EngineEvent, GameConfig } from '../../src/engine/types';
import { MARVEL, ofType, quiet, setup, step } from './helpers';

function reachWave(e: Engine, w: number): EngineEvent[] {
  const out: EngineEvent[] = [];
  let guard = 0;
  while (e.state.wave < w && !e.state.result && guard++ < 20 * 40 * w) {
    for (const en of simState(e).enemies) en.hp = 0;
    e.tick();
    out.push(...e.drainEvents());
  }
  return out;
}
const base: GameConfig = { mode: 'solo', seed: 5, mapId: 'x', players: [setup()], bossRhythm: { small: 0, big: 1, thanos: 0 } };

describe('options de script de la campagne', () => {
  it('bossOrder impose l’ordre des gros boss, puis la rotation reprend', () => {
    const e = createEngine({ ...base, script: { bossOrder: ['galactus', 'ursula'] } });
    const ids = ofType(reachWave(e, 4), 'bossSpawn').map((b) => b.boss);
    expect(ids.slice(0, 2)).toEqual(['galactus', 'ursula']);
    expect(ids.length).toBeGreaterThanOrEqual(3);
  });

  it('excludeBosses retire des boss de la rotation (et Thanos du mode infini)', () => {
    const e = createEngine({ ...base, bossPool: 'marvel-disney', script: { excludeBosses: ['jafar', 'cruella', 'ursula', 'malefique'] } });
    const ids = ofType(reachWave(e, 7), 'bossSpawn').map((b) => b.boss);
    expect(new Set(ids)).toEqual(new Set(['galactus', 'bouffon']));
    const t = createEngine({ ...base, bossRhythm: { small: 0, big: 2, thanos: 4 }, script: { excludeBosses: ['thanos'] } });
    expect(ofType(reachWave(t, 5), 'bossSpawn').map((b) => b.boss)).not.toContain('thanos');
  });

  it('endOnBossKill : victoire dès que le boss imposé tombe, même avec des ennemis sur le chemin', () => {
    const e = createEngine({ mode: 'solo', seed: 5, mapId: 'x', players: [setup()], targetWaves: 10, script: { bossId: 'cruella', bossAtWave: 2, endOnBossKill: true } });
    reachWave(e, 2);
    const boss = simState(e).enemies.find((x) => x.bossId === 'cruella')!;
    debugSpawn(e, { hp: 1e9, distance: 3 });
    boss.hp = 0;
    const end = ofType(step(e, 2), 'gameOver')[0]!;
    expect(end).toMatchObject({ outcome: 'victoire', wave: 2 });
  });

  it('endOnBossKill avec miniBoss : victoire à la mort du sbire géant', () => {
    const e = createEngine({ mode: 'solo', seed: 5, mapId: 'x', players: [setup()], targetWaves: 9, script: { miniBoss: 'galactus', bossAtWave: 3, endOnBossKill: true } });
    reachWave(e, 3);
    const mini = simState(e).enemies.find((x) => x.giant)!;
    expect(mini.minionOf).toBe('galactus');
    mini.hp = 0;
    expect(ofType(step(e, 2), 'gameOver')[0]).toMatchObject({ outcome: 'victoire', wave: 3 });
  });

  it('passifs d’éveil : appliqués à partir de leur étoile (Thor ★10 : zone +25 points)', () => {
    const ratio = (stars: number) => {
      const e = quiet(['thor', ...MARVEL.slice(0, 4)], {}, { awakening: { thor: stars } });
      debugNoRange(e);
      debugPlace(e, 0, 0, 'thor');
      const t = debugSpawn(e, { hp: 1e9, distance: 8 });
      debugSpawn(e, { hp: 1e9, distance: 7.6 });
      const h = ofType(step(e, 1), 'hit');
      const main = h.find((x) => x.enemy === t.uid)!.damage;
      return h.find((x) => x.enemy !== t.uid)!.damage / main;
    };
    expect(ratio(9)).toBeCloseTo(1); // seul : mode actif, zone à 100 %
    expect(ratio(10)).toBeCloseTo(1.25);
  });
});

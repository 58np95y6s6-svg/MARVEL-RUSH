import { describe, expect, it } from 'vitest';
import { bossWaveKind, createEngine } from '../../src/engine';
import { debugPlace } from '../../src/engine/debug';
import { ROTATING_BOSSES } from '../../src/data/bosses';
import { earlyHpMul, waveHp } from '../../src/data/enemies';
import type { BossId } from '../../src/data/types';
import type { Engine, EngineEvent, GameConfig } from '../../src/engine/types';
import { MARVEL, ofType, setup, simState, solo, step } from './helpers';

/** Tue tout ce qui est sur le chemin à chaque tick (pour enchaîner les vagues). */
function stepKilling(e: Engine, n: number): EngineEvent[] {
  const out: EngineEvent[] = [];
  for (let i = 0; i < n; i++) {
    for (const en of simState(e).enemies) en.hp = 0;
    e.tick();
    out.push(...e.drainEvents());
  }
  return out;
}

/** Avance jusqu'au début de la vague `w` en tuant tout (boss compris). */
function reachWave(e: Engine, w: number): EngineEvent[] {
  const out: EngineEvent[] = [];
  let guard = 0;
  while (e.state.wave < w && guard++ < 20 * 40 * w) out.push(...stepKilling(e, 1));
  return out;
}

describe('vagues', () => {
  it('durent 30 s et les PV suivent 100 × 1,18^(vague-1), sans allègement en début de partie', () => {
    const e = solo();
    expect(e.state.wave).toBe(1);
    step(e, 1);
    expect(e.state.enemies[0]!.maxHp).toBeCloseTo(100 * earlyHpMul(1));
    expect(earlyHpMul(12)).toBe(1);
    expect(waveHp(20)).toBeCloseTo(100 * Math.pow(1.18, 19));
    const ev = stepKilling(e, 20 * 30);
    expect(ofType(ev, 'waveStart').map((w) => w.wave)).toEqual([2]);
    step(e, 1);
    const normal = e.state.enemies.find((x) => x.kind === 'normal');
    expect(normal!.maxHp).toBeCloseTo(118 * earlyHpMul(2));
  });

  it('les ennemis restants ne disparaissent pas à la fin de la vague', () => {
    const e = solo(MARVEL, { script: { noLifeLoss: true } });
    step(e, 20 * 29);
    for (const en of simState(e).enemies) en.speed = 0;
    const n = e.state.enemies.length;
    step(e, 30);
    expect(e.state.wave).toBe(2);
    expect(e.state.enemies.length).toBeGreaterThanOrEqual(n);
  });

  it('rythme : petit boss toutes les 5 vagues, gros toutes les 10, Thanos à la 50 en mode infini', () => {
    const inf: GameConfig = { mode: 'solo', seed: 1, mapId: 'x', players: [setup()] };
    const kinds = [5, 10, 15, 20, 7, 50].map((w) => bossWaveKind(inf, w));
    expect(kinds).toEqual(['petit', 'gros', 'petit', 'gros', null, 'gros']);
    const custom = { ...inf, bossRhythm: { small: 3, big: 6, thanos: 12 } };
    expect([3, 6, 9, 12].map((w) => bossWaveKind(custom, w))).toEqual(['petit', 'gros', 'petit', 'gros']);
  });

  it('petit boss : lieutenant géant du prochain gros boss (PV ×12), sans apparitions, vague suivante à sa mort', () => {
    const e = solo();
    const ev = reachWave(e, 5);
    const mini = ofType(ev, 'miniBossSpawn');
    expect(mini).toHaveLength(1);
    const st = simState(e);
    const boss = st.enemies.find((x) => x.uid === mini[0]!.enemy)!;
    expect(boss.giant).toBe(true);
    expect(boss.maxHp).toBeCloseTo(waveHp(5) * 12);
    expect(boss.minionOf).toBe(st.nextBigBoss);
    expect(e.state.phase).toBe('boss');
    for (const x of st.enemies) if (x !== boss) x.hp = 0;
    boss.speed = 0;
    const during = step(e, 20 * 40);
    expect(ofType(during, 'enemySpawn')).toHaveLength(0);
    expect(e.state.wave).toBe(5);
    // Pouvoir affaibli du maître toutes les 10 s.
    expect(ofType(during, 'bossPower').length).toBeGreaterThanOrEqual(3);
    boss.hp = 0;
    const after = step(e, 2);
    expect(ofType(after, 'waveStart')[0]!.wave).toBe(6);
  });

  it('gros boss à la vague 10 (PV ×25), sbires dans les 2 vagues d’avant, rotation sans répétition', () => {
    const e = solo(MARVEL, { mapId: 'x' });
    const ev = reachWave(e, 31);
    const bosses = ofType(ev, 'bossSpawn');
    expect(bosses.map((b) => ev.indexOf(b) >= 0)).toHaveLength(3);
    const ids = bosses.map((b) => b.boss);
    expect(new Set(ids).size).toBe(3);
    for (const id of ids) expect(ROTATING_BOSSES).toContain(id);
    // Les lieutenants annoncent le bon maître.
    const minis = ofType(ev, 'miniBossSpawn').map((m) => m.boss);
    expect(minis).toEqual(ids);
    // Sbires du prochain gros boss aux vagues 8 et 9 seulement (avant la vague 10).
    const spawnsByWave = new Map<number, Set<string>>();
    let wave = 1;
    const st = simState(e);
    void st;
    for (const x of ev) {
      if (x.type === 'waveStart') wave = x.wave;
      if (x.type === 'enemySpawn' && x.kind === 'sbire') spawnsByWave.set(wave, (spawnsByWave.get(wave) ?? new Set()).add('s'));
    }
    expect([...spawnsByWave.keys()].sort((a, b) => a - b)).toEqual([8, 9, 18, 19, 28, 29]);
  });

  it('les 6 gros boss passent avant toute répétition', () => {
    const e = createEngine({ mode: 'solo', seed: 3, mapId: 'x', players: [setup()], bossRhythm: { small: 0, big: 1, thanos: 0 } });
    const ev = reachWave(e, 13);
    const ids = ofType(ev, 'bossSpawn').map((b) => b.boss);
    expect(ids.length).toBeGreaterThanOrEqual(12);
    expect(new Set(ids.slice(0, 6)).size).toBe(6);
    expect(new Set(ids.slice(6, 12)).size).toBe(6);
  });

  it('Thanos à la vague 50 en mode infini (PV ×2), pas en campagne', () => {
    const e = createEngine({ mode: 'solo', seed: 3, mapId: 'x', players: [setup()], bossRhythm: { small: 0, big: 10, thanos: 20 } });
    const ev = reachWave(e, 21);
    const b = ofType(ev, 'bossSpawn');
    expect(b.map((x) => x.boss)[1]).toBe('thanos');
    const def = createEngine({ mode: 'solo', seed: 3, mapId: 'x', players: [setup()] });
    expect(bossWaveKind(def.config, 50)).toBe('gros');
    const camp = createEngine({ mode: 'solo', seed: 3, mapId: 'x', players: [setup()], targetWaves: 25, bossRhythm: { small: 0, big: 10, thanos: 20 } });
    const ev2 = reachWave(camp, 21);
    expect(ofType(ev2, 'bossSpawn').map((x) => x.boss)).not.toContain('thanos');
  });

  it('script.bossId thanos à script.bossAtWave', () => {
    const e = createEngine({ mode: 'solo', seed: 3, mapId: 'x', players: [setup()], targetWaves: 3, script: { bossId: 'thanos', bossAtWave: 3 } });
    const ev = reachWave(e, 3);
    const b = ofType(ev, 'bossSpawn')[0]!;
    expect(b.boss).toBe('thanos');
    const boss = simState(e).enemies.find((x) => x.uid === b.enemy)!;
    expect(boss.maxHp).toBeCloseTo(waveHp(3) * 25 * 2);
    // Niveau gagné quand le boss est tué.
    const end = stepKilling(e, 3);
    expect(ofType(end, 'gameOver')[0]).toMatchObject({ outcome: 'victoire', wave: 3 });
  });

  it('script.miniBoss : sbire géant (PV ×8, taille ×2) sans pouvoir à la vague imposée', () => {
    const e = createEngine({ mode: 'solo', seed: 3, mapId: 'x', players: [setup()], targetWaves: 2, script: { miniBoss: 'bouffon', bossAtWave: 2 } });
    const ev = reachWave(e, 2);
    const m = ofType(ev, 'miniBossSpawn')[0]!;
    expect(m.boss).toBe('bouffon');
    const boss = simState(e).enemies.find((x) => x.uid === m.enemy)!;
    expect(boss).toMatchObject({ giant: true, kind: 'sbire', minionOf: 'bouffon' });
    expect(boss.maxHp).toBeCloseTo(waveHp(2) * 8);
    boss.speed = 0;
    for (const x of simState(e).enemies) if (x !== boss) x.hp = 0;
    const during = step(e, 20 * 20);
    expect(ofType(during, 'bossPower')).toHaveLength(0);
    boss.hp = 0;
    expect(ofType(step(e, 3), 'gameOver')[0]!.outcome).toBe('victoire');
  });

  it('rage après 45 s : vitesse ×2', () => {
    const e = createEngine({ mode: 'solo', seed: 3, mapId: 'x', players: [setup()], script: { bossAtWave: 1, bossId: 'jafar' } });
    const boss = simState(e).enemies.find((x) => x.bossId)!;
    const v = boss.speed;
    const ev = step(e, 20 * 45 + 1);
    expect(ofType(ev, 'bossRage')).toHaveLength(1);
    expect(boss.speed).toBeCloseTo(v * 2);
  });

  it('un ennemi qui passe retire 1 vie, un boss toutes ; 0 vie = défaite', () => {
    const e = solo();
    step(e, 1);
    const st = simState(e);
    st.enemies[0]!.distance = 29.999;
    const ev = step(e, 2);
    expect(ofType(ev, 'lifeLost')[0]!.lives).toBe(2);
    const b = createEngine({ mode: 'solo', seed: 3, mapId: 'x', players: [setup()], script: { bossAtWave: 1, bossId: 'cruella' } });
    simState(b).enemies.find((x) => x.bossId)!.distance = 29.999;
    const ev2 = step(b, 2);
    expect(ofType(ev2, 'lifeLost')[0]!.lives).toBe(0);
    expect(ofType(ev2, 'gameOver')[0]).toMatchObject({ outcome: 'defaite', wave: 1 });
    expect(b.state.result?.outcome).toBe('defaite');
  });

  it('victoire après targetWaves vagues, palier « milestone » toutes les 10 vagues', () => {
    const e = createEngine({ mode: 'solo', seed: 3, mapId: 'x', players: [setup()], targetWaves: 2 });
    const ev = stepKilling(e, 20 * 62);
    expect(ofType(ev, 'gameOver')[0]).toMatchObject({ outcome: 'victoire', wave: 2 });
    const inf = solo();
    const ev2 = reachWave(inf, 21);
    expect(ofType(ev2, 'milestone').map((m) => m.wave)).toEqual([10, 20]);
  });

  it('Tiana ne donne plus de mana en début de vague (mana par élimination, voir archetypes.test.ts)', () => {
    const gain = (withTiana: boolean) => {
      const e = solo(['tiana', 'merida', 'nemo', 'pocahontas', 'foxhound']);
      if (withTiana) debugPlace(e, 0, 0, 'tiana', 3);
      const p = e.state.players[0]!;
      const before = p.mana;
      stepKilling(e, 20 * 30); // les ennemis disparaissent sans élimination créditée
      return p.mana - before;
    };
    expect(gain(true)).toBe(gain(false));
  });

  it('rotation reproductible avec la même graine', () => {
    const run = (seed: number) => {
      const e = createEngine({ mode: 'solo', seed, mapId: 'x', players: [setup()], bossRhythm: { small: 0, big: 1, thanos: 0 } });
      return ofType(reachWave(e, 6), 'bossSpawn').map((b) => b.boss as BossId);
    };
    expect(run(11)).toEqual(run(11));
  });
});

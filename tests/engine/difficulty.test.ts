import { describe, expect, it } from 'vitest';
import { createEngine, bossWaveKind } from '../../src/engine';
import { spawnInterval } from '../../src/engine/engine';
import { STARTER_DECKS, UNITS } from '../../src/data/units';
import { WAVE_RULES, waveHp } from '../../src/data/enemies';
import type { Engine, EngineEvent, GameConfig } from '../../src/engine/types';
import { ofType, setup, simState } from './helpers';

function stepKilling(e: Engine, n: number): EngineEvent[] {
  const out: EngineEvent[] = [];
  for (let i = 0; i < n; i++) {
    for (const en of simState(e).enemies) en.hp = 0;
    e.tick();
    out.push(...e.drainEvents());
  }
  return out;
}

function reachWave(e: Engine, w: number): EngineEvent[] {
  const out: EngineEvent[] = [];
  let guard = 0;
  while (e.state.wave < w && guard++ < 20 * 40 * w) out.push(...stepKilling(e, 1));
  return out;
}

/** Nombre d'apparitions pendant la vague 1 (30 s), sans rien tuer. */
function spawnsWave1(cfg: Partial<GameConfig>): number {
  const e = createEngine({ mode: 'solo', seed: 4, mapId: 'x', players: [setup()], script: { noLifeLoss: true }, ...cfg, ...(cfg.script ? { script: { noLifeLoss: true, ...cfg.script } } : {}) });
  let n = 0;
  for (let t = 0; t < 20 * 29; t++) { e.tick(); n += ofType(e.drainEvents(), 'enemySpawn').length; }
  return n;
}

describe('difficulté : PV des premières vagues', () => {
  it('un héros de départ de rang 1, niveau 1, met 3 coups ou plus pour tuer un ennemi normal de la vague 1', () => {
    const starters = [...STARTER_DECKS.marvel, ...STARTER_DECKS.disney];
    const dmg = starters.map((u) => UNITS[u].damage);
    const avg = dmg.reduce((a, b) => a + b, 0) / dmg.length;
    const hits = waveHp(1) / avg;
    expect(hits).toBeGreaterThanOrEqual(3);
    expect(hits).toBeLessThanOrEqual(5);
    // Aucun héros de départ ne tue en un coup.
    for (const d of dmg) expect(waveHp(1) / d).toBeGreaterThan(1.5);
    // Et ça monte régulièrement.
    for (let w = 2; w <= 30; w++) expect(waveHp(w)).toBeGreaterThan(waveHp(w - 1));
  });

  it('moins d’ennemis en début de partie, de plus en plus ensuite', () => {
    expect(spawnInterval(1)).toBeCloseTo(WAVE_RULES.spawnIntervalStart);
    expect(spawnInterval(10)).toBeLessThan(spawnInterval(1));
    expect(spawnInterval(40)).toBeCloseTo(WAVE_RULES.spawnIntervalMin);
  });
});

describe('difficulté de campagne : effectif et PV (script)', () => {
  it('enemyCountMultiplier : plus d’apparitions par vague, de façon déterministe', () => {
    const base = spawnsWave1({});
    const more = spawnsWave1({ script: { enemyCountMultiplier: 1.5 } });
    expect(more).toBeGreaterThan(base * 1.35);
    expect(more).toBe(spawnsWave1({ script: { enemyCountMultiplier: 1.5 } }));
    expect(spawnInterval(1, 2)).toBeCloseTo(WAVE_RULES.spawnIntervalStart / 2);
  });

  it('waveHpGrowth remplace la croissance de 1,18 par vague', () => {
    expect(waveHp(20, 1.05)).toBeCloseTo(100 * Math.pow(1.05, 19));
    const e = createEngine({ mode: 'solo', seed: 4, mapId: 'x', players: [setup()], targetWaves: 30, script: { waveHpGrowth: 1.05, enemyHpMultiplier: 2 } });
    reachWave(e, 4);
    stepKilling(e, 1);
    e.tick();
    const n = simState(e).enemies.find((x) => x.kind === 'normal');
    if (n) expect(n.maxHp).toBeCloseTo(waveHp(4, 1.05) * 2);
  });

  it('bossHpMultiplier : PV des gros boss et des lieutenants, en plus de enemyHpMultiplier', () => {
    const e = createEngine({ mode: 'solo', seed: 3, mapId: 'x', players: [setup()], targetWaves: 12, script: { enemyHpMultiplier: 0.5, bossHpMultiplier: 3 } });
    const ev = reachWave(e, 5);
    const mini = ofType(ev, 'miniBossSpawn')[0]!;
    const lieut = simState(e).enemies.find((x) => x.uid === mini.enemy)!;
    expect(lieut.maxHp).toBeCloseTo(waveHp(5) * 0.5 * 3 * 12);
    const ev2 = reachWave(e, 10);
    const big = ofType(ev2, 'bossSpawn')[0]!;
    const boss = simState(e).enemies.find((x) => x.uid === big.enemy)!;
    expect(boss.maxHp / (waveHp(10) * 0.5 * 25)).toBeGreaterThanOrEqual(3 - 1e-9);
  });

  it('script.miniBoss ne remplace que la vague désignée (bossAtWave), pas toutes les vagues de petit boss', () => {
    const cfg: GameConfig = {
      mode: 'solo', seed: 11, mapId: 'x', players: [setup()], targetWaves: 15,
      script: { miniBoss: 'ursula', bossAtWave: 15, endOnBossKill: true, excludeBosses: ['ursula'] },
    };
    const e = createEngine(cfg);
    expect(bossWaveKind(cfg, 5)).toBe('petit');
    expect(bossWaveKind(cfg, 10)).toBe('gros');
    expect(bossWaveKind(cfg, 15)).toBe('petit');
    const ev = reachWave(e, 15);
    const minis = ofType(ev, 'miniBossSpawn');
    // Vague 5 : lieutenant du gros boss de la vague 10 (rotation sans Ursula) ; vague 15 : sbire géant d'Ursula.
    expect(minis).toHaveLength(2);
    expect(minis[0]!.boss).not.toBe('ursula');
    expect(minis[0]!.boss).toBe(ofType(ev, 'bossSpawn')[0]!.boss);
    expect(minis[1]!.boss).toBe('ursula');
    // La mort du lieutenant de la vague 5 n'a pas terminé la partie ; celle de la vague 15 la gagne.
    expect(ofType(ev, 'gameOver')).toHaveLength(0);
    const end = stepKilling(e, 3);
    expect(ofType(end, 'gameOver')[0]).toMatchObject({ outcome: 'victoire', wave: 15 });
  });

  it('miniBoss sans bossAtWave : la dernière vague du niveau', () => {
    const cfg: GameConfig = { mode: 'solo', seed: 2, mapId: 'x', players: [setup()], targetWaves: 20, script: { miniBoss: 'jafar' } };
    expect(bossWaveKind(cfg, 20)).toBe('petit');
    expect(bossWaveKind(cfg, 10)).toBe('gros');
  });
});

describe('sauvegarde de partie (reprise)', () => {
  it('serialize → createEngine(config, sauvegarde) : état identique, et la partie continue pareil', () => {
    const cfg: GameConfig = {
      mode: 'solo', seed: 77, mapId: 'x', players: [setup()], targetWaves: 20,
      script: { enemyHpMultiplier: 1.2, enemyCountMultiplier: 1.3, bossHpMultiplier: 1.5, waveHpGrowth: 1.07, excludeBosses: ['bouffon'] },
    };
    const a = createEngine(cfg);
    reachWave(a, 6);
    const saved = a.serialize();
    const b = createEngine(JSON.parse(JSON.stringify(cfg)) as GameConfig, saved);
    expect(b.serialize()).toBe(saved);
    expect(b.state.wave).toBe(6);
    for (let t = 0; t < 20 * 40; t++) { a.tick(); b.tick(); a.drainEvents(); b.drainEvents(); }
    expect(b.serialize()).toBe(a.serialize());
  });
});

import { describe, expect, it } from 'vitest';
import { bossWaveKind, createEngine } from '../../src/engine';
import { debugPlace, debugSpawn } from '../../src/engine/debug';
import { ROTATING_BOSSES } from '../../src/data/bosses';
import { ENEMIES, WAVE_RULES, killMana, monsterHp, spawnWeights, waveGrowth, waveHp } from '../../src/data/enemies';
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
  it('Coop de Rush Royale : 10 monstres par vague, PV qui montent à chaque monstre, vague suivante quand le terrain est nettoyé', () => {
    expect(WAVE_RULES.monstersPerWave).toBe(10);
    const e = solo(MARVEL, { script: { noLifeLoss: true } });
    expect(e.state.wave).toBe(1);
    const ev = step(e, 1);
    expect(e.state.enemies[0]!.maxHp).toBeCloseTo(waveHp(1));
    for (let i = 0; i < 20 * 40; i++) {
      for (const x of simState(e).enemies) x.speed = 0; // personne n'atteint la porte
      ev.push(...step(e, 1));
    }
    expect(ofType(ev, 'enemySpawn')).toHaveLength(10);
    // Chaque nouveau monstre est un peu plus solide (croissance de la vague répartie sur ses 10 monstres).
    expect(monsterHp(1, 9, 10)).toBeCloseTo(waveHp(1) * Math.pow(WAVE_RULES.hpGrowth, 0.9));
    expect(e.state.wave).toBe(1); // les monstres sont encore là
    const next = stepKilling(e, 2);
    expect(ofType(next, 'waveStart').map((w) => w.wave)).toEqual([2]);
    expect(waveHp(2)).toBeCloseTo(waveHp(1) * WAVE_RULES.hpGrowth);
  });

  it('croissance des PV : blocs de 10 vagues, puis frein des modes infinis après la vague 20 ; mana d’élimination +10 toutes les 10 vagues (50 au plus)', () => {
    const g = WAVE_RULES.hpGrowth - 1;
    expect(waveGrowth(1)).toBeCloseTo(1 + g);
    expect(waveGrowth(10)).toBeCloseTo(1 + g);
    expect(waveGrowth(11)).toBeCloseTo(1 + g * (1 + WAVE_RULES.hpGrowthStep));
    expect(waveGrowth(20)).toBeCloseTo(1 + g * (1 + WAVE_RULES.hpGrowthStep));
    // Campagne (croissance fournie) : la règle des blocs continue.
    expect(waveGrowth(31, WAVE_RULES.hpGrowth)).toBeCloseTo(1 + g * (1 + 3 * WAVE_RULES.hpGrowthStep));
    // Modes infinis : après la vague 20, le taux redescend régulièrement vers le plancher, sans mur.
    for (let w = 21; w <= 150; w++) {
      expect(waveGrowth(w)).toBeLessThan(waveGrowth(w - 1));
      expect(waveGrowth(w)).toBeGreaterThan(1 + WAVE_RULES.lateFloor);
    }
    expect(waveGrowth(30)).toBeLessThan(1.15);
    expect(waveGrowth(60)).toBeLessThan(1.08);
    for (let w = 2; w <= 150; w++) expect(waveHp(w)).toBeGreaterThan(waveHp(w - 1));
    // Le début de partie ne change pas ; la vague 40 est 8 fois moins solide qu'avec la règle des blocs.
    expect(waveHp(20)).toBeCloseTo(waveHp(20, WAVE_RULES.hpGrowth));
    expect(waveHp(40, WAVE_RULES.hpGrowth) / waveHp(40)).toBeGreaterThan(6);
    expect([1, 10, 11, 21, 41, 51, 90].map(killMana)).toEqual([10, 10, 20, 30, 50, 50, 50]);
    // Types de monstres de Rush Royale : rapide PV ×0,5 et vitesse ×2 ; gros PV ×5, mana ×5, 2 vies.
    expect(ENEMIES.rapide).toMatchObject({ hpMul: 0.5, speedMul: 2 });
    expect(ENEMIES.gros).toMatchObject({ hpMul: 5, mana: 5, lives: 2 });
  });

  it('la vague ne se termine pas tant qu’un monstre est en vie', () => {
    const e = solo(MARVEL, { script: { noLifeLoss: true } });
    step(e, 20 * 29);
    for (const en of simState(e).enemies) en.speed = 0;
    step(e, 20 * 30);
    expect(e.state.wave).toBe(1);
    expect(e.state.enemies.length).toBeGreaterThan(0);
  });

  it('rythme : petit boss toutes les 5 vagues, gros toutes les 10, Thanos à la 50 en mode infini', () => {
    const inf: GameConfig = { mode: 'solo', seed: 1, mapId: 'x', players: [setup()] };
    const kinds = [5, 10, 15, 20, 7, 50].map((w) => bossWaveKind(inf, w));
    expect(kinds).toEqual(['petit', 'gros', 'petit', 'gros', null, 'gros']);
    // Rush Royale (Coop) : après la vague 60, boss aux vagues paires, mini-boss aux impaires.
    expect([61, 62, 63, 64].map((w) => bossWaveKind(inf, w))).toEqual(['petit', 'gros', 'petit', 'gros']);
    const custom = { ...inf, bossRhythm: { small: 3, big: 6, thanos: 12 } };
    expect([3, 6, 9, 12].map((w) => bossWaveKind(custom, w))).toEqual(['petit', 'gros', 'petit', 'gros']);
  });

  it('petit boss : lieutenant géant du prochain gros boss (Rush Royale : PV ×5, vitesse ×0,8) avec 9 rapides, vague suivante au nettoyage', () => {
    const e = solo();
    const ev = reachWave(e, 5);
    const mini = ofType(ev, 'miniBossSpawn');
    expect(mini).toHaveLength(1);
    const st = simState(e);
    const boss = st.enemies.find((x) => x.uid === mini[0]!.enemy)!;
    expect(boss.giant).toBe(true);
    expect(boss.maxHp).toBeCloseTo(waveHp(5) * 5);
    expect(boss.speed).toBeCloseTo(WAVE_RULES.baseSpeed * 0.8);
    expect(boss.minionOf).toBe(st.nextBigBoss);
    expect(e.state.phase).toBe('boss');
    boss.speed = 0;
    const during: EngineEvent[] = [];
    for (let i = 0; i < 20 * 40; i++) {
      for (const x of st.enemies) if (x !== boss) x.hp = 0;
      e.tick();
      during.push(...e.drainEvents());
    }
    // Rush Royale : la vague du mini-boss compte 10 monstres, le mini-boss et 9 rapides (sans compter les
    // sbires qu'appelle le pouvoir affaibli de certains lieutenants : Sauterelle géante, Alpha, Robot de Zurg…).
    const spawns = ofType(during, 'enemySpawn').filter((x) => x.kind !== 'sbire');
    expect(spawns).toHaveLength(9);
    expect(spawns.every((x) => x.kind === 'rapide')).toBe(true);
    expect(e.state.wave).toBe(5);
    // Pouvoir affaibli du maître toutes les 10 s.
    expect(ofType(during, 'bossPower').length).toBeGreaterThanOrEqual(3);
    boss.hp = 0;
    const after = stepKilling(e, 2);
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

  it('les 6 gros boss passent avant toute répétition (rotation « Marvel et Disney »)', () => {
    const e = createEngine({ mode: 'solo', seed: 3, mapId: 'x', players: [setup()], bossRhythm: { small: 0, big: 1, thanos: 0 }, bossPool: 'marvel-disney' });
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
    const during: EngineEvent[] = [];
    for (let i = 0; i < 20 * 20; i++) {
      for (const x of simState(e).enemies) if (x !== boss) x.hp = 0;
      e.tick();
      during.push(...e.drainEvents());
    }
    expect(ofType(during, 'bossPower')).toHaveLength(0);
    boss.hp = 0;
    expect(ofType(stepKilling(e, 20 * 30), 'gameOver')[0]!.outcome).toBe('victoire');
  });

  it('rage après 45 s : vitesse ×2', () => {
    const e = createEngine({ mode: 'solo', seed: 3, mapId: 'x', players: [setup()], script: { bossAtWave: 1, bossId: 'jafar' } });
    const boss = simState(e).enemies.find((x) => x.bossId)!;
    const v = boss.speed;
    const ev = step(e, 20 * 45 + 1);
    expect(ofType(ev, 'bossRage')).toHaveLength(1);
    expect(boss.speed).toBeCloseTo(v * 2);
  });

  it('un ennemi qui passe retire 1 vie, un gros, un mini-boss ou un boss 2 (Rush Royale) ; 0 vie = défaite', () => {
    const e = solo();
    step(e, 1);
    const st = simState(e);
    st.enemies[0]!.distance = 29.999;
    const ev = step(e, 2);
    expect(ofType(ev, 'lifeLost')[0]!.lives).toBe(2);
    // Rush Royale : un gros monstre retire 2 vies.
    debugSpawn(e, { kind: 'gros', hp: 1e9, distance: 29.999, speed: 2 });
    expect(ofType(step(e, 2), 'lifeLost')[0]!.lives).toBe(0);
    // Un boss retire 2 vies : la partie continue s'il en reste.
    const b = createEngine({ mode: 'solo', seed: 3, mapId: 'x', players: [setup()], script: { bossAtWave: 1, bossId: 'cruella' } });
    simState(b).enemies.find((x) => x.bossId)!.distance = 29.999;
    const ev2 = step(b, 2);
    expect(ofType(ev2, 'lifeLost')[0]!.lives).toBe(1);
    expect(b.state.result).toBeUndefined();
    // Niveau de boss (endOnBossKill) : laisser passer le boss imposé, c'est perdre.
    const c = createEngine({ mode: 'solo', seed: 3, mapId: 'x', players: [setup()], targetWaves: 1, script: { bossAtWave: 1, bossId: 'cruella', endOnBossKill: true } });
    simState(c).enemies.find((x) => x.bossId)!.distance = 29.999;
    const ev3 = step(c, 2);
    expect(ofType(ev3, 'lifeLost')[0]!.lives).toBe(0);
    expect(ofType(ev3, 'gameOver')[0]).toMatchObject({ outcome: 'defaite', wave: 1 });
    expect(c.state.result?.outcome).toBe('defaite');
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
  it('composition Rush Royale : vagues normales de monstres communs en mode infini ; la campagne y ajoute gros, blindés et boucliers', () => {
    expect(spawnWeights(12)).toEqual([['normal', 10]]);
    expect(spawnWeights(5, { miniWave: true })).toEqual([['rapide', 1]]);
    expect(spawnWeights(12, { campaign: true }).map(([k]) => k)).toEqual(['normal', 'gros', 'blinde', 'bouclier']);
    expect(spawnWeights(3, { campaign: true }).map(([k]) => k)).toEqual(['normal']);
    const e = solo();
    const ev = reachWave(e, 15);
    const kinds = new Set(ofType(ev, 'enemySpawn').filter((x) => x.kind !== 'sbire').map((x) => x.kind));
    expect([...kinds].sort()).toEqual(['normal', 'rapide']);
  });

  it('mini-boss : mana ×5 d’un monstre commun (Rush Royale)', () => {
    const e = solo();
    reachWave(e, 5);
    const st = simState(e);
    const mini = st.enemies.find((x) => x.x.mini)!;
    for (const x of st.enemies) if (x !== mini) x.x.gone = 1;
    debugPlace(e, 0, 0, 'cmarvel', 7);
    mini.hp = 1;
    let kill: { mana: number } | undefined;
    for (let i = 0; i < 40 && !kill; i++) kill = ofType(step(e, 1), 'kill').find((k) => k.enemy === mini.uid);
    expect(kill?.mana).toBe(5 * killMana(5));
  });
});

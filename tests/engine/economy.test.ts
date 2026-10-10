// Économie de partie : rendement du mana (« Mana + »), récompense de boss, amélioration des héros.
import { describe, expect, it } from 'vitest';
import {
  BOSS_KILL_REWARD, createEngine, MANA_UPGRADE_COSTS, POWERUP_ATTACK_SPEED,
} from '../../src/engine';
import { debugNoRange, debugPlace, debugSpawn } from '../../src/engine/debug';
import { ofType, quiet, setup, step } from './helpers';

describe('rendement du mana (« Mana + »)', () => {
  it('5 niveaux à 50/100/200/400/800, puis refus', () => {
    const e = quiet(undefined, { script: { startMana: 5000 } });
    const p = e.state.players[0]!;
    for (let i = 0; i < 6; i++) e.apply({ type: 'manaUpgrade', player: 'p1' });
    const ev = step(e);
    expect(ofType(ev, 'manaUpgrade').map((x) => x.level)).toEqual([1, 2, 3, 4, 5]);
    expect(ofType(ev, 'rejected')[0]!.reason).toMatch(/maximum/);
    expect(p.manaLevel).toBe(5);
    expect(p.mana).toBe(5000 - MANA_UPGRADE_COSTS.reduce((a, b) => a + b, 0));
    expect(MANA_UPGRADE_COSTS).toEqual([50, 100, 200, 400, 800]);
  });

  it('refuse sans mana ; +20 % de mana par élimination et par niveau', () => {
    const e = quiet(undefined, { script: { startMana: 49 } });
    e.apply({ type: 'manaUpgrade', player: 'p1' });
    expect(ofType(step(e), 'rejected')[0]!.reason).toMatch(/Pas assez/);
    const x = quiet(undefined, { script: { startMana: 150 } });
    x.apply({ type: 'manaUpgrade', player: 'p1' });
    x.apply({ type: 'manaUpgrade', player: 'p1' });
    step(x);
    debugNoRange(x);
    debugPlace(x, 0, 0, 'cmarvel', 7);
    debugSpawn(x, { hp: 1, kind: 'gros' });
    expect(ofType(step(x), 'kill')[0]!.mana).toBe(Math.round(50 * 1.4)); // gros : 5 × 10 (Rush Royale)
  });

  it('Coop : chaque joueur a son propre niveau ; sauvegardé', () => {
    const cfg = { mode: 'coop' as const, seed: 3, mapId: 'test', players: [setup(), setup(undefined, {}, 'p2')], script: { startMana: 500 } };
    const e = createEngine(cfg);
    e.apply({ type: 'manaUpgrade', player: 'p2' });
    step(e);
    expect(e.state.players[0]!.manaLevel ?? 0).toBe(0);
    expect(e.state.players[1]!.manaLevel).toBe(1);
    const r = createEngine(cfg, e.serialize());
    expect(r.state.players[1]!.manaLevel).toBe(1);
  });
});

describe('récompense de boss', () => {
  const kill = (d: Parameters<typeof debugSpawn>[1], coop = false, manaLevel = 0) => {
    const e = quiet(undefined, coop ? { mode: 'coop' } : {});
    debugNoRange(e);
    for (const p of e.state.players) p.manaLevel = manaLevel;
    debugPlace(e, 0, 0, 'cmarvel', 7);
    const b = debugSpawn(e, { hp: 1, distance: 3, ...d });
    b.x.powerIn = 1e9;
    return { e, ev: step(e), b };
  };
  it('lieutenant ×2,5, gros boss ×5,5, Thanos ×8 le coût d’invocation, avec un événement « mana »', () => {
    for (const [d, f] of [[{ lieutenantOf: 'jafar' }, BOSS_KILL_REWARD.lieutenant], [{ bossId: 'ursula' }, BOSS_KILL_REWARD.boss], [{ bossId: 'thanos' }, BOSS_KILL_REWARD.thanos]] as const) {
      const { e, ev, b } = kill(d);
      const m = ofType(ev, 'mana');
      expect(m).toHaveLength(1);
      expect(m[0]).toMatchObject({ reason: 'boss', enemy: b.uid, slot: -1, amount: Math.round(f * e.state.players[0]!.summonCost) });
    }
    expect(ofType(kill({}).ev, 'mana')).toHaveLength(0); // ennemi ordinaire
  });
  it('× rendement du mana, et en Coop chaque joueur reçoit la récompense entière', () => {
    const { e, ev } = kill({ bossId: 'galactus', lane: 'tronc' }, true, 2);
    const m = ofType(ev, 'mana');
    expect(m.map((x) => x.player).sort()).toEqual(['p1', 'p2']);
    for (const x of m) expect(x.amount).toBe(Math.round(5.5 * 10 * 1.4));
    expect(e.state.players[1]!.summonCost).toBe(10);
  });
});

describe('amélioration des héros en partie', () => {
  it('chaque niveau : +15 % de dégâts et +6 % de vitesse d’attaque', () => {
    const count = (lv: number) => {
      const e = quiet(undefined, { script: { startMana: 5000 } });
      debugNoRange(e);
      for (let i = 1; i < lv; i++) e.apply({ type: 'powerup', player: 'p1', unit: 'cmarvel' });
      step(e);
      debugPlace(e, 0, 0, 'cmarvel', 1);
      debugSpawn(e, { hp: 1e12 });
      const ev = step(e, 20 * 60);
      return { attacks: ofType(ev, 'attack').length, dmg: ofType(ev, 'hit')[0]!.damage };
    };
    const a = count(1), b = count(5);
    expect(b.dmg / a.dmg).toBeCloseTo(1 + 0.15 * 4);
    expect(b.attacks / a.attacks).toBeCloseTo(1 + POWERUP_ATTACK_SPEED * 4, 1);
  });
});

// Extension Pixar : pack, coup de duo, profils Rush Royale des 15 héros, archétypes de stratégie, méchants
// (pouvoirs, Muntz et Zurg qui alternent, « Je suis ton père » de Zurg à 30 %).
import { describe, expect, it } from 'vitest';
import { debugNoRange, debugPlace, debugSpawn, simState } from '../../src/engine/debug';
import { BOSSES, BOSS_POOLS, DOGS_NAME, FATHER_NAME, LIEUTENANTS, ZURG_ROBOTS_NAME } from '../../src/data/bosses';
import { PACKS } from '../../src/data/packs';
import { activeTeams } from '../../src/data/teams';
import { TALENTS } from '../../src/data/talents';
import { AWAKENINGS } from '../../src/data/awakenings';
import { UNIT_LIST } from '../../src/data/units';
import type { BossId, UnitId } from '../../src/data/types';
import { createEngine, finalBossAt } from '../../src/engine';
import type { Engine } from '../../src/engine/types';
import { ofType, quiet, setup, step } from './helpers';

const PX = UNIT_LIST.filter((u) => u.pack === 'pixar');
const FILL: UnitId[] = ['cmarvel', 'falcon', 'hawkeye', 'widow', 'merida'];
const deckWith = (...u: UnitId[]): UnitId[] => [...u, ...FILL.filter((f) => !u.includes(f))].slice(0, 5);
function arena(u: UnitId, rank = 1, deck = deckWith(u)): Engine {
  const e = quiet(deck);
  debugNoRange(e);
  debugPlace(e, 0, 7, u, rank);
  return e;
}
const grid = (e: Engine) => e.state.players[0]!.grid;
function withBoss(boss: BossId, units: [number, UnitId, number][]): { e: Engine; ev: ReturnType<typeof step> } {
  const e = quiet(deckWith('cmarvel'));
  for (const [slot, u, r] of units) debugPlace(e, 0, slot, u, r);
  debugSpawn(e, { hp: 1e12, bossId: boss, distance: 1 });
  return { e, ev: step(e, 1) };
}

describe('extension Pixar : contenu', () => {
  it('15 héros du pack Pixar (3 Légendaires, 6 Épiques, 6 Rares), même pack que les autres', () => {
    expect(PX.map((u) => u.id)).toEqual(['mrincredible', 'elastigirl', 'frozone', 'violetflash', 'sullimike', 'mcqueen', 'carlrussell', 'joysadness', 'remy', 'walleeve', 'lucaalberto', 'mei', 'jessie', 'ianbarley', 'joe']);
    const by = (r: string) => PX.filter((u) => u.rarity === r).length;
    expect(by('legendaire')).toBe(3);
    expect(by('epique') + by('rare')).toBe(12);
    expect(PACKS.pixar).toMatchObject({ price1: 100, price10: 900, pityLegendary: 30, rates: PACKS.marvel.rates });
  });

  it('chaque héros a 6 talents et 5 éveils ; 8 duos ont un coup de duo', () => {
    for (const u of PX) {
      expect(TALENTS.filter((t) => t.unit === u.id), u.id).toHaveLength(6);
      expect(AWAKENINGS.filter((a) => a.unit === u.id), u.id).toHaveLength(5);
    }
    expect(PX.filter((u) => (u.ability.params.duoEvery ?? 0) > 0)).toHaveLength(8);
  });

  it('les 8 archétypes de stratégie sont couverts', () => {
    const has = (k: string) => PX.filter((u) => k in u.ability.params).map((u) => u.id);
    expect(has('sacrificeMana')).toEqual(['remy']);
    expect(has('copyDamageMul')).toEqual(['joysadness']);
    expect(has('promoteAlly')).toEqual(['carlrussell']);
    expect(has('growthPerKill')).toEqual(['mei']);
    expect(has('manaPerKill')).toEqual(['sullimike']);
    expect(has('auraAttackSpeed')).toEqual(['mcqueen']);
    expect(has('swapAlly')).toEqual(['violetflash']);
    expect(has('formationDamagePerAlly')).toEqual(['lucaalberto']);
  });

  it('équipes Les Indestructibles, Monstres & Cie, Émotions et Toy Story (inter-univers)', () => {
    expect(activeTeams(['mrincredible', 'elastigirl', 'frozone', 'thor', 'hulk']).map((t) => t.id)).toContain('indestructibles');
    expect(activeTeams(['sullimike', 'mei', 'thor', 'hulk', 'cap']).map((t) => t.id)).toContain('monstres');
    expect(activeTeams(['joe', 'ianbarley', 'thor', 'hulk', 'cap']).map((t) => t.id)).toContain('emotions');
    expect(activeTeams(['buzzwoody', 'jessie', 'thor', 'hulk', 'cap']).map((t) => t.id)).toContain('toystory');
  });

  it('6 méchants avec arène, lieutenant et sbires ; Zurg dans la rotation « tous », pas dans « Marvel et Disney »', () => {
    const ids: BossId[] = ['syndrome', 'randall', 'lotso', 'hopper', 'muntz', 'zurg'];
    for (const id of ids) {
      expect(BOSSES[id].arenaMapId).toBe(`arene-${id}`);
      expect(LIEUTENANTS[id].power.interval).toBe(10);
      expect(BOSS_POOLS.tous).toContain(id);
      expect(BOSS_POOLS['marvel-disney']).not.toContain(id);
    }
    expect(BOSS_POOLS.pixar).toEqual(ids);
  });

  it('Thanos garde la vague 50 du mode infini, sauf dans la rotation Pixar', () => {
    const cfg = { mode: 'solo' as const, seed: 1, mapId: 'x', players: [setup()] };
    expect(finalBossAt(cfg, 50)).toBe('thanos');
    expect(finalBossAt({ ...cfg, bossPool: 'pixar' }, 50)).toBeNull();
  });
});

describe('coup de duo', () => {
  it('Violette & Flèche : 1 attaque sur 3 est un coup de duo (Flèche frappe deux fois de plus)', () => {
    const e = arena('violetflash');
    debugSpawn(e, { hp: 1e12, distance: 5 });
    const fx = ofType(step(e, 20 * 20), 'attack').filter((a) => a.unit === 'violetflash').map((a) => a.fx);
    expect(fx.length).toBeGreaterThanOrEqual(9);
    const duo = fx.filter((f) => f === 'violetflash:duo').length;
    expect(Math.abs(duo - fx.length / 3)).toBeLessThanOrEqual(1);
    expect(fx.filter((f) => f === 'violetflash:coup').length).toBe(fx.length - duo);
  });

  it('Joe & 22 : le coup de duo double les dégâts (étincelle)', () => {
    const e = arena('joe');
    const b = debugSpawn(e, { hp: 1e12, distance: 5 });
    const ev = step(e, 20 * 30);
    const atk = ofType(ev, 'attack').filter((a) => a.unit === 'joe');
    expect(atk.some((a) => a.fx === 'joe:duo')).toBe(true);
    expect(atk.some((a) => a.fx === 'joe:notes')).toBe(true);
    expect(b.hp).toBeLessThan(1e12);
  });

  it('WALL-E & EVE : le rayon d’EVE touche aussi les ennemis autour', () => {
    const e = arena('walleeve');
    debugSpawn(e, { hp: 1e12, distance: 5 });
    debugSpawn(e, { hp: 1e12, distance: 5.5 });
    const duo = ofType(step(e, 20 * 15), 'attack').filter((a) => a.fx === 'walleeve:duo');
    expect(duo.length).toBeGreaterThan(0);
    expect(duo[0]!.targets.length).toBe(2);
  });
});

describe('compétences des héros Pixar', () => {
  it('M. Indestructible : coup de poing sismique, toute la ligne étourdie', () => {
    const e = arena('mrincredible');
    const a = debugSpawn(e, { hp: 1e12, distance: 2 });
    const b = debugSpawn(e, { hp: 1e12, distance: 2.4 });
    const ev = step(e, 20 * 8);
    const ab = ofType(ev, 'ability').find((x) => x.name === 'Coup de poing sismique');
    expect(ab).toBeDefined();
    expect(ab!.targets).toEqual(expect.arrayContaining([a.uid, b.uid]));
  });

  it('Rémy & Linguini : +4 de mana par rang au début de chaque vague', () => {
    const run = (withRemy: boolean) => {
      const e = createEngine({ mode: 'solo', seed: 5, mapId: 'x', players: [setup(deckWith('remy'))] });
      if (withRemy) debugPlace(e, 0, 0, 'remy', 3);
      const ev = step(e, 20 * 40);
      return ofType(ev, 'waveStart').length > 1 ? e.state.players[0]!.mana : -1;
    };
    expect(run(true) - run(false)).toBeGreaterThanOrEqual(12);
  });

  it('Violette : après un échange, l’alliée est protégée des pouvoirs de boss', () => {
    const e = quiet(deckWith('violetflash', 'cmarvel'));
    debugPlace(e, 0, 0, 'violetflash', 2);
    debugPlace(e, 0, 1, 'cmarvel', 2);
    e.apply({ type: 'swap', player: 'p1', from: 0, to: 1 });
    step(e, 1);
    const g = simState(e).players[0]!.grid;
    const ally = g.find((u) => u?.unit === 'cmarvel')!;
    expect(ally.counters.immuneFor ?? 0).toBeGreaterThan(2);
  });
});

describe('méchants Pixar', () => {
  it('Syndrome : rayon à point zéro, 2 unités figées 3 s', () => {
    const { e, ev } = withBoss('syndrome', [[0, 'cmarvel', 1], [1, 'falcon', 1], [2, 'widow', 1]]);
    const p = ofType(ev, 'bossPower')[0]!;
    expect(p.slots).toHaveLength(2);
    for (const s of p.slots) expect(grid(e)[s]!.status.stunnedFor).toBeCloseTo(3);
  });

  it('Randall : camouflage, 2 unités hypnotisées et il se soigne', () => {
    const e = quiet(deckWith('cmarvel'));
    debugPlace(e, 0, 0, 'cmarvel', 1);
    debugPlace(e, 0, 1, 'falcon', 1);
    const b = debugSpawn(e, { hp: 1e9, bossId: 'randall', distance: 1 });
    b.hp = 5e8;
    const p = ofType(step(e, 1), 'bossPower')[0]!;
    expect(p.slots).toHaveLength(2);
    for (const s of p.slots) expect(grid(e)[s]!.status.hypnotizedFor).toBeCloseTo(3);
    expect(b.hp).toBeGreaterThan(5e8 + 0.03e9 - 1e5); // + 3 % des PV max (moins les coups reçus)
  });

  it('Lotso : tri des jouets, la plus petite unité part à la benne et une autre perd 1 rang', () => {
    const { e, ev } = withBoss('lotso', [[0, 'cmarvel', 1], [3, 'falcon', 4]]);
    const p = ofType(ev, 'bossPower')[0]!;
    expect(p.slots.sort((a, b) => a - b)).toEqual([0, 3]);
    expect(grid(e)[0]).toBeNull();
    expect(grid(e)[3]!.rank).toBe(3);
  });

  it('Le Borgne : 4 sauterelles en renfort et 1 unité étourdie', () => {
    const { ev } = withBoss('hopper', [[0, 'cmarvel', 1], [1, 'falcon', 1]]);
    expect(ofType(ev, 'bossPower')[0]!.slots).toHaveLength(1);
    expect(ofType(ev, 'enemySpawn').filter((s) => s.kind === 'sbire')).toHaveLength(4);
  });

  it('Muntz : la meute puis le dirigeable, en alternance', () => {
    const { e, ev } = withBoss('muntz', [[0, 'cmarvel', 1], [5, 'falcon', 1], [1, 'widow', 1]]);
    expect(ofType(ev, 'bossPower')[0]!.name).toBe(DOGS_NAME);
    expect(ofType(ev, 'enemySpawn').filter((s) => s.kind === 'sbire')).toHaveLength(3);
    const ev2 = step(e, 20 * 7);
    const p2 = ofType(ev2, 'bossPower')[0]!;
    expect(p2.name).not.toBe(DOGS_NAME);
    expect(p2.slots.length).toBeGreaterThan(0);
  });

  it('Zurg : pistolet à ions puis robots ; à 30 % de PV, « Je suis ton père » (une seule fois)', () => {
    const e = quiet(deckWith('cmarvel'));
    for (const s of [0, 1, 2, 3, 4]) debugPlace(e, 0, s, 'cmarvel', 3);
    const z = debugSpawn(e, { hp: 1e6, bossId: 'zurg', distance: 1 });
    const ev = step(e, 1);
    expect(ofType(ev, 'bossPower')[0]!.name).toBe(BOSSES.zurg.power.name);
    const ev2 = step(e, 20 * 9);
    expect(ofType(ev2, 'bossPower').map((p) => p.name)).toContain(ZURG_ROBOTS_NAME);
    z.hp = z.maxHp * 0.25;
    const ev3 = step(e, 2);
    const father = ofType(ev3, 'bossPower').filter((p) => p.name === FATHER_NAME);
    expect(father).toHaveLength(1);
    expect(father[0]!.slots.length).toBe(5);
    expect(ofType(step(e, 20 * 3), 'bossPower').filter((p) => p.name === FATHER_NAME)).toHaveLength(0);
  });
});

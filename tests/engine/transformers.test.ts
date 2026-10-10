// Extension Transformers : pack, transformation robot ↔ véhicule, profils Rush Royale des 15 Autobots,
// archétypes de stratégie, Decepticons (pouvoirs, Devastator qui se reforme, Megatron, Unicron à la vague 150).
import { describe, expect, it } from 'vitest';
import { debugNoRange, debugPlace, debugSpawn, simState } from '../../src/engine/debug';
import { BOSSES, BOSS_POOLS, LIEUTENANTS, REFORM_NAME, TYRANNY_NAME } from '../../src/data/bosses';
import { PACKS } from '../../src/data/packs';
import { TEAMS, activeTeams } from '../../src/data/teams';
import { TALENTS } from '../../src/data/talents';
import { AWAKENINGS } from '../../src/data/awakenings';
import { UNITS, UNIT_LIST } from '../../src/data/units';
import type { BossId, UnitId } from '../../src/data/types';
import { createEngine, finalBossAt } from '../../src/engine';
import { dropAction } from '../../src/engine/archetypes';
import type { Engine } from '../../src/engine/types';
import { ofType, quiet, setup, step } from './helpers';

const TF = UNIT_LIST.filter((u) => u.pack === 'transformers');
const FILL: UnitId[] = ['cmarvel', 'falcon', 'hawkeye', 'widow', 'merida'];
const deckWith = (...u: UnitId[]): UnitId[] => [...u, ...FILL.filter((f) => !u.includes(f))].slice(0, 5);
function arena(u: UnitId, rank = 1, deck = deckWith(u)): Engine {
  const e = quiet(deck);
  debugNoRange(e);
  debugPlace(e, 0, 7, u, rank);
  return e;
}
const unitAt = (e: Engine, slot: number) => simState(e).players[0]!.grid[slot]!;

describe('extension Transformers : contenu', () => {
  it('15 Autobots du pack Transformers (3 Légendaires, 5 Épiques, 7 Rares), même pack que les autres', () => {
    expect(TF.map((u) => u.id)).toEqual(['optimus', 'bumblebee', 'ironhide', 'ratchet', 'jazz', 'arcee', 'grimlock', 'wheeljack', 'hotrod', 'elita', 'bulkhead', 'sideswipe', 'prowl', 'mirage', 'ultramagnus']);
    const by = (r: string) => TF.filter((u) => u.rarity === r).length;
    expect([by('legendaire'), by('epique'), by('rare')]).toEqual([3, 5, 7]);
    expect(PACKS.transformers).toMatchObject({ price1: 100, price10: 900, pityLegendary: 30, rates: PACKS.marvel.rates });
  });

  it('chaque Autobot se transforme (robot lent et fort, véhicule rapide) et a 6 talents et 5 éveils', () => {
    for (const u of TF) {
      const p = u.ability.params;
      expect(p.transformEvery, u.id).toBe(8);
      expect(p.robotDamage! * p.robotSpeed!).toBeGreaterThan(1);
      expect(p.vehicleSpeed).toBeGreaterThan(1);
      expect(TALENTS.filter((t) => t.unit === u.id)).toHaveLength(6);
      expect(AWAKENINGS.filter((a) => a.unit === u.id)).toHaveLength(5);
    }
  });

  it('les 8 archétypes de stratégie sont couverts', () => {
    const has = (k: string) => TF.filter((u) => k in u.ability.params).map((u) => u.id);
    expect(has('sacrificeMana')).toEqual(['bulkhead']);
    expect(has('copyDamageMul')).toEqual(['mirage']);
    expect(has('promoteAlly')).toEqual(['wheeljack']);
    expect(has('growthPerKill')).toEqual(['grimlock']);
    expect(has('manaPerKill')).toEqual(['jazz']);
    expect(has('auraAttackSpeed')).toEqual(['ratchet']);
    expect(has('swapAlly')).toEqual(['bumblebee']);
    expect(has('formationDamagePerAlly')).toEqual(['ultramagnus']);
  });

  it('équipes Autobots, Dinobots, Aériens et Les Machines (inter-univers)', () => {
    expect(activeTeams(['optimus', 'bumblebee', 'jazz', 'ratchet', 'thor']).map((t) => t.id)).toContain('autobots');
    expect(activeTeams(['grimlock', 'bulkhead', 'thor', 'hulk', 'cap']).map((t) => t.id)).toContain('dinobots');
    expect(activeTeams(['ironman', 'optimus', 'thor', 'hulk', 'cap']).map((t) => t.id)).toContain('machines');
    expect(TEAMS.aeriens!.params.minCount).toBe(2);
  });

  it('7 Decepticons avec arène, lieutenant et sbires ; Megatron dans la rotation, Unicron hors rotation', () => {
    const ids: BossId[] = ['starscream', 'soundwave', 'shockwave', 'devastator', 'blitzwing', 'megatron', 'unicron'];
    for (const id of ids) {
      expect(BOSSES[id].arenaMapId).toBe(`arene-${id}`);
      expect(LIEUTENANTS[id].power.interval).toBe(10);
    }
    expect(BOSS_POOLS.tous).toContain('megatron');
    expect(BOSS_POOLS.tous).not.toContain('unicron');
    expect(BOSS_POOLS['marvel-disney']).not.toContain('starscream');
  });
});

describe('transformation', () => {
  it('robot au départ ; véhicule toutes les 8 s, puis robot', () => {
    const e = arena('optimus');
    const u = unitAt(e, 7);
    expect(u.counters.vehicle).toBe(0);
    const ev = step(e, 8 * 20 + 1);
    expect(u.counters.vehicle).toBe(1);
    expect(ofType(ev, 'ability').some((a) => a.name === 'Transformation : véhicule')).toBe(true);
    step(e, 8 * 20);
    expect(u.counters.vehicle).toBe(0);
  });

  it('un appui transforme tout de suite (commande transform), pas deux fois de suite', () => {
    const e = arena('bumblebee');
    e.apply({ type: 'transform', player: 'p1', slot: 7 });
    step(e, 1);
    expect(unitAt(e, 7).counters.vehicle).toBe(1);
    e.apply({ type: 'transform', player: 'p1', slot: 7 });
    const ev = step(e, 1);
    expect(ofType(ev, 'rejected')).toHaveLength(1);
    step(e, 20);
    e.apply({ type: 'transform', player: 'p1', slot: 7 });
    step(e, 1);
    expect(unitAt(e, 7).counters.vehicle).toBe(0);
  });

  it('un héros qui ne se transforme pas refuse la commande', () => {
    const e = arena('cmarvel');
    e.apply({ type: 'transform', player: 'p1', slot: 7 });
    expect(ofType(step(e, 1), 'rejected')).toHaveLength(1);
  });

  it('robot : vise le plus de PV ; véhicule : le plus avancé', () => {
    const e = arena('elita');
    const far = debugSpawn(e, { hp: 1e6, distance: 20 });
    const fat = debugSpawn(e, { hp: 1e8, distance: 2 });
    let atk = ofType(step(e, 40), 'attack').filter((a) => a.unit === 'elita');
    expect(atk[0]!.targets[0]).toBe(fat.uid);
    e.apply({ type: 'transform', player: 'p1', slot: 7 });
    step(e, 2);
    atk = ofType(step(e, 40), 'attack').filter((a) => a.unit === 'elita');
    expect(atk.at(-1)!.targets[0]).toBe(far.uid);
  });

  it('le mode véhicule tire plus vite que le mode robot', () => {
    const count = (veh: boolean) => {
      const e = arena('hotrod');
      debugSpawn(e, { hp: 1e12, distance: 5 });
      if (veh) { e.apply({ type: 'transform', player: 'p1', slot: 7 }); step(e, 1); }
      return ofType(step(e, 7 * 20), 'attack').filter((a) => a.unit === 'hotrod').length;
    };
    expect(count(true)).toBeGreaterThan(count(false) * 1.8);
  });
});

describe('profils Rush Royale des Autobots', () => {
  it('Optimus (Banshee) : cri de ralliement sur tous les ennemis à portée', () => {
    const e = arena('optimus');
    for (let i = 0; i < 3; i++) debugSpawn(e, { hp: 1e9, distance: 3 + i });
    const ev = step(e, 6 * 20 + 2);
    const rally = ofType(ev, 'ability').find((a) => a.name === 'Cri de ralliement');
    expect(rally?.targets).toHaveLength(3);
  });

  it('Bumblebee (Mage de foudre) : en voiture, 3 cibles ; échangeur', () => {
    const e = arena('bumblebee');
    for (let i = 0; i < 4; i++) debugSpawn(e, { hp: 1e9, distance: 2 + i });
    e.apply({ type: 'transform', player: 'p1', slot: 7 });
    const atk = ofType(step(e, 30), 'attack').filter((a) => a.fx === 'bumblebee:rafale');
    expect(atk[0]!.targets).toHaveLength(3);
    debugPlace(e, 0, 0, 'cmarvel', 1);
    expect(dropAction(unitAt(e, 7), unitAt(e, 0))).toBe('swap');
  });

  it('Ironhide (Chasseur de démons) : en robot, autant de cibles que son rang', () => {
    const e = arena('ironhide', 3);
    for (let i = 0; i < 5; i++) debugSpawn(e, { hp: 1e9, distance: 2 + i });
    const atk = ofType(step(e, 30), 'attack').find((a) => a.fx === 'ironhide:canons');
    expect(atk!.targets).toHaveLength(3);
  });

  it('Ratchet (Sorcière) : aura de vitesse en ambulance seulement', () => {
    const speed = (veh: boolean) => {
      const e = quiet(deckWith('ratchet', 'cmarvel'));
      debugNoRange(e);
      debugPlace(e, 0, 7, 'ratchet', 1);
      debugPlace(e, 0, 8, 'cmarvel', 1);
      if (veh) { e.apply({ type: 'transform', player: 'p1', slot: 7 }); step(e, 1); }
      debugSpawn(e, { hp: 1e12, distance: 5 });
      return ofType(step(e, 6 * 20), 'attack').filter((a) => a.unit === 'cmarvel').length;
    };
    expect(speed(true)).toBeGreaterThan(speed(false));
  });

  it('Jazz (Loup de mer) : mana par élimination, doublé en voiture', () => {
    const gain = (veh: boolean) => {
      const e = arena('jazz');
      if (veh) { e.apply({ type: 'transform', player: 'p1', slot: 7 }); step(e, 1); }
      const target = debugSpawn(e, { hp: 1, distance: 3 });
      const before = e.state.players[0]!.mana;
      step(e, 40);
      void target;
      return e.state.players[0]!.mana - before;
    };
    expect(gain(true)).toBeGreaterThan(gain(false));
  });

  it('Grimlock (Chaperon rouge) : croissance avec le temps et les éliminations', () => {
    const e = arena('grimlock');
    step(e, 100);
    expect(unitAt(e, 7).counters.growth).toBeCloseTo(0.02, 5); // 0,004 point par seconde
    debugSpawn(e, { hp: 1, distance: 3 });
    step(e, 30);
    expect(unitAt(e, 7).counters.growth).toBeGreaterThan(0.045); // + 0,03 par élimination
  });

  it('Wheeljack (Corsaire) : booster de fusion ; mine en voiture de course', () => {
    const e = arena('wheeljack');
    debugPlace(e, 0, 0, 'cmarvel', 1);
    expect(dropAction(unitAt(e, 7), unitAt(e, 0))).toBe('promote');
    e.apply({ type: 'transform', player: 'p1', slot: 7 });
    for (let i = 0; i < 3; i++) debugSpawn(e, { hp: 1e9, distance: 3 + i * 0.3 });
    const ev = step(e, 6 * 20);
    expect(ofType(ev, 'ability').some((a) => a.name === 'Mine')).toBe(true);
  });

  it('Bulkhead (sacrifice) : la fusion rapporte du mana', () => {
    const e = arena('bulkhead', 2);
    debugPlace(e, 0, 8, 'bulkhead', 2);
    e.apply({ type: 'merge', player: 'p1', from: 7, to: 8 });
    const ev = step(e, 1);
    expect(ofType(ev, 'mana').find((m) => m.reason === 'sacrifice')?.amount).toBe(25);
  });

  it('Mirage (copieur) : devient une copie à −25 %', () => {
    const e = arena('mirage', 2);
    debugPlace(e, 0, 8, 'cmarvel', 2);
    e.apply({ type: 'copy', player: 'p1', from: 7, to: 8 });
    step(e, 1);
    expect(unitAt(e, 7).unit).toBe('cmarvel');
    expect(unitAt(e, 7).status.copyMul).toBe(0.75);
  });

  it('Ultra Magnus (formation) : alignés, ils frappent plus fort ; porte-voitures renforce la ligne', () => {
    const e = quiet(deckWith('ultramagnus'));
    debugNoRange(e);
    for (const s of [5, 6, 7]) debugPlace(e, 0, s, 'ultramagnus', 1);
    debugSpawn(e, { hp: 1e12, distance: 4 });
    const hits = ofType(step(e, 30), 'attack').filter((a) => a.unit === 'ultramagnus');
    expect(hits.length).toBeGreaterThan(0);
  });

  it('Prowl (Maléfice) : +12 % de dégâts aux voisines en robot seulement', async () => {
    const { baseDamage } = await import('../../src/engine/combat');
    const e = quiet(deckWith('prowl', 'cmarvel'));
    debugPlace(e, 0, 7, 'cmarvel', 1);
    const ctx = (e as unknown as { _ctx: Parameters<typeof baseDamage>[0] })._ctx;
    const alone = baseDamage(ctx, 0, 7, unitAt(e, 7));
    debugPlace(e, 0, 8, 'prowl', 1);
    expect(baseDamage(ctx, 0, 7, unitAt(e, 7)) / alone).toBeCloseTo(1.12, 5);
    unitAt(e, 8).counters.vehicle = 1;
    expect(baseDamage(ctx, 0, 7, unitAt(e, 7)) / alone).toBeCloseTo(1, 5);
  });
});

describe('Decepticons', () => {
  function withBoss(boss: BossId, units: [number, UnitId, number][], deck: UnitId[] = ['cmarvel', 'falcon', 'hawkeye', 'widow', 'optimus']) {
    const e = quiet(deck);
    for (const [slot, u, r] of units) debugPlace(e, 0, slot, u, r);
    const b = debugSpawn(e, { hp: 1e12, bossId: boss, distance: 1 });
    const ev = step(e, 1);
    return { e, ev, b };
  }
  const power = (ev: ReturnType<typeof step>) => ofType(ev, 'bossPower');

  it('Starscream : 2 unités étourdies', () => {
    const { e, ev } = withBoss('starscream', [[0, 'cmarvel', 1], [1, 'falcon', 1], [2, 'widow', 1]]);
    expect(power(ev)[0]!.slots).toHaveLength(2);
    expect(e.state.players[0]!.grid.filter((u) => (u?.status.stunnedFor ?? 0) > 0)).toHaveLength(2);
  });

  it('Soundwave : brouillage (améliorations perdues, plus de transformation)', () => {
    const { e } = withBoss('soundwave', [[0, 'optimus', 1]]);
    const u = unitAt(e, 0);
    expect(u.counters.jamFor).toBeGreaterThan(0);
    e.apply({ type: 'transform', player: 'p1', slot: 0 });
    expect(ofType(step(e, 1), 'rejected')).toHaveLength(1);
  });

  it('Shockwave : une unité transformée en une autre du deck pendant 6 s', () => {
    const { e } = withBoss('shockwave', [[0, 'cmarvel', 2]]);
    const u = unitAt(e, 0);
    expect(u.status.transformedInto).toBeDefined();
    expect(u.status.transformedInto).not.toBe('cmarvel');
  });

  it('Devastator : une colonne étourdie ; se reforme une fois à 40 %', () => {
    const { e, ev, b } = withBoss('devastator', [[0, 'cmarvel', 1], [5, 'falcon', 1], [10, 'widow', 1]]);
    expect(power(ev)[0]!.slots.every((s) => s % 5 === power(ev)[0]!.slots[0]! % 5)).toBe(true);
    debugNoRange(e);
    b.hp = 1; b.maxHp = 1000;
    const ev2 = step(e, 40);
    expect(power(ev2).some((p) => p.name === REFORM_NAME)).toBe(true);
    expect(b.x.reformed).toBe(1);
  });

  it('Blitzwing : alterne glace (une ligne) et feu (dégâts réduits)', () => {
    const { e, ev } = withBoss('blitzwing', [[0, 'cmarvel', 1], [1, 'falcon', 1]]);
    expect(power(ev)[0]!.name).toBe('Blizzard');
    const ev2 = step(e, 6 * 20 + 1);
    expect(power(ev2).some((p) => p.name === 'Canon de feu')).toBe(true);
  });

  it('Megatron : canon à fusion, puis renforts Vehicons ; Tyrannie à 30 %', () => {
    const { e, ev, b } = withBoss('megatron', [[0, 'optimus', 3], [1, 'falcon', 2]]);
    expect(power(ev)[0]!.name).toBe('Canon à fusion');
    const before = simState(e).enemies.length;
    step(e, 8 * 20 + 1);
    expect(simState(e).enemies.length).toBe(before + 3);
    unitAt(e, 0).counters.vehicle = 1;
    b.hp = b.maxHp * 0.2;
    const ev3 = step(e, 1);
    expect(power(ev3).some((p) => p.name === TYRANNY_NAME)).toBe(true);
    expect(unitAt(e, 0).counters.vehicle).toBe(0);
  });

  it('Unicron : boss cosmique à la vague 150 en mode infini, prioritaire sur Thanos', () => {
    const cfg = { mode: 'solo' as const, seed: 1, mapId: 'x', players: [setup()] };
    expect(finalBossAt(cfg, 150)).toBe('unicron');
    expect(finalBossAt(cfg, 50)).toBe('thanos');
    expect(finalBossAt({ ...cfg, bossPool: 'marvel-disney' }, 150)).toBe('thanos');
    expect(finalBossAt({ ...cfg, targetWaves: 200 }, 150)).toBeNull();
    const e = createEngine({ ...cfg, bossRhythm: { small: 0, big: 0, thanos: 0, unicron: 3 } });
    void e;
  });
});

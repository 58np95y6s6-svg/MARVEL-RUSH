import { describe, expect, it } from 'vitest';
import { debugPlace, debugSpawn, debugStone, simState } from '../../src/engine/debug';
import { BOSS_LIST, SNAP_NAME, THANOS_STONES } from '../../src/data/bosses';
import type { BossId, UnitId } from '../../src/data/types';
import type { Engine } from '../../src/engine/types';
import { MARVEL, ofType, quiet, step } from './helpers';

const DECK: UnitId[] = ['cmarvel', 'falcon', 'hawkeye', 'widow', 'coco'];

function withBoss(boss: BossId, units: [number, UnitId, number][], deck: UnitId[] = DECK): { e: Engine; ev: ReturnType<typeof step> } {
  const e = quiet(deck);
  for (const [slot, u, r] of units) debugPlace(e, 0, slot, u, r);
  const b = debugSpawn(e, { hp: 1e12, bossId: boss, distance: 1 });
  void b;
  const ev = step(e, 1);
  return { e, ev };
}
const grid = (e: Engine) => e.state.players[0]!.grid;

describe('boss', () => {
  it('13 boss définis (7 + 6 DC), intervalle 6 s (Thanos et Darkseid 8 s)', () => {
    expect(BOSS_LIST).toHaveLength(13);
    for (const b of BOSS_LIST) expect(b.power.interval).toBe(b.id === 'thanos' || b.id === 'darkseid' ? 8 : 6);
  });

  it('Jafar : Hypnose, 1 à 2 unités cessent d’attaquer 4 s', () => {
    const { e, ev } = withBoss('jafar', [[0, 'cmarvel', 1], [1, 'falcon', 1], [2, 'widow', 1]]);
    const p = ofType(ev, 'bossPower')[0]!;
    expect(p.name).toBe('Hypnose');
    expect(p.slots.length).toBeGreaterThanOrEqual(1);
    expect(p.slots.length).toBeLessThanOrEqual(2);
    for (const s of p.slots) expect(grid(e)[s]!.status.hypnotizedFor).toBeCloseTo(4);
    // Une unité hypnotisée n'attaque pas.
    const s = p.slots[0]!;
    debugSpawn(e, { hp: 1e12, distance: 2 });
    const atk = ofType(step(e, 20 * 3), 'attack').filter((a) => a.slot === s);
    expect(atk).toHaveLength(0);
  });

  it('Cruella : Vol de manteau, une unité perd 1 rang', () => {
    const { e, ev } = withBoss('cruella', [[3, 'cmarvel', 4]]);
    expect(ofType(ev, 'bossPower')[0]).toMatchObject({ name: 'Vol de manteau', slots: [3] });
    expect(grid(e)[3]!.rank).toBe(3);
  });

  it('Ursula : Contrat, échange 2 unités', () => {
    const { e, ev } = withBoss('ursula', [[0, 'cmarvel', 1], [14, 'falcon', 2]]);
    expect(ofType(ev, 'bossPower')[0]!.slots.sort((a, b) => a - b)).toEqual([0, 14]);
    expect(grid(e)[0]!.unit).toBe('falcon');
    expect(grid(e)[14]!.unit).toBe('cmarvel');
  });

  it('Maléfique : Sommeil maudit, une ligne entière dort 3 s', () => {
    const { e, ev } = withBoss('malefique', [[5, 'cmarvel', 1], [6, 'falcon', 1], [9, 'widow', 1]]);
    expect(ofType(ev, 'bossPower')[0]!.slots).toEqual([5, 6, 9]);
    for (const s of [5, 6, 9]) expect(grid(e)[s]!.status.sleepingFor).toBeCloseTo(3);
  });

  it('Galactus : Dévoreur, détruit une unité de rang ≤ 3', () => {
    const { e, ev } = withBoss('galactus', [[0, 'cmarvel', 5], [1, 'falcon', 3]]);
    expect(ofType(ev, 'bossPower')[0]!.slots).toEqual([1]);
    expect(grid(e)[1]).toBeNull();
    expect(grid(e)[0]!.rank).toBe(5);
  });

  it('Bouffon Vert : Bombes citrouilles, étourdit 3 unités 2 s', () => {
    const { e, ev } = withBoss('bouffon', [[0, 'cmarvel', 1], [1, 'falcon', 1], [2, 'widow', 1], [3, 'hawkeye', 1]]);
    const p = ofType(ev, 'bossPower')[0]!;
    expect(p.slots).toHaveLength(3);
    for (const s of p.slots) expect(grid(e)[s]!.status.stunnedFor).toBeCloseTo(2);
  });

  it('le pouvoir revient toutes les 6 s', () => {
    const { e } = withBoss('bouffon', [[0, 'cmarvel', 1]]);
    expect(ofType(step(e, 20 * 12), 'bossPower')).toHaveLength(2);
  });

  describe('Thanos : Gant de l’infini', () => {
    const run = (stone: string, units: [number, UnitId, number][]) => {
      const e = quiet(DECK);
      debugStone(e, stone);
      for (const [slot, u, r] of units) debugPlace(e, 0, slot, u, r);
      const boss = debugSpawn(e, { hp: 1000, bossId: 'thanos', distance: 1 });
      const ev = step(e, 1);
      return { e, boss, p: ofType(ev, 'bossPower')[0]! };
    };
    it('six Pierres avec leur couleur', () => {
      expect(THANOS_STONES.map((s) => s.id)).toEqual(['puissance', 'espace', 'realite', 'ame', 'temps', 'esprit']);
    });
    it('Pouvoir : étourdit 3 unités 2 s', () => {
      const { e, p } = run('puissance', [[0, 'cmarvel', 1], [1, 'falcon', 1], [2, 'widow', 1]]);
      expect(p.name).toBe('Pierre du Pouvoir');
      for (const s of p.slots) expect(grid(e)[s]!.status.stunnedFor).toBeCloseTo(2);
      expect(p.slots).toHaveLength(3);
    });
    it('Espace : échange 2 unités', () => {
      const { e, p } = run('espace', [[0, 'cmarvel', 1], [1, 'falcon', 1]]);
      expect(p.name).toBe('Pierre de l’Espace');
      expect(grid(e)[0]!.unit).toBe('falcon');
    });
    it('Réalité : transforme une unité en une autre du deck, même rang', () => {
      const { e, p } = run('realite', [[4, 'cmarvel', 3]]);
      expect(p.name).toBe('Pierre de la Réalité');
      expect(grid(e)[4]!.unit).not.toBe('cmarvel');
      expect(DECK).toContain(grid(e)[4]!.unit);
      expect(grid(e)[4]!.rank).toBe(3);
    });
    it('Âme : vole 20 % du mana', () => {
      const { e, p } = run('ame', []);
      expect(p.name).toBe('Pierre de l’Âme');
      expect(e.state.players[0]!.mana).toBe(120); // 150 − 20 %
    });
    it('Temps : soigne Thanos de 5 %', () => {
      const e = quiet(DECK);
      debugStone(e, 'temps');
      const boss = debugSpawn(e, { hp: 1000, bossId: 'thanos', distance: 1 });
      boss.hp = 500;
      expect(ofType(step(e, 1), 'bossPower')[0]!.name).toBe('Pierre du Temps');
      expect(boss.hp).toBeCloseTo(550);
    });
    it('Esprit : hypnotise 2 unités 4 s', () => {
      const { e, p } = run('esprit', [[0, 'cmarvel', 1], [1, 'falcon', 1], [2, 'widow', 1]]);
      expect(p.name).toBe('Pierre de l’Esprit');
      expect(p.slots).toHaveLength(2);
      for (const s of p.slots) expect(grid(e)[s]!.status.hypnotizedFor).toBeCloseTo(4);
    });
    it('toutes les 8 s', () => {
      const { e } = run('ame', []);
      expect(ofType(step(e, 20 * 16), 'bossPower')).toHaveLength(2);
    });
    it('Claquement de doigts une fois à 30 % : annonce, puis 3 unités perdent la moitié de leurs rangs 1 s après', () => {
      const e = quiet(DECK);
      debugStone(e, 'ame');
      for (const [s, r] of [[0, 7], [1, 4], [2, 2], [3, 1]] as const) debugPlace(e, 0, s, 'cmarvel', r);
      const boss = debugSpawn(e, { hp: 1e6, bossId: 'thanos', distance: 1 });
      boss.x.powerIn = 1e9;
      boss.hp = 2.9e5;
      const first = ofType(step(e, 1), 'bossPower');
      expect(first).toEqual([expect.objectContaining({ name: SNAP_NAME, slots: [] })]);
      const later = ofType(step(e, 20), 'bossPower');
      expect(later).toHaveLength(1);
      expect(later[0]!.name).toBe(SNAP_NAME);
      expect(later[0]!.slots).toHaveLength(3);
      const ranks = grid(e).slice(0, 4).map((u) => u!.rank);
      const expected: Record<number, number> = { 7: 4, 4: 2, 2: 1, 1: 1 };
      const original = [7, 4, 2, 1];
      original.forEach((r, i) => expect([r, expected[r]]).toContain(ranks[i]));
      expect(ranks.filter((r, i) => r !== original[i]).length).toBeGreaterThanOrEqual(2);
      boss.hp = 1e5;
      expect(ofType(step(e, 40), 'bossPower').filter((x) => x.name === SNAP_NAME)).toHaveLength(0);
    });
  });

  it('Raiponce (Pascal) est insensible aux pouvoirs de boss', () => {
    const { e, ev } = withBoss('galactus', [[0, 'rapunzel', 1]], ['rapunzel', ...MARVEL.slice(0, 4)]);
    expect(ofType(ev, 'bossPower')[0]!.slots).toEqual([]);
    expect(grid(e)[0]!.unit).toBe('rapunzel');
  });

  it('Coco : Remember Me restaure l’unité détruite, une fois par vague', () => {
    const { e, ev } = withBoss('galactus', [[0, 'cmarvel', 5], [1, 'falcon', 2], [2, 'widow', 2], [14, 'coco', 4]]);
    const p = ofType(ev, 'bossPower')[0]!;
    expect(ofType(ev, 'ability').some((a) => a.name === 'Remember Me')).toBe(true);
    const restored = grid(e)[p.slots[0]!];
    expect(restored).not.toBeNull();
    const ev2 = step(e, 20 * 6);
    expect(ofType(ev2, 'ability').filter((a) => a.name === 'Remember Me')).toHaveLength(0);
  });

  it('petit boss : version affaiblie du pouvoir du maître toutes les 10 s', () => {
    const e = quiet(DECK);
    for (const s of [0, 1, 2]) debugPlace(e, 0, s, 'cmarvel', 1);
    debugSpawn(e, { hp: 1e12, lieutenantOf: 'jafar', distance: 1 });
    const ev = step(e, 20 * 10 + 1);
    const pw = ofType(ev, 'bossPower');
    expect(pw).toHaveLength(2);
    expect(pw[0]).toMatchObject({ boss: 'jafar', name: 'Hypnose' });
    expect(pw[0]!.slots).toHaveLength(1);
    expect(grid(e)[pw[1]!.slots[0]!]!.status.hypnotizedFor).toBeCloseTo(2, 1);
  });

  it('Citrouilles volantes : explosion à l’arrivée qui étourdit 2 unités', () => {
    const e = quiet(DECK);
    for (const s of [0, 1, 2]) debugPlace(e, 0, s, 'cmarvel', 1);
    const pk = debugSpawn(e, { hp: 1e12, minionOf: 'bouffon', distance: 29.99, speed: 2, flying: true });
    pk.x.arrivalStun = 1;
    pk.x.arrivalStunUnits = 2;
    const ev = step(e, 2);
    expect(ofType(ev, 'lifeLost')).toHaveLength(1);
    expect(ofType(ev, 'bossPower')[0]!.slots).toHaveLength(2);
    void simState;
  });
});

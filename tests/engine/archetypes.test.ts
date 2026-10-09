// Archétypes de stratégie génériques (src/engine/archetypes.ts, docs/roadmap.md) :
// sacrifice → mana, copieur, booster de fusion, croissance, mana par élimination, boost de vitesse.
import { describe, expect, it } from 'vitest';
import { createEngine, dropAction, formationLength, formationPartners, KILL_MANA, SACRIFICE_MANA } from '../../src/engine';
import { debugNoRange, debugPlace, debugSpawn, runSeconds } from '../../src/engine/debug';
import type { UnitId } from '../../src/data/types';
import { UNITS } from '../../src/data/units';
import type { Engine, GameConfig } from '../../src/engine/types';
import { ofType, quiet, setup, simState, step } from './helpers';

const DECK: UnitId[] = ['widow', 'loki', 'coco', 'venom', 'tiana'];
const BIG = 1e9;
const grid = (e: Engine) => e.state.players[0]!.grid;

describe('Sacrifice → mana (Black Widow)', () => {
  it('fusionnée : mana selon le rang (10, 25, 45, 70, 100, 140), une fois par fusion', () => {
    for (let rank = 1; rank <= 6; rank++) {
      const e = quiet(DECK);
      debugPlace(e, 0, 0, 'widow', rank);
      debugPlace(e, 0, 1, 'widow', rank);
      const before = e.state.players[0]!.mana;
      e.apply({ type: 'merge', player: 'p1', from: 0, to: 1 });
      const ev = step(e);
      expect(ofType(ev, 'merge')).toHaveLength(1);
      expect(e.state.players[0]!.mana - before).toBe(SACRIFICE_MANA[rank - 1]);
      expect(ofType(ev, 'mana')[0]).toMatchObject({ amount: SACRIFICE_MANA[rank - 1], reason: 'sacrifice', slot: 1 });
    }
    expect(SACRIFICE_MANA).toEqual([10, 25, 45, 70, 100, 140, 190]);
  });

  it('détruite par un boss (Galactus) : mana selon son rang', () => {
    const e = quiet(DECK);
    debugPlace(e, 0, 0, 'widow', 3);
    const boss = debugSpawn(e, { hp: BIG, bossId: 'galactus', distance: 1 });
    void boss;
    const before = e.state.players[0]!.mana;
    const ev = step(e, 2);
    expect(ofType(ev, 'bossPower')[0]!.slots).toEqual([0]);
    expect(grid(e)[0]).toBeNull();
    expect(e.state.players[0]!.mana - before).toBe(45);
    expect(ofType(ev, 'mana')[0]).toMatchObject({ amount: 45, slot: 0 });
  });

  it('les talents multiplient le barème (Espionne d’élite ×1,3)', () => {
    const e = createEngine({ mode: 'solo', seed: 3, mapId: 'test', players: [setup(DECK, { levels: { widow: 7 }, talents: { widow: ['a', 'a'] } })] });
    simState(e).enemies = [];
    simState(e).waveTimeLeft = 1e6;
    simState(e).spawnTimer = 1e6;
    debugPlace(e, 0, 0, 'widow', 2);
    debugPlace(e, 0, 1, 'widow', 2);
    const before = e.state.players[0]!.mana;
    e.apply({ type: 'merge', player: 'p1', from: 0, to: 1 });
    step(e);
    expect(e.state.players[0]!.mana - before).toBe(Math.round(25 * 1.3));
  });
});

describe('Copieur (Loki)', () => {
  it('glissé sur une alliée de même rang : devient sa copie (compétence complète, −25 % de dégâts)', () => {
    const e = quiet(['loki', 'cmarvel', 'falcon', 'hawkeye', 'ironman']);
    debugNoRange(e);
    debugPlace(e, 0, 0, 'loki', 2);
    debugPlace(e, 0, 1, 'ironman', 2);
    e.apply({ type: 'copy', player: 'p1', from: 0, to: 1 });
    const ev = step(e);
    expect(ofType(ev, 'copy')[0]).toMatchObject({ from: 0, to: 1, unit: 'ironman', rank: 2 });
    const c = grid(e)[0]!;
    expect(c.unit).toBe('ironman');
    expect(c.rank).toBe(2);
    expect(c.status).toMatchObject({ copyMul: 0.75, copyOf: 'loki' });
    expect(c.counters.cd).toBeGreaterThan(0); // recharge de l'Uni-Beam
    expect(grid(e)[1]!.unit).toBe('ironman');
    // Dégâts : 75 % de ceux de l'original.
    grid(e)[1] = null;
    debugSpawn(e, { hp: BIG, distance: 10 });
    c.cooldown = 0;
    const hit = ofType(step(e), 'hit')[0]!;
    expect(hit.damage).toBeCloseTo(UNITS.ironman.damage * 1.51 * 0.75);
    // La compétence complète (Uni-Beam) se déclenche aussi.
    const more = step(e, 20 * 11);
    expect(ofType(more, 'ability').some((a) => a.name === 'Uni-Beam' && a.slot === 0)).toBe(true);
  });

  it('même héros = fusion normale, rang différent refusé, la copie peut ensuite fusionner', () => {
    const e = quiet(['loki', 'cmarvel', 'falcon', 'hawkeye', 'widow']);
    debugPlace(e, 0, 0, 'loki', 1);
    debugPlace(e, 0, 1, 'loki', 1);
    debugPlace(e, 0, 2, 'falcon', 2);
    debugPlace(e, 0, 3, 'falcon', 1);
    expect(dropAction(grid(e)[0], grid(e)[1])).toBe('merge');
    expect(dropAction(grid(e)[0], grid(e)[2])).toBeNull();
    expect(dropAction(grid(e)[0], grid(e)[3])).toBe('copy');
    expect(dropAction(grid(e)[3], grid(e)[0])).toBeNull(); // Falcon ne copie pas
    e.apply({ type: 'copy', player: 'p1', from: 0, to: 2 });
    e.apply({ type: 'copy', player: 'p1', from: 0, to: 1 });
    e.apply({ type: 'copy', player: 'p1', from: 3, to: 0 });
    const r = ofType(step(e), 'rejected').map((x) => x.reason);
    expect(r).toHaveLength(3);
    expect(r[0]).toMatch(/même rang/);
    expect(r[1]).toMatch(/fusionnent/);
    expect(r[2]).toMatch(/copier/);
    e.apply({ type: 'copy', player: 'p1', from: 0, to: 3 });
    step(e);
    expect(grid(e)[0]!.unit).toBe('falcon');
    e.apply({ type: 'merge', player: 'p1', from: 0, to: 3 });
    expect(ofType(step(e), 'merge')).toHaveLength(1);
    expect(grid(e)[3]!.rank).toBe(2);
    expect(grid(e)[3]!.status.copyMul).toBeUndefined();
  });

  it('sans limite : chaque Loki peut copier, même une copie, sans cumuler le malus', () => {
    const e = quiet(['loki', 'cmarvel', 'falcon', 'hawkeye', 'widow']);
    debugPlace(e, 0, 0, 'loki', 3);
    debugPlace(e, 0, 1, 'loki', 3);
    debugPlace(e, 0, 2, 'cmarvel', 3);
    e.apply({ type: 'copy', player: 'p1', from: 0, to: 2 });
    step(e);
    e.apply({ type: 'copy', player: 'p1', from: 1, to: 0 });
    step(e);
    expect(grid(e)[1]!.unit).toBe('cmarvel');
    expect(grid(e)[1]!.status.copyMul).toBe(0.75);
  });

  it('talents : copie à 100 % et rang bonus (éveil ultime)', () => {
    const e = createEngine({
      mode: 'solo', seed: 3, mapId: 'test',
      players: [setup(['loki', 'cmarvel', 'falcon', 'hawkeye', 'widow'], { levels: { loki: 10 }, talents: { loki: ['a', 'a', 'b'] }, awakening: { loki: 10 } })],
    });
    debugPlace(e, 0, 0, 'loki', 4);
    debugPlace(e, 0, 1, 'cmarvel', 4);
    e.apply({ type: 'copy', player: 'p1', from: 0, to: 1 });
    step(e);
    expect(grid(e)[0]).toMatchObject({ unit: 'cmarvel', rank: 5 });
    expect(grid(e)[0]!.status.copyMul).toBe(1);
  });
});

describe('Booster de fusion (Coco)', () => {
  it('glissée sur une alliée de même rang : Coco disparaît, l’alliée gagne 1 rang et garde son identité', () => {
    const e = quiet(DECK);
    debugPlace(e, 0, 0, 'coco', 3);
    const v = debugPlace(e, 0, 1, 'venom', 3);
    v.counters.growth = 0.3;
    expect(dropAction(grid(e)[0], grid(e)[1])).toBe('promote');
    e.apply({ type: 'promote', player: 'p1', from: 0, to: 1 });
    const ev = step(e);
    expect(ofType(ev, 'promote')[0]).toMatchObject({ from: 0, to: 1, unit: 'venom', rank: 4 });
    expect(grid(e)[0]).toBeNull();
    expect(grid(e)[1]!.uid).toBe(v.uid);
    expect(grid(e)[1]).toMatchObject({ unit: 'venom', rank: 4 });
    expect(grid(e)[1]!.counters.growth).toBeGreaterThanOrEqual(0.3);
  });

  it('refuse une autre Coco (fusion), un autre rang et le rang 7', () => {
    const e = quiet(DECK);
    debugPlace(e, 0, 0, 'coco', 7);
    debugPlace(e, 0, 1, 'widow', 7);
    debugPlace(e, 0, 2, 'coco', 2);
    debugPlace(e, 0, 3, 'coco', 2);
    debugPlace(e, 0, 4, 'tiana', 3);
    expect(dropAction(grid(e)[0], grid(e)[1])).toBeNull();
    expect(dropAction(grid(e)[2], grid(e)[3])).toBe('merge');
    e.apply({ type: 'promote', player: 'p1', from: 0, to: 1 });
    e.apply({ type: 'promote', player: 'p1', from: 2, to: 3 });
    e.apply({ type: 'promote', player: 'p1', from: 2, to: 4 });
    const r = ofType(step(e), 'rejected').map((x) => x.reason);
    expect(r).toHaveLength(3);
    expect(r[0]).toMatch(/Rang maximal/);
    expect(r[1]).toMatch(/fusionnent/);
    expect(r[2]).toMatch(/même rang/);
  });
});

describe('Croissance (Venom)', () => {
  const bonus = (pts: number) => 0.28 * Math.pow(pts, 0.75);
  it('sans plafond, à rendements décroissants : points +0,5/s et +0,02 par élimination', () => {
    const e = quiet(DECK);
    debugNoRange(e);
    const v = debugPlace(e, 0, 0, 'venom', 1);
    runSeconds(e, 200);
    expect(v.counters.growth).toBeCloseTo(1, 2);
    for (let i = 0; i < 30; i++) debugSpawn(e, { hp: 1, distance: 5 });
    const kills = ofType(step(e, 20 * 40), 'kill').length;
    expect(kills).toBe(30);
    expect(v.counters.growth).toBeCloseTo(1 + 0.005 * 40 + 0.02 * 30, 1);
    debugSpawn(e, { hp: BIG, distance: 5 });
    v.cooldown = 0;
    const hit = ofType(step(e), 'hit')[0]!;
    expect(hit.damage).toBeCloseTo(UNITS.venom.damage * (1 + bonus(v.counters.growth!)), 0);
    // Repères de la courbe : ≈ +100 % vers 5,5 points (vague 30), ≈ +200 % vers 13 points (vague 60), sans plafond.
    expect(bonus(5.5)).toBeCloseTo(1, 1);
    expect(bonus(13.4)).toBeCloseTo(1.96, 1);
    expect(bonus(100)).toBeGreaterThan(bonus(50));
  });

  it('fusion : la nouvelle unité garde 50 % du bonus du plus fort des deux Venom', () => {
    const e = quiet(DECK);
    const a = debugPlace(e, 0, 0, 'venom', 2);
    const b = debugPlace(e, 0, 1, 'venom', 2);
    a.counters.growth = 8;
    b.counters.growth = 4;
    e.apply({ type: 'merge', player: 'p1', from: 0, to: 1 });
    step(e);
    const m = grid(e)[1]!;
    expect(m.rank).toBe(3);
    const kept = bonus(8) * 0.5;
    if (m.unit === 'venom') expect(bonus(m.counters.growth!)).toBeCloseTo(kept, 2);
    else expect(m.counters.growth).toBeCloseTo(kept, 3); // autre héros : bonus fixe (courbe linéaire par défaut)
  });
});

describe('Mana par élimination (Tiana)', () => {
  it('un ennemi touché par Tiana rapporte KILL_MANA[rang] de plus, quel que soit le tueur', () => {
    for (const rank of [1, 4, 7]) {
      const e = quiet(DECK);
      debugNoRange(e);
      debugPlace(e, 0, 0, 'tiana', rank);
      const t = debugSpawn(e, { hp: BIG, distance: 5 });
      step(e);
      expect(t.x.manaTag).toBe(KILL_MANA[rank - 1]);
      t.hp = 1;
      const v = debugPlace(e, 0, 1, 'venom', 1);
      v.cooldown = 0;
      grid(e)[0]!.cooldown = 99;
      const kill = ofType(step(e), 'kill')[0]!;
      expect(kill.mana).toBe(10 + KILL_MANA[rank - 1]!);
    }
    expect(KILL_MANA).toEqual([1, 2, 3, 4, 5, 6, 8]);
  });

  it('un ennemi jamais touché par Tiana ne rapporte que son mana normal', () => {
    const e = quiet(DECK);
    debugNoRange(e);
    debugPlace(e, 0, 0, 'venom', 1);
    debugSpawn(e, { hp: 1, distance: 5 });
    expect(ofType(step(e), 'kill')[0]!.mana).toBe(10);
  });
});

describe('Boost de vitesse (aura)', () => {
  it('Captain America et Pocahontas portent la clé générique auraAttackSpeed', () => {
    expect(UNITS.cap.ability.params.auraAttackSpeed).toBeGreaterThan(0);
    expect(UNITS.pocahontas.ability.params.auraAttackSpeed).toBeGreaterThan(0);
  });
});

describe('déterminisme et sauvegarde avec les archétypes', () => {
  const cfg: GameConfig = { mode: 'solo', seed: 99, mapId: 'test', players: [setup(DECK)], script: { startMana: 2000 } };
  /** Bot : invoque, fusionne, copie et booste ; la partie joue 40 s. */
  function play(e: Engine, ticks: number): string[] {
    const log: string[] = [];
    for (let t = 0; t < ticks; t++) {
      const p = e.state.players[0]!;
      if (p.grid.some((g) => !g) && p.mana >= p.summonCost) e.apply({ type: 'summon', player: 'p1' });
      else {
        outer: for (let i = 0; i < 15; i++) for (let j = 0; j < 15; j++) {
          const k = i === j ? null : dropAction(p.grid[i], p.grid[j]);
          if (k) { e.apply({ type: k, player: 'p1', from: i, to: j }); break outer; }
        }
      }
      e.tick();
      for (const ev of e.drainEvents()) if (ev.type !== 'hit' && ev.type !== 'attack') log.push(JSON.stringify(ev));
    }
    return log;
  }

  it('deux parties identiques produisent les mêmes événements (copies, promotions, sacrifices)', () => {
    const a = play(createEngine(cfg), 20 * 40);
    const b = play(createEngine(cfg), 20 * 40);
    expect(a).toEqual(b);
    expect(a.some((s) => s.includes('"type":"copy"') || s.includes('"type":"promote"'))).toBe(true);
  });

  it('sauvegarde et reprise gardent les copies et la croissance', () => {
    const e = createEngine(cfg);
    debugPlace(e, 0, 0, 'loki', 2);
    debugPlace(e, 0, 1, 'tiana', 2);
    e.apply({ type: 'copy', player: 'p1', from: 0, to: 1 });
    step(e);
    const r0 = createEngine(cfg, e.serialize());
    expect(r0.state.players[0]!.grid[0]!.status).toEqual({ copyMul: 0.75, copyOf: 'loki' });
    expect(r0.state.players[0]!.grid[0]!.unit).toBe('tiana');
    play(e, 20 * 10);
    const r = createEngine(cfg, e.serialize());
    expect(r.state.players[0]!.grid).toEqual(e.state.players[0]!.grid);
    const x = play(e, 20 * 20);
    const y = play(r, 20 * 20);
    expect(y).toEqual(x);
    expect(r.serialize()).toBe(e.serialize());
  });
});

describe('Échangeur (Vanellope & Ralph)', () => {
  it('glissée sur une alliée de même rang : échange des cases, bonus aux nouvelles voisines, sans limite', () => {
    const e = quiet(['vanralph', 'cmarvel', 'falcon', 'hawkeye', 'widow']);
    const v = debugPlace(e, 0, 0, 'vanralph', 2);
    const f = debugPlace(e, 0, 13, 'falcon', 2);
    const n = debugPlace(e, 0, 12, 'cmarvel', 1);
    expect(dropAction(v, f)).toBe('swap');
    expect(dropAction(v, n)).toBeNull(); // autre rang
    e.apply({ type: 'swap', player: 'p1', from: 0, to: 13 });
    const ev = step(e);
    expect(ofType(ev, 'swap')[0]).toMatchObject({ from: 0, to: 13, unit: 'vanralph', rank: 2 });
    expect(grid(e)[13]!.uid).toBe(v.uid);
    expect(grid(e)[0]!.uid).toBe(f.uid);
    expect(n.counters.boostFor).toBeGreaterThan(4.9);
    expect(n.counters.boost).toBeCloseTo(0.2);
    expect(f.counters.boostFor ?? 0).toBe(0); // l'alliée échangée n'est plus voisine
    e.apply({ type: 'swap', player: 'p1', from: 13, to: 0 });
    step(e);
    expect(grid(e)[0]!.uid).toBe(v.uid);
    // Refus : autre rang, même héros (fusion), unité qui n'échange pas.
    e.apply({ type: 'swap', player: 'p1', from: 0, to: 12 });
    e.apply({ type: 'swap', player: 'p1', from: 13, to: 0 });
    const r = ofType(step(e), 'rejected').map((x) => x.reason);
    expect(r[0]).toMatch(/même rang/);
    expect(r[1]).toMatch(/échanger/);
  });

  it('déterministe et sauvegardé', () => {
    const cfg: GameConfig = { mode: 'solo', seed: 5, mapId: 'test', players: [setup(['vanralph', 'cmarvel', 'falcon', 'hawkeye', 'widow'])] };
    const e = createEngine(cfg);
    debugPlace(e, 0, 0, 'vanralph', 1);
    debugPlace(e, 0, 14, 'falcon', 1);
    e.apply({ type: 'swap', player: 'p1', from: 0, to: 14 });
    step(e, 3);
    const r = createEngine(cfg, e.serialize());
    expect(r.state.players[0]!.grid[14]!.unit).toBe('vanralph');
    step(e, 200); step(r, 200);
    expect(r.serialize()).toBe(e.serialize());
  });
});

describe('Formation (Loki)', () => {
  const lokiHit = (slots: number[], at: number, extra = 0) => {
    const e = quiet(['loki', 'cmarvel', 'falcon', 'hawkeye', 'widow']);
    debugNoRange(e);
    for (const s of slots) { const u = debugPlace(e, 0, s, 'loki', 1); u.cooldown = s === at ? 0 : 99; }
    const t = debugSpawn(e, { hp: BIG, distance: 10 });
    for (let i = 0; i < extra; i++) debugSpawn(e, { hp: BIG, distance: 10.5 + i * 0.3 });
    const ev = step(e);
    return { hits: ofType(ev, 'hit'), t, e };
  };
  it('2 Loki alignés : +15 % ; en diagonale : aucun bonus ; une copie ne compte pas', () => {
    const D = UNITS.loki.damage;
    expect(lokiHit([0], 0).hits[0]!.damage).toBeCloseTo(D);
    expect(lokiHit([0, 1], 0).hits[0]!.damage).toBeCloseTo(D * 1.15);
    expect(lokiHit([0, 5], 0).hits[0]!.damage).toBeCloseTo(D * 1.15); // colonne
    expect(lokiHit([0, 6], 0).hits[0]!.damage).toBeCloseTo(D); // diagonale
    expect(lokiHit([0, 2], 0).hits[0]!.damage).toBeCloseTo(D); // pas contigus
    expect(formationLength([null, null], 0)).toBe(0);
  });
  it('3 alignés : +30 % (plafond à 3) et attaque de zone (40 % autour de la cible)', () => {
    const D = UNITS.loki.damage;
    const three = lokiHit([5, 6, 7], 6, 2);
    expect(three.hits[0]!.damage).toBeCloseTo(D * 1.3);
    expect(three.hits.slice(1).map((h) => h.damage)).toEqual([D * 1.3 * 0.4, D * 1.3 * 0.4].map((x) => expect.closeTo(x, 5)));
    const four = lokiHit([5, 6, 7, 8], 6);
    expect(four.hits[0]!.damage).toBeCloseTo(D * 1.3);
    expect(formationPartners(four.e.state.players[0]!.grid, 6).sort()).toEqual([5, 7, 8]);
    const two = lokiHit([5, 6], 6, 2);
    expect(two.hits).toHaveLength(1); // pas de zone à 2
  });
});

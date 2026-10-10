// Extension DC Comics : données, compétences des 15 héros, pouvoirs des 6 boss, rotation,
// Darkseid à la vague 100, paliers prolongés, équipes, déterminisme.
import { describe, expect, it } from 'vitest';
import { createEngine, finalBossAt } from '../../src/engine';
import { debugNoRange, debugPlace, debugSpawn, simState } from '../../src/engine/debug';
import { ENEMIES, waveHp } from '../../src/data/enemies';
import { KILL_MANA, SACRIFICE_MANA, dropAction, formationLength, growthBonus } from '../../src/engine/archetypes';
import {
  ANTI_LIFE_NAME, BOOM_TUBE_NAME, BOSSES, BOSS_POOLS, LIEUTENANTS, OMEGA_NAME, ROTATING_BOSSES, VENOM_NAME,
} from '../../src/data/bosses';
import { INFINITE_MILESTONES } from '../../src/data/milestones';
import { PACKS } from '../../src/data/packs';
import { talentsFor } from '../../src/data/talents';
import { passivesFor } from '../../src/data/awakenings';
import { activeTeams } from '../../src/data/teams';
import { UNITS, UNIT_LIST } from '../../src/data/units';
import type { BossId, UnitId } from '../../src/data/types';
import type { Engine, EngineEvent, GameConfig } from '../../src/engine/types';
import { RANK_DAMAGE } from '../../src/engine/combat';
import { resolveUnitParams } from '../../src/engine/talents';
import { ofType, quiet, setup, step } from './helpers';

const DC_HEROES: UnitId[] = [
  'batman', 'superman', 'wonderwoman', 'flash', 'aquaman', 'greenlantern', 'cyborg', 'supergirl',
  'shazam', 'robin', 'batgirl', 'catwoman', 'harley', 'martian', 'greenarrow',
];
const DC_BOSSES: BossId[] = ['joker', 'luthor', 'bane', 'sinestro', 'blackadam', 'darkseid'];

// Remplissage sans équipe active avec les héros DC testés.
const FILL: UnitId[] = ['cmarvel', 'falcon', 'widow', 'nemo', 'foxhound', 'tiana'];
function deckWith(u: UnitId): UnitId[] {
  return [u, ...FILL.filter((f) => f !== u)].slice(0, 5);
}
function arena(u: UnitId, rank = 1, extra: Parameters<typeof quiet>[2] = {}): Engine {
  const e = quiet(deckWith(u), {}, extra);
  debugNoRange(e); // compétences testées hors portée (voir tests/engine/range.test.ts)
  debugPlace(e, 0, 7, u, rank);
  return e;
}
/** Dégâts de base (rang 1, niveau 1) : les valeurs suivent l'équilibrage des portées. */
const D = (u: UnitId): number => UNITS[u].damage;
const BIG = 1e9;
const grid = (e: Engine) => e.state.players[0]!.grid;
const abilityNames = (ev: EngineEvent[]) => ofType(ev, 'ability').map((a) => a.name);

/** Tue tout ce qui est sur le chemin à chaque tick (pour enchaîner les vagues). */
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

describe('extension DC : données', () => {
  it('15 héros DC, pack DC, raretés réparties comme les autres packs (4 / 6 / 5)', () => {
    const dc = UNIT_LIST.filter((u) => u.pack === 'dc');
    expect(dc.map((u) => u.id).sort()).toEqual(DC_HEROES.slice().sort());
    const count = (r: string) => dc.filter((u) => u.rarity === r).length;
    expect([count('legendaire'), count('epique'), count('rare')]).toEqual([4, 6, 5]);
    expect(PACKS.dc).toMatchObject({ price1: 100, price10: 900, pityLegendary: 40, rates: PACKS.marvel.rates });
  });

  it('chaque héros DC a 6 talents (3 paliers × 2) et 5 passifs d’éveil', () => {
    for (const id of DC_HEROES) {
      const t = talentsFor(id);
      expect(t.map((x) => `${x.tier}${x.option}`)).toEqual(['1a', '1b', '2a', '2b', '3a', '3b']);
      expect(passivesFor(id).map((p) => p.star)).toEqual([2, 4, 6, 8, 10]);
    }
  });

  it('6 boss DC avec pouvoir, sbires, lieutenant et arène', () => {
    for (const id of DC_BOSSES) {
      const b = BOSSES[id];
      expect(b.arenaMapId).toBe(`arene-${id}`);
      expect(Object.keys(b.minion.params).length).toBeGreaterThan(0);
      expect(LIEUTENANTS[id].power.interval).toBe(10);
    }
    expect(ROTATING_BOSSES).toHaveLength(11);
    expect(ROTATING_BOSSES).not.toContain('darkseid');
    expect(BOSS_POOLS.dc).toEqual(['joker', 'luthor', 'bane', 'sinestro', 'blackadam']);
  });

  it('équipes DC et inter-univers', () => {
    const ids = (deck: UnitId[]) => activeTeams(deck).map((t) => t.id);
    expect(ids(['batman', 'superman', 'wonderwoman', 'flash', 'cmarvel'])).toEqual(['justiceleague', 'trinite']);
    expect(ids(['batman', 'robin', 'cmarvel', 'falcon', 'widow'])).toEqual(['batfamille']);
    expect(ids(['greenlantern', 'martian', 'supergirl', 'cmarvel', 'widow'])).toEqual(['cosmiques']);
    expect(ids(['ironman', 'batman', 'harley', 'catwoman', 'widow'])).toEqual(['sirenes', 'riches']);
    expect(ids(['hawkeye', 'greenarrow', 'cmarvel', 'falcon', 'widow'])).toEqual(['archers']);
  });
});

describe('extension DC : profils Rush Royale des 15 héros', () => {
  it('Batman (Bourreau) : exécute sous 20,5 % des PV, seuil réduit de moitié contre les boss', () => {
    const e = arena('batman');
    const t = debugSpawn(e, { hp: 1000 });
    t.hp = 300; // 300 − 200 = 100 < 205
    const ev = step(e, 20);
    expect(t.hp).toBe(0);
    expect(abilityNames(ev)).toContain('Justicier');
    const b = arena('batman');
    const boss = debugSpawn(b, { hp: BIG, bossId: 'cruella' });
    boss.x.powerIn = 1e9;
    boss.hp = boss.maxHp * 0.15;
    step(b, 20);
    expect(boss.hp).toBeGreaterThan(0);
    boss.hp = boss.maxHp * 0.09;
    step(b, 20);
    expect(boss.hp).toBe(0);
    // Le seuil monte avec le niveau (+1,5 point par niveau).
    const l1 = arena('batman');
    const y = debugSpawn(l1, { hp: 1000 });
    y.hp = 500; // 500 − 200 = 300 > 205
    step(l1, 1);
    expect(y.hp).toBeGreaterThan(0);
    const lv = arena('batman', 1, { levels: { batman: 5 } });
    const x = debugSpawn(lv, { hp: 1000 });
    x.hp = 500; // 500 − 200 × 1,4 = 220 < 265
    step(lv, 1);
    expect(x.hp).toBe(0);
  });

  it('Superman (Givre) : souffle glacial sur tout le chemin toutes les 6 s, 4 % par rang, cumulable 3 fois, boss compris', () => {
    const e = arena('superman', 2);
    const boss = debugSpawn(e, { hp: BIG * 10, distance: 20, bossId: 'cruella' });
    boss.x.powerIn = 1e9;
    const far = debugSpawn(e, { hp: BIG, distance: 1 });
    step(e, 20 * 6 + 1);
    expect(far.effects.slow).toBeCloseTo(0.08);
    expect(boss.effects.slow).toBeCloseTo(0.08);
    step(e, 20 * 6 * 3);
    expect(far.effects.slow).toBeCloseTo(0.24);
    expect(far.x.frostStacks).toBe(3);
  });

  it('Wonder Woman (Moine) : Fureur sans mana toutes les 12 s (cadence +60 %, éclaboussure), partagée par les Wonder Woman reliées', () => {
    const e = arena('wonderwoman');
    const twin = debugPlace(e, 0, 8, 'wonderwoman', 2);
    const t = debugSpawn(e, { hp: BIG, distance: 10 });
    const n = debugSpawn(e, { hp: BIG, distance: 10.3 });
    const ev = step(e, 20 * 12 + 1);
    expect(abilityNames(ev)).toContain('Fureur amazone');
    expect(grid(e)[7]!.counters.powerFor).toBeGreaterThan(4.5);
    expect(twin.counters.powerFor).toBeGreaterThan(4.5);
    const hits = ofType(step(e, 20), 'hit').filter((h) => h.enemy === n.uid || h.enemy === t.uid);
    expect(hits.some((h) => Math.abs(h.damage - D('wonderwoman') * 0.5) < 1e-6)).toBe(true);
  });

  it('Green Lantern (Cultiste) : une cible de plus par Lantern relié (3 au plus), dégâts doublés à 5 reliés', () => {
    const glHit = (slots: number[], at: number) => {
      const e = quiet(deckWith('greenlantern'));
      debugNoRange(e);
      for (const s of slots) { const u = debugPlace(e, 0, s, 'greenlantern', 1); u.cooldown = s === at ? 0 : 99; }
      for (let i = 0; i < 6; i++) debugSpawn(e, { hp: BIG, distance: 10 + i * 0.3 });
      const atk = ofType(step(e), 'attack').filter((a) => a.unit === 'greenlantern');
      const hits = ofType(step(e, 0), 'hit');
      void hits;
      return atk[0]!;
    };
    expect(glHit([0], 0).targets).toHaveLength(1);
    expect(glHit([0, 1], 0).targets).toHaveLength(2);
    expect(glHit([0, 1, 2, 3], 1).targets).toHaveLength(4);
    const e = quiet(deckWith('greenlantern'));
    debugNoRange(e);
    for (const s of [0, 1, 2, 3, 4]) { const u = debugPlace(e, 0, s, 'greenlantern', 1); u.cooldown = s === 2 ? 0 : 99; }
    debugSpawn(e, { hp: BIG });
    const hit = ofType(step(e), 'hit')[0]!;
    expect(hit.damage).toBeCloseTo(D('greenlantern') * 2);
    expect(formationLength(grid(e), 2)).toBe(5);
  });

  it('Flash (Cogneur) : rage quand le chemin est encombré (vitesse ×2, +50 % de dégâts, zone)', () => {
    const e = arena('flash');
    for (let i = 0; i < 11; i++) debugSpawn(e, { hp: BIG, distance: 10 + i * 0.2 });
    const ev = step(e, 20 * 30);
    expect(abilityNames(ev)).toContain('Rage');
    const calm = arena('flash');
    debugSpawn(calm, { hp: BIG });
    expect(abilityNames(step(calm, 20 * 30))).not.toContain('Rage');
    const f = grid(e)[7]!;
    f.counters.rageFor = 5;
    const hits = ofType(step(e, 20), 'hit');
    expect(hits.some((h) => Math.abs(h.damage - D('flash') * 1.5) < 1e-6)).toBe(true);
    expect(hits.some((h) => Math.abs(h.damage - D('flash') * 1.5 * 0.5) < 1e-6)).toBe(true);
  });

  it('Aquaman (Faucheuse) : chance d’engloutir la cible, jamais un boss', () => {
    const e = arena('aquaman', 7);
    for (let i = 0; i < 8; i++) debugSpawn(e, { hp: BIG, distance: 5 + i });
    const ev = step(e, 20 * 60);
    expect(abilityNames(ev).filter((x) => x === 'Kraken').length).toBeGreaterThan(3);
    const b = arena('aquaman', 7);
    const boss = debugSpawn(b, { hp: BIG, bossId: 'cruella' });
    boss.x.powerIn = 1e9;
    expect(abilityNames(step(b, 20 * 60))).not.toContain('Kraken');
  });

  it('Cyborg (Génie) : chaque fusion du plateau charge le Boom Tube (+5 % de vitesse et de dégâts par charge)', () => {
    const e = arena('cyborg');
    const cy = grid(e)[7]!;
    debugPlace(e, 0, 0, 'falcon', 1);
    debugPlace(e, 0, 1, 'falcon', 1);
    e.apply({ type: 'merge', player: 'p1', from: 0, to: 1 });
    step(e);
    expect(cy.counters.vortex).toBe(1);
    cy.counters.vortex = 10;
    debugSpawn(e, { hp: BIG });
    const hit = ofType(step(e, 20), 'hit').find((h) => h.damage > 0)!;
    expect(hit.damage).toBeCloseTo(D('cyborg') * 1.5);
    expect(UNITS.cyborg.ability.params.auraAttackSpeed).toBeCloseTo(0.15);
  });

  it('Supergirl (Barde) : croissance avec le temps et les éliminations ; toutes les 20 s, +20 % de vitesse pendant 10 s', () => {
    const e = arena('supergirl');
    const sg = grid(e)[7]!;
    debugSpawn(e, { hp: 1, distance: 5 });
    step(e, 1);
    expect(sg.counters.growth).toBeCloseTo(0.03 + 0.004 * 0.05);
    const ev = step(e, 20 * 20);
    expect(abilityNames(ev)).toContain('Éruption solaire');
    expect(sg.counters.haste).toBeCloseTo(0.2);
    expect(sg.counters.hasteFor).toBeGreaterThan(9);
  });

  it('Shazam (Météore) : la foudre tombe toutes les 8 s (−0,6 s par rang) : 300 % en zone, étourdit 1 s sauf les boss', () => {
    const e = arena('shazam');
    const a = debugSpawn(e, { hp: BIG, distance: 10 });
    const ev = step(e, 20 * 8 + 1);
    const ab = ofType(ev, 'ability').find((x) => x.name === 'SHAZAM !')!;
    expect(ab.targets).toContain(a.uid);
    expect(ofType(ev, 'hit').some((h) => Math.abs(h.damage - D('shazam') * 3) < 1e-6)).toBe(true);
    expect(a.effects.stunFor).toBeGreaterThan(0.5);
    const r7 = arena('shazam', 7);
    debugSpawn(r7, { hp: BIG });
    expect(abilityNames(step(r7, 20 * 5))).toContain('SHAZAM !'); // 8 − 0,6 × 6 = 4,4 s
  });

  it('Martian Manhunter (Mime) : intangible face aux pouvoirs de boss', () => {
    const b = arena('martian');
    debugSpawn(b, { hp: BIG, distance: 1, bossId: 'galactus' });
    const pw = ofType(step(b, 1), 'bossPower')[0]!;
    expect(pw.slots).toEqual([]);
    expect(grid(b)[7]!.unit).toBe('martian');
  });

  it('Batgirl (Bombardier) : chaque coup explose à 60 % autour de la cible', () => {
    const e = arena('batgirl');
    const t = debugSpawn(e, { hp: BIG, distance: 10 });
    const n = debugSpawn(e, { hp: BIG, distance: 10.4 });
    const hits = ofType(step(e, 20), 'hit');
    // Ciblage « premier » : l'ennemi le plus avancé (n) prend le coup, t l'explosion.
    expect(hits.find((h) => h.enemy === n.uid)!.damage).toBeCloseTo(D('batgirl'));
    expect(hits.find((h) => h.enemy === t.uid)!.damage).toBeCloseTo(D('batgirl') * 0.6);
  });

  it('Green Arrow (Mage de glace) : chaque flèche ralentit de 6 % de plus, 30 % au plus', () => {
    const e = arena('greenarrow');
    const t = debugSpawn(e, { hp: BIG });
    step(e, 1);
    expect(t.effects.slow).toBeCloseTo(0.06);
    step(e, 20 * 10);
    expect(t.effects.slow).toBeCloseTo(0.3);
  });
});

describe('extension DC : archétypes de stratégie (docs/roadmap.md)', () => {
  it('Harley Quinn (Clown) — Sacrifice → mana : fusionnée, elle rapporte le barème standard', () => {
    for (const rank of [1, 3, 5]) {
      const e = arena('harley', rank);
      debugPlace(e, 0, 8, 'harley', rank);
      const before = e.state.players[0]!.mana;
      e.apply({ type: 'merge', player: 'p1', from: 7, to: 8 });
      step(e);
      expect(e.state.players[0]!.mana - before).toBe(SACRIFICE_MANA[rank - 1]);
    }
  });

  it('Martian Manhunter (Mime) — Copieur : prend la forme d’une alliée de même rang à −25 %', () => {
    const e = arena('martian', 2);
    const m = grid(e)[7]!;
    const model = debugPlace(e, 0, 8, 'cmarvel', 2);
    expect(dropAction(m, model)).toBe('copy');
    e.apply({ type: 'copy', player: 'p1', from: 7, to: 8 });
    step(e);
    expect(m.unit).toBe('cmarvel');
    expect(m.status).toMatchObject({ copyMul: 0.75, copyOf: 'martian' });
  });

  it('Robin (Ferrailleur) — Booster de fusion : l’alliée gagne 1 rang, parfois 2 (talent : +25 de mana)', () => {
    let doubles = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const e = quiet(deckWith('robin'), { seed }, { levels: { robin: 5 }, talents: { robin: ['a'] } });
      debugNoRange(e);
      debugPlace(e, 0, 7, 'robin', 3);
      const ally = debugPlace(e, 0, 8, 'batgirl', 3);
      expect(dropAction(grid(e)[7], ally)).toBe('promote');
      const before = e.state.players[0]!.mana;
      e.apply({ type: 'promote', player: 'p1', from: 7, to: 8 });
      const ev = step(e);
      expect(grid(e)[7]).toBeNull();
      expect([4, 5]).toContain(ally.rank);
      if (ally.rank === 5) doubles++;
      expect(ofType(ev, 'mana')).toEqual([expect.objectContaining({ amount: 25, reason: 'promotion' })]);
      expect(e.state.players[0]!.mana - before).toBe(25);
    }
    // 20 % + 4 × 2,5 % = 30 % au niveau 5.
    expect(doubles).toBeGreaterThan(4);
    expect(doubles).toBeLessThan(22);
  });

  it('Supergirl (Barde) — Croissance : grandit avec le temps, garde la moitié de son bonus en fusion', () => {
    const e = arena('supergirl');
    const sg = grid(e)[7]!;
    step(e, 20 * 10);
    expect(sg.counters.growth).toBeCloseTo(0.04, 3);
    sg.counters.growth = 16;
    debugPlace(e, 0, 8, 'supergirl', 1);
    e.apply({ type: 'merge', player: 'p1', from: 7, to: 8 });
    step(e);
    const merged = grid(e)[8]!;
    const bonus = growthBonus(UNITS[merged.unit].ability.params, merged.counters.growth ?? 0);
    expect(bonus).toBeCloseTo(0.28 * Math.pow(16, 0.75) * 0.5, 2);
  });

  it('Catwoman (Démonologue) — Mana par élimination : barème KILL_MANA × 2 selon son rang', () => {
    const e = arena('catwoman', 4);
    const t = debugSpawn(e, { hp: BIG });
    step(e, 20);
    expect(t.x.manaTag).toBe(KILL_MANA[3] * 2);
    const k = arena('catwoman', 2);
    const v = debugSpawn(k, { hp: BIG });
    step(k, 20);
    v.hp = 1;
    const kill = ofType(step(k, 20), 'kill')[0]!;
    expect(kill.mana).toBe(ENEMIES[v.kind].mana * 10 + KILL_MANA[1] * 2);
  });

  it('Cyborg (Génie) — Boost de vitesse : clé générique auraAttackSpeed', () => {
    const shots = (slot: number) => {
      const x = arena('cyborg');
      grid(x)[7]!.cooldown = 1e9;
      debugPlace(x, 0, slot, 'falcon');
      debugSpawn(x, { hp: BIG });
      return ofType(step(x, 20 * 40), 'attack').filter((a) => a.unit === 'falcon').length;
    };
    const r = shots(8) / shots(0);
    expect(r).toBeGreaterThan(1.1);
    expect(r).toBeLessThan(1.2);
  });

  it('Flash (Cogneur) — Échangeur : échange sa case avec une alliée de même rang, bonus aux nouvelles voisines', () => {
    const e = arena('flash', 2);
    const f = grid(e)[7]!;
    const ally = debugPlace(e, 0, 0, 'cmarvel', 2);
    const nb = debugPlace(e, 0, 1, 'falcon', 1);
    expect(dropAction(f, ally)).toBe('swap');
    e.apply({ type: 'swap', player: 'p1', from: 7, to: 0 });
    step(e);
    expect(grid(e)[0]!.uid).toBe(f.uid);
    expect(grid(e)[7]!.uid).toBe(ally.uid);
    expect(nb.counters.boost).toBeCloseTo(0.2);
    expect(nb.counters.boostFor).toBeGreaterThan(4.9);
  });
});

describe('extension DC : talents et passifs d’éveil lus par le moteur', () => {
  it('Superman, talent « Hiver éternel » : le souffle se cumule 5 fois', () => {
    const e = arena('superman', 1, { levels: { superman: 9 }, talents: { superman: ['a', 'a', 'a'] } });
    const t = debugSpawn(e, { hp: BIG });
    step(e, 20 * 6 * 5 + 1);
    expect(t.x.frostStacks).toBe(5);
  });

  it('Batman ★10 : seuil d’exécution +7 points (★4 et ★10)', () => {
    const base = UNITS.batman.ability.params;
    expect(resolveUnitParams('batman', base, 1, undefined, 10).executeThreshold).toBeCloseTo(0.205 + 0.07);
  });
});

describe('extension DC : pouvoirs des boss', () => {
  function withBoss(boss: BossId, units: [number, UnitId, number][]): { e: Engine; ev: EngineEvent[] } {
    const e = quiet(['cmarvel', 'falcon', 'hawkeye', 'widow', 'coco']);
    for (const [slot, u, r] of units) debugPlace(e, 0, slot, u, r);
    debugSpawn(e, { hp: 1e12, bossId: boss, distance: 1 });
    return { e, ev: step(e, 1) };
  }

  it('Joker : Rire du Joker, échange les rangs de 2 unités', () => {
    const { e, ev } = withBoss('joker', [[3, 'cmarvel', 5], [4, 'falcon', 1]]);
    expect(ofType(ev, 'bossPower')[0]).toMatchObject({ boss: 'joker', name: 'Rire du Joker' });
    expect(grid(e)[3]!.rank).toBe(1);
    expect(grid(e)[4]!.rank).toBe(5);
  });

  it('Lex Luthor : Rayon de kryptonite (−50 % de dégâts 6 s sur l’unité de plus haut rang), armure de guerre', () => {
    const { e, ev } = withBoss('luthor', [[0, 'cmarvel', 5], [1, 'falcon', 2]]);
    expect(ofType(ev, 'bossPower')[0]).toMatchObject({ name: 'Rayon de kryptonite', slots: [0] });
    const u = grid(e)[0]!;
    expect(u.counters.weaken).toBeCloseTo(0.5);
    expect(u.counters.weakenFor).toBeGreaterThan(5.9);
    u.cooldown = 0;
    const after = step(e, 1);
    const idx = after.findIndex((a) => a.type === 'attack' && a.slot === 0);
    expect((after[idx + 1] as { damage: number }).damage).toBeCloseTo(D('cmarvel') * (1 + 4 * RANK_DAMAGE) * 0.5);
    const real = createEngine({ mode: 'solo', seed: 2, mapId: 'x', players: [setup()], script: { bossAtWave: 1, bossId: 'luthor' } });
    expect(simState(real).enemies.find((x) => x.bossId)!.armor).toBeCloseTo(0.3);
  });

  it('Bane : Brise-échine (−2 rangs à la meilleure unité), Venin une fois à 50 % de PV', () => {
    const { e, ev } = withBoss('bane', [[0, 'cmarvel', 6], [1, 'falcon', 3]]);
    expect(ofType(ev, 'bossPower')[0]).toMatchObject({ name: 'Brise-échine', slots: [0] });
    expect(grid(e)[0]!.rank).toBe(4);
    const boss = simState(e).enemies.find((x) => x.bossId === 'bane')!;
    boss.x.powerIn = 1e9;
    boss.speed = 1;
    boss.hp = boss.maxHp * 0.4;
    const v = ofType(step(e, 1), 'bossPower');
    expect(v).toEqual([expect.objectContaining({ name: VENOM_NAME, slots: [] })]);
    expect(boss.hp / boss.maxHp).toBeCloseTo(0.55);
    expect(boss.speed).toBeCloseTo(1.3);
    boss.hp = boss.maxHp * 0.3;
    expect(ofType(step(e, 20), 'bossPower')).toHaveLength(0);
  });

  it('Sinestro : Cage de la peur, une colonne entière emprisonnée 3 s', () => {
    const { e, ev } = withBoss('sinestro', [[0, 'cmarvel', 1], [5, 'falcon', 1], [10, 'widow', 1]]);
    expect(ofType(ev, 'bossPower')[0]).toMatchObject({ name: 'Cage de la peur', slots: [0, 5, 10] });
    for (const s of [0, 5, 10]) expect(grid(e)[s]!.status.stunnedFor).toBeCloseTo(3);
  });

  it('Black Adam : Foudre de Kahndaq, 3 s sur une unité et 1,5 s sur ses voisines', () => {
    const { e, ev } = withBoss('blackadam', [[6, 'cmarvel', 1], [7, 'falcon', 1], [8, 'widow', 1]]);
    const p = ofType(ev, 'bossPower')[0]!;
    expect(p.name).toBe('Foudre de Kahndaq');
    const [main, ...side] = p.slots;
    expect(grid(e)[main!]!.status.stunnedFor).toBeCloseTo(3);
    expect(side.length).toBeGreaterThanOrEqual(1);
    for (const s of side) {
      expect(Math.abs(s - main!)).toBe(1);
      expect(grid(e)[s]!.status.stunnedFor).toBeCloseTo(1.5);
    }
  });

  it('Darkseid : Rayons Oméga puis Boom Tube, en alternance toutes les 8 s', () => {
    const { e, ev } = withBoss('darkseid', [[0, 'cmarvel', 3], [1, 'falcon', 3], [2, 'widow', 3]]);
    const omega = ofType(ev, 'bossPower')[0]!;
    expect(omega.name).toBe(OMEGA_NAME);
    expect(omega.slots).toHaveLength(2);
    for (const s of omega.slots) {
      expect(grid(e)[s]!.rank).toBe(2);
      expect(grid(e)[s]!.status.stunnedFor).toBeCloseTo(2);
    }
    const next = step(e, 20 * 8);
    expect(ofType(next, 'bossPower')[0]!.name).toBe(BOOM_TUBE_NAME);
    const spawns = ofType(next, 'enemySpawn');
    expect(spawns).toHaveLength(4);
    for (const s of spawns) {
      const m = simState(e).enemies.find((x) => x.uid === s.enemy)!;
      expect(m).toMatchObject({ kind: 'sbire', minionOf: 'darkseid' });
      expect(m.x.flying).toBe(1);
    }
  });

  it('Darkseid : Équation d’Anti-Vie une fois à 30 % (annonce, puis 1 s après : −1 rang ×3 et plateau hypnotisé)', () => {
    const e = quiet(['cmarvel', 'falcon', 'hawkeye', 'widow', 'coco']);
    for (const [s, r] of [[0, 7], [1, 5], [2, 4], [3, 1]] as const) debugPlace(e, 0, s, 'cmarvel', r);
    const boss = debugSpawn(e, { hp: 1e6, bossId: 'darkseid', distance: 1 });
    boss.x.powerIn = 1e9;
    boss.hp = 2.9e5;
    expect(ofType(step(e, 1), 'bossPower')).toEqual([expect.objectContaining({ name: ANTI_LIFE_NAME, slots: [] })]);
    const later = ofType(step(e, 20), 'bossPower');
    expect(later).toHaveLength(1);
    expect(later[0]!.slots.sort()).toEqual([0, 1, 2, 3]);
    expect(grid(e).slice(0, 4).map((u) => u!.rank)).toEqual([6, 4, 3, 1]);
    for (let s = 0; s < 4; s++) expect(grid(e)[s]!.status.hypnotizedFor).toBeGreaterThan(1.5);
    boss.hp = 1e5;
    expect(ofType(step(e, 40), 'bossPower').filter((x) => x.name === ANTI_LIFE_NAME)).toHaveLength(0);
  });

  it.each(DC_BOSSES)('lieutenant de %s : version affaiblie du pouvoir toutes les 10 s', (id) => {
    const e = quiet(['cmarvel', 'falcon', 'hawkeye', 'widow', 'coco']);
    for (const [s, r] of [[0, 5], [5, 3], [10, 4], [1, 4]] as const) debugPlace(e, 0, s, 'cmarvel', r);
    debugSpawn(e, { hp: 1e12, lieutenantOf: id, distance: 1 });
    const ev = step(e, 20 * 10 + 1);
    const pw = ofType(ev, 'bossPower');
    expect(pw).toHaveLength(2);
    expect(pw[0]!.boss).toBe(id);
  });

  it('les sbires DC suivent leurs paramètres (clowns à ballons, Parademons volants)', () => {
    const e = createEngine({ mode: 'solo', seed: 4, mapId: 'x', players: [setup()], bossRhythm: { small: 0, big: 3, thanos: 0 }, bossPool: 'dc', script: { bossOrder: ['joker'] } });
    reachWave(e, 1);
    // Vagues 1 et 2 : sbires du Joker (le gros boss de la vague 3).
    let clowns = 0;
    for (let i = 0; i < 20 * 30; i++) {
      e.tick();
      for (const x of ofType(e.drainEvents(), 'enemySpawn')) {
        const m = simState(e).enemies.find((y) => y.uid === x.enemy)!;
        if (m.minionOf === 'joker') { clowns++; expect(m.shieldHits).toBe(2); }
      }
      for (const en of simState(e).enemies) en.speed = 0;
    }
    expect(clowns).toBeGreaterThanOrEqual(3);
  });
});

describe('extension DC : rotation, Darkseid et paliers des modes infinis', () => {
  const inf: GameConfig = { mode: 'solo', seed: 1, mapId: 'x', players: [setup()] };

  it('boss final : Thanos à 50 et 150, Darkseid à 100 et 200 ; selon l’option de rotation', () => {
    expect([50, 100, 150, 200, 60].map((w) => finalBossAt(inf, w))).toEqual(['thanos', 'darkseid', 'thanos', 'darkseid', null]);
    expect([50, 100].map((w) => finalBossAt({ ...inf, bossPool: 'marvel-disney' }, w))).toEqual(['thanos', 'thanos']);
    expect([50, 100].map((w) => finalBossAt({ ...inf, bossPool: 'dc' }, w))).toEqual(['darkseid', 'darkseid']);
    expect(finalBossAt({ ...inf, targetWaves: 120 }, 100)).toBeNull();
  });

  it('rotation « Tous les univers » : les 11 gros boss passent avant toute répétition', () => {
    const e = createEngine({ ...inf, seed: 3, bossRhythm: { small: 0, big: 1, thanos: 0, darkseid: 0 } });
    const ids = ofType(reachWave(e, 24), 'bossSpawn').map((b) => b.boss);
    expect(new Set(ids.slice(0, 11)).size).toBe(11);
    expect(new Set(ids.slice(11, 22)).size).toBe(11);
    for (const id of ids) expect(ROTATING_BOSSES).toContain(id);
  });

  it('rotation « DC seul » : seulement les 5 boss DC', () => {
    const e = createEngine({ ...inf, seed: 8, bossPool: 'dc', bossRhythm: { small: 0, big: 1, thanos: 0, darkseid: 0 } });
    const ids = ofType(reachWave(e, 12), 'bossSpawn').map((b) => b.boss);
    expect(new Set(ids)).toEqual(new Set(BOSS_POOLS.dc));
  });

  it('Darkseid arrive à sa vague (PV ×2), annoncé par son lieutenant, Thanos garde la sienne', () => {
    const e = createEngine({ ...inf, seed: 6, bossRhythm: { small: 5, big: 10, thanos: 20, darkseid: 40 } });
    const ev = reachWave(e, 41);
    const big = ofType(ev, 'bossSpawn').map((b) => b.boss);
    expect(big[1]).toBe('thanos');
    expect(big[3]).toBe('darkseid');
    expect(ofType(ev, 'miniBossSpawn').map((m) => m.boss)).toContain('darkseid');
    const camp = createEngine({ ...inf, seed: 6, targetWaves: 41, bossRhythm: { small: 0, big: 10, thanos: 20, darkseid: 40 } });
    expect(ofType(reachWave(camp, 41), 'bossSpawn').map((b) => b.boss)).not.toContain('darkseid');
    const d = createEngine({ ...inf, script: { bossAtWave: 1, bossId: 'darkseid' } });
    expect(simState(d).enemies.find((x) => x.bossId)!.maxHp).toBeCloseTo(waveHp(1) * 25 * 2);
  });

  it('rythme par défaut : Thanos à 50, Darkseid à 100, paliers jusqu’à 100 (dont le coffre cosmique à 75)', () => {
    const e = createEngine({ ...inf, seed: 9 });
    const ev = reachWave(e, 101);
    const big = ofType(ev, 'bossSpawn');
    expect(big.find((b) => b.boss === 'thanos')).toBeDefined();
    expect(big[4]!.boss).toBe('thanos');
    // Après la vague 60 (alternance Rush Royale), gros boss aux vagues paires : Darkseid est le dernier, à la 100.
    expect(big[big.length - 1]!.boss).toBe('darkseid');
    expect(big.filter((b) => b.boss === 'darkseid')).toHaveLength(1);
    const ms = ofType(ev, 'milestone');
    expect(ms.map((m) => m.wave)).toEqual([10, 20, 30, 40, 50, 60, 70, 75, 80, 90, 100]);
    expect(ms.find((m) => m.wave === 75)!.chest).toBe('cosmique');
    expect(ms.find((m) => m.wave === 100)!.chest).toBe('cosmique');
    expect(INFINITE_MILESTONES.map((m) => m.wave)).toEqual([10, 20, 30, 40, 50, 75, 100]);
  });
});

describe('extension DC : équipes', () => {
  it('Trinité : +30 % de dégâts contre les boss', () => {
    const e = quiet(['batman', 'superman', 'wonderwoman', 'cmarvel', 'falcon']);
    debugNoRange(e);
    debugPlace(e, 0, 7, 'batman');
    const boss = debugSpawn(e, { hp: BIG, bossId: 'cruella', distance: 20 });
    boss.x.powerIn = 1e9;
    expect(ofType(step(e, 1), 'hit')[0]!.damage).toBeCloseTo(D('batman') * 1.3);
  });

  it('Les Riches : +20 de mana par vague', () => {
    const rich = createEngine({ ...{ mode: 'solo' as const, seed: 1, mapId: 'x' }, players: [setup(['ironman', 'batman', 'cmarvel', 'falcon', 'widow'])] });
    const poor = createEngine({ ...{ mode: 'solo' as const, seed: 1, mapId: 'x' }, players: [setup(['ironman', 'cmarvel', 'falcon', 'widow', 'nemo'])] });
    expect(rich.state.players[0]!.mana - poor.state.players[0]!.mana).toBe(20);
  });

  it('Les Archers : +15 % de vitesse d’attaque', () => {
    const count = (deck: UnitId[]) => {
      const x = quiet(deck);
      debugPlace(x, 0, 7, 'greenarrow');
      debugSpawn(x, { hp: 1e12 });
      return ofType(step(x, 20 * 60), 'attack').filter((a) => a.unit === 'greenarrow').length;
    };
    const r = count(['greenarrow', 'hawkeye', 'cmarvel', 'falcon', 'widow']) / count(['greenarrow', 'cmarvel', 'falcon', 'widow', 'nemo']);
    expect(r).toBeGreaterThan(1.1);
    expect(r).toBeLessThan(1.2);
  });
});

describe('extension DC : déterminisme et sauvegarde', () => {
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
  const duo: GameConfig = {
    mode: 'coop', seed: 77, mapId: 'x', bossPool: 'dc', bossRhythm: { small: 2, big: 3, thanos: 0, darkseid: 6 },
    players: [
      setup(['batman', 'superman', 'greenlantern', 'harley', 'shazam'], { levels: { batman: 9 }, talents: { batman: ['a', 'b', 'a'] }, awakening: { greenlantern: 10 } }),
      setup(['flash', 'catwoman', 'supergirl', 'martian', 'cyborg'], { awakening: { harley: 4 } }, 'p2'),
    ],
  };
  const soloDc: GameConfig = { mode: 'solo', seed: 31, mapId: 'x', players: [setup(['wonderwoman', 'aquaman', 'robin', 'batgirl', 'greenarrow'])] };

  it('même graine ⇒ même partie ; sauvegarde puis reprise ⇒ même avenir', () => {
    expect(run(duo, 4000)).toBe(run(duo, 4000));
    expect(run(duo, 4000, 2222)).toBe(run(duo, 4000));
    expect(run(soloDc, 3000, 1500)).toBe(run(soloDc, 3000));
    expect(UNITS.batman.pack).toBe('dc');
  });
});

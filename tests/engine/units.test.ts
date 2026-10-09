import { describe, expect, it } from 'vitest';
import { debugNoRange, debugPlace, debugSpawn, simState } from '../../src/engine/debug';
import type { UnitId } from '../../src/data/types';
import { UNITS, UNIT_LIST } from '../../src/data/units';
import type { Engine } from '../../src/engine/types';
import { ofType, quiet, step } from './helpers';

const FILL: UnitId[] = ['cmarvel', 'falcon', 'hawkeye', 'widow', 'merida', 'nemo'];
function deckWith(u: UnitId): UnitId[] {
  return [u, ...FILL.filter((f) => f !== u)].slice(0, 5);
}
function arena(u: UnitId, rank = 1, deck = deckWith(u)): Engine {
  const e = quiet(deck);
  debugNoRange(e); // compétences testées hors portée (voir tests/engine/range.test.ts)
  debugPlace(e, 0, 7, u, rank);
  return e;
}
const BIG = 1e9;
/** Dégâts de base (rang 1, niveau 1) : les valeurs suivent l'équilibrage des portées. */
const D = (u: UnitId): number => UNITS[u].damage;

describe('compétences des 28 unités', () => {
  it('les 28 unités ont des données complètes', () => {
    expect(UNIT_LIST).toHaveLength(28);
    for (const u of UNIT_LIST) {
      expect(u.damage).toBeGreaterThan(0);
      expect(u.attackInterval).toBeGreaterThan(0);
      expect(Object.keys(u.ability.params).length).toBeGreaterThan(0);
    }
  });

  it('Iron Man : Uni-Beam toutes les 10 s, 200 % sur une ligne du chemin', () => {
    const e = arena('ironman');
    const line = [25, 26, 27].map((d) => debugSpawn(e, { hp: BIG, distance: d }));
    const far = debugSpawn(e, { hp: BIG, distance: 5 });
    const ev = step(e, 200);
    const beam = ofType(ev, 'ability').find((a) => a.name === 'Uni-Beam')!;
    expect(beam.targets.sort()).toEqual(line.map((x) => x.uid).sort());
    expect(beam.targets).not.toContain(far.uid);
    expect(ofType(ev, 'attack').some((a) => a.fx === 'ironman:unibeam')).toBe(true);
    expect(ofType(ev, 'hit').some((h) => h.enemy === line[0]!.uid && Math.abs(h.damage - D('ironman') * 2) < 1e-6)).toBe(true);
  });

  it('Spider-Man : ralentit de 10 % par coup, immobilise 1 s à 3 cumuls', () => {
    const e = arena('spiderman');
    const t = debugSpawn(e, { hp: BIG });
    step(e, 1);
    expect(t.effects.slow).toBeCloseTo(0.1);
    step(e, 10);
    expect(t.effects.slow).toBeCloseTo(0.2);
    const ev = step(e, 10);
    expect(ofType(ev, 'ability')[0]!.name).toBe('Toile collante');
    expect(t.effects.stunFor).toBeGreaterThan(0.5);
  });

  it('Hulk : éclaboussure 40 %, Rage, Smash tous les 8 coups', () => {
    const e = arena('hulk');
    const t = debugSpawn(e, { hp: BIG, distance: 15 });
    const n = debugSpawn(e, { hp: BIG, distance: 14 });
    const ev = step(e, 1);
    const hits = ofType(ev, 'hit');
    expect(hits.find((h) => h.enemy === t.uid)!.damage).toBeCloseTo(D('hulk'));
    expect(hits.find((h) => h.enemy === n.uid)!.damage).toBeCloseTo(D('hulk') * 0.4);
    const later = step(e, 20 * 13);
    expect(ofType(later, 'ability').some((a) => a.name === 'Hulk Smash')).toBe(true);
    const dmg = ofType(later, 'hit').filter((h) => h.enemy === t.uid).map((h) => h.damage);
    expect(dmg[0]).toBeCloseTo(D('hulk') * 1.05); // +5 % de Rage au 2e coup
    expect(dmg[1]).toBeCloseTo(D('hulk') * 1.1);
  });

  it('Thor : chaîne sur 3 ennemis (−20 % par rebond), 5 au rang 5', () => {
    const e = arena('thor');
    for (let i = 0; i < 6; i++) debugSpawn(e, { hp: BIG, distance: i });
    const dmg = ofType(step(e, 1), 'hit').map((h) => h.damage);
    expect(dmg).toHaveLength(3);
    expect(dmg[0]).toBeCloseTo(D('thor'));
    expect(dmg[1]).toBeCloseTo(D('thor') * 0.8);
    expect(dmg[2]).toBeCloseTo(D('thor') * 0.6);
    const e5 = arena('thor', 5);
    for (let i = 0; i < 6; i++) debugSpawn(e5, { hp: BIG, distance: i });
    expect(ofType(step(e5, 1), 'hit')).toHaveLength(5);
  });

  it('Doctor Strange : Portail toutes les 12 s, renvoie l’ennemi de tête (sauf boss)', () => {
    const e = arena('strange');
    const boss = debugSpawn(e, { hp: BIG, distance: 25, bossId: 'cruella' });
    const t = debugSpawn(e, { hp: BIG, distance: 20 });
    simState(e).enemies.forEach((x) => (x.x.powerIn = 1e9));
    const ev = step(e, 240);
    expect(ofType(ev, 'ability').find((a) => a.name === 'Portail')!.targets).toEqual([t.uid]);
    expect(t.distance).toBe(0);
    expect(boss.distance).toBe(25);
  });

  it('Venom : exécute sous 15 % de PV, croissance par élimination', () => {
    const e = arena('venom');
    const t = debugSpawn(e, { hp: D('venom') * 1.1 });
    const ev = step(e, 1);
    expect(ofType(ev, 'ability')[0]!.name).toBe('Dévorer');
    expect(ofType(ev, 'kill')[0]!.enemy).toBe(t.uid);
    debugSpawn(e, { hp: BIG });
    const next = ofType(step(e, 20), 'hit')[0]!;
    // Points : 0,02 (élimination) + 0,005 par seconde (≈ 1,05 s) ; bonus = 0,28 × points^0,75.
    expect(next.damage).toBeCloseTo(D('venom') * (1 + 0.28 * Math.pow(0.02 + 0.005 * 1.05, 0.75)), 0);
  });

  it('Captain Marvel : mode binaire après 10 attaques, dégâts ×2 pendant 5 s', () => {
    const e = arena('cmarvel');
    debugSpawn(e, { hp: BIG });
    const ev = step(e, 20 * 9);
    expect(ofType(ev, 'ability').some((a) => a.name === 'Mode binaire')).toBe(true);
    const hits = ofType(step(e, 20), 'hit');
    expect(hits[0]!.damage).toBeCloseTo(D('cmarvel') * 2);
  });

  it('Captain America : rebondit sur 3 ennemis, +15 % de vitesse aux voisines', () => {
    const e = arena('cap');
    for (let i = 0; i < 4; i++) debugSpawn(e, { hp: BIG, distance: i });
    expect(ofType(step(e, 1), 'hit')).toHaveLength(3);
    const count = (withCap: boolean) => {
      const x = quiet(deckWith('cap'));
      debugPlace(x, 0, 0, 'cmarvel');
      if (withCap) debugPlace(x, 0, 1, 'cap');
      debugSpawn(x, { hp: 1e12 });
      return ofType(step(x, 20 * 60), 'attack').filter((a) => a.unit === 'cmarvel').length;
    };
    const r = count(true) / count(false);
    expect(r).toBeGreaterThan(1.08);
    expect(r).toBeLessThan(1.2);
  });

  it('Loki : ne se transforme plus seul (copieur, voir archetypes.test.ts), peut faire reculer l’ennemi', () => {
    const e = arena('loki');
    const t = debugSpawn(e, { hp: BIG, distance: 10 });
    const loki = e.state.players[0]!.grid[7]!;
    const ev = step(e, 20 * 60);
    expect(loki.unit).toBe('loki');
    expect(loki.status.transformedInto).toBeUndefined();
    expect(ofType(ev, 'ability').some((a) => a.name === 'Illusion' && a.targets.includes(t.uid))).toBe(true);
  });

  it('Soldat de l’hiver : une attaque sur 4 critique ×3 et étourdit 0,5 s', () => {
    const e = arena('bucky');
    const t = debugSpawn(e, { hp: BIG });
    const hits = ofType(step(e, 20 * 4), 'hit');
    expect(hits[3]).toMatchObject({ crit: true });
    expect(hits[3]!.damage).toBeCloseTo(D('bucky') * 3);
    expect(t.effects.stunFor).toBeGreaterThan(0);
  });

  it('Œil de faucon : flèches explosive, glace puis électrique', () => {
    const e = arena('hawkeye');
    const t = debugSpawn(e, { hp: BIG, distance: 10 });
    debugSpawn(e, { hp: BIG, distance: 9.5 });
    const ev = step(e, 30);
    expect(ofType(ev, 'attack').slice(0, 3).map((a) => a.fx)).toEqual(['hawkeye:explosive', 'hawkeye:glace', 'hawkeye:electrique']);
    expect(t.effects.slow).toBeCloseTo(0.25);
    expect(ofType(ev, 'attack')[2]!.targets).toHaveLength(2);
  });

  it('Falcon : Redwing marque le plus fort (+25 % de dégâts subis)', () => {
    const e = arena('falcon');
    const strong = debugSpawn(e, { hp: BIG });
    debugSpawn(e, { hp: 1000, distance: 5 });
    const ev = step(e, 20 * 6);
    expect(ofType(ev, 'ability').find((a) => a.name === 'Drone Redwing')!.targets).toEqual([strong.uid]);
    expect(strong.effects.marked).toBeCloseTo(0.25);
    e.state.players[0]!.grid[7]!.cooldown = 0;
    expect(ofType(step(e, 1), 'hit')[0]!.damage).toBeCloseTo(D('falcon') * 1.25);
  });

  it('Black Widow : plus de bonus contre les boss, un coup sur 5 paralyse 1 s', () => {
    const e = arena('widow');
    const boss = debugSpawn(e, { hp: BIG, bossId: 'ursula', distance: 20 });
    boss.x.powerIn = 1e9;
    expect(ofType(step(e, 1), 'hit')[0]!.damage).toBeCloseTo(D('widow'));
    const x = arena('widow');
    const t = debugSpawn(x, { hp: BIG });
    const ev = step(x, 20 * 2 + 1);
    expect(ofType(ev, 'ability')[0]!.name).toBe('Morsure de la veuve');
    expect(t.effects.stunFor).toBeGreaterThan(0);
  });

  it('Shang-Chi : tous les 10 coups, 10 anneaux sur 10 ennemis', () => {
    const e = arena('shangchi');
    for (let i = 0; i < 12; i++) debugSpawn(e, { hp: BIG, distance: i });
    const ev = step(e, 20 * 4);
    const rings = ofType(ev, 'ability').find((a) => a.name === 'Dix Anneaux')!;
    expect(new Set(rings.targets).size).toBe(10);
  });

  it('Vaïana : la vague repousse de 1,5 case les ennemis de tête (sauf boss)', () => {
    const e = arena('moana');
    const lead = [20, 19, 18].map((d) => debugSpawn(e, { hp: BIG, distance: d }));
    const fourth = debugSpawn(e, { hp: BIG, distance: 5 });
    step(e, 200);
    expect(lead.map((x) => x.distance)).toEqual([18.5, 17.5, 16.5]);
    expect(fourth.distance).toBe(5);
  });

  it('Maui : faucon (cadence ×2, dégâts ×0,5) puis requin (×2,5 avec éclaboussure)', () => {
    const e = arena('maui');
    const t = debugSpawn(e, { hp: BIG, distance: 10 });
    debugSpawn(e, { hp: BIG, distance: 9 });
    const first = ofType(step(e, 1), 'attack')[0]!;
    expect(first.fx).toBe('maui:faucon');
    const ev = step(e, 20 * 9);
    expect(ofType(ev, 'ability').some((a) => a.name.includes('requin'))).toBe(true);
    const shark = ofType(ev, 'attack').find((a) => a.fx === 'maui:requin')!;
    expect(shark.targets).toHaveLength(2);
    expect(ofType(ev, 'hit').some((h) => h.enemy === t.uid && Math.abs(h.damage - D('maui') * 2.5) < 1e-6)).toBe(true);
  });

  it('Pocahontas : +vitesse aux voisines, Meeko donne parfois +5 de mana', () => {
    const count = (withP: boolean) => {
      const x = quiet(deckWith('pocahontas'));
      debugPlace(x, 0, 0, 'cmarvel');
      if (withP) debugPlace(x, 0, 5, 'pocahontas', 3);
      debugSpawn(x, { hp: 1e12 });
      return ofType(step(x, 20 * 60), 'attack').filter((a) => a.unit === 'cmarvel').length;
    };
    expect(count(true) / count(false)).toBeGreaterThan(1.12); // +10 % +5 % × 2 rangs
    const e = arena('pocahontas');
    debugPlace(e, 0, 0, 'cmarvel', 7);
    const manas: number[] = [];
    for (let i = 0; i < 300; i++) {
      debugSpawn(e, { hp: 1 });
      manas.push(...ofType(step(e, 1), 'kill').map((k) => k.mana));
    }
    expect(manas).toContain(15);
    expect(manas.filter((m) => m === 15).length).toBeLessThan(40);
  });

  it('Mulan : brûlure 20 %/s pendant 3 s, Avalanche 300 % une fois par vague', () => {
    const e = arena('mulan');
    const t = debugSpawn(e, { hp: BIG, distance: 20 });
    step(e, 1);
    expect(t.effects.burn).toBeCloseTo(D('mulan') * 0.2);
    const x = arena('mulan');
    for (let i = 0; i < 8; i++) debugSpawn(x, { hp: BIG, distance: i });
    const ev = step(x, 20 * 5);
    const av = ofType(ev, 'ability').filter((a) => a.name === 'Avalanche');
    expect(av).toHaveLength(1);
    expect(av[0]!.targets).toHaveLength(8);
  });

  it('Rebelle : 100 % de critiques ×2 sur l’ennemi le plus avancé', () => {
    const e = arena('merida');
    const lead = debugSpawn(e, { hp: BIG, distance: 20 });
    debugSpawn(e, { hp: BIG, distance: 3 });
    const h = ofType(step(e, 1), 'hit')[0]!;
    expect(h).toMatchObject({ enemy: lead.uid, crit: true });
    expect(h.damage).toBeCloseTo(D('merida') * 2);
  });

  it('Ariel : le Chant arrête 3 ennemis 1,5 s, Sébastien fait saigner', () => {
    const e = arena('ariel');
    const ts = [20, 19, 18, 3].map((d) => debugSpawn(e, { hp: 1e6, distance: d }));
    step(e, 1);
    expect(ts[0]!.x.bleed).toBeCloseTo(0.05 * 1e6);
    const ev = step(e, 20 * 8);
    expect(ofType(ev, 'ability').find((a) => a.name === 'Chant de sirène')!.targets).toEqual(ts.slice(0, 3).map((x) => x.uid));
    expect(ts[0]!.effects.stunFor).toBeGreaterThan(1);
  });

  it('Rox & Rouky : deux coups, le second +50 % sur la même cible', () => {
    const e = arena('foxhound');
    debugSpawn(e, { hp: BIG });
    const d = ofType(step(e, 1), 'hit').map((h) => h.damage);
    expect(d[0]).toBeCloseTo(D('foxhound'));
    expect(d[1]).toBeCloseTo(D('foxhound') * 1.5);
  });

  it('Tiana : la langue tire l’ennemi de tête 1 case en arrière toutes les 12 s', () => {
    const e = arena('tiana');
    const t = debugSpawn(e, { hp: BIG, distance: 20 });
    const ev = step(e, 240);
    expect(ofType(ev, 'ability').some((a) => a.name === 'Langue de Naveen')).toBe(true);
    expect(t.distance).toBe(19);
  });

  it('Nemo & Dory : un effet aléatoire à chaque tir', () => {
    const e = arena('nemo');
    debugPlace(e, 0, 0, 'cmarvel');
    debugSpawn(e, { hp: BIG });
    const ev = ofType(step(e, 20 * 20), 'attack').filter((a) => a.unit === 'nemo').map((a) => a.fx);
    for (const fx of ['nemo:ralenti', 'nemo:double', 'nemo:poison', 'nemo:cadence']) expect(ev).toContain(fx);
  });

  it('Coco : +5 % de dégâts aux voisines', () => {
    const x = quiet(deckWith('coco'));
    debugPlace(x, 0, 0, 'cmarvel');
    debugPlace(x, 0, 1, 'coco');
    debugSpawn(x, { hp: BIG });
    const ev = step(x, 1);
    const idx = ev.findIndex((a) => a.type === 'attack' && a.unit === 'cmarvel');
    expect((ev[idx + 1] as { damage: number }).damage).toBeCloseTo(D('cmarvel') * 1.05);
  });

  it('Nick & Judy : Nick réduit l’armure de 20 %, Judy arrête le plus fort 2 s', () => {
    const e = arena('nickjudy');
    const t = debugSpawn(e, { hp: BIG, armor: 0.3 });
    expect(ofType(step(e, 1), 'hit')[0]!.damage).toBeCloseTo(D('nickjudy') * 0.7);
    expect(t.effects.armorBreak).toBeCloseTo(0.2);
    e.state.players[0]!.grid[7]!.cooldown = 0;
    expect(ofType(step(e, 1), 'hit')[0]!.damage).toBeCloseTo(D('nickjudy') * 0.9);
    const ev = step(e, 20 * 6);
    expect(ofType(ev, 'ability').find((a) => a.name === 'Arrestation')!.targets).toEqual([t.uid]);
    expect(t.effects.stunFor).toBeGreaterThan(1);
  });

  it('Buzz & Woody : le laser transperce la ligne, le lasso ramène l’ennemi de tête de 2 cases', () => {
    const e = arena('buzzwoody');
    const line = [27, 25, 22].map((d) => debugSpawn(e, { hp: BIG, distance: d }));
    debugSpawn(e, { hp: BIG, distance: 3 });
    expect(ofType(step(e, 1), 'attack')[0]!.targets.sort()).toEqual(line.map((x) => x.uid).sort());
    step(e, 200);
    expect(line[0]!.distance).toBe(25);
  });

  it('Raiponce : retire les effets de boss des voisines et leur donne +15 % de dégâts', () => {
    const e = quiet(deckWith('rapunzel'));
    const c = debugPlace(e, 0, 0, 'cmarvel');
    debugPlace(e, 0, 1, 'rapunzel');
    c.status.sleepingFor = 3;
    debugSpawn(e, { hp: BIG });
    const ev = step(e, 1);
    expect(c.status.sleepingFor).toBeUndefined();
    const idx = ev.findIndex((a) => a.type === 'attack' && a.unit === 'cmarvel');
    expect((ev[idx + 1] as { damage: number }).damage).toBeCloseTo(D('cmarvel') * 1.15);
  });

  it('Vanellope & Ralph : brise les boucliers, ×2 contre les blindés, échange (archétype) et cadence aux voisines', () => {
    const e = arena('vanralph');
    const s = debugSpawn(e, { hp: BIG, shieldHits: 5, distance: 10 });
    expect(ofType(step(e, 1), 'hit')[0]!.damage).toBeCloseTo(D('vanralph'));
    expect(s.shieldHits).toBe(0);
    const x = arena('vanralph');
    debugSpawn(x, { hp: BIG, armor: 0.3 });
    expect(ofType(step(x, 1), 'hit')[0]!.damage).toBeCloseTo(D('vanralph') * 2 * 0.7);
    for (let i = 0; i < 15; i++) if (i !== 7) debugPlace(x, 0, i, 'cmarvel');
    expect(ofType(step(x, 240), 'ability').some((a) => a.name === 'Glitch')).toBe(false); // plus de téléportation seule
    x.apply({ type: 'swap', player: 'p1', from: 7, to: 0 });
    const ev = step(x, 1);
    expect(ofType(ev, 'swap')[0]).toMatchObject({ from: 7, to: 0, unit: 'vanralph', rank: 1 });
    expect(x.state.players[0]!.grid[7]!.unit).toBe('cmarvel');
    const glitch = ofType(ev, 'ability').find((a) => a.name === 'Glitch')!;
    expect(glitch.slot).toBe(0);
    expect(glitch.targets).toEqual([7]);
    expect(x.state.players[0]!.grid[0]!.unit).toBe('vanralph');
    expect(x.state.players[0]!.grid[1]!.counters.boostFor).toBeGreaterThan(4);
  });
});

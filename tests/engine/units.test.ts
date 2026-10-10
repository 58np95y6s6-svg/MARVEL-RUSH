// Compétences des 28 unités, sur les profils Rush Royale (docs/rush-royale-mapping.md).
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
/** Dégâts de base (rang 1, niveau 1). */
const D = (u: UnitId): number => UNITS[u].damage;
const attacksOf = (e: Engine, u: UnitId, ticks: number) => ofType(step(e, ticks), 'attack').filter((a) => a.unit === u).length;
const close = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps * Math.max(1, Math.abs(b));

describe('profils Rush Royale des 73 unités (28 + 15 DC + 15 Transformers + 15 Pixar)', () => {
  it('les 73 unités ont des données complètes ; seuls les soutiens « sans cible » n’attaquent pas', () => {
    expect(UNIT_LIST).toHaveLength(73);
    for (const u of UNIT_LIST) {
      expect(u.damage).toBeGreaterThanOrEqual(0);
      expect(u.attackInterval).toBeGreaterThan(0);
      expect(Object.keys(u.ability.params).length).toBeGreaterThan(0);
    }
    expect(UNIT_LIST.filter((u) => u.damage === 0).map((u) => u.id).sort()).toEqual(['cap', 'pocahontas', 'rapunzel']);
  });

  it('rang de fusion (règle Rush Royale) : intervalle ÷ rang, dégâts par coup inchangés', () => {
    const count = (rank: number) => {
      const e = arena('hawkeye', rank);
      debugSpawn(e, { hp: BIG });
      const ev = step(e, 20 * 30);
      const hits = ofType(ev, 'hit');
      expect(hits[0]!.damage).toBeCloseTo(D('hawkeye'));
      return ofType(ev, 'attack').length;
    };
    const r1 = count(1);
    expect(count(3) / r1).toBeCloseTo(3, 1);
    expect(count(7) / r1).toBeCloseTo(7, 0);
  });

  it('Iron Man (Tesla) : une fusion voisine le charge ; chargé, 4 ennemis de plus à 50 %', () => {
    const e = arena('ironman');
    const t = debugSpawn(e, { hp: BIG, distance: 20 });
    for (const d of [11, 12, 13, 14, 15]) debugSpawn(e, { hp: BIG, distance: d });
    expect(ofType(step(e, 1), 'attack')[0]!.targets).toEqual([t.uid]);
    debugPlace(e, 0, 2, 'cmarvel');
    debugPlace(e, 0, 0, 'cmarvel');
    e.apply({ type: 'merge', player: 'p1', from: 0, to: 2 }); // case 2 : voisine du dessus
    const ev = step(e, 20);
    expect(ofType(ev, 'ability').some((a) => a.name === 'Surcharge Arc')).toBe(true);
    expect(e.state.players[0]!.grid[7]!.counters.charges).toBe(1);
    const shot = ofType(ev, 'attack').find((a) => a.unit === 'ironman' && a.fx === 'ironman:unibeam')!;
    expect(shot.targets).toHaveLength(5);
    const full = D('ironman') * 1.385;
    expect(ofType(ev, 'hit').some((h) => close(h.damage, full))).toBe(true);
    expect(ofType(ev, 'hit').some((h) => close(h.damage, full * 0.5))).toBe(true);
  });

  it('Spider-Man (Catapulte) : zone de 100 % autour du premier, collés 1 s, pas avant 9 s ; le rang monte les dégâts', () => {
    const e = arena('spiderman');
    const t = debugSpawn(e, { hp: BIG, distance: 10 });
    const n = debugSpawn(e, { hp: BIG, distance: 10.5 });
    const hits = ofType(step(e, 1), 'hit');
    expect(hits.filter((h) => close(h.damage, D('spiderman')))).toHaveLength(2);
    expect(t.effects.stunFor).toBeCloseTo(1, 1);
    expect(n.effects.stunFor).toBeCloseTo(1, 1);
    step(e, 20 * 3); // 2e tir à 2 s : pas de nouveau collage
    expect(t.effects.stunFor ?? 0).toBe(0);
    step(e, 20 * 7); // 9 s passées : recollé
    expect(t.effects.stunFor ?? 0).toBeGreaterThan(0);
    const boss = arena('spiderman');
    const b = debugSpawn(boss, { hp: BIG, bossId: 'jafar', distance: 10 });
    step(boss, 1);
    expect(b.effects.stunFor ?? 0).toBe(0);
    const r3 = arena('spiderman', 3);
    debugSpawn(r3, { hp: BIG });
    const ev = step(r3, 20 * 10);
    expect(ofType(ev, 'hit')[0]!.damage).toBeCloseTo(D('spiderman') * 3);
    expect(ofType(ev, 'attack').filter((a) => a.unit === 'spiderman').length).toBeLessThanOrEqual(6); // 2 s, quel que soit le rang
  });

  it('Hulk (Minotaure) : Séisme toutes les 5 s (ralentit, dégâts sur 3 s), Éboulement à la fusion', () => {
    const e = arena('hulk');
    const t = debugSpawn(e, { hp: BIG, distance: 10 });
    const n = debugSpawn(e, { hp: BIG, distance: 11 });
    const ev = step(e, 20 * 5 + 2);
    const quake = ofType(ev, 'ability').find((a) => a.name === 'Séisme')!;
    expect(quake.targets.sort()).toEqual([t.uid, n.uid].sort());
    expect(n.effects.slow).toBeCloseTo(0.3);
    expect(n.x.bleed).toBeCloseTo(D('hulk'));
    const x = quiet(deckWith('hulk'));
    debugNoRange(x);
    debugPlace(x, 0, 0, 'hulk');
    debugPlace(x, 0, 1, 'hulk');
    const hurt = debugSpawn(x, { hp: 1e6, distance: 3 });
    hurt.hp = 6e5; // 400 000 PV perdus
    x.apply({ type: 'merge', player: 'p1', from: 0, to: 1 });
    const rock = step(x, 21);
    expect(ofType(rock, 'ability').some((a) => a.name === 'Éboulement')).toBe(true);
    expect(ofType(rock, 'hit').some((h) => h.enemy === hurt.uid && close(h.damage, 4e5 * 0.05, 0.01))).toBe(true);
  });

  it('Thor (Inquisiteur) : zone à 50 % des dégâts de base, +15 % par coup consécutif sur la même cible (600 % au plus)', () => {
    // 2 Thor : nombre pair, pas de mode actif.
    const e = arena('thor');
    debugPlace(e, 0, 0, 'thor').cooldown = 99;
    const t = debugSpawn(e, { hp: BIG, distance: 11 });
    const n = debugSpawn(e, { hp: BIG, distance: 10.5 });
    const ev = step(e, 20 * 60);
    const onT = ofType(ev, 'hit').filter((h) => h.enemy === t.uid).map((h) => h.damage);
    const onN = ofType(ev, 'hit').filter((h) => h.enemy === n.uid).map((h) => h.damage);
    expect(onT[0]).toBeCloseTo(D('thor'));
    expect(onT[1]).toBeCloseTo(D('thor') * 1.15);
    expect(onT[10]).toBeCloseTo(D('thor') * 2.5);
    expect(onT[45]).toBeCloseTo(D('thor') * 7); // plafond : +600 %
    expect(onN.every((d) => close(d, D('thor') * 0.5))).toBe(true); // la zone ne profite pas de la rampe
    expect(ofType(ev, 'attack').filter((a) => a.unit === 'thor')[0]!.fx).toBe('thor:marteau');
    expect(onT.length).toBeGreaterThanOrEqual(59);
    expect(onT.length).toBeLessThanOrEqual(61); // 1 coup par seconde
  });

  it('Thor : la rampe repart de zéro au changement de cible', () => {
    const e = arena('thor');
    debugPlace(e, 0, 0, 'thor').cooldown = 99;
    debugSpawn(e, { hp: BIG, distance: 5 });
    step(e, 20 * 5);
    const lead = debugSpawn(e, { hp: BIG, distance: 20 });
    const h = ofType(step(e, 20 * 2), 'hit').filter((x) => x.enemy === lead.uid);
    expect(h[0]!.damage).toBeCloseTo(D('thor'));
    expect(h[1]!.damage).toBeCloseTo(D('thor') * 1.15);
  });

  it('Thor : mode actif avec 1, 3, 5 ou 7 exemplaires (intervalle 0,6 s, zone à 100 %)', () => {
    const e = arena('thor');
    debugSpawn(e, { hp: BIG, distance: 11 });
    const n = debugSpawn(e, { hp: BIG, distance: 10.5 });
    const ev = step(e, 20 * 6);
    const onN = ofType(ev, 'hit').filter((h) => h.enemy === n.uid).map((h) => h.damage);
    expect(onN[0]).toBeCloseTo(D('thor'));
    expect(onN.length).toBeGreaterThanOrEqual(9); // 6 s ÷ 0,6 s
    expect(ofType(ev, 'attack').filter((a) => a.unit === 'thor')[0]!.fx).toBe('thor:foudre');
    const count = (k: number) => {
      const x = arena('thor');
      for (let i = 1; i < k; i++) debugPlace(x, 0, i - 1 + (i > 7 ? 1 : 0), 'thor').cooldown = 99;
      debugSpawn(x, { hp: BIG, distance: 11 });
      return attacksOf(x, 'thor', 20 * 6);
    };
    const one = count(1);
    expect(count(2)).toBeLessThan(one * 0.7);
    expect(count(3)).toBe(one);
    expect(count(4)).toBeLessThan(one * 0.7);
    expect(count(5)).toBe(one);
  });

  it('Doctor Strange (Mage du portail) : 5 % de chance de renvoyer la cible au début (sauf boss)', () => {
    const e = arena('strange');
    const t = debugSpawn(e, { hp: BIG, distance: 20 });
    const ev = step(e, 20 * 200);
    const portals = ofType(ev, 'ability').filter((a) => a.name === 'Portail');
    expect(portals.length).toBeGreaterThan(0);
    expect(t.x.teleports).toBe(portals.length);
    expect(t.distance).toBe(0);
    const b = arena('strange');
    debugSpawn(b, { hp: BIG, distance: 20, bossId: 'jafar' });
    expect(ofType(step(b, 20 * 200), 'ability').some((a) => a.name === 'Portail')).toBe(false);
  });

  it('Venom (Zélote) : dégâts selon le mana en réserve (×2 vers 1 000, ×3 vers 60 000)', () => {
    const at = (mana: number) => {
      const e = arena('venom');
      e.state.players[0]!.mana = mana;
      debugSpawn(e, { hp: BIG, distance: 11 });
      return ofType(step(e, 1), 'hit')[0]!.damage / D('venom');
    };
    expect(at(0)).toBeCloseTo(1);
    expect(at(1000)).toBeCloseTo(2, 1);
    expect(at(60000)).toBeCloseTo(3, 1);
    expect(at(100)).toBeCloseTo(1 + 0.3105 * Math.pow(100, 0.1693), 3);
  });

  it('Captain Marvel (Mage de feu) : explosion de 78 % autour de la cible', () => {
    const e = arena('cmarvel');
    const t = debugSpawn(e, { hp: BIG, distance: 14 });
    const n = debugSpawn(e, { hp: BIG, distance: 13 });
    const far = debugSpawn(e, { hp: BIG, distance: 10 });
    const hits = ofType(step(e, 1), 'hit');
    expect(hits.find((h) => h.enemy === t.uid)!.damage).toBeCloseTo(D('cmarvel'));
    expect(hits.find((h) => h.enemy === n.uid)!.damage).toBeCloseTo(D('cmarvel') * 0.78);
    expect(hits.some((h) => h.enemy === far.uid)).toBe(false);
  });

  it('Captain America (Statue) : n’attaque pas, +14 % de cadence par rang aux voisines, critiques en nombre pair', () => {
    const count = (cap: number) => {
      const x = quiet(deckWith('cap'));
      debugNoRange(x);
      debugPlace(x, 0, 7, 'cmarvel');
      if (cap) debugPlace(x, 0, 8, 'cap', cap);
      debugSpawn(x, { hp: BIG });
      return attacksOf(x, 'cmarvel', 20 * 60);
    };
    expect(count(2) / count(0)).toBeCloseTo(1.28, 1);
    const e = arena('cap', 7);
    debugSpawn(e, { hp: BIG });
    expect(ofType(step(e, 100), 'attack')).toHaveLength(0);
    debugPlace(e, 0, 6, 'cmarvel');
    debugPlace(e, 0, 0, 'cap', 7); // 2 statues : nombre pair
    const crits = ofType(step(e, 20 * 30), 'hit').filter((h) => h.crit);
    expect(crits.length).toBeGreaterThan(5);
  });

  it('Soldat de l’hiver (Bourreau) : achève sous 20,5 % des PV, moitié contre les boss', () => {
    const e = arena('bucky', 1, ['bucky', 'merida', 'nemo', 'tiana', 'coco']); // sans bonus d'équipe
    const t = debugSpawn(e, { hp: D('bucky') * 1.15, distance: 10 }); // après un coup : 13 % des PV
    const ev = step(e, 1);
    expect(t.hp).toBeLessThanOrEqual(0);
    expect(ofType(ev, 'ability').some((a) => a.name === 'Bras bionique')).toBe(true);
    const b = arena('bucky', 1, ['bucky', 'merida', 'nemo', 'tiana', 'coco']);
    const boss = debugSpawn(b, { hp: D('bucky') * 1.15, bossId: 'jafar', distance: 10 }); // 13 % > 10,25 %
    step(b, 1);
    expect(boss.hp).toBeGreaterThan(0);
  });

  it('Œil de faucon (Archer) : chaque amélioration donne +22 % de vitesse au lieu de +6 %', () => {
    const count = (pu: boolean) => {
      const x = arena('hawkeye');
      if (pu) { simState(x).players[0]!.mana = 1000; x.apply({ type: 'powerup', player: 'p1', unit: 'hawkeye' }); }
      debugSpawn(x, { hp: BIG });
      return attacksOf(x, 'hawkeye', 20 * 60);
    };
    expect(count(true) / count(false)).toBeCloseTo(1.22, 1);
  });

  it('Falcon (Tireur d’élite) : vise le plus de PV ; pendant un boss, dégâts ×1,5', () => {
    const e = arena('falcon');
    debugSpawn(e, { hp: 100, distance: 20 });
    const big = debugSpawn(e, { hp: 10000, distance: 1 });
    const h = ofType(step(e, 1), 'hit')[0]!;
    expect(h.enemy).toBe(big.uid);
    expect(h.damage).toBeCloseTo(D('falcon'));
    const b = arena('falcon');
    debugSpawn(b, { hp: BIG, bossId: 'jafar', distance: 25 });
    simState(b).phase = 'boss';
    expect(ofType(step(b, 1), 'hit')[0]!.damage).toBeCloseTo(D('falcon') * 1.5);
  });

  it('Shang-Chi (Tonnerre) : chaîne de 50 % sur la cible et les ennemis qui la suivent, autant que le rang', () => {
    const e = arena('shangchi', 3);
    const lead = debugSpawn(e, { hp: BIG, distance: 20 });
    for (const d of [10, 12, 14]) debugSpawn(e, { hp: BIG, distance: d });
    const ev = step(e, 1);
    const atk = ofType(ev, 'attack').find((a) => a.unit === 'shangchi')!;
    expect(atk.targets[0]).toBe(lead.uid);
    expect(atk.targets).toHaveLength(3);
    const hits = ofType(ev, 'hit');
    expect(hits.filter((h) => close(h.damage, D('shangchi') * 0.5))).toHaveLength(3);
    expect(hits.filter((h) => close(h.damage, D('shangchi')))).toHaveLength(1);
    const dazed = simState(e).enemies.filter((x) => (x.effects.stunFor ?? 0) > 0);
    expect(dazed).toHaveLength(3);
  });

  it('Vaïana (Archer du vent) : Ouragan toutes les 4 s (cadence ×3), +30 dégâts par rang', () => {
    const e = arena('moana');
    debugSpawn(e, { hp: BIG });
    const ev = step(e, 20 * 4 + 1);
    expect(ofType(ev, 'ability').some((a) => a.name === 'Ouragan')).toBe(true);
    const during = attacksOf(e, 'moana', 20 * 3);
    expect(during).toBeGreaterThanOrEqual(14); // 3 s à 0,2 s
    const r2 = arena('moana', 2);
    debugSpawn(r2, { hp: BIG });
    expect(ofType(step(r2, 1), 'hit')[0]!.damage).toBeCloseTo(D('moana') + 30);
  });

  it('Maui (Borée) : faucon (+30 % de cadence) puis requin toutes les 6 s (+60 % et critiques)', () => {
    const e = arena('maui');
    debugSpawn(e, { hp: BIG });
    const hawk = attacksOf(e, 'maui', 20 * 5);
    const ev = step(e, 20 * 1 + 1);
    expect(ofType(ev, 'ability').some((a) => a.name === 'Métamorphose : requin')).toBe(true);
    const shark = step(e, 20 * 5);
    expect(ofType(shark, 'attack').filter((a) => a.unit === 'maui').length).toBeGreaterThan(hawk);
    expect(ofType(shark, 'attack').every((a) => a.fx === 'maui:requin')).toBe(true);
  });

  it('Pocahontas (Bannière) : n’attaque pas, +12 % de cadence par rang aux 4 voisines', () => {
    const count = (rank: number) => {
      const x = quiet(deckWith('pocahontas'));
      debugNoRange(x);
      debugPlace(x, 0, 7, 'cmarvel');
      if (rank) debugPlace(x, 0, 2, 'pocahontas', rank);
      debugSpawn(x, { hp: BIG });
      return attacksOf(x, 'cmarvel', 20 * 60);
    };
    expect(count(3) / count(0)).toBeCloseTo(1.36, 1);
    const e = arena('pocahontas');
    debugSpawn(e, { hp: BIG });
    expect(ofType(step(e, 100), 'attack')).toHaveLength(0);
  });

  it('Mulan (Danse-lames) : seule, +100 % de cadence ; chaque danseuse donne +10 % aux autres', () => {
    const solo = arena('mulan');
    debugSpawn(solo, { hp: BIG });
    const alone = attacksOf(solo, 'mulan', 20 * 30);
    const pair = arena('mulan');
    debugPlace(pair, 0, 8, 'mulan'); // voisine : ne dansent plus
    debugSpawn(pair, { hp: BIG });
    const linked = attacksOf(pair, 'mulan', 20 * 30) / 2;
    expect(alone / linked).toBeCloseTo(2, 1);
    const two = arena('mulan');
    debugPlace(two, 0, 0, 'mulan'); // pas voisine : les deux dansent
    debugSpawn(two, { hp: BIG });
    expect(ofType(step(two, 1), 'hit')[0]!.damage).toBeCloseTo(D('mulan') * 1.1);
  });

  it('Rebelle (Chasseur) : premier tir sur chaque nouvelle cible +210 %', () => {
    const e = arena('merida');
    debugSpawn(e, { hp: BIG });
    const dmg = ofType(step(e, 25), 'hit').map((h) => h.damage);
    expect(dmg[0]).toBeCloseTo(D('merida') * 3.1);
    expect(dmg[1]).toBeCloseTo(D('merida'));
  });

  it('Ariel (Stase) : toutes les 4 s (1,8 s au rang 7), fige les ennemis 2,5 s (sauf boss)', () => {
    const e = arena('ariel');
    const t = debugSpawn(e, { hp: BIG, distance: 10 });
    const ev = step(e, 20 * 4 + 1);
    expect(ofType(ev, 'ability').find((a) => a.name === 'Chant de sirène')!.targets).toContain(t.uid);
    expect(t.effects.stunFor).toBeGreaterThan(2.3);
    const b = arena('ariel');
    const boss = debugSpawn(b, { hp: BIG, bossId: 'jafar', distance: 10 });
    step(b, 20 * 4 + 1);
    expect(boss.effects.stunFor ?? 0).toBe(0);
    const r7 = arena('ariel', 7);
    debugSpawn(r7, { hp: BIG });
    expect(ofType(step(r7, 20 * 10), 'ability').filter((a) => a.name === 'Chant de sirène').length).toBeGreaterThanOrEqual(5);
  });

  it('Rox & Rouky (Voleur) : bonus aléatoire de 0 à 200 % des dégâts', () => {
    const e = arena('foxhound', 1, ['foxhound', 'merida', 'nemo', 'tiana', 'coco']);
    debugSpawn(e, { hp: BIG });
    const dmg = ofType(step(e, 20 * 60), 'hit').map((h) => h.damage);
    expect(Math.min(...dmg)).toBeGreaterThanOrEqual(D('foxhound') - 1e-6);
    expect(Math.max(...dmg)).toBeLessThanOrEqual(D('foxhound') * 3 + 1e-6);
    expect(Math.max(...dmg)).toBeGreaterThan(D('foxhound') * 2.5);
  });

  it('Tiana (Vampire) : la cible mordue rapporte 0,5 mana par seconde, et du mana à sa mort', () => {
    const e = arena('tiana');
    const t = debugSpawn(e, { hp: BIG, distance: 10 });
    step(e, 1);
    expect(t.x.bite).toBeCloseTo(0.5);
    const before = e.state.players[0]!.mana;
    step(e, 20 * 10);
    expect(e.state.players[0]!.mana - before).toBe(5);
    const k = arena('tiana');
    debugSpawn(k, { hp: 1 });
    expect(ofType(step(k, 1), 'kill')[0]!.mana).toBe(10 + 1);
  });

  it('Nemo (Chaudron) : une potion à l’arrivée, 5 de mana par rang toutes les 8 s', () => {
    const e = arena('nemo', 2);
    debugSpawn(e, { hp: BIG, distance: 10 });
    const ev = step(e, 1);
    expect(ofType(ev, 'ability').some((a) => a.name.startsWith('Potion'))).toBe(true);
    const before = e.state.players[0]!.mana;
    const later = step(e, 20 * 8);
    expect(ofType(later, 'ability').some((a) => a.name === 'Mémoire de poisson')).toBe(true);
    expect(e.state.players[0]!.mana - before).toBe(10);
  });

  it('Coco (Dryade) : attaque le premier ennemi (le booster de fusion est testé dans archetypes.test.ts)', () => {
    const e = arena('coco');
    debugSpawn(e, { hp: BIG });
    expect(ofType(step(e, 1), 'hit')[0]!.damage).toBeCloseTo(D('coco'));
  });

  it('Nick & Judy (Chimiste) : la cible subit +5 % de dégâts par rang ; vise le premier ennemi pas encore fiché', () => {
    const e = arena('nickjudy', 2);
    const a = debugSpawn(e, { hp: BIG, distance: 20 });
    const b = debugSpawn(e, { hp: BIG, distance: 10 });
    const first = ofType(step(e, 1), 'hit')[0]!;
    expect(first.enemy).toBe(a.uid);
    expect(a.x.vuln).toBeCloseTo(0.1);
    const second = ofType(step(e, 20), 'hit')[0]!;
    expect(second.enemy).toBe(b.uid);
  });

  it('Buzz & Woody (Ingénieur) : +5 % de dégâts par jouet relié (cases voisines, groupe)', () => {
    const e = arena('buzzwoody');
    debugPlace(e, 0, 8, 'buzzwoody');
    debugPlace(e, 0, 13, 'buzzwoody'); // relié à 8, pas à 7 : groupe de 3
    debugSpawn(e, { hp: BIG });
    const hits = ofType(step(e, 1), 'hit');
    expect(hits).toHaveLength(3);
    expect(hits.every((h) => close(h.damage, D('buzzwoody') * 1.1))).toBe(true);
  });

  it('Raiponce (Meule) : n’attaque pas, +8 % de dégâts par rang aux 4 voisines', () => {
    const e = arena('rapunzel', 3);
    debugPlace(e, 0, 8, 'cmarvel');
    debugSpawn(e, { hp: BIG, distance: 10 });
    const ev = step(e, 1);
    expect(ofType(ev, 'attack').filter((a) => a.unit === 'rapunzel')).toHaveLength(0);
    expect(ofType(ev, 'hit')[0]!.damage).toBeCloseTo(D('cmarvel') * 1.24);
  });

  it('Vanellope & Ralph (Gardien du portail) : échange avec une alliée de même rang, la libère, puis bugue 2 s', () => {
    const e = arena('vanralph');
    debugPlace(e, 0, 0, 'cmarvel');
    e.state.players[0]!.grid[0]!.status.stunnedFor = 5;
    e.apply({ type: 'swap', player: 'p1', from: 7, to: 0 });
    const ev = step(e, 1);
    expect(ofType(ev, 'swap')[0]).toMatchObject({ from: 7, to: 0, unit: 'vanralph', rank: 1 });
    const g = e.state.players[0]!.grid;
    expect(g[7]!.unit).toBe('cmarvel');
    expect(g[7]!.status.stunnedFor).toBeUndefined();
    expect(g[0]!.unit).toBe('vanralph');
    expect(g[0]!.status.sleepingFor).toBeGreaterThan(1.9);
    debugSpawn(e, { hp: BIG });
    expect(ofType(step(e, 20), 'attack').filter((a) => a.unit === 'vanralph')).toHaveLength(0);
  });
});

import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine';
import { debugPlace, debugQuiet, debugSpawn } from '../../src/engine/debug';
import {
  RANGE_LONG, RANGE_MEDIUM, RANGE_SHORT, boardGeometry, coveredSpans, enemyGridPos, inReach, rangeClass, rangeLabel, unitRange,
} from '../../src/engine/geometry';
import { UNIT_LIST } from '../../src/data/units';
import { PATH_SHAPES } from '../../src/maps/layout';
import { ALL_MAPS } from '../../src/maps/index';
import type { Engine } from '../../src/engine/types';
import { ofType, quiet, setup, step } from './helpers';

// Carte inconnue 'test' : chemin en U, longueur par défaut 30 cases en Solo.
const SOLO_LEN = 30;
const solo = boardGeometry('solo', 'u');

/** Distance (en cases du chemin) du milieu de la première partie couverte par une unité. */
function coveredDistance(slot: number, range: number, len = SOLO_LEN): number {
  const spans = coveredSpans(solo, 0, 'a', slot, range);
  expect(spans.length).toBeGreaterThan(0);
  const [a, b] = spans[0]!;
  return ((a + b) / 2) * len;
}

function attacksOf(e: Engine, n = 1) {
  return ofType(step(e, n), 'attack');
}

describe('portées d’attaque (§4.1)', () => {
  it('les 28 unités ont une portée : globale ou 1,6 / 2,4 / 3,4 cases', () => {
    for (const u of UNIT_LIST) {
      expect(u.range).toBeDefined();
      expect(['globale', RANGE_SHORT, RANGE_MEDIUM, RANGE_LONG]).toContain(u.range);
    }
    expect(rangeLabel('ironman')).toBe('toute la map');
    expect(rangeLabel('hulk')).toBe('courte');
    expect(rangeLabel('venom')).toBe('moyenne');
    expect(rangeLabel('thor')).toBe('longue');
    expect(rangeClass({})).toBe('globale'); // absent = globale
    // Revue des portées (octobre 2026) : Shang-Chi lance les Dix Anneaux comme le Danse-lames ses lames.
    expect(rangeLabel('shangchi')).toBe('longue');
    expect(rangeLabel('mulan')).toBe('longue');
    expect(rangeLabel('bucky')).toBe('toute la map');
    expect(unitRange({ range: 2 })).toBe(2);
  });

  it('coordonnées de grille : le haut du U passe à 1,1 case au-dessus de la rangée 0', () => {
    // Milieu du chemin en U : au-dessus de la colonne centrale.
    const p = enemyGridPos(solo, 0, 'a', SOLO_LEN / 2, SOLO_LEN)!;
    expect(p.col).toBeCloseTo(2, 1);
    expect(p.row).toBeCloseTo(-1.1, 1);
    expect(inReach(2, RANGE_SHORT, p)).toBe(true);   // case (2, 0)
    expect(inReach(7, RANGE_SHORT, p)).toBe(false);  // case (2, 1) : 2,1 cases
    expect(inReach(7, RANGE_MEDIUM, p)).toBe(true);
  });

  it('une unité de courte portée au centre ne touche aucun point du chemin, pour toutes les formes', () => {
    for (const shape of PATH_SHAPES) {
      expect(coveredSpans(boardGeometry('solo', shape), 0, 'a', 7, RANGE_SHORT)).toEqual([]);
    }
  });

  it('corps à corps au centre : ne frappe pas un ennemi éloigné ; une unité globale le peut', () => {
    const far = 1; // tout début du chemin, en bas à gauche
    const e = quiet();
    debugPlace(e, 0, 7, 'hulk');
    debugSpawn(e, { hp: 1e9, distance: far });
    expect(attacksOf(e, 40)).toHaveLength(0);

    const g = quiet();
    debugPlace(g, 0, 7, 'cmarvel');
    debugSpawn(g, { hp: 1e9, distance: far });
    expect(attacksOf(g, 1)).toHaveLength(1);
  });

  it('le boss aussi doit entrer dans la zone', () => {
    const e = quiet();
    debugPlace(e, 0, 7, 'hulk');
    const boss = debugSpawn(e, { hp: 1e9, bossId: 'cruella', distance: 1 });
    boss.x.powerIn = 1e9;
    expect(attacksOf(e, 20)).toHaveLength(0);
    boss.distance = coveredDistance(2, RANGE_SHORT); // au-dessus de la case (2, 0)
    debugPlace(e, 0, 2, 'hulk');
    const atk = attacksOf(e, 1);
    expect(atk.map((a) => a.slot)).toEqual([2]);
    expect(atk[0]!.targets).toEqual([boss.uid]);
  });

  it('la portée change le choix de la cible : « premier » dans la zone seulement', () => {
    const nearCorner = coveredDistance(0, RANGE_SHORT); // près de la case (0, 0)
    const make = (unit: 'venom' | 'merida') => {
      const e = quiet();
      debugPlace(e, 0, 0, unit);
      const near = debugSpawn(e, { hp: 1e9, distance: nearCorner });
      const lead = debugSpawn(e, { hp: 1e9, distance: SOLO_LEN - 1 }); // le plus avancé, en bas à droite
      return { e, near, lead };
    };
    const melee = make('venom');
    expect(attacksOf(melee.e)[0]!.targets).toEqual([melee.near.uid]);
    const sniper = make('merida');
    expect(attacksOf(sniper.e)[0]!.targets).toEqual([sniper.lead.uid]);
  });

  it('la portée suit la case après une fusion : même unité, autre case, autre résultat', () => {
    const d = coveredDistance(4, RANGE_MEDIUM); // près du coin haut droit
    const hit = (slot: number) => {
      const e = quiet();
      debugPlace(e, 0, slot, 'spiderman');
      debugSpawn(e, { hp: 1e9, distance: d });
      return attacksOf(e).length;
    };
    expect(hit(4)).toBe(1);
    expect(hit(10)).toBe(0); // bas gauche : trop loin
  });

  it('Coop : chaque joueur a sa géométrie (p1 en bas le long de la branche a, p2 en haut le long de la b)', () => {
    const geo = boardGeometry('coop', 'u');
    // Début de branche : près de la case (0, 2) de chaque joueur, sur sa propre branche.
    const pa = enemyGridPos(geo, 0, 'a', 0.3, 18)!;
    const pb = enemyGridPos(geo, 1, 'b', 0.3, 18)!;
    expect(pa.col).toBeCloseTo(pb.col, 3);
    expect(pa.row).toBeCloseTo(pb.row, 3); // symétrie (au dixième de pixel près) : même place vue par chacun
    expect(inReach(10, RANGE_SHORT, pa)).toBe(true);
    expect(inReach(10, RANGE_SHORT, enemyGridPos(geo, 1, 'a', 0.3, 18))).toBe(false);

    const e = createEngine({ mode: 'coop', seed: 3, mapId: 'test', players: [setup(['hulk', 'cmarvel', 'falcon', 'hawkeye', 'widow']), setup(['hulk', 'cmarvel', 'falcon', 'hawkeye', 'widow'], {}, 'p2')] });
    debugQuiet(e);
    e.drainEvents();
    debugPlace(e, 0, 10, 'hulk');
    debugPlace(e, 1, 10, 'hulk');
    debugSpawn(e, { hp: 1e9, lane: 'a', distance: 0.3 });
    expect(attacksOf(e).map((a) => a.player)).toEqual(['p1']);
    const f = createEngine({ mode: 'coop', seed: 3, mapId: 'test', players: [setup(['hulk', 'cmarvel', 'falcon', 'hawkeye', 'widow']), setup(['hulk', 'cmarvel', 'falcon', 'hawkeye', 'widow'], {}, 'p2')] });
    debugQuiet(f);
    f.drainEvents();
    debugPlace(f, 0, 10, 'hulk');
    debugPlace(f, 1, 10, 'hulk');
    debugSpawn(f, { hp: 1e9, lane: 'b', distance: 0.3 });
    expect(attacksOf(f).map((a) => a.player)).toEqual(['p2']);
  });

  it('la géométrie du moteur suit la forme du chemin de chaque map', () => {
    for (const m of ALL_MAPS) {
      const g = boardGeometry('solo', m.shape);
      expect(g.shape).toBe(m.shape);
      // Le premier point du chemin en coordonnées de grille correspond au tracé du rendu.
      const p0 = m.path[0]!;
      const q = enemyGridPos(g, 0, 'a', 0, m.pathLength)!;
      expect(q.col).toBeCloseTo((p0.x - 150) / 140 - 0.5, 6);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { ALL_MAPS, ARENAS, ARENA_OF_BOSS, MAPS, arenaForBoss, getMap, mapForDeck, mapsForUniverse } from '../../src/maps/index';
import { COOP_TRUNK_MIN_CELLS, PATH_CELLS, PATH_SHAPES, coopLayout, lanePoint, polylineLength, rectHitsPlay, soloLayout } from '../../src/maps/layout';
import type { BossId } from '../../src/data/types';

const within = (v: number, ref: number, tol = 0.1) => Math.abs(v - ref) / ref <= tol;

describe('géométrie du plateau', () => {
  it.each(PATH_SHAPES)('chemins de forme %s : longueur normalisée et dans l\'écran', (shape) => {
    const s = soloLayout(shape);
    expect(s.lane.cells).toBe(PATH_CELLS);
    expect(polylineLength(s.lane.points) / s.lane.cell).toBeCloseTo(PATH_CELLS, 1);
    const c = coopLayout(shape);
    // Coop : tronc long (il longe les plateaux sur toute leur largeur), chemin complet plus long qu'en Solo.
    expect(c.trunk.cells).toBeGreaterThanOrEqual(COOP_TRUNK_MIN_CELLS);
    expect(c.branchA.cells + c.trunk.cells).toBeGreaterThanOrEqual(PATH_CELLS);
    expect(c.branchB.cells + c.trunk.cells).toBeGreaterThanOrEqual(PATH_CELLS);
    expect(c.trunk.points[1]!.x).toBeLessThanOrEqual(c.partner.grid.x); // jusqu'au bord gauche des plateaux
    // Dernière ligne droite de chaque branche avant la jonction (règle de ciblage de la Coop).
    for (const [lane, cross] of [[c.branchA, c.crossA], [c.branchB, c.crossB]] as const) {
      expect(cross).toBeGreaterThan(lane.cells * 0.4);
      expect(lane.cells - cross).toBeGreaterThanOrEqual(2);
      const p = lanePoint(lane, cross + 0.05), q = lanePoint(lane, lane.cells);
      expect(Math.abs(p.x - q.x)).toBeLessThan(1); // segment vertical jusqu'à la jonction
    }
    for (const lane of [s.lane, c.branchA, c.branchB, c.trunk])
      for (const p of lane.points) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1000);
        expect(p.y).toBeGreaterThanOrEqual(100);
        expect(p.y).toBeLessThanOrEqual(1300);
      }
    // les branches se rejoignent au début du tronc
    expect(c.branchA.points.at(-1)).toEqual(c.trunk.points[0]);
    expect(c.branchB.points.at(-1)).toEqual(c.trunk.points[0]);
  });

  it('15 cases par plateau, sans chevauchement avec le chemin', () => {
    const s = soloLayout('u');
    expect(s.board.cells).toHaveLength(15);
    for (const cell of s.board.cells) expect(rectHitsPlay({ ...cell, w: 1, h: 1 }, s)).toBe(true);
    const mid = lanePoint(s.lane, PATH_CELLS / 2);
    const g = s.board.grid;
    expect(mid.y).toBeLessThan(g.y);
  });
});

describe('maps', () => {
  it('12 maps, 7 variantes et 7 arènes, identifiants uniques', () => {
    expect(MAPS.length).toBe(19);
    expect(ARENAS.length).toBe(7);
    expect(new Set(ALL_MAPS.map((m) => m.id)).size).toBe(ALL_MAPS.length);
    expect(mapsForUniverse('marvel')).toHaveLength(6);
    expect(mapsForUniverse('disney')).toHaveLength(13);
  });

  it.each(ALL_MAPS.map((m) => [m.id, m] as const))('%s : longueurs, ambiances, couches', (_id, m) => {
    expect(within(m.pathLength, PATH_CELLS)).toBe(true);
    const lc = m.pathLengthCoop!;
    expect(lc.tronc).toBeGreaterThanOrEqual(COOP_TRUNK_MIN_CELLS);
    expect(lc.a + lc.tronc).toBeGreaterThanOrEqual(PATH_CELLS);
    expect(lc.b + lc.tronc).toBeGreaterThanOrEqual(PATH_CELLS);
    const labels = new Set(m.ambience);
    expect(labels.size).toBeGreaterThanOrEqual(2);
    expect(labels.size).toBeLessThanOrEqual(3);
    expect(m.layers.map((l) => l.id)).toEqual(['fond', 'decor', 'chemin', 'details']);
    for (const mode of ['solo', 'coop'] as const)
      for (const l of m.layers) {
        const svg = l.svg(mode);
        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg.length).toBeLessThan(400_000);
      }
  });

  it.each(ALL_MAPS.map((m) => [m.id, m] as const))('%s : rien d\'animé sur le chemin ni sur la grille', (_id, m) => {
    const shapes = m.boss ? PATH_SHAPES : [m.shape];
    for (const shape of shapes)
      for (const mode of ['solo', 'coop'] as const) {
        const L = mode === 'solo' ? soloLayout(shape) : coopLayout(shape);
        for (const a of m.anims(mode, shape)) {
          expect(a.period).toBeGreaterThan(0);
          expect(rectHitsPlay(a.sweep, L), `${a.label} (${mode}, ${shape})`).toBe(false);
        }
      }
  });
});

describe('registre', () => {
  it('chaque boss a son arène', () => {
    for (const boss of Object.keys(ARENA_OF_BOSS) as BossId[]) {
      const a = arenaForBoss(boss);
      expect(a?.boss).toBe(boss);
    }
    expect(arenaForBoss('thanos')?.name).toBe('Titan');
  });

  it('mapForDeck choisit l\'univers majoritaire', () => {
    expect(mapForDeck(['spiderman', 'venom', 'ironman', 'thor', 'moana']).id).toBe('toits-new-york');
    expect(mapForDeck(['moana', 'maui', 'mulan', 'coco', 'ironman']).id).toBe('ile-motunui');
    expect(mapForDeck(['cap', 'widow', 'hawkeye', 'thor', 'loki']).id).toBe('base-avengers');
    expect(mapForDeck(['ariel', 'tiana', 'nemo', 'rapunzel', 'merida'], ['toits-new-york', 'atlantica']).id).toBe('atlantica');
  });

  it('getMap retombe sur la map de départ', () => {
    expect(getMap('inconnue').id).toBe('toits-new-york');
  });
});

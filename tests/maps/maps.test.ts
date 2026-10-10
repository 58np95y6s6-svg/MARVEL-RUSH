import { describe, expect, it } from 'vitest';
import { ALL_MAPS, ARENAS, ARENA_OF_BOSS, MAPS, arenaForBoss, getMap, mapForDeck, mapsForUniverse } from '../../src/maps/index';
import { PATH_CELLS, PATH_SHAPES, coopLayout, lanePoint, polylineLength, rectHitsPlay, soloLayout } from '../../src/maps/layout';
import type { BossId } from '../../src/data/types';

const within = (v: number, ref: number, tol = 0.1) => Math.abs(v - ref) / ref <= tol;

describe('géométrie du plateau', () => {
  it.each(PATH_SHAPES)('chemins de forme %s : longueur normalisée et dans l\'écran', (shape) => {
    const s = soloLayout(shape);
    expect(s.lane.cells).toBe(PATH_CELLS);
    expect(polylineLength(s.lane.points) / s.lane.cell).toBeCloseTo(PATH_CELLS, 1);
    const c = coopLayout(shape);
    expect(within(c.branchA.cells + c.trunk.cells, PATH_CELLS)).toBe(true);
    expect(within(c.branchB.cells + c.trunk.cells, PATH_CELLS)).toBe(true);
    expect(c.trunk.cells).toBeGreaterThanOrEqual(1.5);
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
  it('12 maps, 7 variantes, 3 maps Transformers et 14 arènes, identifiants uniques', () => {
    expect(MAPS.length).toBe(22);
    expect(ARENAS.length).toBe(14);
    expect(mapsForUniverse('transformers')).toHaveLength(3);
    expect(new Set(ALL_MAPS.map((m) => m.id)).size).toBe(ALL_MAPS.length);
    expect(mapsForUniverse('marvel')).toHaveLength(6);
    expect(mapsForUniverse('disney')).toHaveLength(13);
  });

  it.each(ALL_MAPS.map((m) => [m.id, m] as const))('%s : longueurs, ambiances, couches', (_id, m) => {
    expect(within(m.pathLength, PATH_CELLS)).toBe(true);
    const lc = m.pathLengthCoop!;
    expect(within(lc.a + lc.tronc, PATH_CELLS)).toBe(true);
    expect(within(lc.b + lc.tronc, PATH_CELLS)).toBe(true);
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

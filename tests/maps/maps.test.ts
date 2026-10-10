import { describe, expect, it } from 'vitest';
import { ALL_MAPS, ARENAS, ARENA_OF_BOSS, DC_ARENAS, DC_MAPS, MAPS, arenaForBoss, getMap, mapForDeck, mapsForUniverse } from '../../src/maps/index';
import { COOP_TRUNK_MIN_CELLS, PATH_CELLS, PATH_SHAPES, coopLayout, lanePoint, polylineLength, rectHitsPlay, soloLayout } from '../../src/maps/layout';
import type { BossId, UnitId } from '../../src/data/types';
import { UNIT_LIST } from '../../src/data/units';

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
  it('12 maps, 7 variantes, 6 maps DC et 13 arènes, identifiants uniques', () => {
    expect(MAPS.length).toBe(25);
    expect(ARENAS.length).toBe(13);
    expect(new Set(ALL_MAPS.map((m) => m.id)).size).toBe(ALL_MAPS.length);
    expect(mapsForUniverse('marvel')).toHaveLength(6);
    expect(mapsForUniverse('disney')).toHaveLength(13);
    expect(mapsForUniverse('dc')).toHaveLength(6);
    expect(mapsForUniverse('boss')).toHaveLength(13);
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

describe('extension DC', () => {
  it('6 maps DC débloquées par les chapitres 7 à 9, avec un modificateur et un son', () => {
    expect(DC_MAPS.map((m) => m.id)).toEqual(['gotham-nuit', 'batcave', 'metropolis', 'themyscira', 'atlantis', 'oa']);
    for (const m of DC_MAPS) {
      expect(m.universe).toBe('dc');
      expect(m.unlock.type).toBe('chapitre');
      expect(m.unlock.value).toBeGreaterThanOrEqual(7);
      expect(m.unlock.value).toBeLessThanOrEqual(9);
      expect(m.sound.length).toBeGreaterThan(0);
      expect(m.pathCoop?.tronc.length).toBeGreaterThan(1);
    }
    expect(getMap('gotham-nuit').unlock.value).toBe(7);
    expect(getMap('oa').unlock.value).toBe(9);
  });

  it('chaque héros DC est associé à exactement une map DC', () => {
    const dcHeroes = UNIT_LIST.filter((u) => u.pack === 'dc').map((u) => u.id);
    for (const id of dcHeroes) expect(DC_MAPS.filter((m) => m.heroes.includes(id)).map((m) => m.id), id).toHaveLength(1);
    for (const m of DC_MAPS) for (const h of m.heroes) expect(dcHeroes).toContain(h);
  });

  it('6 arènes DC avec effets de boss, Apokolips pour Darkseid', () => {
    expect(DC_ARENAS.map((a) => a.boss)).toEqual(['joker', 'luthor', 'bane', 'sinestro', 'blackadam', 'darkseid']);
    for (const a of DC_ARENAS) {
      expect(a.universe).toBe('boss');
      expect(a.bossFx?.effects.length).toBeGreaterThan(0);
      expect(ARENA_OF_BOSS[a.boss as BossId]).toBe(a.id);
    }
    expect(arenaForBoss('darkseid')?.name).toBe('Apokolips');
  });

  it('mapForDeck gère les decks DC', () => {
    const dc = (ids: string[]) => ids as UnitId[];
    expect(mapForDeck(dc(['batman', 'robin', 'catwoman', 'superman', 'thor'])).id).toBe('gotham-nuit');
    expect(mapForDeck(dc(['superman', 'supergirl', 'shazam', 'aquaman', 'ironman'])).id).toBe('metropolis');
    expect(mapForDeck(dc(['wonderwoman', 'aquaman', 'moana']), ['toits-new-york', 'atlantis', 'themyscira']).id).toBe('themyscira');
    expect(mapForDeck(dc(['greenlantern', 'martian', 'flash', 'batgirl', 'moana'])).id).toBe('oa');
    // maps DC encore verrouillées : repli sur une map débloquée
    expect(mapForDeck(dc(['batman', 'superman', 'flash', 'aquaman', 'cyborg']), ['toits-new-york', 'ile-motunui']).id).toBe('toits-new-york');
    // univers majoritaire DC sans map associée débloquée → première map DC débloquée
    expect(mapForDeck(dc(['batman', 'superman', 'flash', 'aquaman', 'moana']), ['toits-new-york', 'oa']).id).toBe('oa');
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

import { describe, expect, it } from 'vitest';
import { LaneSampler } from './path';
import { lanePoint, soloLayout, PATH_SHAPES } from '../maps/layout';

describe('LaneSampler', () => {
  it('suit lanePoint à moins d’un pixel logique, pour toutes les formes de chemin', () => {
    for (const shape of PATH_SHAPES) {
      const lane = soloLayout(shape).lane;
      const s = new LaneSampler(lane);
      for (let d = 0; d <= lane.cells; d += 0.37) {
        const p = lanePoint(lane, d);
        s.at(d);
        expect(Math.hypot(s.x - p.x, s.y - p.y)).toBeLessThan(1.5);
      }
    }
  });
  it('borne les distances hors du chemin', () => {
    const lane = soloLayout('u').lane;
    const s = new LaneSampler(lane);
    const a = lanePoint(lane, 0), b = lanePoint(lane, lane.cells);
    s.at(-3); expect(Math.hypot(s.x - a.x, s.y - a.y)).toBeLessThan(0.01);
    s.at(99); expect(Math.hypot(s.x - b.x, s.y - b.y)).toBeLessThan(0.01);
  });
});

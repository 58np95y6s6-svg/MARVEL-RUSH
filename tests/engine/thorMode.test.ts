// Aide de rendu thorMode : même règle que le moteur (mode actif à 1, 3, 5 ou 7 Thor, formes de chevalier).
import { describe, expect, it } from 'vitest';
import { debugPlace } from '../../src/engine/debug';
import { thorMode } from '../../src/engine';
import type { UnitId } from '../../src/data/types';
import { quiet, step } from './helpers';

const DECK: UnitId[] = ['thor', 'cmarvel', 'falcon', 'hawkeye', 'widow'];
const eng = (talents: ('a' | 'b')[] = []) => quiet(DECK, {}, { levels: { thor: 9 }, talents: { thor: talents } });

describe('thorMode', () => {
  it('actif à 1 et 3 exemplaires, pas à 2 ; null hors Thor', () => {
    const e = eng();
    debugPlace(e, 0, 0, 'thor');
    debugPlace(e, 0, 5, 'cmarvel');
    expect(thorMode(e.state, e.config, 0, 0)).toEqual({ active: true, knight: null });
    expect(thorMode(e.state, e.config, 0, 5)).toBeNull();
    expect(thorMode(e.state, e.config, 0, 9)).toBeNull();
    debugPlace(e, 0, 1, 'thor');
    expect(thorMode(e.state, e.config, 0, 0)!.active).toBe(false);
    debugPlace(e, 0, 2, 'thor');
    expect(thorMode(e.state, e.config, 0, 1)!.active).toBe(true);
  });

  it('Chevalier de lumière : tous les Thor ; ténèbres : le seul chevalier, toujours actif', () => {
    const l = eng(['a']);
    debugPlace(l, 0, 0, 'thor');
    debugPlace(l, 0, 1, 'thor');
    expect(thorMode(l.state, l.config, 0, 1)).toEqual({ active: false, knight: 'lumiere' });
    const d = eng(['b']);
    debugPlace(d, 0, 0, 'thor');
    debugPlace(d, 0, 1, 'thor');
    step(d, 2);
    expect(thorMode(d.state, d.config, 0, 0)).toEqual({ active: true, knight: 'tenebres' });
    expect(thorMode(d.state, d.config, 0, 1)).toEqual({ active: false, knight: null });
  });
});

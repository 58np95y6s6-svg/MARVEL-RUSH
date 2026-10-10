// Chaque effet d'attaque émis par le moteur a une signature visuelle, et chaque unité a son cas.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { UNIT_LIST } from '../../data/units';
import { ATTACK_FX, UNIT_FX_COLOR } from '../fxTable';

const src = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');

describe('signatures visuelles', () => {
  it('couvrent tous les effets d’attaque du moteur', () => {
    const engine = src('../../engine/abilities.ts') + src('../../engine/transformers.ts') + src('../../engine/pixar.ts');
    const emitted = [...engine.matchAll(/fx: '([a-z]+:[a-z-]+)'/g), ...engine.matchAll(/fxEv\([^)]*'([a-z]+:[a-z-]+)'\)/g), ...engine.matchAll(/\? '([a-z]+:[a-z-]+)' : '([a-z]+:[a-z-]+)'/g)].flatMap((m) => m.slice(1).filter(Boolean) as string[]);
    expect(emitted.length).toBeGreaterThan(20);
    for (const fx of emitted) expect(ATTACK_FX as readonly string[]).toContain(fx);
  });

  it('ont un cas et une couleur pour chacune des unités', () => {
    const sig = src('./signatures.ts');
    for (const u of UNIT_LIST) {
      expect(sig.includes(`case '${u.id}':`), u.id).toBe(true);
      expect(UNIT_FX_COLOR[u.id], u.id).toBeTypeOf('number');
    }
  });
});

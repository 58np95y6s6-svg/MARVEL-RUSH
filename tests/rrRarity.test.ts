// Revue des raretés (octobre 2026) : chaque héros reprend une unité Rush Royale de même rareté.
import { describe, expect, it } from 'vitest';
import { RR_RARITY_GAPS, UNIT_LIST } from '../src/data/units';

const SAME: Record<string, readonly string[]> = { rare: ['commune', 'rare'], epique: ['epique'], legendaire: ['legendaire'] };

describe('unités Rush Royale copiées', () => {
  it('chaque héros a son unité Rush Royale, chacune utilisée une seule fois', () => {
    for (const u of UNIT_LIST) expect(u.rr, u.id).toBeDefined();
    const ids = UNIT_LIST.map((u) => u.rr!.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z-]*$/);
  });

  it('même rareté que l’unité Rush Royale (Rare ↔ commune ou rare), sauf écarts justifiés', () => {
    for (const u of UNIT_LIST) {
      const ok = SAME[u.rarity]!.includes(u.rr!.rarity);
      if (RR_RARITY_GAPS[u.id]) expect(ok, `${u.id} : écart déclaré mais raretés égales`).toBe(false);
      else expect(ok, `${u.id} : ${u.rarity} copie ${u.rr!.name} (${u.rr!.rarity})`).toBe(true);
    }
  });
});

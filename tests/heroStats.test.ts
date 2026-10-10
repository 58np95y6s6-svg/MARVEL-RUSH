// Chiffres de la fiche de héros (onglets Principal et Stats), façon fiche d'unité de Rush Royale.
import { describe, expect, it } from 'vitest';
import { abilityStats, coreStats } from '../src/ui/heroStats';
import { UNITS, UNIT_IDS } from '../src/data/units';

const base = { level: 1, rank: 1, powerUp: 1, stars: 0 };

describe('fiche de héros : statistiques', () => {
  it('Thor (Inquisiteur) : Offensif avec le gain du niveau suivant, intervalles, chiffres de la fiche Rush Royale', () => {
    const c = coreStats('thor', base);
    expect(c.offense.value).toBe('189');
    expect(c.offense.next).toBe('+19');
    expect(c.interval.value).toBe('1 s');
    const ab = Object.fromEntries(abilityStats('thor', base).map((t) => [t.key, t.value]));
    expect(ab.rampPerHit).toBe('15 %');
    expect(ab.rampMax).toBe('600 %');
    expect(ab.areaDamage).toBe('50 %');
    expect(ab.activeAttackSpeed).toBe('0,6 s');
  });

  it('les aperçus suivent le rang, l’amélioration en partie et le niveau', () => {
    expect(coreStats('thor', { ...base, rank: 2 }).interval.value).toBe('0,5 s');
    expect(coreStats('thor', { ...base, powerUp: 2 }).offense.value).toBe(String(Math.round(189 * 1.15)));
    expect(coreStats('thor', { ...base, level: 10 }).offense.next).toBeUndefined();
    // Talent Ronin (palier 3) : limite 800 %.
    const ronin = abilityStats('thor', { ...base, level: 9, talents: ['a', 'a', 'a'] }).find((t) => t.key === 'rampMax')!;
    expect(ronin.value).toBe('800 %');
    // Les tableaux par niveau de Rush Royale ressortent en vert (gain au niveau suivant).
    expect(abilityStats('spiderman', base).find((t) => t.key === 'netDamage')!.next).toBe('+19');
  });

  it('extension DC : chaque héros DC a des chiffres de compétence sur sa fiche', () => {
    const dc = UNIT_IDS.filter((id) => UNITS[id].pack === 'dc');
    expect(dc.length).toBe(15);
    for (const id of dc) {
      const ab = abilityStats(id, base);
      expect(ab.length, id).toBeGreaterThan(0);
      for (const t of ab) expect(t.value, `${id}.${t.key}`).not.toMatch(/NaN|undefined/);
    }
    const bat = Object.fromEntries(abilityStats('batman', base).map((t) => [t.key, t]));
    expect(bat.executeThreshold!.value).toBe('20,5 %');
    expect(bat.executeThreshold!.next).toBe('+1,5 %');
    expect(abilityStats('harley', { ...base, rank: 3 }).find((t) => t.key === 'sacrificeMana')!.value).toBe('45');
    expect(abilityStats('catwoman', { ...base, rank: 2 }).find((t) => t.key === 'manaPerKill')!.value).toBe('4');
  });
});

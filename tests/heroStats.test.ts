// Chiffres de la fiche de héros (onglets Principal et Stats), façon fiche d'unité de Rush Royale.
import { describe, expect, it } from 'vitest';
import { abilityStats, coreStats } from '../src/ui/heroStats';

const base = { level: 1, rank: 1, powerUp: 1, stars: 0 };

describe('fiche de héros : statistiques', () => {
  it('Thor (Inquisiteur) : Offensif avec le gain du niveau suivant, intervalles, chiffres de la fiche Rush Royale', () => {
    const c = coreStats('thor', base);
    expect(c.offense.value).toBe('189');
    expect(c.offense.next).toBe('+129'); // fiche de l'Inquisiteur : +129 par niveau
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
    expect(abilityStats('bucky', base).find((t) => t.key === 'executeThreshold')!.next).toBe('+1,5 %');
    expect(coreStats('bucky', base).offense.next).toBe('+19'); // Bourreau : +18,5 par niveau
    // Catapulte (Spider-Man) : le rang multiplie les dégâts, pas la cadence.
    expect(coreStats('spiderman', { ...base, rank: 3 }).offense.value).toBe('300');
    expect(coreStats('spiderman', { ...base, rank: 3 }).interval.value).toBe('2 s');
  });
});

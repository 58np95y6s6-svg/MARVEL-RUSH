// Garde-fous du rythme de l'économie (docs/equilibrage.md §6), avec les vraies règles et un joueur régulier.
import { describe, expect, it } from 'vitest';
import { daysPerTenPull, infiniteWave, simulateEconomy } from '../../src/meta/economySim';

describe('simulation de l’économie (joueur régulier)', () => {
  it('vague atteinte en Solo Infini selon le jour', () => {
    expect(infiniteWave(7)).toBe(16);
    expect(infiniteWave(60)).toBe(30);
    expect(infiniteWave(240)).toBe(50);
  });

  it('rythme : ★1 la 1re ou 2e semaine, ★5 Rare en 2 à 3 mois, pluie de tirages au début puis un lot tous les 3 à 4 jours', () => {
    const runs = [1, 2, 3].map((seed) => simulateEconomy({ days: 120, seed, focus: 'rare' }));
    for (const r of runs) {
      expect(r.firstStar1).not.toBeNull();
      expect(r.firstStar1!).toBeLessThanOrEqual(12);
      expect(r.rareStar5).not.toBeNull();
      expect(r.rareStar5!).toBeGreaterThanOrEqual(55);
      expect(r.rareStar5!).toBeLessThanOrEqual(100);
      // Jours 1 à 14 (achetés + offerts) : 2 à 3 lots par jour la 1re semaine, puis moins.
      const lots = (a: number, b: number) => (r.days[b - 1]!.pulls - (a > 1 ? r.days[a - 2]!.pulls : 0)) / 10;
      expect(lots(1, 7)).toBeGreaterThanOrEqual(14);
      expect(lots(1, 7)).toBeLessThanOrEqual(28);
      expect(lots(8, 14)).toBeLessThan(lots(1, 7));
      expect(lots(8, 14)).toBeGreaterThanOrEqual(5);
      const per = daysPerTenPull(r, 31, 120);
      expect(per).toBeGreaterThanOrEqual(2.5);
      expect(per).toBeLessThanOrEqual(4.5);
    }
  });

  it('★10 sur un Légendaire : pas avant 8 mois', () => {
    for (const seed of [1, 2]) {
      const r = simulateEconomy({ days: 245, seed, focus: 'legendaire' });
      expect(r.legendaryStar10).toBeNull();
    }
  }, 20000);
});

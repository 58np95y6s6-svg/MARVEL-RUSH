// Gemmes du début de partie : première victoire (ch. 1-3), calendrier de bienvenue, rattrapage des profils existants.
import { describe, expect, it } from 'vitest';
import { blankProfile, migrateProfile, type Profile } from '../../src/meta/profile';
import {
  FIRST_CLEAR_GEMS, QUEST_ROOKIE_GEMS, QUEST_ROOKIE_LEVEL, WELCOME_CALENDAR, applyRetroGems, claimWelcome, firstClearGems,
  questRookieGems, retroFirstClearGems, threeStarGems, welcomeNext, welcomeReady, xpAtLevel,
} from '../../src/meta/gems';
import { accountLevel } from '../../src/meta/economy';

describe('gemmes du début de partie', () => {
  it('première victoire : 400 / 300 / 150 gemmes aux chapitres 1 à 3, rien ensuite ; 3 ★ plus généreuses au début', () => {
    expect(FIRST_CLEAR_GEMS).toEqual([400, 300, 150]);
    expect([1, 2, 3, 4, 6].map(firstClearGems)).toEqual([400, 300, 150, 0, 0]);
    expect([1, 2, 3, 4].map(threeStarGems)).toEqual([30, 30, 15, 5]);
    // ≈ un lot de 10 (900 gemmes) tous les 2 à 3 niveaux aux chapitres 1 et 2
    expect(900 / firstClearGems(1)).toBeLessThanOrEqual(3);
    expect(900 / firstClearGems(2)).toBeLessThanOrEqual(3);
  });

  it('bonus débutant des quêtes : jusqu’au niveau de compte 15 (formule de niveau identique)', () => {
    for (const lv of [2, 10, 15, 30]) expect(accountLevel(xpAtLevel(lv)).level).toBe(lv);
    expect(questRookieGems(0)).toBe(QUEST_ROOKIE_GEMS);
    expect(questRookieGems(xpAtLevel(QUEST_ROOKIE_LEVEL) - 1)).toBe(QUEST_ROOKIE_GEMS);
    expect(questRookieGems(xpAtLevel(QUEST_ROOKIE_LEVEL))).toBe(0);
  });

  it('calendrier de bienvenue : un jour par jour de connexion, gemmes et lots de 10 offerts', () => {
    const p = blankProfile('T', 'spiderman');
    const gems0 = p.shards;
    expect(welcomeNext(p)?.day).toBe(1);
    expect(claimWelcome(p, '2026-10-10')).toMatchObject({ day: 1, gems: 300, pulls: 10 });
    expect(claimWelcome(p, '2026-10-10')).toBeNull(); // un seul par jour
    expect(welcomeReady(p, '2026-10-10')).toBe(false);
    // Sauter des jours ne fait rien perdre : on reprend au jour 2.
    expect(claimWelcome(p, '2026-10-14')?.day).toBe(2);
    for (let d = 15; d <= 19; d++) claimWelcome(p, `2026-10-${d}`);
    expect(p.welcome?.claimed).toBe(7);
    expect(welcomeNext(p)).toBeNull();
    expect(claimWelcome(p, '2026-10-25')).toBeNull();
    const gems = WELCOME_CALENDAR.reduce((n, d) => n + d.gems, 0);
    const pulls = WELCOME_CALENDAR.reduce((n, d) => n + (d.pulls ?? 0), 0);
    expect(gems).toBe(3300);
    expect(pulls).toBe(30);
    expect(p.shards).toBe(gems0 + gems);
    expect((p.pendingPulls ?? []).reduce((n, f) => n + f.count, 0)).toBe(pulls);
  });

  it('profil existant : rattrapage complet des premières victoires, une seule fois ; calendrier ouvert', () => {
    const old = blankProfile('Ancien', 'thor') as Profile;
    delete old.gemsRetro;
    old.shards = 100;
    old.campaign = {
      'c1-n1': { stars: [true, false, false] }, 'c1-n2': { stars: [true, true, true] },
      'c2-n1': { stars: [true, false, false] }, 'c3-n4': { stars: [true, false, false] }, 'c4-n1': { stars: [true, false, false] },
      'c2-n2': { stars: [false, false, false] },
    };
    expect(retroFirstClearGems(old)).toBe(400 + 400 + 300 + 150);
    expect(migrateProfile(old)).toBe(true);
    expect(old.shards).toBe(100 + 1250);
    expect(old.gemsRetro).toBe(true);
    expect(migrateProfile(old)).toBe(false);
    expect(applyRetroGems(old)).toBe(0);
    expect(old.shards).toBe(1350);
    expect(welcomeNext(old)?.day).toBe(1);
    // Un nouveau profil n'a pas de rattrapage à recevoir.
    expect(blankProfile('Neuf', 'thor').gemsRetro).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { BOSSES, ROTATING_BOSSES } from '../../src/data/bosses';
import { STARTER_DECKS } from '../../src/data/units';
import { bossWaveKind, createEngine } from '../../src/engine';
import { hasMap } from '../../src/maps';
import {
  CHAPTERS, LEVELS, chapterLevels, constraintLabel, getLevel, levelConfig, levelId, nextLevel,
} from '../../src/campaign/levels';
import {
  campaignTotals, chapterStars, constraintMet, currentChapter, evaluateStars, isChapterUnlocked, isLevelUnlocked,
  levelRewards, recordLevel, totalStars, type Progress, type Stars,
} from '../../src/campaign/progress';
import type { BattleOutcome } from '../../src/campaign/tracker';
import type { Profile } from '../../src/meta/profile';

const DECK = STARTER_DECKS.marvel;

function outcome(over: Partial<BattleOutcome> = {}): BattleOutcome {
  return {
    won: true, wave: 3, livesLeft: 3, deck: DECK.slice(), seed: 1,
    summons: 10, merges: 4, maxRank: 3, maxPowerup: 1, bossKills: [], leaked: {},
    bossDestroyed: 0, bossDowngraded: 0, maxSleep: 0, endMana: 50, emptyCells: 3, time: 90,
    ...over,
  };
}

/** Progression où les niveaux donnés sont gagnés avec les étoiles données. */
function progress(entries: [string, Stars][]): Progress {
  const p: Progress = { campaign: {}, campaignChests: {}, heroes: {} };
  for (const [id, stars] of entries) p.campaign[id] = { stars };
  return p;
}
const ALL3: Stars = [true, true, true];
const winAll = (chapters: number[], stars: Stars = ALL3): [string, Stars][] =>
  chapters.flatMap((c) => chapterLevels(c).map((l): [string, Stars] => [l.id, stars]));

describe('données de la campagne', () => {
  it('9 chapitres × 10 niveaux (6 + 3 Pixar, numérotés 13 à 15), identifiants c<ch>-n<n>', () => {
    expect(CHAPTERS).toHaveLength(9);
    expect(LEVELS).toHaveLength(90);
    expect(CHAPTERS.map((c) => c.n)).toEqual([1, 2, 3, 4, 5, 6, 13, 14, 15]);
    for (const ch of CHAPTERS) {
      const ls = chapterLevels(ch.n);
      expect(ls.map((l) => l.id)).toEqual(Array.from({ length: 10 }, (_, i) => `c${ch.n}-n${i + 1}`));
    }
  });

  it('maps et boss existent, chaque contrainte a un libellé', () => {
    for (const l of LEVELS) {
      expect(hasMap(l.map), l.id).toBe(true);
      expect(l.map.startsWith('arene-'), l.id).toBe(false);
      if (l.boss) {
        expect(BOSSES[l.boss.id], l.id).toBeDefined();
        expect(hasMap(BOSSES[l.boss.id].arenaMapId)).toBe(true);
      }
      expect(constraintLabel(l.bonus, l).length).toBeGreaterThan(5);
    }
  });

  it('courbe du doc : 10 à 15 vagues au chapitre 1, puis de plus en plus ; effectif et PV en hausse régulière', () => {
    const ranges: Record<number, [number, number]> = {
      1: [10, 15], 2: [15, 20], 3: [20, 25], 4: [25, 30], 5: [30, 40], 6: [40, 50], 13: [150, 160], 14: [160, 175], 15: [175, 200],
    };
    for (const ch of CHAPTERS) {
      const [w0, w1] = ranges[ch.n]!;
      const ls = chapterLevels(ch.n);
      for (const l of ls) {
        expect(l.waves, l.id).toBeGreaterThanOrEqual(w0);
        expect(l.waves, l.id).toBeLessThanOrEqual(w1);
      }
      // Les vagues montent de niveau en niveau (1→5 et 6→10) ; les niveaux de boss sont en haut de la fourchette.
      for (let i = 1; i < 10; i++) if (i !== 5) expect(ls[i]!.waves, ls[i]!.id).toBeGreaterThanOrEqual(ls[i - 1]!.waves);
      expect(ls[9]!.waves).toBe(w1);
      expect(ls[4]!.waves).toBeGreaterThanOrEqual(w1 - 5);
      expect(ls[4]!.waves).toBe(Math.max(...ls.slice(0, 5).map((l) => l.waves)));
    }
    // Multiplicateurs strictement croissants sur les 60 niveaux.
    for (let i = 1; i < LEVELS.length; i++) {
      const a = LEVELS[i - 1]!, b = LEVELS[i]!;
      expect(b.hpMul, b.id).toBeGreaterThan(a.hpMul);
      expect(b.countMul, b.id).toBeGreaterThanOrEqual(a.countMul);
      expect(b.bossHpMul, b.id).toBeGreaterThanOrEqual(a.bossHpMul);
    }
    expect(LEVELS[59]!.countMul).toBeGreaterThan(LEVELS[0]!.countMul);
    expect(LEVELS[59]!.bossHpMul).toBeGreaterThan(LEVELS[0]!.bossHpMul);
    expect(getLevel('c1-n1')).toMatchObject({ map: 'toits-new-york', waves: 10 });
    expect(getLevel('c6-n10')).toMatchObject({ waves: 50, boss: { id: 'thanos', wave: 50 } });
  });

  it('les configurations se construisent et le moteur démarre', () => {
    for (const l of LEVELS) {
      const cfg = levelConfig(l, DECK, null, 42);
      expect(cfg).toMatchObject({ mode: 'solo', mapId: l.map, targetWaves: l.waves, mapModifiers: {} });
      expect(cfg.script).toMatchObject({ enemyHpMultiplier: l.hpMul, enemyCountMultiplier: l.countMul, bossHpMultiplier: l.bossHpMul, waveHpGrowth: l.growth });
      const e = createEngine(cfg);
      for (let i = 0; i < 40; i++) e.tick();
      expect(e.state.wave).toBe(1);
    }
  });

  it('rythme des boss conforme (§4.3), le boss ou lieutenant imposé à la dernière vague des niveaux de boss', () => {
    for (const l of LEVELS) {
      const cfg = levelConfig(l, DECK, null, 7);
      const kinds = Array.from({ length: l.waves }, (_, i) => bossWaveKind(cfg, i + 1));
      const expected = Array.from({ length: l.waves }, (_, i) => {
        const w = i + 1;
        if (l.boss && w === l.boss.wave) return l.boss.kind === 'lieutenant' ? 'petit' : 'gros';
        return w % 10 === 0 ? 'gros' : w % 5 === 0 ? 'petit' : null;
      });
      expect(kinds, l.id).toEqual(expected);
      if (l.waves < 5) expect(kinds.every((k) => k === null)).toBe(true);
      if (l.waves >= 10) expect(kinds).toContain('gros');
    }
  });

  it('niveaux 5 : lieutenant du boss du chapitre à la dernière vague ; niveaux 10 : boss du chapitre, fin à sa mort', () => {
    for (const ch of CHAPTERS) {
      const l5 = getLevel(levelId(ch.n, 5))!;
      expect(l5.boss).toMatchObject({ kind: 'lieutenant', id: ch.lieutenantOf, wave: l5.waves });
      const c5 = levelConfig(l5, DECK, null, 3);
      expect(c5.script).toMatchObject({ miniBoss: ch.lieutenantOf, bossAtWave: l5.waves, endOnBossKill: true });
      expect(c5.script?.excludeBosses).toContain(ch.lieutenantOf);
      const l10 = getLevel(levelId(ch.n, 10))!;
      expect(l10.boss).toMatchObject({ kind: 'boss', id: ch.boss, wave: l10.waves });
      expect(levelConfig(l10, DECK, null, 3).script).toMatchObject({ bossId: ch.boss, bossAtWave: l10.waves, endOnBossKill: true });
    }
    expect(getLevel('c6-n10')!.boss!.id).toBe('thanos');
    expect(getLevel('c6-n8')!.boss).toMatchObject({ id: 'malefique', wave: getLevel('c6-n8')!.waves });
  });

  it('le boss du chapitre est retiré de la rotation jusqu’à son niveau', () => {
    for (const ch of CHAPTERS.slice(0, 5)) {
      for (const l of chapterLevels(ch.n)) expect(l.exclude, l.id).toEqual([ch.boss]);
    }
    for (const n of [1, 7, 8]) expect(getLevel(`c6-n${n}`)!.exclude).toEqual(['malefique']);
    expect(getLevel('c6-n9')!.exclude).toBeUndefined();
    expect(ROTATING_BOSSES).not.toContain('thanos');
    // Chapitres Pixar : rotation complète, sans le boss intermédiaire ni le boss du chapitre.
    expect(getLevel('c13-n3')!.exclude).toEqual(['randall', 'syndrome']);
    expect(getLevel('c15-n10')!.exclude).toEqual(['lotso', 'zurg']);
    expect(levelConfig(getLevel('c13-n1')!, DECK, null, 1).bossPool).toBe('tous');
    expect(levelConfig(getLevel('c1-n1')!, DECK, null, 1).bossPool).toBe('marvel-disney');
    expect(getLevel('c15-n10')!.boss).toMatchObject({ id: 'zurg', wave: 200 });
    expect(getLevel('c14-n8')!.boss).toMatchObject({ id: 'hopper', wave: 172 });
  });

  it('nextLevel enchaîne les chapitres', () => {
    expect(nextLevel(getLevel('c1-n9')!)!.id).toBe('c1-n10');
    expect(nextLevel(getLevel('c1-n10')!)!.id).toBe('c2-n1');
    // Extension Pixar : le chapitre 13 suit le dernier chapitre installé (6 sans les extensions DC et Transformers).
    expect(nextLevel(getLevel('c6-n10')!)!.id).toBe('c13-n1');
    expect(nextLevel(getLevel('c13-n10')!)!.id).toBe('c14-n1');
    expect(nextLevel(getLevel('c15-n10')!)).toBeNull();
  });

  it('niveaux de collection, talents et éveils du profil passent au moteur', () => {
    const profile = { heroes: { spiderman: { level: 4, cards: 0, awakening: 2, talents: [1, 0, null] } } } as unknown as Profile;
    const cfg = levelConfig(getLevel('c1-n1')!, DECK, profile, 1);
    expect(cfg.players[0]).toMatchObject({ levels: { spiderman: 4 }, talents: { spiderman: ['b', 'a'] }, awakening: { spiderman: 2 } });
  });
});

describe('étoiles', () => {
  const l1 = getLevel('c1-n1')!; // fusionner 3 fois
  it('défaite : aucune étoile', () => {
    expect(evaluateStars(l1, outcome({ won: false }))).toEqual([false, false, false]);
  });
  it('★★ avec au moins 2 vies, ★★★ indépendante de la 2e', () => {
    expect(evaluateStars(l1, outcome({ livesLeft: 3, merges: 3 }))).toEqual([true, true, true]);
    expect(evaluateStars(l1, outcome({ livesLeft: 1, merges: 5 }))).toEqual([true, false, true]);
    expect(evaluateStars(l1, outcome({ livesLeft: 2, merges: 2 }))).toEqual([true, true, false]);
  });
  it('contraintes', () => {
    const lv = (id: string) => getLevel(id)!;
    const met = (id: string, o: Partial<BattleOutcome>) => constraintMet(lv(id).bonus, outcome(o), lv(id));
    expect(met('c1-n2', { livesLeft: 3 })).toBe(true);
    expect(met('c1-n2', { livesLeft: 2 })).toBe(false);
    expect(met('c1-n3', { maxPowerup: 3 })).toBe(true);
    expect(met('c1-n3', { maxPowerup: 2 })).toBe(false);
    expect(met('c1-n4', { maxRank: 3 })).toBe(true);
    expect(met('c1-n5', { bossKills: [{ boss: 'bouffon', small: true, wave: 15, time: 24 }] })).toBe(true);
    expect(met('c1-n5', { bossKills: [{ boss: 'bouffon', small: true, wave: 15, time: 26 }] })).toBe(false);
    expect(met('c1-n5', { bossKills: [{ boss: 'galactus', small: true, wave: 5, time: 10 }] })).toBe(false);
    expect(met('c1-n6', { summons: 29 })).toBe(true);
    expect(met('c1-n6', { summons: 30 })).toBe(false);
    expect(met('c1-n8', { deck: DECK })).toBe(true);
    expect(met('c1-n8', { deck: STARTER_DECKS.disney })).toBe(false);
    expect(met('c1-n9', { emptyCells: 2 })).toBe(true);
    expect(met('c1-n10', { bossKills: [{ boss: 'bouffon', small: true, wave: 5, time: 10 }, { boss: 'bouffon', small: false, wave: 15, time: 39 }] })).toBe(true);
    expect(met('c1-n10', { bossKills: [{ boss: 'bouffon', small: true, wave: 5, time: 10 }] })).toBe(false);
    expect(met('c2-n3', { deck: ['loki', 'hawkeye', 'falcon', 'cmarvel', 'widow'] })).toBe(true);
    expect(met('c2-n3', { deck: DECK })).toBe(false);
    expect(met('c2-n6', { maxPowerup: 2 })).toBe(true);
    expect(met('c2-n6', { maxPowerup: 3 })).toBe(false);
    expect(met('c2-n8', { deck: ['widow', 'hawkeye', 'bucky', 'falcon', 'cmarvel'] })).toBe(true);
    expect(met('c2-n8', { deck: DECK })).toBe(false);
    expect(met('c2-n9', { bossDestroyed: 1 })).toBe(false);
    expect(met('c3-n1', { deck: ['moana', 'maui', 'hawkeye', 'falcon', 'cmarvel'] })).toBe(true);
    expect(met('c3-n4', { deck: ['moana', 'ariel', 'cmarvel', 'falcon', 'merida'] })).toBe(true);
    expect(met('c3-n4', { deck: ['cmarvel', 'falcon', 'merida', 'foxhound', 'mulan'] })).toBe(false);
    expect(met('c3-n8', { deck: ['moana', 'maui', 'ariel', 'falcon', 'cmarvel'] })).toBe(true);
    expect(met('c3-n9', { endMana: 300 })).toBe(true);
    expect(met('c4-n4', { leaked: { blinde: 1 } })).toBe(false);
    expect(met('c4-n4', { leaked: { normal: 2 } })).toBe(true);
    expect(met('c5-n3', { leaked: { bouclier: 1 } })).toBe(false);
    expect(met('c5-n8', { bossDowngraded: 1 })).toBe(false);
    expect(met('c5-n9', { deck: ['spiderman', 'moana', 'hawkeye', 'falcon', 'cmarvel'] })).toBe(true);
    expect(met('c5-n9', { deck: DECK })).toBe(false);
    expect(met('c6-n3', { maxSleep: 3 })).toBe(true);
    expect(met('c6-n3', { maxSleep: 3.5 })).toBe(false);
    expect(met('c6-n9', { deck: ['widow', 'hawkeye', 'bucky', 'falcon', 'cap'] })).toBe(true); // Agents + Ailes
  });
});

describe('déblocage', () => {
  it('niveaux l’un après l’autre', () => {
    const p = progress([['c1-n1', [true, false, false]]]);
    expect(isLevelUnlocked(p, 'c1-n1')).toBe(true);
    expect(isLevelUnlocked(p, 'c1-n2')).toBe(true);
    expect(isLevelUnlocked(p, 'c1-n3')).toBe(false);
    expect(isLevelUnlocked(progress([]), 'c2-n1')).toBe(false);
  });
  it('seuils d’étoiles 0 / 30 / 60 / 95 / 130 et niveau 10 précédent gagné', () => {
    // Chapitres Pixar : étoiles des chapitres d'avant − 15 (165 après Thanos sans les autres extensions).
    expect(CHAPTERS.map((c) => c.unlockStars)).toEqual([0, 0, 30, 60, 95, 130, 165, 195, 225]);
    expect(isChapterUnlocked(progress(winAll([1, 2, 3, 4, 5, 6])), 13)).toBe(true);
    expect(isChapterUnlocked(progress(winAll([1, 2, 3, 4, 5, 6], [true, false, false])), 13)).toBe(false);
    // Chapitre 2 : niveau 10 du ch. 1 suffit (même à 1 étoile).
    const ch1min = progress(winAll([1], [true, false, false]));
    expect(isChapterUnlocked(ch1min, 2)).toBe(true);
    expect(isChapterUnlocked(progress(winAll([1]).slice(0, 9)), 2)).toBe(false);
    // Chapitre 3 : 30 étoiles.
    const twoChaptersMin = progress(winAll([1, 2], [true, false, false])); // 20 ★
    expect(totalStars(twoChaptersMin)).toBe(20);
    expect(isChapterUnlocked(twoChaptersMin, 3)).toBe(false);
    const enough = progress([...winAll([1]), ...winAll([2], [true, false, false])]); // 30 + 10
    expect(isChapterUnlocked(enough, 3)).toBe(true);
    // Chapitre 6 : 130 étoiles.
    const five = progress([...winAll([1, 2, 3, 4]), ...winAll([5], [true, false, false])]); // 120 + 10
    expect(totalStars(five)).toBe(130);
    expect(isChapterUnlocked(five, 6)).toBe(true);
    five.campaign['c5-n9'] = { stars: [true, false, false] };
    five.campaign['c4-n1'] = { stars: [true, true, false] };
    expect(isChapterUnlocked(five, 6)).toBe(false);
    expect(currentChapter(progress([]))).toBe(1);
    expect(currentChapter(enough)).toBe(3);
  });
});

describe('récompenses', () => {
  const l = (id: string) => getLevel(id)!;
  it('or : 20 par étoile nouvelle, 8 par étoile refaite, pour 10 vagues (× vagues / 10) ; 2 gemmes par étoile nouvelle ; XP', () => {
    const first = levelRewards(l('c1-n1'), [true, true, false], progress([]), DECK); // 10 vagues
    expect(first.total.gold).toBe(40);
    expect(first.total.shards).toBe(4 + 400); // + première victoire du chapitre 1 (400 gemmes)
    expect(first.lines.find((x) => x.kind === 'gemmes')?.reward.shards).toBe(400);
    expect(first.total.xp).toBe(20 + 20);
    expect(first.firstWin).toBe(true);
    expect(first.chest).toEqual({ tier: 'bois', scale: 1, crystals: 0 });
    const replay = levelRewards(l('c1-n1'), [true, true, true], progress([['c1-n1', [true, true, false]]]), DECK);
    // 8 + 8 (refaites) + 20 (nouvelle) ; 2 gemmes ; bonus premières 3 étoiles : +150 or, +30 gemmes (ch. 1-2)
    expect(replay.total.gold).toBe(8 + 8 + 20 + 150);
    expect(replay.total.shards).toBe(2 + 30);
    expect(replay.total.xp).toBe(20 + 10);
    expect(replay.chest).toEqual({ tier: 'bois', scale: 0.5, crystals: 0 }); // 3 ★ (+1) mais rejoué (−1)
    const long = levelRewards(l('c6-n9'), [true, false, false], progress([]), DECK); // 48 vagues
    expect(long.total.gold).toBe(Math.round(20 * 4.8));
    expect(long.total.shards).toBe(2); // pas de bonus de première victoire après le chapitre 3
    expect(levelRewards(l('c2-n1'), [true, false, false], progress([]), DECK).total.shards).toBe(2 + 300);
    expect(levelRewards(l('c3-n1'), [true, false, false], progress([]), DECK).total.shards).toBe(2 + 150);
    expect(long.total.xp).toBe(Math.round(30 * 4.8));
    expect(replay.firstWin).toBe(false);
    expect(levelRewards(l('c1-n1'), [false, false, false], progress([]), DECK).total).toEqual({});
  });
  it('niveau 5 et niveau 10, première victoire', () => {
    const r5 = levelRewards(l('c1-n5'), [true, false, false], progress([]), DECK);
    expect(r5.total.scrolls).toBe(1);
    expect(r5.total.cards?.[0]?.count).toBe(10);
    expect(DECK).toContain(r5.total.cards?.[0]?.unit);
    const r10 = levelRewards(l('c1-n10'), [true, false, false], progress([]), DECK);
    expect(r10.total).toMatchObject({ scrolls: 2, shards: 100 + 2 + 400, gold: 30, heroes: ['spiderman'], xp: 45 * 2 }); // 15 vagues
    expect(r10.chest).toEqual({ tier: 'or', scale: 1, crystals: 20 }); // bois + 2 (boss)
    const owner = { ...progress([]), heroes: { spiderman: { level: 1, cards: 0, awakening: 0, talents: [null, null, null] } } } as Progress;
    expect(levelRewards(l('c1-n10'), [true, false, false], owner, DECK).total.heroes).toEqual(['venom']);
    expect(levelRewards(l('c3-n10'), [true, false, false], progress([]), DECK).total.heroes).toEqual(['moana']);
    expect(levelRewards(l('c6-n10'), [true, false, false], progress([]), DECK).total).toMatchObject({ heroes: ['coco'], crystals: 100 });
    // Extension Pixar : coffres héroïques, Zurg donne aussi 100 ✦.
    expect(levelRewards(l('c13-n1'), [true, false, false], progress([]), DECK).chest?.tier).toBe('heroique');
    const zg = levelRewards(l('c15-n10'), [true, false, false], progress([]), DECK);
    expect(zg.total).toMatchObject({ heroes: ['joe'], crystals: 100 });
    // Rejouer après la première victoire : plus de récompense spéciale.
    expect(levelRewards(l('c1-n10'), [true, false, false], progress([['c1-n10', [true, false, false]]]), DECK).total.scrolls).toBeUndefined();
  });
  it('25 ✦ pour 3 étoiles sur un niveau de boss, une seule fois', () => {
    expect(levelRewards(l('c1-n5'), ALL3, progress([]), DECK).total.crystals).toBe(25);
    expect(levelRewards(l('c1-n4'), ALL3, progress([]), DECK).total.crystals).toBeUndefined();
    expect(levelRewards(l('c1-n5'), ALL3, progress([['c1-n5', ALL3]]), DECK).total.crystals).toBeUndefined();
    expect(levelRewards(l('c1-n5'), [false, false, true], progress([['c1-n5', [true, true, false]]]), DECK).total.crystals).toBeUndefined();
  });
  it('coffres d’étoiles à 10, 20 et 30 étoiles du chapitre', () => {
    const p = progress(winAll([1]).slice(0, 3)); // 9 ★
    const rw = levelRewards(l('c1-n4'), [true, false, false], p, DECK);
    expect(rw.chests).toEqual(['c1-10']);
    expect(rw.lines.find((x) => x.kind === 'coffre')!.reward).toMatchObject({ gold: 400, shards: 40, scrolls: 1 });
    recordLevel(p, l('c1-n4'), rw, 4);
    expect(chapterStars(p, 1)).toBe(10);
    expect(p.campaignChests['c1-10']).toBe(true);
    expect(levelRewards(l('c1-n5'), [true, false, false], p, DECK).chests).toEqual([]);
  });
  it('campagne complète à 3 étoiles : 63 parchemins (7 par chapitre), 27 coffres, cristaux', () => {
    const t = campaignTotals();
    expect(t.scrolls).toBe(63);
    expect(t.heroes).toEqual(['spiderman', 'thor', 'moana', 'mulan', 'buzzwoody', 'coco', 'mrincredible', 'walleeve', 'joe']);
    expect(t.freePulls?.length).toBe(9);
    // 25 ✦ × 22 niveaux de boss (5 et 10 de chaque chapitre, + 8 du ch. 6 et des ch. 13 à 15) + 100 (Thanos) + 100 (Zurg)
    expect(t.crystals).toBe(25 * 22 + 200);
    // Or : 3 × 20 × (vagues / 10) par niveau + 90 × 150 (3 étoiles) + 9 × (400 + 800 + 1 200)
    const stars = LEVELS.reduce((n, lv) => n + Math.round(60 * lv.waves / 10), 0);
    expect(t.gold).toBe(stars + 90 * 150 + 9 * 2400);
    // Gemmes : 270 × 2 + 3 ★ (20 × 30 + 10 × 15 + 60 × 5) + 9 × 100 (boss) + 9 × (40 + 60 + 80)
    // + premières victoires des chapitres 1 à 3 (10 × 400 + 10 × 300 + 10 × 150)
    expect(t.shards).toBe(540 + 1050 + 900 + 1620 + 8500);
    expect(t.xp).toBe(LEVELS.reduce((n, lv) => n + Math.round(50 * lv.waves / 10) * (lv.n === 10 ? 2 : 1), 0));
  });
});

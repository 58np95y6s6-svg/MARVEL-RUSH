// Coop à deux : récompenses par palier (Coop Infini), campagne Coop (données, étoiles du duo, ouverture).
import { describe, expect, it } from 'vitest';
import { blankProfile, type Profile } from '../../src/meta/profile';
import { applyStarter } from '../../src/meta/decks';
import { seededRng } from '../../src/meta/chests';
import { COOP_TIERS, applyCoopInfiniteGame, applyCoopLevelGame, coopTiersUpTo, nextCoopTier, soloChaptersDone } from '../../src/meta/coop';
import {
  COOP_LEVELS, coopChapterOpen, coopLevelConfig, coopLevelOpen, evaluateCoopStars, getCoopLevel, type DuoStats,
} from '../../src/campaign/coopLevels';
import { LEVELS } from '../../src/campaign/levels';
import { UNITS } from '../../src/data/units';
import type { BattleStats } from '../../src/campaign/tracker';

const fresh = (): Profile => { const p = blankProfile('Léa', 'moana'); applyStarter(p, 'marvel'); return p; };
const DAY = '2026-10-10';

describe('Coop Infini : récompenses par palier', () => {
  it('table du §5.2 : bois, argent, or + Épique, héroïque, légendaire + Légendaire + cadre, puis or tous les 10', () => {
    expect(COOP_TIERS.map((t) => [t.wave, t.chest])).toEqual([[10, 'bois'], [20, 'argent'], [30, 'or'], [40, 'heroique'], [50, 'legendaire']]);
    expect(COOP_TIERS[2]!.guaranteed).toBe('epique');
    expect(COOP_TIERS[4]!.guaranteed).toBe('legendaire');
    expect(coopTiersUpTo(72).map((t) => t.wave)).toEqual([10, 20, 30, 40, 50, 60, 70]);
    expect(nextCoopTier(23).wave).toBe(30);
    expect(nextCoopTier(55).wave).toBe(60);
  });

  it('vague 35 : 3 coffres, Épique garanti, or et gemmes par vague, record du duo', () => {
    const p = fresh();
    const gold0 = p.gold, gems0 = p.shards;
    const r = applyCoopInfiniteGame(p, { wavesCleared: 35, bossKills: [{ boss: 'bouffon', small: false, wave: 10 }], partnerName: 'Max' }, seededRng(4), DAY);
    expect(r.chests.map((c) => c.content.tier)).toEqual(['bois', 'argent', 'or']);
    expect(r.heroes.some((h) => UNITS[h.unit].rarity === 'epique')).toBe(true);
    expect(p.gold).toBeGreaterThan(gold0 + 35 * 20);
    expect(p.shards).toBeGreaterThanOrEqual(gems0 + 35);
    expect(p.scrolls).toBeGreaterThanOrEqual(3);
    expect(p.coopBest).toBe(35);
    expect(p.coopHistory?.[0]).toMatchObject({ mode: 'coop-infini', wave: 35, partner: 'Max' });
    // Le même jour, les coffres de palier ne reviennent pas ; l'or par vague, si.
    const g1 = p.gold;
    const again = applyCoopInfiniteGame(p, { wavesCleared: 35, bossKills: [], partnerName: 'Max' }, seededRng(5), DAY);
    expect(again.chests).toEqual([]);
    expect(p.gold).toBe(g1 + 35 * 20);
    // Le lendemain, si.
    expect(applyCoopInfiniteGame(p, { wavesCleared: 12, bossKills: [], partnerName: 'Max' }, seededRng(6), '2026-10-11').chests.length).toBe(1);
  });

  it('vague 50 : coffre légendaire, Légendaire garanti, cadre « Vainqueur de Thanos », tirage offert au 40', () => {
    const p = fresh();
    const r = applyCoopInfiniteGame(p, { wavesCleared: 50, bossKills: [{ boss: 'thanos', small: false, wave: 50 }], partnerName: 'Max' }, seededRng(9), DAY);
    expect(r.chests.map((c) => c.content.tier)).toEqual(['bois', 'argent', 'or', 'heroique', 'legendaire']);
    expect(r.heroes.some((h) => UNITS[h.unit].rarity === 'legendaire')).toBe(true);
    expect(p.frames).toContain('thanos');
    expect(p.pendingPulls?.some((x) => x.count >= 1)).toBe(true);
  });
});

const stats = (o: Partial<BattleStats & { kills: number }> = {}): BattleStats & { kills: number; deck: never[] } => ({
  summons: 10, merges: 3, maxRank: 3, maxPowerup: 1, bossKills: [], leaked: {}, bossDestroyed: 0, bossDowngraded: 0,
  maxSleep: 0, endMana: 0, emptyCells: 0, time: 100, kills: 20, deck: [], ...o,
});

describe('Coop Niveaux', () => {
  it('60 niveaux, mêmes vagues que le Solo, maps et contraintes d’entraide du document', () => {
    expect(COOP_LEVELS).toHaveLength(60);
    expect(COOP_LEVELS.map((l) => l.waves)).toEqual(LEVELS.filter((l) => l.chapter <= 6).map((l) => l.waves));
    expect(getCoopLevel('cc1-n1')).toMatchObject({ map: 'toits-new-york', bonus: { kind: 'gifts', min: 1 } });
    expect(getCoopLevel('cc1-n10')?.boss).toMatchObject({ kind: 'boss', id: 'bouffon' });
    expect(getCoopLevel('cc6-n10')?.boss).toMatchObject({ id: 'thanos' });
    const cfg = coopLevelConfig(getCoopLevel('cc1-n5')!, 3);
    expect(cfg).toMatchObject({ targetWaves: getCoopLevel('cc1-n5')!.waves, script: { endOnBossKill: true } });
  });

  it('ouverture : chapitre fini en Solo par les deux, niveaux l’un après l’autre', () => {
    expect(coopChapterOpen(1, [1], [])).toBe(false);
    expect(coopChapterOpen(1, [1], [1, 2])).toBe(true);
    const l2 = getCoopLevel('cc1-n2')!;
    expect(coopLevelOpen(l2, {}, [1], [1])).toBe(false);
    expect(coopLevelOpen(l2, { 'cc1-n1': { stars: [true, false, false] } }, [1], [1])).toBe(true);
    const p = fresh();
    p.campaign['c1-n10'] = { stars: [true, false, false] };
    expect(soloChaptersDone(p)).toEqual([1]);
  });

  it('étoiles du duo : vies partagées et contraintes d’entraide', () => {
    const l = getCoopLevel('cc1-n1')!; // offrir au moins 1 unité
    const d: DuoStats = { won: true, livesLeft: 3, wave: 10, gifts: 1, players: [stats(), stats()] };
    expect(evaluateCoopStars(l, d)).toEqual([true, true, true]);
    expect(evaluateCoopStars(l, { ...d, gifts: 0, livesLeft: 1 })).toEqual([true, false, false]);
    expect(evaluateCoopStars(l, { ...d, won: false })).toEqual([false, false, false]);
    const share = getCoopLevel('cc1-n3')!; // chaque joueur fait au moins 30 % des éliminations
    expect(evaluateCoopStars(share, { ...d, players: [stats({ kills: 40 }), stats({ kills: 10 })] })[2]).toBe(false);
    expect(evaluateCoopStars(share, { ...d, players: [stats({ kills: 30 }), stats({ kills: 20 })] })[2]).toBe(true);
    const rank = getCoopLevel('cc1-n4')!; // les deux joueurs ont une unité de rang 3
    expect(evaluateCoopStars(rank, { ...d, players: [stats({ maxRank: 3 }), stats({ maxRank: 2 })] })[2]).toBe(false);
  });

  it('récompenses à chacun : étoiles enregistrées, coffre de victoire, coffres d’étoiles du chapitre', () => {
    const p = fresh();
    const r = applyCoopLevelGame(p, { levelId: 'cc1-n1', chapter: 1, n: 1, won: true, wave: 10, stars: [true, true, true], partnerName: 'Max' }, seededRng(2), DAY);
    expect(p.coopLevels?.['cc1-n1']?.stars).toEqual([true, true, true]);
    expect(r.chests).toHaveLength(1);
    for (let n = 2; n <= 4; n++) applyCoopLevelGame(p, { levelId: `cc1-n${n}`, chapter: 1, n, won: true, wave: 10, stars: [true, true, true], partnerName: 'Max' }, seededRng(n), DAY);
    expect(p.coopChests?.['cc1-10']).toBe(true);
    // Une défaite n'efface rien.
    applyCoopLevelGame(p, { levelId: 'cc1-n1', chapter: 1, n: 1, won: false, wave: 4, stars: [false, false, false], partnerName: 'Max' }, seededRng(1), DAY);
    expect(p.coopLevels?.['cc1-n1']?.stars).toEqual([true, true, true]);
  });
});

// Coffres, quêtes du jour, Route des récompenses, migration des monnaies (v1 → v2).
import { describe, expect, it } from 'vitest';
import { blankProfile, migrateProfile, migrationGold, START_GEMS, START_GOLD, type Profile } from '../../src/meta/profile';
import { CHESTS, CHEST_TIERS, applyChest, bossKillGold, openChest, rollChest, seededRng, upgradeTier } from '../../src/meta/chests';
import {
  QUEST_DEFS, WEEKLY_GOAL, claimQuest, claimWeekly, ensureQuests, questsClaimable, rollQuests, trackQuests, weekOf,
} from '../../src/meta/quests';
import { ROAD_FIRST, claimRoad, roadClaimable, roadReward } from '../../src/meta/road';
import { applyStarter } from '../../src/meta/decks';
import { UNITS } from '../../src/data/units';
import { levelUp } from '../../src/meta/economy';
import type { UnitId } from '../../src/data/types';

const fresh = (): Profile => { const p = blankProfile('Test', 'spiderman'); applyStarter(p, 'marvel'); return p; };

describe('monnaies et migration', () => {
  it('nouveau profil : 1 000 gemmes et 2 000 or', () => {
    const p = blankProfile('A', 'thor');
    expect(p.shards).toBe(START_GEMS);
    expect(p.gold).toBe(START_GOLD);
    expect(START_GEMS).toBe(1000);
    expect(START_GOLD).toBe(2000);
  });

  it('v1 → v2 : les éclats deviennent des gemmes, or de départ proportionnel à la progression', () => {
    const old = blankProfile('Ancien', 'thor') as Omit<Profile, 'gold'> & { gold?: number };
    delete old.gold;
    old.version = 1;
    old.shards = 4321;
    old.xp = 1500;
    old.infiniteBest = 20;
    old.campaign = { 'c1-n1': { stars: [true, true, true] }, 'c1-n2': { stars: [true, false, true] } };
    expect(migrationGold(old as Profile)).toBe(2000 + 120 * 5 + 60 * 20 + 1500);
    expect(migrateProfile(old as Profile)).toBe(true);
    expect(old.version).toBe(2);
    expect(old.shards).toBe(4321);
    expect(old.gold).toBe(5300);
    expect(migrateProfile(old as Profile)).toBe(false); // idempotente
    expect(old.gold).toBe(5300);
    // plafond
    expect(migrationGold({ campaign: {}, infiniteBest: 0, xp: 10_000_000 })).toBe(40000);
  });
});

describe('coffres', () => {
  it('table : l’or et les cartes montent avec le rang', () => {
    for (let i = 1; i < CHEST_TIERS.length; i++) {
      const a = CHESTS[CHEST_TIERS[i - 1]!], b = CHESTS[CHEST_TIERS[i]!];
      expect(b.gold).toBeGreaterThan(a.gold);
      expect(b.gems).toBeGreaterThan(a.gems);
    }
    expect(upgradeTier('bois', 2)).toBe('or');
    expect(upgradeTier('or', 9)).toBe('legendaire');
    expect(upgradeTier('argent', -5)).toBe('bois');
  });

  it('tirage déterministe (graine) : même contenu, cartes de héros possédés, or ±10 %', () => {
    const p = fresh();
    const a = rollChest(p, 'or', seededRng(42));
    const b = rollChest(p, 'or', seededRng(42));
    expect(a).toEqual(b);
    expect(a.gold).toBeGreaterThanOrEqual(450);
    expect(a.gold).toBeLessThanOrEqual(550);
    expect(a.gems).toBe(16);
    for (const c of a.cards) expect(p.heroes[c.unit]).toBeDefined();
    // rollChest ne modifie rien
    expect(p.gold).toBe(2000);
  });

  it('les piles visent d’abord le deck ; sans Légendaire possédé, la pile descend d’une rareté', () => {
    const p = fresh();
    const deck = new Set(p.decks[0]);
    let inDeck = 0, total = 0, legendary = 0;
    for (let s = 0; s < 400; s++) {
      const c = rollChest(p, 'legendaire', seededRng(s));
      for (const x of c.cards) { total += x.count; if (deck.has(x.unit)) inDeck += x.count; if (UNITS[x.unit].rarity === 'legendaire') legendary++; }
    }
    expect(legendary).toBe(0); // aucun Légendaire dans le deck de départ
    expect(inDeck / total).toBeGreaterThan(0.6);
  });

  it('crédit : or, gemmes, cristaux, cartes, nouveau héros', () => {
    const p = fresh();
    let seen: UnitId | null = null;
    for (let s = 0; s < 200 && !seen; s++) {
      const c = rollChest(p, 'legendaire', seededRng(s), { crystals: 7 });
      if (c.heroes.length) { seen = c.heroes[0]!; applyChest(p, c); expect(p.crystals).toBe(7); }
    }
    expect(seen).not.toBeNull();
    expect(p.heroes[seen!]).toMatchObject({ level: 1, cards: 0 });
    const before = { gold: p.gold, gems: p.shards };
    const c = openChest(p, 'argent', seededRng(1), { scale: 0.5 });
    expect(c.small).toBe(true);
    expect(p.gold).toBe(before.gold + c.gold);
    expect(p.shards).toBe(before.gems + c.gems);
    expect(p.chestsOpened).toBe(2);
  });

  it('butin des boss : 20 or par lieutenant, 60 par gros boss, 300 pour Thanos', () => {
    expect(bossKillGold([{ boss: 'galactus', small: true }, { boss: 'galactus', small: false }, { boss: 'thanos', small: false }])).toBe(20 + 60 + 300);
    expect(bossKillGold([])).toBe(0);
  });
});

describe('quêtes du jour', () => {
  it('3 quêtes différentes, tirées à l’identique pour un jour et un profil, sans Solo Infini s’il est fermé', () => {
    const a = rollQuests('2026-10-10', 'abc', false);
    expect(a).toHaveLength(3);
    expect(new Set(a.map((q) => q.id)).size).toBe(3);
    expect(rollQuests('2026-10-10', 'abc', false)).toEqual(a);
    for (let d = 1; d <= 28; d++) {
      expect(rollQuests(`2026-11-${String(d).padStart(2, '0')}`, 'abc', false).some((q) => q.id === 'infini')).toBe(false);
    }
  });

  it('progression, réclamation, remise à zéro à minuit', () => {
    const p = fresh();
    const q = ensureQuests(p, '2026-10-10');
    // Toutes les quêtes du pool avancent avec un événement complet.
    const done = trackQuests(p, { merges: 99, summons: 999, bossKills: 9, levelsWon: 9, waves: 999, stars: 9, upgrades: 9, infiniteWave: 99 }, '2026-10-10');
    expect(done).toHaveLength(3);
    expect(questsClaimable(p, '2026-10-10')).toBe(3);
    const gold = p.gold, gems = p.shards;
    const def = QUEST_DEFS[q.list[0]!.id as keyof typeof QUEST_DEFS];
    // Débutant (compte sous le niveau 15) : +20 gemmes par quête.
    expect(claimQuest(p, 0, '2026-10-10')).toEqual({ gold: def.reward.gold, shards: def.reward.gems + 20 });
    expect(p.gold).toBe(gold + def.reward.gold);
    expect(p.shards).toBe(gems + def.reward.gems + 20);
    expect(claimQuest(p, 0, '2026-10-10')).toBeNull(); // une seule fois
    expect(p.quests!.weekDone).toBe(1);
    // Lendemain : nouvelles quêtes à zéro, la semaine continue.
    ensureQuests(p, '2026-10-11');
    expect(p.quests!.list.every((x) => x.progress === 0 && !x.claimed)).toBe(true);
    expect(p.quests!.weekDone).toBe(1);
  });

  it('progression partielle (somme) et meilleur score (vague Infini)', () => {
    const p = fresh();
    p.campaign['c1-n10'] = { stars: [true, false, false] };
    p.quests = { day: '2026-10-10', week: weekOf('2026-10-10'), weekDone: 0, weekClaimed: false, list: [
      { id: 'fusions', target: 30, progress: 0, claimed: false },
      { id: 'infini', target: 15, progress: 0, claimed: false },
      { id: 'ameliorer', target: 1, progress: 0, claimed: false },
    ] };
    trackQuests(p, { merges: 12, infiniteWave: 9 }, '2026-10-10');
    trackQuests(p, { merges: 12, infiniteWave: 7 }, '2026-10-10');
    expect(p.quests.list.map((x) => x.progress)).toEqual([24, 9, 0]);
    expect(claimQuest(p, 0, '2026-10-10')).toBeNull();
    trackQuests(p, { merges: 10, infiniteWave: 16 }, '2026-10-10');
    expect(p.quests.list.map((x) => x.progress)).toEqual([30, 15, 0]);
  });

  it('coffre de la semaine : 12 quêtes réclamées, une fois par semaine (lundi)', () => {
    expect(weekOf('2026-10-10')).toBe('2026-10-05'); // samedi → lundi
    expect(weekOf('2026-10-12')).toBe('2026-10-12');
    const p = fresh();
    ensureQuests(p, '2026-10-10');
    p.quests!.weekDone = WEEKLY_GOAL - 1;
    expect(claimWeekly(p, seededRng(1), '2026-10-10')).toBeNull();
    p.quests!.weekDone = WEEKLY_GOAL;
    const gems = p.shards;
    const c = claimWeekly(p, seededRng(1), '2026-10-10')!;
    expect(c.tier).toBe('legendaire');
    expect(p.shards).toBe(gems + c.gems);
    expect(c.gems).toBe(60 + 150);
    expect(c.crystals).toBe(40);
    expect(claimWeekly(p, seededRng(1), '2026-10-10')).toBeNull();
    ensureQuests(p, '2026-10-12'); // nouvelle semaine
    expect(p.quests).toMatchObject({ weekDone: 0, weekClaimed: false });
  });

  it('monter un héros fait avancer « Améliore un héros »', () => {
    const p = fresh();
    const day = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
    ensureQuests(p, day);
    p.quests!.list[0] = { id: 'ameliorer', target: 1, progress: 0, claimed: false };
    const u = p.decks[0]![0]!;
    p.heroes[u]!.cards = 5;
    expect(levelUp(p, u)).toBe(true);
    expect(p.quests!.list[0]!.progress).toBe(1);
  });
});

describe('Route des récompenses', () => {
  it('chaque niveau donne de l’or ; lot de 10 tous les 10 niveaux, coffre aux 5, cadres ; niveaux 2-15 très généreux', () => {
    expect(roadReward(2)).toMatchObject({ gold: 180, gems: 200 });
    expect(roadReward(3)).toMatchObject({ gold: 220, crystals: 30, gems: 150 });
    expect(roadReward(5)).toMatchObject({ chest: 'or', pulls: 10, big: true, frame: { id: 'bronze' } });
    expect(roadReward(10)).toMatchObject({ pulls: 10, gems: 300, frame: { id: 'argent' } });
    expect(roadReward(15)).toMatchObject({ chest: 'or', pulls: 10 });
    // Ensuite, le rythme normal.
    expect(roadReward(16)).toMatchObject({ gems: 40 });
    expect(roadReward(17).gems).toBeUndefined();
    expect(roadReward(17).crystals).toBe(30);
    expect(roadReward(20)).toMatchObject({ pulls: 10 });
    expect(roadReward(20).gems).toBeUndefined();
    expect(roadReward(25).pulls).toBeUndefined();
    expect(roadReward(25).chest).toBe('heroique');
    expect(roadReward(45).chest).toBe('legendaire');
    for (let l = ROAD_FIRST; l < 80; l++) expect(roadReward(l).gold).toBeGreaterThan(0);
  });

  it('réclamer : seulement les niveaux atteints, une fois chacun', () => {
    const p = fresh();
    expect(roadClaimable(p)).toEqual([]);
    p.xp = 100 + 150 + 200 + 250; // niveau 5
    expect(roadClaimable(p)).toEqual([2, 3, 4, 5]);
    expect(claimRoad(p, 6, seededRng(1))).toBeNull();
    const gold = p.gold;
    const r = claimRoad(p, 5, seededRng(1))!;
    expect(r.chest?.tier).toBe('or');
    expect(p.gold).toBe(gold + 300 + r.chest!.gold);
    expect(p.frames).toEqual(['bronze']);
    expect(p.frame).toBe('bronze');
    expect(claimRoad(p, 5, seededRng(1))).toBeNull();
    expect(roadClaimable(p)).toEqual([2, 3, 4]);
    p.xp = 100_000;
    claimRoad(p, 10, seededRng(2));
    expect(p.pendingPulls?.some((f) => f.pack === 'choix' && f.count === 10)).toBe(true);
  });
});

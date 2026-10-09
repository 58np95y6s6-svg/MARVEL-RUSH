// Économie du méta-jeu : tirages (taux, garanties), niveaux, éveils, talents, decks, récompenses.
import { describe, expect, it } from 'vitest';
import { blankProfile, applyReward, type Profile } from '../../src/meta/profile';
import {
  AWAKENING_CRYSTAL_COSTS, LEVEL_SHARD_COSTS, accountLevel, applyInfiniteRewards, awaken, awakeningCost,
  chooseTalent, claimDailyChest, deckSlotsUnlocked, infiniteUnlocked, levelUp, levelUpCost,
} from '../../src/meta/economy';
import {
  COMPLETE_PACK, buyPulls, freePullsFor, openFreePulls, packPool, pullPacks, rollPulls, rollRarity,
} from '../../src/meta/pulls';
import { applyStarter, deckError, playerSetupFor, setDeckSlot, swapDeckSlots, teamHints } from '../../src/meta/decks';
import { AWAKENING_COPY_COSTS, LEVEL_COPY_COSTS, getHeroProgress } from '../../src/meta/collection';
import { UNIT_LIST, STARTER_DECKS } from '../../src/data/units';
import { PACK_LIST } from '../../src/data/packs';

/** Générateur déterministe (mulberry32). */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const fresh = (): Profile => blankProfile('Test', 'spiderman');

describe('packs', () => {
  it('Pack Complet en premier, puis un pack par univers de PACK_LIST', () => {
    const packs = pullPacks();
    expect(packs[0]!.id).toBe('complet');
    expect(packs.slice(1).map((p) => p.id)).toEqual(PACK_LIST.map((p) => p.id));
    expect(packPool('complet').length).toBe(UNIT_LIST.length);
    expect(packPool('marvel').every((u) => u.pack === 'marvel')).toBe(true);
    expect(COMPLETE_PACK.price1).toBe(100);
    expect(COMPLETE_PACK.price10).toBe(900);
  });

  it('taux 72 / 24 / 4', () => {
    const rng = seeded(1);
    const n = 200000;
    const c = { rare: 0, epique: 0, legendaire: 0 };
    for (let i = 0; i < n; i++) c[rollRarity(COMPLETE_PACK.rates, rng)]++;
    expect(c.rare / n).toBeCloseTo(0.72, 2);
    expect(c.epique / n).toBeCloseTo(0.24, 2);
    expect(c.legendaire / n).toBeCloseTo(0.04, 2);
  });

  it('Légendaire garanti au 40e tirage, compteur séparé par pack', () => {
    const p = fresh();
    const noLeg = () => 0.99; // toujours Rare sans garantie
    const first = rollPulls(p, 'marvel', 39, noLeg);
    expect(first.every((r) => r.rarity !== 'legendaire')).toBe(true);
    expect(p.pity['marvel']).toBe(39);
    expect(p.pity['disney'] ?? 0).toBe(0);
    const [r40] = rollPulls(p, 'marvel', 1, noLeg);
    expect(r40!.rarity).toBe('legendaire');
    expect(r40!.guaranteed).toBe('pity');
    expect(p.pity['marvel']).toBe(0);
  });

  it('un Légendaire naturel remet le compteur à zéro', () => {
    const p = fresh();
    p.pity['complet'] = 25;
    rollPulls(p, 'complet', 1, () => 0.01);
    expect(p.pity['complet']).toBe(0);
  });

  it('lot de 10 : au moins une Épique', () => {
    const p = fresh();
    const res = rollPulls(p, 'disney', 10, () => 0.99);
    expect(res).toHaveLength(10);
    expect(res.filter((r) => r.rarity === 'epique')).toHaveLength(1);
    expect(res[9]!.guaranteed).toBe('lot');
    for (let s = 0; s < 300; s++) {
      const q = fresh();
      const r = rollPulls(q, 'complet', 10, seeded(s));
      expect(r.some((x) => x.rarity !== 'rare')).toBe(true);
    }
  });

  it('prix, doublons en cartes, héros nouveaux ajoutés', () => {
    const p = fresh();
    expect(buyPulls(p, 'marvel', 10, seeded(3))).not.toBeNull();
    expect(p.shards).toBe(100);
    expect(buyPulls(p, 'marvel', 10, seeded(4))).toBeNull();
    expect(p.shards).toBe(100);
    const r = buyPulls(p, 'marvel', 1, () => 0.5)!;
    expect(p.shards).toBe(0);
    const u = r[0]!.unit;
    const before = p.heroes[u]!.cards;
    rollPulls(p, 'marvel', 1, () => 0.5);
    expect(p.heroes[u]!.cards).toBe(before + 1);
  });

  it('doublon d’un héros au maximum → 5 ✦', () => {
    const p = fresh();
    rollPulls(p, 'marvel', 1, () => 0.5);
    const u = Object.keys(p.heroes)[0] as keyof typeof p.heroes;
    Object.assign(p.heroes[u]!, { level: 10, awakening: 10 });
    const r = rollPulls(p, 'marvel', 1, () => 0.5);
    expect(r[0]!.outcome).toBe('cristaux');
    expect(p.crystals).toBe(5);
  });

  it('tirages gratuits : 10 offerts dans le pack de départ', () => {
    const p = fresh();
    applyStarter(p, 'disney');
    expect(freePullsFor(p, 'disney')).toBe(10);
    expect(freePullsFor(p, 'marvel')).toBe(0);
    const r = openFreePulls(p, 'disney', seeded(9));
    expect(r).toHaveLength(10);
    expect(r.some((x) => x.rarity !== 'rare')).toBe(true);
    expect(p.shards).toBe(1000);
    expect(freePullsFor(p, 'disney')).toBe(0);
    applyReward(p, { freePulls: [{ pack: 'choix', count: 1 }] });
    expect(freePullsFor(p, 'marvel')).toBe(1);
    expect(openFreePulls(p, 'complet', seeded(1))).toHaveLength(1);
    expect(p.pendingPulls).toEqual([]);
  });
});

describe('progression des héros', () => {
  it('coûts de niveau : cartes et éclats', () => {
    expect(LEVEL_COPY_COSTS).toEqual([1, 1, 2, 2, 2, 3, 3, 3, 4]);
    expect(LEVEL_SHARD_COSTS).toEqual([50, 100, 150, 250, 400, 600, 900, 1300, 1800]);
    const p = fresh();
    p.shards = 100000;
    p.heroes.thor = { level: 1, cards: 21, awakening: 0, talents: [null, null, null] };
    expect(levelUpCost(p.heroes.thor)).toEqual({ cards: 1, shards: 50, crystals: 0, scrolls: 0 });
    for (let i = 0; i < 9; i++) expect(levelUp(p, 'thor')).toBe(true);
    expect(p.heroes.thor.level).toBe(10);
    expect(p.heroes.thor.cards).toBe(0);
    expect(p.shards).toBe(100000 - 5550);
    expect(levelUp(p, 'thor')).toBe(false);
  });

  it('refuse sans cartes ou sans éclats, sans rien modifier', () => {
    const p = fresh();
    p.heroes.thor = { level: 1, cards: 0, awakening: 0, talents: [null, null, null] };
    expect(levelUp(p, 'thor')).toBe(false);
    p.heroes.thor.cards = 1; p.shards = 49;
    expect(levelUp(p, 'thor')).toBe(false);
    expect(p.heroes.thor).toMatchObject({ level: 1, cards: 1 });
    expect(p.shards).toBe(49);
  });

  it('éveils : niveau 10 requis, 130 copies et 24 950 ✦ au total', () => {
    expect(AWAKENING_COPY_COSTS.reduce((a, b) => a + b, 0)).toBe(130);
    expect(AWAKENING_CRYSTAL_COSTS.reduce((a, b) => a + b, 0)).toBe(24950);
    const p = fresh();
    p.heroes.hulk = { level: 9, cards: 200, awakening: 0, talents: [null, null, null] };
    p.crystals = 30000;
    expect(awakeningCost(p.heroes.hulk)).toBeNull();
    expect(awaken(p, 'hulk')).toBe(false);
    p.heroes.hulk.level = 10;
    expect(awakeningCost(p.heroes.hulk)).toEqual({ cards: 2, shards: 0, crystals: 50, scrolls: 0 });
    for (let i = 0; i < 10; i++) expect(awaken(p, 'hulk')).toBe(true);
    expect(p.heroes.hulk.awakening).toBe(10);
    expect(p.heroes.hulk.cards).toBe(70);
    expect(p.crystals).toBe(30000 - 24950);
    expect(awaken(p, 'hulk')).toBe(false);
  });

  it('talents : niveau, ordre des paliers, parchemins ; changement gratuit', () => {
    const p = fresh();
    p.heroes.thor = { level: 4, cards: 0, awakening: 0, talents: [null, null, null] };
    p.scrolls = 10;
    expect(chooseTalent(p, 'thor', 1, 0)).toBe(false);
    p.heroes.thor.level = 9;
    expect(chooseTalent(p, 'thor', 2, 0)).toBe(false); // palier 1 d'abord
    expect(chooseTalent(p, 'thor', 1, 1)).toBe(true);
    expect(p.scrolls).toBe(9);
    expect(chooseTalent(p, 'thor', 2, 0)).toBe(true);
    expect(p.scrolls).toBe(7);
    expect(chooseTalent(p, 'thor', 1, 0)).toBe(true); // changement gratuit
    expect(p.scrolls).toBe(7);
    p.scrolls = 2;
    expect(chooseTalent(p, 'thor', 3, 0)).toBe(false);
    expect(playerSetupFor(p, ['thor']).talents.thor).toEqual(['a', 'a']);
  });
});

describe('decks', () => {
  it('deck de départ, validation, placement et échange', () => {
    const p = fresh();
    applyStarter(p, 'marvel');
    expect(p.decks[0]).toEqual(STARTER_DECKS.marvel);
    expect(deckError(p, p.decks[0]!)).toBeNull();
    expect(deckError(p, ['spiderman', 'spiderman', 'falcon', 'cmarvel', 'widow'])).toMatch(/différents/);
    expect(deckError(p, ['thor', 'hawkeye', 'falcon', 'cmarvel', 'widow'])).toMatch(/collection/);
    expect(deckError(p, ['hawkeye'])).toMatch(/5 héros/);
    expect(setDeckSlot(p, 0, 0, 'thor')).toBe(false); // non possédé
    p.heroes.thor = { level: 1, cards: 0, awakening: 0, talents: [null, null, null] };
    expect(setDeckSlot(p, 0, 0, 'thor')).toBe(true);
    expect(p.decks[0]![0]).toBe('thor');
    // Déjà dans le deck : les cases s'échangent.
    expect(setDeckSlot(p, 0, 0, 'widow')).toBe(true);
    expect(p.decks[0]).toEqual(['widow', 'hawkeye', 'falcon', 'cmarvel', 'thor']);
    expect(swapDeckSlots(p, 0, 0, 4)).toBe(true);
    expect(p.decks[0]![0]).toBe('thor');
    expect(deckError(p, p.decks[0]!)).toBeNull();
  });

  it('bonus d’équipe actifs et « il manque »', () => {
    const hints = teamHints(['ironman', 'thor', 'widow', 'hawkeye', 'falcon']);
    const agents = hints.find((h) => h.team.id === 'agents')!;
    expect(agents.active).toBe(false);
    expect(agents.text).toBe('Il manque Soldat de l’hiver pour Les Agents');
    expect(hints.find((h) => h.team.id === 'avengers3')!.text).toBe('Il manque Hulk pour Avengers (3)');
    const full = teamHints(['ironman', 'thor', 'hulk', 'cap', 'widow']);
    expect(full.find((h) => h.team.id === 'avengers5')?.active).toBe(true);
    expect(full.some((h) => h.team.id === 'avengers3')).toBe(false);
  });

  it('réglages de combat lus sur le profil', () => {
    const p = fresh();
    p.heroes.hulk = { level: 7, cards: 0, awakening: 3, talents: [1, null, null] };
    expect(playerSetupFor(p, ['hulk'])).toEqual({ levels: { hulk: 7 }, talents: { hulk: ['b'] }, awakening: { hulk: 3 } });
  });
});

describe('compte, coffres, Solo Infini', () => {
  it('niveau de compte et emplacements de deck', () => {
    expect(accountLevel(0)).toEqual({ level: 1, into: 0, need: 100 });
    expect(accountLevel(100).level).toBe(2);
    expect(accountLevel(250)).toEqual({ level: 3, into: 0, need: 200 });
    expect(deckSlotsUnlocked(0)).toBe(1);
    expect(deckSlotsUnlocked(100)).toBe(2);
    expect(deckSlotsUnlocked(10000)).toBe(3);
  });

  it('coffre quotidien : +150 éclats +5 ✦, une fois par jour', () => {
    const p = fresh();
    expect(claimDailyChest(p, '2026-10-09')).not.toBeNull();
    expect(p.shards).toBe(1150);
    expect(p.crystals).toBe(5);
    expect(claimDailyChest(p, '2026-10-09')).toBeNull();
    expect(claimDailyChest(p, '2026-10-10')).not.toBeNull();
    expect(p.shards).toBe(1300);
  });

  it('Solo Infini verrouillé jusqu’au chapitre 1', () => {
    const p = fresh();
    expect(infiniteUnlocked(p)).toBe(false);
    p.campaign['c1-n10'] = { stars: [true, false, false] };
    expect(infiniteUnlocked(p)).toBe(true);
  });

  it('récompenses : 10 éclats par vague, coffres cumulés une fois par jour, record', () => {
    const p = fresh();
    applyStarter(p, 'marvel');
    const r = applyInfiniteRewards(p, 32, seeded(5), '2026-10-09');
    // 320 (vagues) + 150 + 300 + 500 (coffres) ; ✦ 5 + 10 + 20 ; parchemins 1 + 2
    expect(r.total.shards).toBe(320 + 150 + 300 + 500);
    expect(r.total.crystals).toBe(35);
    expect(r.total.scrolls).toBe(3);
    expect(r.heroes).toHaveLength(1); // Épique garantie du coffre or
    expect(p.infiniteBest).toBe(32);
    expect(r.newRecord).toBe(true);
    const again = applyInfiniteRewards(p, 25, seeded(6), '2026-10-09');
    expect(again.total.shards).toBe(250);
    expect(again.total.crystals).toBe(0);
    expect(again.newRecord).toBe(false);
    const next = applyInfiniteRewards(p, 12, seeded(7), '2026-10-10');
    expect(next.total.shards).toBe(120 + 150);
  });

  it('au-delà de 50 : +300 éclats, 1 parchemin, +10 ✦ tous les 10', () => {
    const p = fresh();
    const r = applyInfiniteRewards(p, 70, seeded(1), '2026-10-09');
    expect(r.total.shards).toBe(700 + 150 + 300 + 500 + 800 + 1500 + 300 + 300);
    expect(r.total.crystals).toBe(5 + 10 + 20 + 30 + 60 + 10 + 10);
    expect(r.total.scrolls).toBe(1 + 2 + 3 + 1 + 1);
  });

  it('getHeroProgress sans profil actif : valeur par défaut', () => {
    expect(getHeroProgress('thor').owned).toBe(true);
  });
});

describe('fin de Solo Infini avec gros boss', () => {
  it('5 ✦ pour le premier gros boss du jour, 50 ✦ pour Thanos', async () => {
    const { applyInfiniteGame } = await import('../../src/meta/economy');
    const p = blankProfile('T', 'thor');
    const r = applyInfiniteGame(p, { wavesCleared: 9, bigBosses: [] });
    expect(r.total.crystals).toBe(0);
    const r2 = applyInfiniteGame(p, { wavesCleared: 9, bigBosses: ['galactus', 'thanos'] });
    expect(r2.total.crystals).toBe(55);
  });
});

// Coffres de récompense (façon Rush Royale) : Bois, Argent, Or, Héroïque, Légendaire.
// Un coffre contient de l'or (beaucoup), des gemmes (un peu), des cartes des héros possédés (en priorité
// ceux du deck actif), parfois un nouveau héros, et selon la source des cristaux ✦ ou des parchemins.
// Logique pure : le hasard est injecté (`rng`), `rollChest` ne modifie rien, `applyChest` crédite.
// Sources : campagne (victoire), Solo Infini (paliers), coffre quotidien, coffre de la semaine, Route
// des récompenses. Chiffres et simulation : docs/equilibrage.md §6.

import type { BossId, Rarity, UnitId } from '../data/types';
import { UNIT_LIST, UNITS } from '../data/units';
import { MAX_AWAKENING, MAX_HERO_LEVEL } from './collection';
import { addHero, type Profile, type Reward } from './profile';

export type Rng = () => number;

export const CHEST_TIERS = ['bois', 'argent', 'or', 'heroique', 'legendaire'] as const;
export type ChestTier = (typeof CHEST_TIERS)[number];

export const CHEST_NAMES: Record<ChestTier, string> = {
  bois: 'Coffre en bois', argent: 'Coffre d’argent', or: 'Coffre d’or', heroique: 'Coffre héroïque', legendaire: 'Coffre légendaire',
};

/** Pile de cartes d'un coffre : `count` cartes d'UN héros possédé de cette rareté, avec une probabilité `chance`. */
export interface CardStack { rarity: Rarity; count: number; chance?: number }

export interface ChestDef {
  tier: ChestTier;
  gold: number;
  gems: number;
  stacks: CardStack[];
  /** Probabilité d'un héros pas encore possédé (Rare 70 %, Épique 25 %, Légendaire 5 %). */
  newHero: number;
}

/** Table des coffres (contenu à l'échelle 1). */
export const CHESTS: Record<ChestTier, ChestDef> = {
  bois: { tier: 'bois', gold: 120, gems: 4, newHero: 0, stacks: [{ rarity: 'rare', count: 6 }, { rarity: 'epique', count: 1, chance: 0.5 }] },
  argent: {
    tier: 'argent', gold: 250, gems: 8, newHero: 0.02,
    stacks: [{ rarity: 'rare', count: 12 }, { rarity: 'epique', count: 3 }, { rarity: 'legendaire', count: 1, chance: 0.1 }],
  },
  or: {
    tier: 'or', gold: 500, gems: 16, newHero: 0.05,
    stacks: [{ rarity: 'rare', count: 18 }, { rarity: 'rare', count: 6 }, { rarity: 'epique', count: 6 }, { rarity: 'legendaire', count: 1, chance: 0.35 }],
  },
  heroique: {
    tier: 'heroique', gold: 1000, gems: 30, newHero: 0.1,
    stacks: [
      { rarity: 'rare', count: 30 }, { rarity: 'rare', count: 10 }, { rarity: 'epique', count: 10 }, { rarity: 'epique', count: 3 },
      { rarity: 'legendaire', count: 1, chance: 0.75 },
    ],
  },
  legendaire: {
    tier: 'legendaire', gold: 2000, gems: 60, newHero: 0.25,
    stacks: [
      { rarity: 'rare', count: 45 }, { rarity: 'rare', count: 15 }, { rarity: 'epique', count: 15 }, { rarity: 'epique', count: 5 },
      { rarity: 'legendaire', count: 2 }, { rarity: 'legendaire', count: 1, chance: 0.5 },
    ],
  },
};

/** Part des piles qui visent un héros du deck actif (s'il en a un de cette rareté). */
export const DECK_FOCUS = 0.6;
const NEW_HERO_WEIGHTS: Record<Rarity, number> = { rare: 70, epique: 25, legendaire: 5 };
const LOWER: Record<Rarity, Rarity | null> = { legendaire: 'epique', epique: 'rare', rare: null };

/** Contenu tiré d'un coffre (rien n'est encore crédité). */
export interface ChestContent {
  tier: ChestTier;
  /** Coffre réduit (niveau rejoué). */
  small?: boolean;
  gold: number;
  gems: number;
  crystals: number;
  scrolls: number;
  cards: { unit: UnitId; count: number }[];
  /** Héros qui rejoignent la collection. */
  heroes: UnitId[];
  /** Tirages gratuits (pack au choix). */
  freePulls: number;
}

export interface ChestOptions {
  /** Multiplicateur de l'or, des gemmes et des cartes (coffre réduit : 0,5). */
  scale?: number;
  crystals?: number;
  scrolls?: number;
  /** Bonus fixes ajoutés au tirage. */
  gold?: number;
  gems?: number;
  freePulls?: number;
}

const tierIndex = (t: ChestTier): number => CHEST_TIERS.indexOf(t);
export const tierAt = (i: number): ChestTier => CHEST_TIERS[Math.max(0, Math.min(CHEST_TIERS.length - 1, Math.round(i)))]!;
export const upgradeTier = (t: ChestTier, by: number): ChestTier => tierAt(tierIndex(t) + by);

const isMaxed = (p: Profile, u: UnitId): boolean => {
  const h = p.heroes[u];
  return !!h && h.level >= MAX_HERO_LEVEL && h.awakening >= MAX_AWAKENING;
};

function pick<T>(arr: readonly T[], rng: Rng): T | undefined { return arr[Math.floor(rng() * arr.length)]; }

/** Héros qui reçoit une pile : deck actif d'abord (DECK_FOCUS), sinon un héros possédé au hasard. */
function stackTarget(p: Profile, rarity: Rarity, rng: Rng, taken: Set<UnitId>): UnitId | null {
  const owned = (Object.keys(p.heroes) as UnitId[]).filter((u) => UNITS[u]?.rarity === rarity && !isMaxed(p, u));
  if (!owned.length) return null;
  const deck = (p.decks[p.activeDeck] ?? []).filter((u) => owned.includes(u));
  const freshDeck = deck.filter((u) => !taken.has(u));
  const fresh = owned.filter((u) => !taken.has(u));
  if (deck.length && rng() < DECK_FOCUS) return pick(freshDeck.length ? freshDeck : deck, rng) ?? null;
  return pick(fresh.length ? fresh : owned, rng) ?? null;
}

/** Héros pas encore possédé, tiré avec les poids de rareté. */
function rollNewHero(p: Profile, rng: Rng): UnitId | null {
  const pool = UNIT_LIST.filter((u) => !p.heroes[u.id]);
  if (!pool.length) return null;
  const total = pool.reduce((n, u) => n + NEW_HERO_WEIGHTS[u.rarity], 0);
  let r = rng() * total;
  for (const u of pool) { r -= NEW_HERO_WEIGHTS[u.rarity]; if (r < 0) return u.id; }
  return pool[pool.length - 1]!.id;
}

/** Tire le contenu d'un coffre pour ce profil (lecture seule). */
export function rollChest(p: Profile, tier: ChestTier, rng: Rng, o: ChestOptions = {}): ChestContent {
  const def = CHESTS[tier];
  const scale = o.scale ?? 1;
  const jitter = 0.9 + rng() * 0.2; // or : ±10 %
  const out: ChestContent = {
    tier, ...(scale < 1 ? { small: true } : {}),
    gold: Math.round((def.gold * scale * jitter) / 10) * 10 + (o.gold ?? 0),
    gems: Math.round(def.gems * scale) + (o.gems ?? 0),
    crystals: o.crystals ?? 0, scrolls: o.scrolls ?? 0, cards: [], heroes: [], freePulls: o.freePulls ?? 0,
  };
  const per = new Map<UnitId, number>();
  const taken = new Set<UnitId>();
  for (const s of def.stacks) {
    if (s.chance !== undefined && rng() >= s.chance) continue;
    let rarity: Rarity | null = s.rarity;
    let count = Math.max(1, Math.round(s.count * scale));
    let unit: UnitId | null = null;
    // Pas de héros de cette rareté : la pile descend d'une rareté (deux fois plus de cartes).
    while (rarity && !(unit = stackTarget(p, rarity, rng, taken))) { rarity = LOWER[rarity]; count *= 2; }
    if (!unit) continue;
    taken.add(unit);
    per.set(unit, (per.get(unit) ?? 0) + count);
  }
  out.cards = [...per].map(([unit, count]) => ({ unit, count }));
  if (def.newHero > 0 && rng() < def.newHero) {
    const u = rollNewHero(p, rng);
    if (u) out.heroes.push(u);
  }
  return out;
}

/** Le contenu d'un coffre sous forme de récompense (contrat `applyReward`). */
export function chestReward(c: ChestContent): Reward {
  const r: Reward = {};
  if (c.gold) r.gold = c.gold;
  if (c.gems) r.shards = c.gems;
  if (c.crystals) r.crystals = c.crystals;
  if (c.scrolls) r.scrolls = c.scrolls;
  if (c.cards.length) r.cards = c.cards.map((x) => ({ ...x }));
  if (c.freePulls) r.freePulls = [{ pack: 'choix', count: c.freePulls }];
  return r;
}

/** Crédite un coffre tiré (mutation ; à appeler dans updateProfile). */
export function applyChest(p: Profile, c: ChestContent): void {
  p.gold = (p.gold ?? 0) + c.gold;
  p.shards += c.gems;
  p.crystals += c.crystals;
  p.scrolls += c.scrolls;
  for (const x of c.cards) { const h = p.heroes[x.unit]; if (h) h.cards += x.count; }
  for (const u of c.heroes) addHero(p, u, 1);
  if (c.freePulls) (p.pendingPulls ??= []).push({ pack: 'choix', count: c.freePulls });
  p.chestsOpened = (p.chestsOpened ?? 0) + 1;
}

/** Tire puis crédite un coffre. */
export function openChest(p: Profile, tier: ChestTier, rng: Rng, o: ChestOptions = {}): ChestContent {
  const c = rollChest(p, tier, rng, o);
  applyChest(p, c);
  return c;
}

/** Valeur indicative d'un coffre (aperçu « jusqu'à… ») : or et gemmes à l'échelle donnée. */
export function chestPreview(tier: ChestTier, scale = 1): { gold: number; gems: number; cards: number } {
  const d = CHESTS[tier];
  return {
    gold: Math.round(d.gold * scale), gems: Math.round(d.gems * scale),
    cards: d.stacks.filter((s) => s.chance === undefined).reduce((n, s) => n + Math.max(1, Math.round(s.count * scale)), 0),
  };
}

// ------------------------------------------------------------------------------- boss vaincus

/** Petit bonus d'or pour chaque boss vaincu en combat (affiché à l'écran de fin). */
export const BOSS_KILL_GOLD = { lieutenant: 20, boss: 60, thanos: 300 } as const;

export function bossKillGold(kills: readonly { boss: BossId; small: boolean }[]): number {
  return kills.reduce((n, k) => n + (k.small ? BOSS_KILL_GOLD.lieutenant : k.boss === 'thanos' ? BOSS_KILL_GOLD.thanos : BOSS_KILL_GOLD.boss), 0);
}

/** Générateur déterministe (mulberry32), pour les coffres rejouables et les tests. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

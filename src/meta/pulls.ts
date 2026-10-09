// Tirages (§6.2) : taux, garantie Légendaire par pack, Épique garantie dans un lot de 10, tirages gratuits.
// Logique pure : le hasard est injecté (`rng`, Math.random par défaut), aucune dépendance au DOM.
//
// Packs proposés : le « Pack Complet » (tous les héros de tous les univers, extensions comprises) puis
// un pack par univers dérivé de PACK_LIST (Marvel, Disney, puis DC… automatiquement).

import type { Pack, Rarity, UnitDef, UnitId } from '../data/types';
import { PACK_LIST, TEN_PULL_MIN_RARITY } from '../data/packs';
import { UNIT_LIST } from '../data/units';
import { grantPulledHero, type Rng } from './economy';
import type { Profile } from './profile';

export type PullPackId = Pack | 'complet';

export interface PullPack {
  id: PullPackId;
  name: string;
  /** Phrase courte affichée sous le nom. */
  blurb: string;
  price1: number;
  price10: number;
  rates: Record<Rarity, number>;
  pityLegendary: number;
  /** Mis en avant (premier, plus grand). */
  featured: boolean;
}

const BASE = PACK_LIST[0]!;

/** Pack Complet : tous les héros, mêmes prix, taux et garantie que les packs d'univers. */
export const COMPLETE_PACK: PullPack = {
  id: 'complet', name: 'Pack Complet', blurb: 'Tous les héros de tous les univers',
  price1: BASE.price1, price10: BASE.price10, rates: { ...BASE.rates }, pityLegendary: BASE.pityLegendary, featured: true,
};

/** Tous les packs proposés, le Pack Complet en premier. */
export function pullPacks(): PullPack[] {
  return [COMPLETE_PACK, ...PACK_LIST.map((d) => ({
    id: d.id, name: d.name, blurb: '',
    price1: d.price1, price10: d.price10, rates: { ...d.rates }, pityLegendary: d.pityLegendary, featured: false,
  }))];
}

export function getPullPack(id: PullPackId): PullPack {
  return pullPacks().find((p) => p.id === id) ?? COMPLETE_PACK;
}

/** Héros que contient un pack. */
export function packPool(id: PullPackId): UnitDef[] {
  return id === 'complet' ? UNIT_LIST.slice() : UNIT_LIST.filter((u) => u.pack === id);
}

const RANK: Record<Rarity, number> = { rare: 0, epique: 1, legendaire: 2 };

/** Tire une rareté selon les taux (sans garantie). */
export function rollRarity(rates: Record<Rarity, number>, rng: Rng): Rarity {
  const r = rng();
  if (r < rates.legendaire) return 'legendaire';
  if (r < rates.legendaire + rates.epique) return 'epique';
  return 'rare';
}

/** Rareté disponible la plus proche dans le pool (un univers sans Légendaire, par exemple). */
function availableRarity(pool: UnitDef[], want: Rarity): Rarity {
  if (pool.some((u) => u.rarity === want)) return want;
  const order: Rarity[] = want === 'legendaire' ? ['epique', 'rare'] : want === 'epique' ? ['legendaire', 'rare'] : ['epique', 'legendaire'];
  return order.find((r) => pool.some((u) => u.rarity === r)) ?? want;
}

export interface PullResult {
  unit: UnitId;
  rarity: Rarity;
  outcome: 'nouveau' | 'carte' | 'cristaux';
  /** Ce tirage a été forcé par la garantie (Légendaire au 40e, Épique du lot de 10). */
  guaranteed?: 'pity' | 'lot';
}

/**
 * Tire `count` cartes d'un pack et les crédite sur le profil (sans payer : voir `buyPulls`).
 * Le compteur de garantie (`p.pity[pack]`) compte les tirages depuis le dernier Légendaire : le
 * `pityLegendary`-ième tirage sans Légendaire en donne un. Un lot de 10 contient au moins une Épique.
 */
export function rollPulls(p: Profile, packId: PullPackId, count: number, rng: Rng = Math.random): PullResult[] {
  const pack = getPullPack(packId);
  const pool = packPool(packId);
  if (!pool.length) return [];
  const rarities: { r: Rarity; g?: 'pity' | 'lot' }[] = [];
  let pity = p.pity[packId] ?? 0;
  for (let i = 0; i < count; i++) {
    let r: Rarity;
    let g: 'pity' | undefined;
    if (pity + 1 >= pack.pityLegendary) { r = 'legendaire'; g = 'pity'; }
    else r = rollRarity(pack.rates, rng);
    pity = r === 'legendaire' ? 0 : pity + 1;
    rarities.push({ r, g });
  }
  // Lot de 10 : au moins une Épique (ou mieux). La dernière carte Rare devient Épique.
  if (count >= 10 && !rarities.some((x) => RANK[x.r] >= RANK[TEN_PULL_MIN_RARITY])) {
    const last = rarities[rarities.length - 1]!;
    last.r = TEN_PULL_MIN_RARITY; last.g = 'lot';
  }
  p.pity[packId] = pity;
  p.pullsDone = (p.pullsDone ?? 0) + count;
  return rarities.map(({ r, g }) => {
    const rarity = availableRarity(pool, r);
    const choices = pool.filter((u) => u.rarity === rarity);
    const unit = choices[Math.floor(rng() * choices.length)]!.id;
    const outcome = grantPulledHero(p, unit);
    return { unit, rarity, outcome, ...(g ? { guaranteed: g } : {}) };
  });
}

export function pullPrice(packId: PullPackId, count: 1 | 10): number {
  const pack = getPullPack(packId);
  return count === 10 ? pack.price10 : pack.price1 * count;
}

/** Achète et tire 1 ou 10 cartes. null si les éclats manquent (rien n'est modifié). */
export function buyPulls(p: Profile, packId: PullPackId, count: 1 | 10, rng: Rng = Math.random): PullResult[] | null {
  const price = pullPrice(packId, count);
  if (p.shards < price) return null;
  p.shards -= price;
  return rollPulls(p, packId, count, rng);
}

/** Tirages gratuits en attente utilisables sur ce pack (entrée du pack, ou « au choix »). */
export function freePullsFor(p: Profile, packId: PullPackId): number {
  return (p.pendingPulls ?? []).filter((f) => f.pack === packId || f.pack === 'choix').reduce((a, f) => a + f.count, 0);
}

/** Total des tirages gratuits en attente, tous packs confondus. */
export function freePullsTotal(p: Profile): number {
  return (p.pendingPulls ?? []).reduce((a, f) => a + f.count, 0);
}

/**
 * Ouvre des tirages gratuits sur ce pack : jusqu'à 10 d'un coup (un lot de 10 a sa garantie Épique).
 * Consomme d'abord les tirages propres au pack, puis ceux « au choix ».
 */
export function openFreePulls(p: Profile, packId: PullPackId, rng: Rng = Math.random): PullResult[] {
  let want = Math.min(10, freePullsFor(p, packId));
  if (want <= 0) return [];
  const n = want;
  const queue = p.pendingPulls ?? [];
  for (const kind of [packId, 'choix'] as const) {
    for (const f of queue) {
      if (want <= 0) break;
      if (f.pack !== kind) continue;
      const take = Math.min(f.count, want);
      f.count -= take; want -= take;
    }
  }
  p.pendingPulls = queue.filter((f) => f.count > 0);
  return rollPulls(p, packId, n, rng);
}

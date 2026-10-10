// Économie pure (sans DOM ni stockage) : niveaux, éveils, talents, niveau de compte, coffres, Solo Infini.
// Toutes les fonctions qui modifient un profil le font en place et sont à appeler dans `updateProfile`.
// Sources : docs/prompt-jeu.md §5.1, §6.1, §6.2, §6.6 et docs/equilibrage.md §5-6.

import type { BossId, Rarity, UnitId } from '../data/types';
import { UNIT_LIST, UNITS } from '../data/units';
import { TALENT_TIER_LEVELS, TALENT_TIER_SCROLLS } from '../data/talents';
import { AWAKENING_COPY_COSTS, LEVEL_COPY_COSTS, MAX_AWAKENING, MAX_HERO_LEVEL } from './collection';
import { applyReward, bigBossDailyBonus, today, type HeroState, type Profile, type Reward } from './profile';
import { openChest, type ChestContent, type ChestTier } from './chests';
import { trackQuests } from './quests';

export { AWAKENING_COPY_COSTS, LEVEL_COPY_COSTS, MAX_AWAKENING, MAX_HERO_LEVEL };

/** Or pour passer les niveaux 2 à 10 (§6.2) : 39 200 or pour amener un héros au niveau 10. */
export const LEVEL_GOLD_COSTS: readonly number[] = [300, 700, 1200, 2000, 3000, 4500, 6500, 9000, 12000];
/** Cristaux ✦ pour les éveils ★1 à ★10 (§6.6). */
export const AWAKENING_CRYSTAL_COSTS: readonly number[] = [50, 300, 600, 1000, 2000, 2500, 3000, 4000, 5000, 6500];
/** Gains cumulés par étoile d'éveil (§6.6) : attaque +6 %, vitesse d'attaque +4 %. */
export const AWAKENING_ATTACK_PER_STAR = 0.06;
export const AWAKENING_SPEED_PER_STAR = 0.04;
/** Doublon d'un personnage déjà au maximum (niveau 10, ★10) : converti en cristaux. */
export const MAXED_DUPLICATE_CRYSTALS = 5;

export type Rng = () => number;

// ------------------------------------------------------------------------------- héros

export function isMaxed(h: HeroState): boolean {
  return h.level >= MAX_HERO_LEVEL && h.awakening >= MAX_AWAKENING;
}

/** Coût d'une amélioration : cartes du héros + or (niveaux) ou cristaux (éveils). Jamais de gemmes. */
export interface Cost { cards: number; gold: number; crystals: number; scrolls: number }

/** Coût du prochain niveau (null au niveau 10). */
export function levelUpCost(h: HeroState): Cost | null {
  if (h.level >= MAX_HERO_LEVEL) return null;
  return { cards: LEVEL_COPY_COSTS[h.level - 1] ?? 0, gold: LEVEL_GOLD_COSTS[h.level - 1] ?? 0, crystals: 0, scrolls: 0 };
}

/** Coût du prochain éveil (null avant le niveau 10 ou à ★10). */
export function awakeningCost(h: HeroState): Cost | null {
  if (h.level < MAX_HERO_LEVEL || h.awakening >= MAX_AWAKENING) return null;
  return { cards: AWAKENING_COPY_COSTS[h.awakening] ?? 0, gold: 0, crystals: AWAKENING_CRYSTAL_COSTS[h.awakening] ?? 0, scrolls: 0 };
}

export function canAfford(p: Profile, h: HeroState, c: Cost): boolean {
  return h.cards >= c.cards && (p.gold ?? 0) >= c.gold && p.crystals >= c.crystals && p.scrolls >= c.scrolls;
}

/** Raison lisible pour laquelle un coût n'est pas payable (null si payable). */
export function missingFor(p: Profile, h: HeroState, c: Cost): string | null {
  if (h.cards < c.cards) return `Il manque ${c.cards - h.cards} carte${c.cards - h.cards > 1 ? 's' : ''}`;
  if ((p.gold ?? 0) < c.gold) return `Il manque ${(c.gold - (p.gold ?? 0)).toLocaleString('fr-FR')} or`;
  if (p.crystals < c.crystals) return `Il manque ${c.crystals - p.crystals} ✦`;
  if (p.scrolls < c.scrolls) return `Il manque ${c.scrolls - p.scrolls} parchemin${c.scrolls - p.scrolls > 1 ? 's' : ''}`;
  return null;
}

function pay(p: Profile, h: HeroState, c: Cost): void {
  h.cards -= c.cards; p.gold -= c.gold; p.crystals -= c.crystals; p.scrolls -= c.scrolls;
}

/** Monte un héros d'un niveau. Renvoie false (sans rien changer) si impossible. */
export function levelUp(p: Profile, unit: UnitId, day = today()): boolean {
  const h = p.heroes[unit];
  const c = h && levelUpCost(h);
  if (!h || !c || !canAfford(p, h, c)) return false;
  pay(p, h, c);
  h.level += 1;
  p.xp += 10 * h.level; // un peu d'XP de compte pour chaque montée
  trackQuests(p, { upgrades: 1 }, day);
  return true;
}

/** Éveille un héros d'une étoile. Renvoie false (sans rien changer) si impossible. */
export function awaken(p: Profile, unit: UnitId, day = today()): boolean {
  const h = p.heroes[unit];
  const c = h && awakeningCost(h);
  if (!h || !c || !canAfford(p, h, c)) return false;
  pay(p, h, c);
  h.awakening += 1;
  trackQuests(p, { upgrades: 1 }, day);
  return true;
}

export type TalentTier = 1 | 2 | 3;

/** État d'un palier de talent pour un héros. */
export function talentTierState(p: Profile, h: HeroState, tier: TalentTier): 'choisi' | 'ouvrable' | 'niveau' | 'precedent' | 'parchemins' {
  if (h.talents[tier - 1] != null) return 'choisi';
  if (h.level < TALENT_TIER_LEVELS[tier]) return 'niveau';
  if (tier > 1 && h.talents[tier - 2] == null) return 'precedent';
  if (p.scrolls < TALENT_TIER_SCROLLS[tier]) return 'parchemins';
  return 'ouvrable';
}

/**
 * Choisit un talent. Ouvrir un palier coûte des parchemins (TALENT_TIER_SCROLLS) ; changer d'option
 * sur un palier déjà ouvert est gratuit (comme dans Rush Royale).
 */
export function chooseTalent(p: Profile, unit: UnitId, tier: TalentTier, option: 0 | 1): boolean {
  const h = p.heroes[unit];
  if (!h) return false;
  while (h.talents.length < 3) h.talents.push(null);
  const st = talentTierState(p, h, tier);
  if (st === 'choisi') { h.talents[tier - 1] = option; return true; }
  if (st !== 'ouvrable') return false;
  p.scrolls -= TALENT_TIER_SCROLLS[tier];
  h.talents[tier - 1] = option;
  return true;
}

/** Ajoute un héros tiré : nouveau, +1 carte, ou cristaux s'il est déjà au maximum. */
export function grantPulledHero(p: Profile, unit: UnitId): 'nouveau' | 'carte' | 'cristaux' {
  const h = p.heroes[unit];
  if (!h) {
    p.heroes[unit] = { level: 1, cards: 0, awakening: 0, talents: [null, null, null] };
    return 'nouveau';
  }
  if (isMaxed(h)) { p.crystals += MAXED_DUPLICATE_CRYSTALS; return 'cristaux'; }
  h.cards += 1;
  return 'carte';
}

// ------------------------------------------------------------------------------- compte

/** XP pour passer du niveau de compte n au niveau n+1. */
export function xpToNext(level: number): number { return 100 + 50 * (level - 1); }

export function accountLevel(xp: number): { level: number; into: number; need: number } {
  let level = 1;
  let rest = Math.max(0, Math.floor(xp));
  while (rest >= xpToNext(level)) { rest -= xpToNext(level); level += 1; }
  return { level, into: rest, need: xpToNext(level) };
}

/** Niveau de compte requis pour chaque emplacement de deck (§5.1 : jusqu'à 3). */
export const DECK_SLOT_LEVELS: readonly number[] = [1, 2, 4];
export function deckSlotsUnlocked(xp: number): number {
  const lv = accountLevel(xp).level;
  return DECK_SLOT_LEVELS.filter((l) => lv >= l).length;
}

// ------------------------------------------------------------------------------- coffres

/** Coffre quotidien (minuit, heure locale) : coffre d'argent + 40 gemmes + 10 ✦. */
export const DAILY_CHEST = { tier: 'argent' as ChestTier, gems: 40, crystals: 10 };

export function dailyChestReady(p: Profile, day = today()): boolean { return p.dailyChest !== day; }

export function claimDailyChest(p: Profile, rng: Rng = Math.random, day = today()): ChestContent | null {
  if (!dailyChestReady(p, day)) return null;
  p.dailyChest = day;
  return openChest(p, DAILY_CHEST.tier, rng, { gems: DAILY_CHEST.gems, crystals: DAILY_CHEST.crystals });
}

/** Solo Infini débloqué après le chapitre 1 de la campagne (boss du niveau 10 vaincu). */
export function infiniteUnlocked(p: Profile): boolean { return p.campaign['c1-n10']?.stars[0] === true; }

// ------------------------------------------------------------------------------- Solo Infini

export interface TierChest {
  wave: number;
  name: string;
  chest: ChestTier;
  crystals: number;
  scrolls: number;
  /** Personnage garanti de cette rareté (nouveau, ou 1 carte s'il est déjà possédé). */
  guaranteed?: Rarity;
}

/** Coffres de palier du Solo Infini (§5.1, §5.2, cristaux §6.6) : une fois par jour chacun. */
export const INFINITE_TIERS: readonly TierChest[] = [
  { wave: 10, name: 'Palier 10', chest: 'bois', crystals: 5, scrolls: 0 },
  { wave: 20, name: 'Palier 20', chest: 'argent', crystals: 10, scrolls: 1 },
  { wave: 30, name: 'Palier 30', chest: 'or', crystals: 20, scrolls: 2, guaranteed: 'epique' },
  { wave: 40, name: 'Palier 40', chest: 'heroique', crystals: 30, scrolls: 3 },
  { wave: 50, name: 'Palier 50', chest: 'legendaire', crystals: 60, scrolls: 0, guaranteed: 'legendaire' },
  // Extension DC : paliers prolongés jusqu'à Darkseid (vague 100, src/data/milestones.ts).
  { wave: 75, name: 'Palier 75', chest: 'legendaire', crystals: 80, scrolls: 4, guaranteed: 'legendaire' },
  { wave: 100, name: 'Palier 100', chest: 'legendaire', crystals: 150, scrolls: 5, guaranteed: 'legendaire' },
  // Extension Transformers : Unicron, boss cosmique des modes infinis, à la vague 150.
  { wave: 150, name: 'Palier 150 · Unicron', chest: 'legendaire', crystals: 200, scrolls: 6, guaranteed: 'legendaire' },
];
/** Au-delà de la vague 50, tous les 10 : coffre d'or, 1 parchemin, +10 ✦. */
export const INFINITE_BEYOND = { every: 10, chest: 'or' as ChestTier, scrolls: 1, crystals: 10 };
export const INFINITE_GOLD_PER_WAVE = 15;
export const INFINITE_XP_PER_WAVE = 4;
/** Nouveau record : bonus. */
export const INFINITE_RECORD_BONUS = { gold: 500, gems: 50 };

export type RewardIcon = 'or' | 'gemmes' | 'cristaux' | 'parchemins' | 'xp' | 'coffre' | 'heros' | 'cartes' | 'record';

export interface InfiniteResult {
  wavesCleared: number;
  newRecord: boolean;
  /** Ce qui a été crédité, ligne par ligne, pour l'écran de fin. */
  lines: { icon: RewardIcon; label: string; detail?: string }[];
  total: { gold: number; shards: number; crystals: number; scrolls: number; xp: number };
  heroes: { unit: UnitId; outcome: 'nouveau' | 'carte' | 'cristaux' }[];
  /** Coffres de palier ouverts (à animer), dans l'ordre. */
  chests: { name: string; content: ChestContent }[];
}

function pick<T>(arr: readonly T[], rng: Rng): T | undefined { return arr[Math.floor(rng() * arr.length)]; }

/**
 * Récompenses de fin de Solo Infini, créditées sur le profil.
 * `wavesCleared` = vagues terminées (boss compris). Chaque coffre de palier ne se gagne qu'une fois
 * par jour (anti-inflation, docs/equilibrage.md §6) ; au-delà, seul l'or par vague compte.
 */
export function applyInfiniteRewards(p: Profile, wavesCleared: number, rng: Rng = Math.random, day = today()): InfiniteResult {
  const w = Math.max(0, Math.floor(wavesCleared));
  const res: InfiniteResult = {
    wavesCleared: w, newRecord: false, lines: [], heroes: [], chests: [],
    total: { gold: 0, shards: 0, crystals: 0, scrolls: 0, xp: 0 },
  };
  const credit = (r: Reward) => {
    applyReward(p, r);
    res.total.gold += r.gold ?? 0; res.total.shards += r.shards ?? 0; res.total.crystals += r.crystals ?? 0;
    res.total.scrolls += r.scrolls ?? 0; res.total.xp += r.xp ?? 0;
  };
  if (w > 0) {
    credit({ gold: w * INFINITE_GOLD_PER_WAVE, xp: w * INFINITE_XP_PER_WAVE });
    res.lines.push({ icon: 'or', label: `+${(w * INFINITE_GOLD_PER_WAVE).toLocaleString('fr-FR')} or`, detail: `${w} vague${w > 1 ? 's' : ''} × ${INFINITE_GOLD_PER_WAVE}` });
  }
  const tiers: TierChest[] = [...INFINITE_TIERS];
  for (let t = 60; t <= w; t += INFINITE_BEYOND.every) {
    if (INFINITE_TIERS.some((x) => x.wave === t)) continue;
    tiers.push({ wave: t, name: `Palier ${t}`, chest: INFINITE_BEYOND.chest, crystals: INFINITE_BEYOND.crystals, scrolls: INFINITE_BEYOND.scrolls });
  }
  for (const t of tiers) {
    if (w < t.wave) continue;
    const key = String(t.wave);
    if (p.infiniteTiers[key] === day) continue;
    p.infiniteTiers[key] = day;
    const c = openChest(p, t.chest, rng, { crystals: t.crystals, scrolls: t.scrolls });
    res.total.gold += c.gold; res.total.shards += c.gems; res.total.crystals += c.crystals; res.total.scrolls += c.scrolls;
    for (const u of c.heroes) res.heroes.push({ unit: u, outcome: 'nouveau' });
    if (t.guaranteed) {
      const pool = UNIT_LIST.filter((u) => u.rarity === t.guaranteed).map((u) => u.id);
      const u = pick(pool, rng);
      if (u) {
        const outcome = grantPulledHero(p, u);
        res.heroes.push({ unit: u, outcome });
        if (outcome === 'nouveau') c.heroes.push(u); else c.cards.push({ unit: u, count: 1 });
      }
    }
    res.chests.push({ name: t.name, content: c });
    res.lines.push({ icon: 'coffre', label: `${t.name} : ${chestLabel(t.chest)}`, detail: chestDetail(c) });
  }
  if (w > p.infiniteBest) {
    res.newRecord = p.infiniteBest > 0 || w > 0;
    if (p.infiniteBest > 0) {
      credit({ gold: INFINITE_RECORD_BONUS.gold, shards: INFINITE_RECORD_BONUS.gems });
      res.lines.push({ icon: 'record', label: 'Nouveau record !', detail: `${w} vague${w > 1 ? 's' : ''} · +${INFINITE_RECORD_BONUS.gold} or · +${INFINITE_RECORD_BONUS.gems} gemmes` });
    } else res.lines.push({ icon: 'record', label: 'Premier record !', detail: `${w} vague${w > 1 ? 's' : ''}` });
    p.infiniteBest = w;
  }
  return res;
}

const CHEST_LABELS: Record<ChestTier, string> = { bois: 'coffre en bois', argent: 'coffre d’argent', or: 'coffre d’or', heroique: 'coffre héroïque', legendaire: 'coffre légendaire' };
export const chestLabel = (t: ChestTier): string => CHEST_LABELS[t];

/** « 1 020 or · 10 gemmes · 18 cartes · 2 ✦ » */
export function chestDetail(c: ChestContent): string {
  const cards = c.cards.reduce((n, x) => n + x.count, 0);
  return [
    `${c.gold.toLocaleString('fr-FR')} or`, c.gems ? `${c.gems} gemmes` : '', cards ? `${cards} cartes` : '',
    c.crystals ? `${c.crystals} ✦` : '', c.scrolls ? `${c.scrolls} parchemin${c.scrolls > 1 ? 's' : ''}` : '',
    ...c.heroes.map((u) => `${UNITS[u].name} (nouveau !)`),
  ].filter(Boolean).join(' · ');
}

/**
 * Fin d'une partie de Solo Infini : récompenses de vagues et de paliers, cristaux des gros boss
 * (5 ✦ pour le premier de la journée, 50 ✦ pour Thanos, §6.6), or des boss vaincus, quêtes.
 */
export function applyInfiniteGame(
  p: Profile,
  game: { wavesCleared: number; bigBosses: BossId[]; bossGold?: number; merges?: number; summons?: number; bossKills?: number },
  rng: Rng = Math.random, day = today(),
): InfiniteResult {
  const res = applyInfiniteRewards(p, game.wavesCleared, rng, day);
  let bossCrystals = 0;
  for (const b of game.bigBosses) bossCrystals += bigBossDailyBonus(p, b);
  if (bossCrystals > 0) {
    res.total.crystals += bossCrystals;
    res.lines.splice(1, 0, { icon: 'cristaux', label: `+${bossCrystals} ✦`, detail: game.bigBosses.includes('unicron') ? 'Unicron vaincu !' : game.bigBosses.includes('darkseid') ? 'Darkseid vaincu !' : game.bigBosses.includes('thanos') ? 'Thanos vaincu !' : 'Premier gros boss du jour' });
  }
  if (game.bossGold) {
    p.gold += game.bossGold;
    res.total.gold += game.bossGold;
    res.lines.splice(1, 0, { icon: 'or', label: `+${game.bossGold.toLocaleString('fr-FR')} or`, detail: `Butin des boss (${game.bossKills ?? 0})` });
  }
  trackQuests(p, { merges: game.merges, summons: game.summons, bossKills: game.bossKills, waves: game.wavesCleared, infiniteWave: game.wavesCleared }, day);
  return res;
}

// Étoiles, déblocages et récompenses de la campagne (docs/campagne.md §2). Fonctions pures :
// elles lisent le profil (contrat src/meta/profile.ts) sans le modifier. L'écriture passe par
// `commitLevel` (src/campaign/store.ts).

import { categoriesFor } from '../data/categories';
import { activeTeams } from '../data/teams';
import type { UnitId } from '../data/types';
import { UNITS } from '../data/units';
import type { LevelResult, Profile, Reward } from '../meta/profile';
import {
  CHAPTERS, STAR_CHEST_THRESHOLDS, chapterLevels, getChapter, getLevel, guaranteedHero, hash32, levelId,
  type CampaignLevel, type Constraint,
} from './levels';
import type { BattleOutcome } from './tracker';

export type Stars = [boolean, boolean, boolean];

/** Progression lue par les fonctions ci-dessous : le sous-ensemble du profil utile à la campagne. */
export type Progress = Pick<Profile, 'campaign' | 'campaignChests'> & Partial<Pick<Profile, 'heroes'>>;

export const EMPTY_PROGRESS: Progress = { campaign: {}, campaignChests: {} };

// ---------------------------------------------------------------------------------------------
// Étoiles

/** La contrainte bonus est-elle respectée ? (indépendante de la victoire) */
export function constraintMet(c: Constraint, r: BattleOutcome, level?: CampaignLevel): boolean {
  const deck = r.deck;
  switch (c.kind) {
    case 'merges': return r.merges >= c.min;
    case 'noLifeLost': return r.livesLeft >= 3;
    case 'powerup': return r.maxPowerup >= c.min;
    case 'maxPowerup': return r.maxPowerup <= c.max;
    case 'rank': return r.maxRank >= c.min;
    case 'bossTime': {
      const b = level?.boss;
      const kill = b
        ? r.bossKills.find((k) => k.wave === b.wave && k.small === (b.kind === 'lieutenant'))
        : r.bossKills[r.bossKills.length - 1];
      return !!kill && kill.time < c.max;
    }
    case 'summonsBelow': return r.summons < c.max;
    case 'packCount': return deck.filter((u) => UNITS[u]?.pack === c.pack).length >= c.min;
    case 'packEach': return deck.some((u) => UNITS[u]?.pack === 'marvel') && deck.some((u) => UNITS[u]?.pack === 'disney');
    case 'emptyCells': return r.emptyCells >= c.min;
    case 'deckHasAny': return deck.some((u) => c.units.includes(u));
    case 'team': {
      const active = activeTeams(deck).map((t) => t.id);
      if (c.teams?.length) return c.teams.some((t) => active.includes(t));
      return active.length >= (c.min ?? 1);
    }
    case 'controlUnits': return deck.filter((u) => UNITS[u] && categoriesFor(UNITS[u]).includes('controle')).length >= c.min;
    case 'endMana': return r.endMana >= c.min;
    case 'noLeak': return (r.leaked[c.enemy] ?? 0) === 0;
    case 'noBossLoss': return r.bossDestroyed === 0 && r.bossDowngraded === 0;
    case 'noRankLoss': return r.bossDowngraded === 0;
    case 'maxSleep': return r.maxSleep <= c.max + 1e-6;
  }
}

/** ★ victoire, ★★ victoire avec au moins 2 vies, ★★★ victoire et contrainte bonus. Une défaite ne donne rien. */
export function evaluateStars(level: CampaignLevel, r: BattleOutcome): Stars {
  if (!r.won) return [false, false, false];
  return [true, r.livesLeft >= 2, constraintMet(level.bonus, r, level)];
}

export const starCount = (s: readonly boolean[] | undefined): number => (s ? s.filter(Boolean).length : 0);

/** On garde le meilleur de chaque étoile, gagnée séparément. */
export function mergeStars(prev: Stars | undefined, now: Stars): Stars {
  return [!!prev?.[0] || now[0], !!prev?.[1] || now[1], !!prev?.[2] || now[2]];
}

export function levelStars(p: Progress, id: string): Stars {
  const r = p.campaign[id];
  return r ? [r.stars[0], r.stars[1], r.stars[2]] : [false, false, false];
}

export function chapterStars(p: Progress, chapter: number): number {
  return chapterLevels(chapter).reduce((n, l) => n + starCount(p.campaign[l.id]?.stars), 0);
}

export function totalStars(p: Progress): number {
  return CHAPTERS.reduce((n, c) => n + chapterStars(p, c.n), 0);
}

// ---------------------------------------------------------------------------------------------
// Déblocage

export const isLevelWon = (p: Progress, id: string): boolean => !!p.campaign[id]?.stars[0];

/** Un chapitre s'ouvre si le niveau 10 du précédent est gagné et si le total d'étoiles atteint son seuil. */
export function isChapterUnlocked(p: Progress, chapter: number): boolean {
  const ch = getChapter(chapter);
  if (!ch) return false;
  if (chapter === 1) return true;
  return isLevelWon(p, levelId(chapter - 1, 10)) && totalStars(p) >= ch.unlockStars;
}

/** Les niveaux d'un chapitre s'ouvrent l'un après l'autre. */
export function isLevelUnlocked(p: Progress, id: string): boolean {
  const l = getLevel(id);
  if (!l || !isChapterUnlocked(p, l.chapter)) return false;
  return l.n === 1 || isLevelWon(p, levelId(l.chapter, l.n - 1));
}

/** Solo Infini : ouvert à la fin du chapitre 1. */
export const isInfiniteUnlocked = (p: Progress): boolean => isLevelWon(p, levelId(1, 10));

/** Prochain niveau à jouer d'un chapitre (le premier non gagné), ou null si tout est gagné. */
export function nextLevelToPlay(p: Progress, chapter: number): CampaignLevel | null {
  return chapterLevels(chapter).find((l) => !isLevelWon(p, l.id) && isLevelUnlocked(p, l.id)) ?? null;
}

/** Chapitre courant : le dernier chapitre ouvert. */
export function currentChapter(p: Progress): number {
  let c = 1;
  for (const ch of CHAPTERS) if (isChapterUnlocked(p, ch.n)) c = ch.n;
  return c;
}

// ---------------------------------------------------------------------------------------------
// Récompenses

/** Éclats par étoile, pour 10 vagues : multipliés par `lengthFactor` (un niveau de 50 vagues donne ×5). */
export const SHARDS_PER_NEW_STAR = 30;
export const SHARDS_PER_REPLAY_STAR = 10;
/** Durée relative d'un niveau (vagues / 10) : les éclats d'étoiles et l'XP lui sont proportionnels. */
export const lengthFactor = (level: CampaignLevel): number => level.waves / 10;
export const BOSS_LEVEL_CRYSTALS = 25;
export const THANOS_CRYSTALS = 100;
/**
 * Niveau 8 du chapitre 6 (Maléfique) : la table du doc lui donne « 1 parchemin », mais le total
 * annoncé (7 par chapitre, 42 pour la campagne) ne le compte pas. On suit le total : à 0.
 */
export const C6N8_SCROLLS = 0;

export interface StarChest { key: string; threshold: number; reward: Reward }

export function chestReward(threshold: number, cardUnit: UnitId | null): Reward {
  if (threshold === 10) return { shards: 150, scrolls: 1, ...(cardUnit ? { cards: [{ unit: cardUnit, count: 5 }] } : {}) };
  if (threshold === 20) return { shards: 250, scrolls: 1, ...(cardUnit ? { cards: [{ unit: cardUnit, count: 10 }] } : {}) };
  return { shards: 400, scrolls: 2, freePulls: [{ pack: 'choix', count: 1 }] };
}

export const chestKey = (chapter: number, threshold: number): string => `c${chapter}-${threshold}`;

export interface RewardLine {
  kind: 'etoiles' | 'coffre' | 'lieutenant' | 'boss' | 'cristaux' | 'xp';
  label: string;
  reward: Reward;
}

export interface LevelRewards {
  lines: RewardLine[];
  total: Reward;
  /** Étoiles du niveau avant et après ce combat (meilleur de chaque). */
  prev: Stars;
  stars: Stars;
  newStars: number;
  firstWin: boolean;
  /** Clés des coffres d'étoiles obtenus. */
  chests: string[];
}

function pickUnit(pool: UnitId[], seed: string): UnitId | null {
  if (!pool.length) return null;
  return pool[hash32(seed) % pool.length]!;
}

export function addReward(a: Reward, b: Reward): Reward {
  const out: Reward = { ...a };
  for (const k of ['shards', 'crystals', 'scrolls', 'xp'] as const) {
    const v = (a[k] ?? 0) + (b[k] ?? 0);
    if (v) out[k] = v;
  }
  const cards = [...(a.cards ?? []), ...(b.cards ?? [])];
  if (cards.length) out.cards = cards;
  const heroes = [...(a.heroes ?? []), ...(b.heroes ?? [])];
  if (heroes.length) out.heroes = heroes;
  const pulls = [...(a.freePulls ?? []), ...(b.freePulls ?? [])];
  if (pulls.length) out.freePulls = pulls;
  return out;
}

/**
 * Récompenses d'un niveau (première victoire ou rejouer), sans modifier le profil.
 * - Éclats : +30 par étoile obtenue pour la première fois, +10 par étoile déjà obtenue et refaite,
 *   pour 10 vagues (× vagues / 10 : 45 et 15 par étoile pour un niveau de 15 vagues, 150 et 50 pour 50 vagues).
 * - Coffres d'étoiles du chapitre à 10, 20 et 30 étoiles.
 * - Niveau 5, 1re victoire : 1 parchemin + 10 cartes d'une unité du deck.
 * - Niveau 10, 1re victoire : 2 parchemins + 300 éclats + personnage garanti (ch. 6 : + 100 ✦).
 * - ★★★ sur un niveau de boss (5, 10 et 8 du ch. 6), la première fois : 25 ✦.
 * - XP : (20 par victoire + 10 par étoile nouvelle) × vagues / 10, ×2 sur les niveaux 10.
 */
export function levelRewards(level: CampaignLevel, now: Stars, profile: Progress | null, deck: UnitId[], seed = 0): LevelRewards {
  const p = profile ?? EMPTY_PROGRESS;
  const prev = p.campaign[level.id];
  const prevStars: Stars = prev ? [prev.stars[0], prev.stars[1], prev.stars[2]] : [false, false, false];
  const stars = mergeStars(prevStars, now);
  const lines: RewardLine[] = [];
  const won = now[0];
  const firstWin = won && !prevStars[0];
  let newStars = 0, replayStars = 0;
  for (let i = 0; i < 3; i++) {
    if (!now[i]) continue;
    if (prevStars[i]) replayStars++; else newStars++;
  }
  const empty: LevelRewards = { lines, total: {}, prev: prevStars, stars, newStars: 0, firstWin: false, chests: [] };
  if (!won) return empty;

  const len = lengthFactor(level);
  const shards = Math.round((newStars * SHARDS_PER_NEW_STAR + replayStars * SHARDS_PER_REPLAY_STAR) * len);
  if (shards) lines.push({ kind: 'etoiles', label: newStars ? `${newStars} étoile${newStars > 1 ? 's' : ''} nouvelle${newStars > 1 ? 's' : ''}` : 'Étoiles refaites', reward: { shards } });

  const ch = getChapter(level.chapter)!;
  if (firstWin && level.n === 5) {
    const u = pickUnit(deck, `${level.id}:l5:${seed}`);
    lines.push({ kind: 'lieutenant', label: 'Lieutenant vaincu', reward: { scrolls: 1, ...(u ? { cards: [{ unit: u, count: 10 }] } : {}) } });
  }
  if (firstWin && level.n === 10) {
    const hero = guaranteedHero(ch, (profile as Profile | null) ?? null);
    lines.push({
      kind: 'boss', label: `${level.boss?.name ?? 'Boss'} vaincu`,
      reward: { scrolls: 2, shards: 300, heroes: [hero], ...(ch.n === 6 ? { crystals: THANOS_CRYSTALS } : {}) },
    });
  }
  if (firstWin && level.chapter === 6 && level.n === 8 && C6N8_SCROLLS) {
    lines.push({ kind: 'boss', label: 'Maléfique vaincue', reward: { scrolls: C6N8_SCROLLS } });
  }
  const bossLevel = !!level.boss;
  if (bossLevel && stars.every(Boolean) && !prevStars.every(Boolean)) {
    lines.push({ kind: 'cristaux', label: '3 étoiles sur un boss', reward: { crystals: BOSS_LEVEL_CRYSTALS } });
  }

  // Coffres d'étoiles
  const before = chapterStars(p, level.chapter);
  const after = before - starCount(prevStars) + starCount(stars);
  const chests: string[] = [];
  const owned = Object.keys(p.heroes ?? {}) as UnitId[];
  for (const t of STAR_CHEST_THRESHOLDS) {
    const key = chestKey(level.chapter, t);
    if (after >= t && !p.campaignChests[key]) {
      chests.push(key);
      const u = pickUnit(owned.length ? owned : deck, `${key}:${seed}`);
      lines.push({ kind: 'coffre', label: `Coffre ${t} ★`, reward: chestReward(t, u) });
    }
  }

  const xp = Math.round((20 + 10 * newStars) * len) * (level.n === 10 ? 2 : 1);
  lines.push({ kind: 'xp', label: 'Expérience', reward: { xp } });

  const total = lines.reduce<Reward>((acc, l) => addReward(acc, l.reward), {});
  return { lines, total, prev: prevStars, stars, newStars, firstWin, chests };
}

/** Applique le résultat d'un niveau sur une progression (mutation ; à appeler dans updateProfile). */
export function recordLevel(p: Progress, level: CampaignLevel, rw: LevelRewards, wave: number): void {
  const prev: LevelResult | undefined = p.campaign[level.id];
  p.campaign[level.id] = {
    stars: rw.stars,
    bestWave: Math.max(prev?.bestWave ?? 0, wave),
    rewardTaken: !!prev?.rewardTaken || rw.firstWin,
  };
  for (const k of rw.chests) p.campaignChests[k] = true;
}

/** Récompenses maximales d'une campagne terminée à 3 étoiles partout (outil de test et d'équilibrage). */
export function campaignTotals(): Reward {
  let p: Progress = { campaign: {}, campaignChests: {}, heroes: {} };
  let total: Reward = {};
  for (const ch of CHAPTERS) {
    for (const l of chapterLevels(ch.n)) {
      const rw = levelRewards(l, [true, true, true], p, ['spiderman', 'hawkeye', 'falcon', 'cmarvel', 'widow']);
      total = addReward(total, rw.total);
      p = { ...p, campaign: { ...p.campaign }, campaignChests: { ...p.campaignChests } };
      recordLevel(p, l, rw, l.waves);
    }
  }
  return total;
}

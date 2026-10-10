// Récompenses et progression du Coop à deux (§5.2, §5.4, docs/equilibrage.md §5). Logique pure : chaque
// joueur crédite SON profil, en local, avec le bilan envoyé par l'hôte (vague, boss vaincus).
//
// Coop Infini, pour chacun, à la fin de la partie (palier atteint = vague terminée, boss compris) :
//   10 : coffre en bois · 20 : coffre d'argent + 1 parchemin · 30 : coffre d'or + 2 parchemins + 1 Épique garanti
//   40 : coffre héroïque + 3 parchemins + 1 tirage offert (à la place du skin, pas encore en jeu)
//   50 (Thanos vaincu) : coffre légendaire + 1 Légendaire garanti + cadre « Vainqueur de Thanos »
//   ensuite tous les 10 : coffre d'or + 1 parchemin.
// Chaque coffre de palier se gagne une fois par jour (et par mode) ; au-delà, l'or et les gemmes par vague
// comptent toujours. +20 or, +1 gemme et +5 XP par vague, butin d'or des boss, cristaux des paliers
// (5/10/20/30/60 puis +10), bonus de record du duo (+500 or, +50 gemmes).

import type { BossId, Rarity, UnitId } from '../data/types';
import { UNIT_LIST } from '../data/units';
import { bossKillGold, openChest, type ChestTier, type Rng } from './chests';
import { chestDetail, chestLabel, grantPulledHero, type InfiniteResult } from './economy';
import { applyReward, bigBossDailyBonus, today, type Profile, type Reward } from './profile';
import { trackQuests } from './quests';

export interface CoopTier {
  wave: number;
  name: string;
  chest: ChestTier;
  crystals: number;
  scrolls: number;
  guaranteed?: Rarity;
  pulls?: number;
  frame?: string;
}

export const COOP_TIERS: readonly CoopTier[] = [
  { wave: 10, name: 'Palier 10', chest: 'bois', crystals: 5, scrolls: 0 },
  { wave: 20, name: 'Palier 20', chest: 'argent', crystals: 10, scrolls: 1 },
  { wave: 30, name: 'Palier 30', chest: 'or', crystals: 20, scrolls: 2, guaranteed: 'epique' },
  { wave: 40, name: 'Palier 40', chest: 'heroique', crystals: 30, scrolls: 3, pulls: 1 },
  { wave: 50, name: 'Palier 50 · Thanos', chest: 'legendaire', crystals: 60, scrolls: 0, guaranteed: 'legendaire', frame: 'thanos' },
];
export const COOP_BEYOND = { every: 10, chest: 'or' as ChestTier, scrolls: 1, crystals: 10 };
export const COOP_GOLD_PER_WAVE = 20;
export const COOP_GEMS_PER_WAVE = 1;
export const COOP_XP_PER_WAVE = 5;
export const COOP_RECORD_BONUS = { gold: 500, gems: 50 };

/** Paliers jusqu'à la vague `w` (avec ceux d'après 50). */
export function coopTiersUpTo(w: number): CoopTier[] {
  const out = COOP_TIERS.filter((t) => t.wave <= w);
  for (let t = 60; t <= w; t += COOP_BEYOND.every) out.push({ wave: t, name: `Palier ${t}`, chest: COOP_BEYOND.chest, crystals: COOP_BEYOND.crystals, scrolls: COOP_BEYOND.scrolls });
  return out;
}

/** Prochain palier après la vague `w` (affiché sur l'écran Coop). */
export function nextCoopTier(w: number): CoopTier {
  return COOP_TIERS.find((t) => t.wave > w) ?? { wave: (Math.floor(w / 10) + 1) * 10, name: `Palier ${(Math.floor(w / 10) + 1) * 10}`, chest: COOP_BEYOND.chest, crystals: COOP_BEYOND.crystals, scrolls: COOP_BEYOND.scrolls };
}

export interface CoopGame {
  wavesCleared: number;
  bossKills: { boss: BossId | string; small: boolean; wave?: number }[];
  merges?: number;
  summons?: number;
  partnerName: string;
  won?: boolean;
}

/** Fin de Coop Infini : crédite le profil (mutation) et renvoie le détail pour l'écran de fin. */
export function applyCoopInfiniteGame(p: Profile, g: CoopGame, rng: Rng = Math.random, day = today()): InfiniteResult {
  const w = Math.max(0, Math.floor(g.wavesCleared));
  const res: InfiniteResult = { wavesCleared: w, newRecord: false, lines: [], heroes: [], chests: [], total: { gold: 0, shards: 0, crystals: 0, scrolls: 0, xp: 0 } };
  const credit = (r: Reward) => {
    applyReward(p, r);
    res.total.gold += r.gold ?? 0; res.total.shards += r.shards ?? 0; res.total.crystals += r.crystals ?? 0;
    res.total.scrolls += r.scrolls ?? 0; res.total.xp += r.xp ?? 0;
  };
  if (w > 0) {
    credit({ gold: w * COOP_GOLD_PER_WAVE, shards: w * COOP_GEMS_PER_WAVE, xp: w * COOP_XP_PER_WAVE });
    res.lines.push({ icon: 'or', label: `+${(w * COOP_GOLD_PER_WAVE).toLocaleString('fr-FR')} or · +${w * COOP_GEMS_PER_WAVE} gemmes`, detail: `${w} vague${w > 1 ? 's' : ''} à deux` });
  }
  const kills = g.bossKills.map((k) => ({ boss: k.boss as BossId, small: k.small, wave: k.wave ?? 0 }));
  const gold = bossKillGold(kills);
  if (gold > 0) {
    credit({ gold });
    res.lines.push({ icon: 'or', label: `+${gold.toLocaleString('fr-FR')} or`, detail: `Butin des boss (${kills.length})` });
  }
  let bossCrystals = 0;
  for (const k of kills) if (!k.small) bossCrystals += bigBossDailyBonus(p, k.boss);
  if (bossCrystals > 0) {
    res.total.crystals += bossCrystals;
    res.lines.push({ icon: 'cristaux', label: `+${bossCrystals} ✦`, detail: kills.some((k) => k.boss === 'thanos' && !k.small) ? 'Thanos vaincu !' : 'Premier gros boss du jour' });
  }
  const tiers = (p.coopTiers ??= {});
  for (const t of coopTiersUpTo(w)) {
    const key = String(t.wave);
    if (tiers[key] === day) continue;
    tiers[key] = day;
    const c = openChest(p, t.chest, rng, { crystals: t.crystals, scrolls: t.scrolls });
    res.total.gold += c.gold; res.total.shards += c.gems; res.total.crystals += c.crystals; res.total.scrolls += c.scrolls;
    for (const u of c.heroes) res.heroes.push({ unit: u, outcome: 'nouveau' });
    if (t.guaranteed) {
      const pool = UNIT_LIST.filter((u) => u.rarity === t.guaranteed).map((u) => u.id);
      const u: UnitId | undefined = pool[Math.floor(rng() * pool.length)];
      if (u) {
        const outcome = grantPulledHero(p, u);
        res.heroes.push({ unit: u, outcome });
        if (outcome === 'nouveau') c.heroes.push(u); else c.cards.push({ unit: u, count: 1 });
      }
    }
    if (t.pulls) applyReward(p, { freePulls: [{ pack: 'complet', count: t.pulls }] });
    if (t.frame) { const f = (p.frames ??= []); if (!f.includes(t.frame)) f.push(t.frame); }
    res.chests.push({ name: t.name, content: c });
    const extra = [t.pulls ? `${t.pulls} tirage offert` : '', t.frame ? 'cadre « Vainqueur de Thanos »' : ''].filter(Boolean).join(' · ');
    res.lines.push({ icon: 'coffre', label: `${t.name} : ${chestLabel(t.chest)}`, detail: [chestDetail(c), extra].filter(Boolean).join(' · ') });
  }
  const best = p.coopBest ?? 0;
  if (w > best) {
    res.newRecord = true;
    if (best > 0) {
      credit({ gold: COOP_RECORD_BONUS.gold, shards: COOP_RECORD_BONUS.gems });
      res.lines.push({ icon: 'record', label: 'Nouveau record du duo !', detail: `${w} vagues · +${COOP_RECORD_BONUS.gold} or · +${COOP_RECORD_BONUS.gems} gemmes` });
    } else if (w > 0) res.lines.push({ icon: 'record', label: 'Premier record du duo !', detail: `${w} vague${w > 1 ? 's' : ''}` });
    p.coopBest = w;
  }
  pushHistory(p, { mode: 'coop-infini', wave: w, won: !!g.won, partner: g.partnerName });
  trackQuests(p, { merges: g.merges, summons: g.summons, bossKills: kills.length, waves: w, infiniteWave: w }, day);
  return res;
}

export function pushHistory(p: Profile, h: Omit<NonNullable<Profile['coopHistory']>[number], 'at'>): void {
  const list = (p.coopHistory ??= []);
  list.unshift({ at: Date.now(), ...h });
  if (list.length > 10) list.length = 10;
}

/** Chapitres Solo terminés (niveau 10 gagné) : règle d'ouverture des chapitres Coop. */
export function soloChaptersDone(p: Profile | null): number[] {
  const out: number[] = [];
  for (let c = 1; c <= 6; c++) if (p?.campaign[`c${c}-n10`]?.stars[0]) out.push(c);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Coop Niveaux (docs/campagne-coop.md « Récompenses ») : étoiles communes au duo, récompenses à chacun.

export interface CoopLevelGame {
  levelId: string;
  chapter: number;
  n: number;
  won: boolean;
  wave: number;
  stars: [boolean, boolean, boolean];
  partnerName: string;
  merges?: number;
  summons?: number;
  bossKills?: number;
  /** Unités possédées pour les cartes des coffres d'étoiles. */
  rng?: Rng;
}

const STAR_CHESTS: Record<number, Reward & { label: string }> = {
  10: { label: 'Coffre 10 ★', gold: 500, shards: 50, scrolls: 1 },
  20: { label: 'Coffre 20 ★', gold: 1000, shards: 75, scrolls: 1 },
  30: { label: 'Coffre 30 ★', gold: 1500, shards: 100, scrolls: 2, crystals: 30, freePulls: [{ pack: 'complet', count: 1 }] },
};

/** Fin d'un niveau Coop : étoiles du duo enregistrées sur ce profil, récompenses créditées (mutation). */
export function applyCoopLevelGame(p: Profile, g: CoopLevelGame, rng: Rng = Math.random, day = today()): InfiniteResult {
  const res: InfiniteResult = { wavesCleared: g.wave, newRecord: false, lines: [], heroes: [], chests: [], total: { gold: 0, shards: 0, crystals: 0, scrolls: 0, xp: 0 } };
  const credit = (r: Reward) => {
    applyReward(p, r);
    res.total.gold += r.gold ?? 0; res.total.shards += r.shards ?? 0; res.total.crystals += r.crystals ?? 0;
    res.total.scrolls += r.scrolls ?? 0; res.total.xp += r.xp ?? 0;
  };
  const levels = (p.coopLevels ??= {});
  const prev = levels[g.levelId];
  const before = prev?.stars ?? [false, false, false];
  const firstWin = g.won && !before[0];
  const xp = (g.won ? 30 : 10) + 5 * g.chapter;
  credit({ xp });
  if (g.won) {
    const fresh = g.stars.filter((s, i) => s && !before[i]).length;
    const kept = g.stars.filter(Boolean).length - fresh;
    const gold = fresh * 20 + kept * 8;
    credit({ gold, shards: fresh * 2 });
    res.lines.push({ icon: 'or', label: `+${gold} or${fresh ? ` · +${fresh * 2} gemmes` : ''}`, detail: `${g.stars.filter(Boolean).length} étoile${g.stars.filter(Boolean).length > 1 ? 's' : ''} du duo` });
    const tier: ChestTier = g.chapter <= 2 ? 'bois' : g.chapter <= 4 ? 'argent' : 'or';
    const c = openChest(p, firstWin ? tier : 'bois', rng);
    res.total.gold += c.gold; res.total.shards += c.gems; res.total.crystals += c.crystals; res.total.scrolls += c.scrolls;
    res.chests.push({ name: firstWin ? 'Coffre de victoire' : 'Coffre de victoire (rejoué)', content: c });
    res.lines.push({ icon: 'coffre', label: `Victoire : ${chestLabel(c.tier)}`, detail: chestDetail(c) });
    if (firstWin && g.n === 5) { credit({ scrolls: 1 }); res.lines.push({ icon: 'parchemins', label: '+1 parchemin', detail: 'Lieutenant vaincu à deux' }); }
    if (firstWin && g.n === 10) {
      credit({ scrolls: 2, shards: 100 });
      res.lines.push({ icon: 'parchemins', label: '+2 parchemins · +100 gemmes', detail: 'Boss du chapitre vaincu à deux' });
      if (g.chapter === 6) { const f = (p.frames ??= []); if (!f.includes('duo')) f.push('duo'); res.lines.push({ icon: 'record', label: 'Cadre « Duo invincible »' }); }
    }
    if ((g.n === 5 || g.n === 10) && g.stars[2] && !before[2]) { credit({ crystals: 25 }); res.lines.push({ icon: 'cristaux', label: '+25 ✦', detail: '3 étoiles sur un niveau de boss' }); }
    levels[g.levelId] = { stars: [before[0] || g.stars[0], before[1] || g.stars[1], before[2] || g.stars[2]], bestWave: Math.max(prev?.bestWave ?? 0, g.wave), rewardTaken: true };
    // Coffres d'étoiles du chapitre (10, 20, 30 ★), ouverts par chacun.
    const chStars = Object.entries(levels).filter(([id]) => id.startsWith(`cc${g.chapter}-`)).reduce((n, [, r]) => n + r.stars.filter(Boolean).length, 0);
    const opened = (p.coopChests ??= {});
    for (const th of [10, 20, 30]) {
      const key = `cc${g.chapter}-${th}`;
      if (chStars < th || opened[key]) continue;
      opened[key] = true;
      const { label, ...r } = STAR_CHESTS[th]!;
      credit(r);
      res.lines.push({ icon: 'coffre', label, detail: `Chapitre Coop ${g.chapter}` });
    }
  } else {
    res.lines.push({ icon: 'xp', label: `+${xp} XP`, detail: `Vague ${g.wave} atteinte` });
  }
  pushHistory(p, { mode: 'coop-niveaux', levelId: g.levelId, wave: g.wave, won: g.won, partner: g.partnerName });
  trackQuests(p, { merges: g.merges, summons: g.summons, bossKills: g.bossKills, waves: g.wave, levelsWon: g.won ? 1 : 0, stars: g.won ? g.stars.filter((s, i) => s && !before[i]).length : 0 }, day);
  return res;
}

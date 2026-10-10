// Route des récompenses : chaque niveau de compte donne quelque chose (or, gemmes, cristaux, coffre,
// lot de 10 tirages offert, cadre d'avatar). Les récompenses des niveaux atteints se réclament une à une
// (ou toutes d'un coup). Logique pure.

import { openChest, type ChestContent, type ChestTier, type Rng } from './chests';
import { accountLevel } from './economy';
import type { Profile } from './profile';

export interface Frame { id: string; name: string; color: string }
/** Cadres d'avatar gagnés sur la route (niveau → cadre). */
export const FRAMES: Record<number, Frame> = {
  5: { id: 'bronze', name: 'Cadre bronze', color: '#d08a4a' },
  10: { id: 'argent', name: 'Cadre argent', color: '#d9e2f2' },
  20: { id: 'or', name: 'Cadre or', color: '#ffd04a' },
  30: { id: 'diamant', name: 'Cadre diamant', color: '#7ff0ff' },
  50: { id: 'legende', name: 'Cadre légende', color: '#ff7a2a' },
};
export const frameColor = (id: string | undefined): string | null =>
  Object.values(FRAMES).find((f) => f.id === id)?.color ?? null;

export interface RoadReward {
  level: number;
  gold: number;
  gems?: number;
  crystals?: number;
  chest?: ChestTier;
  /** Lot de tirages offert (pack au choix). */
  pulls?: number;
  frame?: Frame;
  /** Récompense mise en avant (grand coffre, lot de 10, cadre). */
  big: boolean;
}

export const ROAD_FIRST = 2;
/** Début de partie : jusqu'à ce niveau de compte, la route est très généreuse en gemmes et en tirages. */
export const ROAD_ROOKIE_MAX = 15;

/**
 * Récompense du niveau de compte `level` (≥ 2).
 * Niveaux 2 à 15 : 200 gemmes (pairs) ou 150 gemmes + 30 ✦ (impairs) ; 5 et 15 : coffre d'or + lot de 10 ;
 * 10 : lot de 10 + 300 gemmes. Ensuite : 40 gemmes ou 30 ✦, coffre tous les 5, lot de 10 tous les 10.
 */
export function roadReward(level: number): RoadReward {
  const r: RoadReward = { level, gold: 100 + 40 * level, big: false };
  const rookie = level <= ROAD_ROOKIE_MAX;
  if (level % 10 === 0) { r.pulls = 10; r.big = true; if (rookie) r.gems = 300; }
  else if (level % 5 === 0) { r.chest = level < 20 ? 'or' : level < 40 ? 'heroique' : 'legendaire'; r.big = true; if (rookie) r.pulls = 10; }
  else if (level % 2 === 0) r.gems = rookie ? 200 : 40;
  else { r.crystals = 30; if (rookie) r.gems = 150; }
  const f = FRAMES[level];
  if (f) { r.frame = f; r.big = true; }
  return r;
}

export function roadClaimed(p: Profile, level: number): boolean { return (p.roadClaimed ?? []).includes(level); }

/** Niveaux atteints dont la récompense attend. */
export function roadClaimable(p: Profile): number[] {
  const lv = accountLevel(p.xp).level;
  const out: number[] = [];
  for (let l = ROAD_FIRST; l <= lv; l++) if (!roadClaimed(p, l)) out.push(l);
  return out;
}

export interface RoadClaim { reward: RoadReward; chest: ChestContent | null }

/** Réclame la récompense d'un niveau atteint. null si impossible. Mutation. */
export function claimRoad(p: Profile, level: number, rng: Rng = Math.random): RoadClaim | null {
  if (level < ROAD_FIRST || level > accountLevel(p.xp).level || roadClaimed(p, level)) return null;
  const r = roadReward(level);
  (p.roadClaimed ??= []).push(level);
  p.gold = (p.gold ?? 0) + r.gold;
  p.shards += r.gems ?? 0;
  p.crystals += r.crystals ?? 0;
  if (r.pulls) (p.pendingPulls ??= []).push({ pack: 'choix', count: r.pulls });
  if (r.frame) {
    const f = (p.frames ??= []);
    if (!f.includes(r.frame.id)) f.push(r.frame.id);
    p.frame = r.frame.id;
  }
  const chest = r.chest ? openChest(p, r.chest, rng) : null;
  return { reward: r, chest };
}

// Progression du joueur sur chaque héros (collection), lue sur le profil actif (src/meta/profile.ts).
// Sans profil (pages de développement), tous les héros sont affichés comme possédés au niveau 1.

import { getProfile } from './profile';

export interface HeroProgress {
  /** Le joueur possède ce héros. */
  owned: boolean;
  /** Niveau de collection (1 à 10, §6.2). */
  level: number;
  /** Étoiles d'éveil (0 à 10, §6.6). */
  awakening: number;
  /** Copies (doublons) en réserve pour la prochaine montée. */
  copies: number;
}

export const MAX_HERO_LEVEL = 10;
export const MAX_AWAKENING = 10;

/** Cartes à réunir pour passer les niveaux 2 à 10 (§6.2 du prompt). */
export const LEVEL_COPY_COSTS: readonly number[] = [1, 1, 2, 2, 2, 3, 3, 3, 4];
/** Copies à réunir pour les éveils ★1 à ★10 (§6.6 du prompt). */
export const AWAKENING_COPY_COSTS: readonly number[] = [2, 3, 5, 6, 8, 10, 13, 18, 25, 40];

const DEFAULT: HeroProgress = { owned: true, level: 1, awakening: 0, copies: 0 };

/** Progression d'un héros sur le profil actif (owned = false s'il n'est pas dans la collection). */
export function getHeroProgress(id: string): HeroProgress {
  const p = getProfile();
  if (!p) return { ...DEFAULT };
  const h = (p.heroes as Record<string, { level: number; awakening: number; cards: number } | undefined>)[id];
  if (!h) return { owned: false, level: 1, awakening: 0, copies: 0 };
  return { owned: true, level: h.level, awakening: h.awakening, copies: h.cards };
}

/**
 * Prochaine étape et copies demandées : un niveau tant que le héros n'est pas niveau 10, puis un
 * éveil. null quand il est au maximum (niveau 10, ★10).
 */
export function nextStep(p: HeroProgress): { kind: 'niveau' | 'eveil'; target: number; needed: number } | null {
  if (p.level < MAX_HERO_LEVEL) {
    return { kind: 'niveau', target: p.level + 1, needed: LEVEL_COPY_COSTS[p.level - 1] ?? 0 };
  }
  if (p.awakening < MAX_AWAKENING) {
    return { kind: 'eveil', target: p.awakening + 1, needed: AWAKENING_COPY_COSTS[p.awakening] ?? 0 };
  }
  return null;
}

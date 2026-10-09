// Progression du joueur sur chaque héros (collection). POINT D'ACCROCHE : il n'y a pas encore de
// profil ni de collection (méta-jeu à venir). getHeroProgress renvoie pour l'instant une valeur par
// défaut ; le futur système de profil (agent Méta et économie) n'aura qu'à remplacer son implémentation
// en gardant cette interface, et l'Encyclopédie affichera la vraie progression.

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

/** Progression d'un héros. À brancher sur le profil quand il existera. */
export function getHeroProgress(_id: string): HeroProgress {
  return { ...DEFAULT };
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

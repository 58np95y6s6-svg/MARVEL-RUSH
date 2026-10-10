// Tutoriel guidé (§5.0) : logique pure des étapes, sans DOM (testée dans tests/tutorial/).
//
// Partie 1 (combat scénarisé, route #tutoriel) : 1 invoquer, 2 invoquer jusqu'à une paire, 3 fusion guidée,
// 4 deuxième fusion, 5 amélioration, 6 boss, 7 victoire (or, gemmes et XP).
// Partie 2 (menus) : 8 premier pack (10 tirages offerts), 9 nouvelle unité dans le deck, 10 niveau 1.
// L'étape est sauvegardée dans `profile.tutorialStep` ; `tutorialDone` passe à true à la fin ou si on passe.

import type { BossId, Rarity, UnitId } from '../data/types';
import { activeTeams } from '../data/teams';
import { UNITS } from '../data/units';
import { teamHints, type Starter, type TeamHint } from '../meta/decks';
import type { Profile } from '../meta/profile';
import type { PullResult } from '../meta/pulls';

export const STEP = {
  summon: 1,
  summonMore: 2,
  merge: 3,
  merge2: 4,
  powerup: 5,
  boss: 6,
  victory: 7,
  pack: 8,
  deck: 9,
  campaign: 10,
} as const;
export type StepId = (typeof STEP)[keyof typeof STEP];

export const FIRST_STEP = STEP.summon;
export const PART1_LAST = STEP.victory;
export const LAST_STEP = STEP.campaign;

/** Récompense de la victoire du combat tutoriel (créditée une seule fois). */
export const TUTORIAL_REWARD = { gold: 300, shards: 100, xp: 60 } as const;
/** Clé de `profile.tips` qui marque la récompense du tutoriel comme déjà donnée. */
export const REWARD_FLAG = 'tuto-recompense';

/** Le profil a-t-il déjà joué (étoiles de campagne ou tirages) ? */
export function hasProgress(p: Pick<Profile, 'campaign' | 'pullsDone'>): boolean {
  if ((p.pullsDone ?? 0) > 0) return true;
  return Object.values(p.campaign).some((l) => l.stars.some(Boolean));
}

/** Joueur existant avec de la progression qui n'a jamais commencé le tutoriel : on le dispense. */
export function shouldAutoComplete(p: Profile): boolean {
  return !p.tutorialDone && p.tutorialStep === undefined && hasProgress(p);
}

/** Étape en cours, ou null si le tutoriel est fini (ou pas encore possible : pas de deck de départ). */
export function currentStep(p: Profile | null): StepId | null {
  if (!p || p.tutorialDone || !p.starter) return null;
  const s = Math.round(p.tutorialStep ?? FIRST_STEP);
  return Math.min(LAST_STEP, Math.max(FIRST_STEP, s)) as StepId;
}

export const isPart1 = (s: number): boolean => s >= FIRST_STEP && s <= PART1_LAST;

/** Étape suivante (null après la dernière). */
export function nextStep(s: StepId): StepId | null {
  return s >= LAST_STEP ? null : ((s + 1) as StepId);
}

/** Route où se joue une étape. */
export function routeForStep(s: StepId): string {
  if (isPart1(s)) return '#tutoriel';
  if (s === STEP.pack) return '#tirages';
  if (s === STEP.deck) return '#collection';
  return '#campagne/1/1';
}

/** L'écran affiché (route émise par l'événement `screen`) est-il celui de l'étape ? */
export function onStepScreen(s: StepId, screen: string): boolean {
  if (isPart1(s)) return screen === 'tutoriel';
  if (s === STEP.pack) return screen === 'tirages';
  if (s === STEP.deck) return screen === 'collection' || screen === 'decks';
  return screen.startsWith('campagne');
}

// ------------------------------------------------------------------------------------ combat

/** Guide qui parle dans les bulles : Spider-Man (départ Marvel) ou Vaïana (départ Disney). */
export function guideFor(starter: Starter | undefined): UnitId {
  return starter === 'disney' ? 'moana' : 'spiderman';
}
export function guideName(starter: Starter | undefined): string {
  return starter === 'disney' ? 'Vaïana' : 'Spider-Man';
}

/** Boss faible du combat tutoriel, au pouvoir inoffensif et bien visible. */
export function tutorialBoss(starter: Starter | undefined): BossId {
  return starter === 'disney' ? 'malefique' : 'bouffon';
}

export function tutorialMap(starter: Starter | undefined): string {
  return starter === 'disney' ? 'ile-motunui' : 'toits-new-york';
}

/** Les deux héros des premières invocations : A, B, A, B → une paire dès la 3e invocation. */
export function tutorialPair(deck: readonly UnitId[]): [UnitId, UnitId] {
  const a = deck[0]!;
  const b = deck[1] ?? a;
  return [a, b];
}

export function forcedSummons(deck: readonly UnitId[]): UnitId[] {
  const [a, b] = tutorialPair(deck);
  return [a, b, a, b];
}

export interface BoardUnit { slot: number; unit: UnitId; rank: number }

/**
 * Plateau à reconstituer quand on reprend la partie 1 en cours d'étape (après fermeture de l'app),
 * avec le nombre d'invocations déjà faites (pour que les invocations imposées restent dans l'ordre).
 */
export function resumeBoard(step: StepId, deck: readonly UnitId[]): { units: BoardUnit[]; summons: number } {
  const [a, b] = tutorialPair(deck);
  const third = deck[2] ?? a;
  if (step <= STEP.summon) return { units: [], summons: 0 };
  if (step === STEP.summonMore) return { units: [{ slot: 7, unit: a, rank: 1 }], summons: 1 };
  if (step === STEP.merge) {
    return { units: [{ slot: 6, unit: a, rank: 1 }, { slot: 7, unit: b, rank: 1 }, { slot: 8, unit: a, rank: 1 }], summons: 3 };
  }
  if (step === STEP.merge2) {
    return { units: [{ slot: 7, unit: b, rank: 1 }, { slot: 8, unit: third, rank: 2 }], summons: 3 };
  }
  return { units: [{ slot: 7, unit: third, rank: 2 }, { slot: 8, unit: a, rank: 2 }, { slot: 12, unit: b, rank: 1 }], summons: 4 };
}

type Cell = { unit: UnitId; rank: number } | null | undefined;

/** Première paire fusionnable (même héros, même rang) : [de, vers], ou null. */
export function findPair(grid: readonly Cell[], prefer?: UnitId): [number, number] | null {
  let found: [number, number] | null = null;
  for (let i = 0; i < grid.length; i++) {
    const a = grid[i];
    if (!a) continue;
    for (let j = i + 1; j < grid.length; j++) {
      const b = grid[j];
      if (!b || b.unit !== a.unit || b.rank !== a.rank) continue;
      if (!prefer || a.unit === prefer) return [i, j];
      found ??= [i, j];
    }
  }
  return found;
}

/** Héros le plus présent sur le plateau (le plus utile à améliorer). */
export function mostPresent(grid: readonly Cell[], deck: readonly UnitId[]): UnitId {
  const n = new Map<UnitId, number>();
  for (const c of grid) if (c) n.set(c.unit, (n.get(c.unit) ?? 0) + c.rank);
  let best = deck[0]!;
  let bestN = -1;
  for (const u of deck) {
    const k = n.get(u) ?? 0;
    if (k > bestN) { best = u; bestN = k; }
  }
  return best;
}

export function boardCount(grid: readonly Cell[]): number {
  return grid.reduce((n, c) => n + (c ? 1 : 0), 0);
}

// ------------------------------------------------------------------------------------ menus

const RARITY_RANK: Record<Rarity, number> = { legendaire: 3, epique: 2, rare: 1 };

/**
 * Héros à mettre dans le deck : le meilleur nouveau du lot (hors deck actif), sinon le meilleur héros
 * possédé hors deck. null si tous les héros possédés sont déjà dans le deck.
 */
export function pickNewUnit(p: Profile, results?: readonly PullResult[]): UnitId | null {
  const deck = p.decks[p.activeDeck] ?? [];
  const score = (u: UnitId) => RARITY_RANK[UNITS[u].rarity] * 10;
  const pick = (list: UnitId[]): UnitId | null => {
    const ok = [...new Set(list)].filter((u) => !deck.includes(u) && p.heroes[u]);
    ok.sort((x, y) => score(y) - score(x) || UNITS[x].name.localeCompare(UNITS[y].name, 'fr'));
    return ok[0] ?? null;
  };
  return pick((results ?? []).filter((r) => r.outcome === 'nouveau').map((r) => r.unit))
    ?? pick((results ?? []).map((r) => r.unit))
    ?? pick(Object.keys(p.heroes) as UnitId[]);
}

/**
 * Case du deck où poser `unit` : celle qui donne le plus de bonus d'équipe actifs, puis d'équipes
 * presque complètes, en sacrifiant de préférence le héros le moins rare (à égalité, la dernière case).
 */
export function pickDeckSlot(deck: readonly UnitId[], unit: UnitId): number {
  const already = deck.indexOf(unit);
  if (already >= 0) return already;
  let best = Math.max(0, deck.length - 1);
  let bestScore = -Infinity;
  deck.forEach((cur, i) => {
    const d = deck.slice();
    d[i] = unit;
    const active = activeTeams(d).length;
    const near = teamHints(d, 1).filter((h) => !h.active).length;
    const score = active * 100 + near * 10 - RARITY_RANK[UNITS[cur].rarity] * 3 + i * 0.01;
    if (score > bestScore) { bestScore = score; best = i; }
  });
  return best;
}

/** Bonus d'équipe actif auquel participe `unit` dans `deck` (explication de l'étape 9). */
export function teamBonusWith(deck: readonly UnitId[], unit: UnitId): TeamHint | null {
  return teamHints(deck).find((h) => h.active && h.team.units.includes(unit)) ?? null;
}

// ------------------------------------------------------------------------------------ astuces

export type Archetype = 'copie' | 'promotion' | 'echange' | 'sacrifice';

/** Archétype de stratégie d'un héros (Loki copie, Coco promeut, Vanellope échange, Black Widow se sacrifie). */
export function archetypeOf(unit: UnitId): Archetype | null {
  const prm = UNITS[unit]?.ability.params ?? {};
  if (prm['copyDamageMul']) return 'copie';
  if (prm['promoteAlly']) return 'promotion';
  if (prm['swapAlly']) return 'echange';
  if (prm['sacrificeMana']) return 'sacrifice';
  return null;
}

/** Équipe à qui il ne manque qu'un héros (astuce « bonus d'équipe presque complet »). */
export function nearlyCompleteTeam(deck: readonly UnitId[]): TeamHint | null {
  return teamHints(deck, 1).find((h) => !h.active && h.need - h.have === 1) ?? null;
}

/** L'astuce `id` est-elle encore à montrer ? */
export function tipPending(p: Pick<Profile, 'tips'> | null, id: string): boolean {
  return !!p && !p.tips?.[id];
}

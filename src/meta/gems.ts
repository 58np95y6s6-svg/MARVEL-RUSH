// Gemmes du début de partie (docs/equilibrage.md §6, « pluie de gemmes des débutants ») : gros bonus de
// première victoire des chapitres 1 à 3 (≈ un lot de 10 tous les 2 à 3 niveaux), calendrier de bienvenue
// sur 7 jours (gemmes + lots de 10 offerts), rattrapage unique des profils existants.
// Logique pure (aucun DOM, aucun stockage) ; les mutations sont à appeler dans `updateProfile`.

import type { Profile } from './profile';

/** Gemmes de la première victoire d'un niveau, par chapitre (chapitres 4 à 9 : rien). */
export const FIRST_CLEAR_GEMS: readonly number[] = [400, 300, 150];

export function firstClearGems(chapter: number): number {
  return FIRST_CLEAR_GEMS[chapter - 1] ?? 0;
}

/** Bonus « premières 3 étoiles » : plus gros dans les chapitres 1 et 2. */
export function threeStarGems(chapter: number): number {
  return chapter <= 2 ? 30 : chapter === 3 ? 15 : 5;
}

/** Quêtes du jour : +20 gemmes chacune tant que le compte est sous ce niveau (deux semaines environ). */
export const QUEST_ROOKIE_LEVEL = 15;
export const QUEST_ROOKIE_GEMS = 20;

/** XP de compte au niveau `level` (même formule que `accountLevel` d'economy.ts, vérifiée par les tests). */
export function xpAtLevel(level: number): number {
  let xp = 0;
  for (let l = 1; l < level; l++) xp += 100 + 50 * (l - 1);
  return xp;
}

/** Bonus débutant d'une quête réclamée (0 à partir du niveau de compte QUEST_ROOKIE_LEVEL). */
export function questRookieGems(xp: number): number {
  return xp < xpAtLevel(QUEST_ROOKIE_LEVEL) ? QUEST_ROOKIE_GEMS : 0;
}

// ------------------------------------------------------------------------------- calendrier

export interface WelcomeDay { day: number; gems: number; pulls?: number }

/** Calendrier de bienvenue : un jour réclamé par jour de connexion (pas besoin d'enchaîner). */
export const WELCOME_CALENDAR: readonly WelcomeDay[] = [
  { day: 1, gems: 300, pulls: 10 }, { day: 2, gems: 400 }, { day: 3, gems: 500 }, { day: 4, gems: 300, pulls: 10 },
  { day: 5, gems: 600 }, { day: 6, gems: 700 }, { day: 7, gems: 500, pulls: 10 },
];

/** État du calendrier (absent = rien réclamé : les profils existants l'ont aussi, à partir d'aujourd'hui). */
export interface WelcomeState { claimed: number; last?: string }

export function welcomeState(p: Pick<Profile, 'welcome'>): WelcomeState {
  return p.welcome ?? { claimed: 0 };
}

/** Prochain jour à réclamer, ou null si le calendrier est fini. */
export function welcomeNext(p: Pick<Profile, 'welcome'>): WelcomeDay | null {
  return WELCOME_CALENDAR[welcomeState(p).claimed] ?? null;
}

/** Un jour est-il réclamable aujourd'hui ? (un seul par jour) */
export function welcomeReady(p: Pick<Profile, 'welcome'>, day: string): boolean {
  const s = welcomeState(p);
  return s.claimed < WELCOME_CALENDAR.length && s.last !== day;
}

/** Réclame le jour suivant du calendrier. null si rien à réclamer aujourd'hui. Mutation. */
export function claimWelcome(p: Profile, day: string): WelcomeDay | null {
  if (!welcomeReady(p, day)) return null;
  const s = welcomeState(p);
  const d = WELCOME_CALENDAR[s.claimed]!;
  p.welcome = { claimed: s.claimed + 1, last: day };
  p.shards += d.gems;
  if (d.pulls) (p.pendingPulls ??= []).push({ pack: 'choix', count: d.pulls });
  return d;
}

// ------------------------------------------------------------------------------- rattrapage

/** Gemmes de première victoire dues pour les niveaux déjà gagnés (rattrapage complet). */
export function retroFirstClearGems(p: Pick<Profile, 'campaign'>): number {
  let n = 0;
  for (const [id, r] of Object.entries(p.campaign ?? {})) {
    const m = /^c(\d+)-n\d+$/.exec(id);
    if (m && r?.stars?.[0]) n += firstClearGems(Number(m[1]));
  }
  return n;
}

/**
 * Rattrapage unique (profil d'avant les gemmes de première victoire) : crédite les gemmes des niveaux
 * déjà gagnés (chapitres 1 à 3). Renvoie les gemmes données (0 si déjà fait). Mutation.
 */
export function applyRetroGems(p: Profile): number {
  if (p.gemsRetro) return 0;
  const g = retroFirstClearGems(p);
  p.gemsRetro = true;
  p.shards += g;
  return g;
}

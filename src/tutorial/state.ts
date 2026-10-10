// Tutoriel guidé : état partagé (navigation, calque unique, sauvegarde de l'étape, passer, revoir).
import { applyReward, getProfile, updateProfile } from '../meta/profile';
import { Coach } from './coach';
import { REWARD_FLAG, TUTORIAL_REWARD, guideFor, type StepId } from './steps';

let goFn: (hash: string) => void = (h) => { location.hash = h; };
export function setNav(go: (hash: string) => void): void { goFn = go; }
export function go(hash: string): void { goFn(hash); }

let coach: Coach | null = null;
const skipListeners = new Set<() => void>();

/** Calque du tutoriel (créé à la demande, avec le guide du deck de départ). */
export function getCoach(): Coach {
  const guide = guideFor(getProfile()?.starter);
  if (!coach) coach = new Coach(guide, () => void skipTutorial());
  else coach.setGuide(guide);
  return coach;
}
export function dropCoach(): void { coach?.destroy(); coach = null; }

/** Prévenu quand le joueur passe le tutoriel (le combat scénarisé se démonte). */
export function onSkip(fn: () => void): () => void { skipListeners.add(fn); return () => { skipListeners.delete(fn); }; }

export async function setStep(s: StepId): Promise<void> {
  if (!getProfile()) return;
  await updateProfile((p) => { if (!p.tutorialDone) p.tutorialStep = s; });
}

/** Récompense de la victoire du combat tutoriel : une seule fois par profil. Renvoie true si créditée. */
export async function grantTutorialReward(): Promise<boolean> {
  const p = getProfile();
  if (!p || p.tips?.[REWARD_FLAG]) return false;
  await updateProfile((q) => {
    applyReward(q, { ...TUTORIAL_REWARD });
    (q.tips ??= {})[REWARD_FLAG] = true;
  });
  return true;
}

export async function completeTutorial(): Promise<void> {
  dropCoach();
  if (!getProfile()) return;
  await updateProfile((p) => {
    p.tutorialDone = true;
    delete p.tutorialStep;
    delete p.tutorialUnit;
  });
}

export async function skipTutorial(): Promise<void> {
  await completeTutorial();
  for (const fn of [...skipListeners]) fn();
  go('');
}

/** « Revoir le tutoriel » (profil) : on repart du premier combat. */
export async function replayTutorial(): Promise<void> {
  if (!getProfile()) return;
  await updateProfile((p) => {
    p.tutorialDone = false;
    p.tutorialStep = 1;
    delete p.tutorialUnit;
  });
  go('#tutoriel');
}
